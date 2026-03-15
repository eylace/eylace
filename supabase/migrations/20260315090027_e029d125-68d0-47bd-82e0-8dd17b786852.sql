
-- FIX 1: seller_applications admin_notes - use view
DROP POLICY IF EXISTS "Users can view own application safe columns" ON public.seller_applications;
CREATE OR REPLACE VIEW public.seller_applications_safe AS
SELECT id, user_id, store_name, store_description, business_type, phone, status, created_at, updated_at
FROM public.seller_applications;
ALTER VIEW public.seller_applications_safe SET (security_invoker = false);
GRANT SELECT ON public.seller_applications_safe TO authenticated;

-- FIX 2: coupon_usage - replace INSERT with function
DROP POLICY IF EXISTS "Users can insert their own coupon usage" ON public.coupon_usage;
DROP POLICY IF EXISTS "Authenticated users can insert coupon usage" ON public.coupon_usage;

CREATE OR REPLACE FUNCTION public.record_coupon_usage(_coupon_id uuid, _order_id uuid, _discount_amount numeric)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.orders WHERE id = _order_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Invalid order';
  END IF;
  INSERT INTO public.coupon_usage (coupon_id, order_id, user_id, discount_amount)
  VALUES (_coupon_id, _order_id, auth.uid(), _discount_amount);
END;
$$;

-- FIX 3: coupons - lookup by code only
DROP POLICY IF EXISTS "Authenticated users can view active coupons" ON public.coupons;
CREATE OR REPLACE FUNCTION public.lookup_coupon(_code text)
RETURNS TABLE(id uuid, code text, discount_type text, discount_value numeric, min_order_amount numeric, max_discount numeric, expires_at timestamptz, usage_limit integer, used_count integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY SELECT c.id, c.code, c.discount_type, c.discount_value, c.min_order_amount, c.max_discount, c.expires_at, c.usage_limit, c.used_count
  FROM public.coupons c WHERE c.code = _code AND c.is_active = true AND (c.expires_at IS NULL OR c.expires_at > now());
END;
$$;

-- FIX 4: preorder_reviews - hide user_id
DROP POLICY IF EXISTS "Authenticated can view preorder reviews" ON public.preorder_reviews;
CREATE OR REPLACE VIEW public.preorder_reviews_public AS
SELECT id, preorder_product_id, rating, title, content, images, created_at
FROM public.preorder_reviews;
ALTER VIEW public.preorder_reviews_public SET (security_invoker = false);
GRANT SELECT ON public.preorder_reviews_public TO anon, authenticated;
