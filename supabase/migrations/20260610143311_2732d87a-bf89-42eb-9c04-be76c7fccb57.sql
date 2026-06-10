
-- 1) Revoke cost_per_item from non-admin roles on order_items
REVOKE SELECT (cost_per_item) ON public.order_items FROM anon, authenticated;

-- 2) Restrict PII on affiliate_clicks: revoke ip_address and user_agent from affiliate owners
REVOKE SELECT (ip_address, user_agent) ON public.affiliate_clicks FROM anon, authenticated;

-- Admin RPC to list affiliate clicks with full details (for admin pages)
CREATE OR REPLACE FUNCTION public.admin_list_affiliate_clicks(_limit integer DEFAULT 200, _search text DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  affiliate_id uuid,
  referral_code text,
  landing_page text,
  ip_address text,
  user_agent text,
  created_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'marketing_manager'::app_role)
  ) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT c.id, c.affiliate_id, a.referral_code, c.landing_page,
         c.ip_address::text, c.user_agent, c.created_at
  FROM public.affiliate_clicks c
  LEFT JOIN public.affiliates a ON a.id = c.affiliate_id
  WHERE _search IS NULL
     OR a.referral_code ILIKE '%' || _search || '%'
     OR c.landing_page ILIKE '%' || _search || '%'
  ORDER BY c.created_at DESC
  LIMIT GREATEST(LEAST(COALESCE(_limit, 200), 1000), 1);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_affiliate_clicks(integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_affiliate_clicks(integer, text) TO authenticated;
