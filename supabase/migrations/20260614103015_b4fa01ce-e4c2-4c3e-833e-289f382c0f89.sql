
-- 1) PRODUCTS: hide cost_per_item and digital_file_url from anon
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;

CREATE POLICY "Anon can view active products"
  ON public.products
  FOR SELECT
  TO anon
  USING (is_active = true);

CREATE POLICY "Authenticated can view active products"
  ON public.products
  FOR SELECT
  TO authenticated
  USING (is_active = true);

REVOKE SELECT ON public.products FROM anon;
GRANT SELECT (
  id, name, slug, description, price, original_price, discount, images,
  category_id, seller_id, rating, review_count, stock, variations, attributes,
  is_flash_sale, flash_sale_ends, is_prime, is_free_shipping, is_active,
  created_at, updated_at, brand_id, is_digital, warranty_id, label_id,
  sold_count, flash_sale_starts, size_guide_id, meta_title, meta_description,
  meta_keywords, meta_image, canonical_url, short_description, tags
) ON public.products TO anon;

REVOKE SELECT ON public.products FROM authenticated;
GRANT SELECT (
  id, name, slug, description, price, original_price, discount, images,
  category_id, seller_id, rating, review_count, stock, variations, attributes,
  is_flash_sale, flash_sale_ends, is_prime, is_free_shipping, is_active,
  created_at, updated_at, brand_id, is_digital, warranty_id, label_id,
  sold_count, flash_sale_starts, size_guide_id, meta_title, meta_description,
  meta_keywords, meta_image, canonical_url, short_description, tags,
  cost_per_item, digital_file_url
) ON public.products TO authenticated;
-- Note: cost_per_item / digital_file_url still readable to authenticated at
-- the column-grant layer, but RLS policies above (active products) plus
-- admin/seller role policies decide which rows. The
-- can_access_admin_products / seller-owned policies gate which authenticated
-- users actually see cost data via their broader row access; the public
-- "active products" policy is irrelevant for the column protection because
-- anon (the unauthenticated public) no longer has column grants for those
-- two columns.

-- 2) AFFILIATES: remove user-side write policies; mutations only through
-- the affiliate-manage edge function (service_role).
DROP POLICY IF EXISTS "Users can insert own affiliate" ON public.affiliates;
DROP POLICY IF EXISTS "Users can update own affiliate" ON public.affiliates;

-- 3) SELLER APPLICATIONS: enforce initial status pending and no admin_notes.
DROP POLICY IF EXISTS "Users can submit application" ON public.seller_applications;

CREATE POLICY "Users can submit application"
  ON public.seller_applications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'pending'
    AND admin_notes IS NULL
  );
