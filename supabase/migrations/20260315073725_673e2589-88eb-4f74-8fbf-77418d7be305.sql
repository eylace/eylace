-- Fix #1: Remove public SELECT on products table (protects digital_file_url)
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;

-- Fix #2: Ensure products_public view uses owner privileges (SECURITY DEFINER)
ALTER VIEW public.products_public SET (security_invoker = false);

-- Fix #3: Restrict coupons public SELECT to active non-expired codes only
DROP POLICY IF EXISTS "Anyone can view active coupons" ON public.coupons;
CREATE POLICY "Public can view active non-expired coupons" ON public.coupons
  FOR SELECT TO public
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));