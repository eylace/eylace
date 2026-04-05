
-- 1. Fix Security Definer Views → convert to SECURITY INVOKER

-- products_public view
DROP VIEW IF EXISTS public.products_public;
CREATE VIEW public.products_public
WITH (security_invoker = true)
AS
SELECT
  id, name, slug, price, original_price, discount, images,
  rating, review_count, is_active, is_flash_sale, flash_sale_ends,
  is_free_shipping, is_prime, is_digital, category_id, brand_id,
  label_id, warranty_id, seller_id, description, variations,
  attributes, stock, created_at, updated_at
FROM public.products
WHERE is_active = true;

-- product_reviews_public view
DROP VIEW IF EXISTS public.product_reviews_public;
CREATE VIEW public.product_reviews_public
WITH (security_invoker = true)
AS
SELECT
  id, product_id, rating, title, content, images,
  helpful_count, verified_purchase, created_at, updated_at
FROM public.product_reviews;

-- sellers_public view
DROP VIEW IF EXISTS public.sellers_public;
CREATE VIEW public.sellers_public
WITH (security_invoker = true)
AS
SELECT
  id, name, slug, logo, rating, is_verified, created_at
FROM public.sellers;

-- seller_applications_safe view
DROP VIEW IF EXISTS public.seller_applications_safe;
CREATE VIEW public.seller_applications_safe
WITH (security_invoker = true)
AS
SELECT
  id, store_name, business_type, fulfillment_type, status, created_at, updated_at
FROM public.seller_applications;

-- 2. Fix mutable search_path on functions

CREATE OR REPLACE FUNCTION public.generate_return_tracking_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.return_tracking_number IS NULL THEN
    NEW.return_tracking_number := 'RTN-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(md5(random()::text), 1, 6));
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 3. Fix overly permissive affiliate_clicks INSERT policy
DROP POLICY IF EXISTS "Anyone can insert clicks" ON public.affiliate_clicks;
CREATE POLICY "Validated affiliate click insert"
ON public.affiliate_clicks
FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.affiliates
    WHERE affiliates.id = affiliate_clicks.affiliate_id
      AND affiliates.status = 'active'
  )
);
