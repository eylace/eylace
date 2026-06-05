
-- 1) Revoke sensitive column reads from anon/authenticated
REVOKE SELECT (cost_per_item) ON public.products FROM anon, authenticated;
REVOKE SELECT (digital_file_url) ON public.products FROM anon, authenticated;
REVOKE SELECT (cost_per_item) ON public.order_items FROM anon, authenticated;

-- 2) Affiliate clicks: require authenticated
DROP POLICY IF EXISTS "Validated affiliate click insert" ON public.affiliate_clicks;
CREATE POLICY "Validated affiliate click insert"
  ON public.affiliate_clicks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.affiliates
      WHERE affiliates.id = affiliate_clicks.affiliate_id
        AND affiliates.status = 'active'
    )
  );

-- 3) coupon_usage: remove direct user insert (record_coupon_usage SECURITY DEFINER handles it)
DROP POLICY IF EXISTS "Users can insert their own usage" ON public.coupon_usage;

-- 4) Restrict writes to tracking_analytics_v1 (and any *_secrets keys) to admins only.
--    Lower-privileged roles (content/marketing/product manager) keep access to
--    other settings via can_manage_website_settings, but cannot touch keys
--    that inject site-wide scripts or hold server secrets.
CREATE OR REPLACE FUNCTION public.is_admin_only_setting_key(_key text)
RETURNS boolean
LANGUAGE sql IMMUTABLE
SET search_path = public
AS $$
  SELECT _key IN ('tracking_analytics_v1', 'accounting_settings', 'courier_advance_settings');
$$;

DROP POLICY IF EXISTS "Website setup roles can manage settings" ON public.system_settings;
CREATE POLICY "Website setup roles can manage settings"
  ON public.system_settings
  FOR ALL
  TO authenticated
  USING (
    public.can_manage_website_settings(auth.uid())
    AND (
      NOT public.is_admin_only_setting_key(key)
      OR public.has_role(auth.uid(), 'admin'::app_role)
    )
  )
  WITH CHECK (
    public.can_manage_website_settings(auth.uid())
    AND (
      NOT public.is_admin_only_setting_key(key)
      OR public.has_role(auth.uid(), 'admin'::app_role)
    )
  );
