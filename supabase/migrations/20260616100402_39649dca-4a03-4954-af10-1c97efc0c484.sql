
-- 1) Restrict broad product SELECT for sensitive columns (cost_per_item, digital_file_url)
-- Drop duplicate authenticated policy and scope the public-read policy to anon only.
-- Authenticated non-admin/non-seller users will read via products_public view (owner-bypass RLS).
DROP POLICY IF EXISTS "Authenticated can view active products" ON public.products;
DROP POLICY IF EXISTS "Anon can view active products" ON public.products;
CREATE POLICY "Anon can view active products"
  ON public.products
  FOR SELECT
  TO anon
  USING (is_active = true);

-- 2) OTP codes: prevent admin harvesting of live OTPs by limiting SELECT to expired/used rows
DROP POLICY IF EXISTS "Admins can view otp codes" ON public.otp_codes;
CREATE POLICY "Admins can view expired or used otp codes"
  ON public.otp_codes
  FOR SELECT
  TO authenticated
  USING (
    (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role))
    AND (is_used = true OR expires_at < now())
  );

-- 3) Affiliate clicks: allow anonymous storefront visitors to record clicks for active affiliates
CREATE POLICY "Anon can record affiliate clicks"
  ON public.affiliate_clicks
  FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.affiliates
      WHERE affiliates.id = affiliate_clicks.affiliate_id
        AND affiliates.status = 'active'
    )
  );
GRANT INSERT ON public.affiliate_clicks TO anon;

-- 4) Preorder reviews: allow users to read their own reviews
CREATE POLICY "Users can view own preorder reviews"
  ON public.preorder_reviews
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 5) Seller commission config: allow sellers to read their own commission rows
CREATE POLICY "Sellers can view own commission config"
  ON public.seller_commission_config
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sellers
      WHERE sellers.id = seller_commission_config.seller_id
        AND sellers.user_id = auth.uid()
    )
  );
