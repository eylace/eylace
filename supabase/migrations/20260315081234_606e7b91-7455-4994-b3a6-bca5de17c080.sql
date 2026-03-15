-- Fix coupon enumeration: restrict to authenticated users only
DROP POLICY IF EXISTS "Public can view active non-expired coupons" ON public.coupons;

CREATE POLICY "Authenticated users can view active coupons" ON public.coupons
  FOR SELECT TO authenticated
  USING ((is_active = true) AND (expires_at IS NULL OR expires_at > now()));