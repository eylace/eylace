
-- 1. Restrict cost_per_item and digital_file_url on products from public roles
REVOKE SELECT ON public.products FROM anon, authenticated;
GRANT SELECT (id, name, slug, description, price, original_price, discount, images, category_id, seller_id, rating, review_count, stock, variations, attributes, is_flash_sale, flash_sale_ends, is_prime, is_free_shipping, is_active, created_at, updated_at, brand_id, is_digital, warranty_id, label_id, sold_count, flash_sale_starts, size_guide_id, meta_title, meta_description, meta_keywords, meta_image, canonical_url, short_description, tags) ON public.products TO anon, authenticated;

-- 2. Restrict cost_per_item on order_items from public roles
REVOKE SELECT ON public.order_items FROM anon, authenticated;
GRANT SELECT (id, order_id, product_id, product_name, product_image, price, quantity, variations, created_at) ON public.order_items TO anon, authenticated;
GRANT INSERT ON public.order_items TO anon, authenticated;

-- 3. Restrict permissions table SELECT to authenticated admins only
DROP POLICY IF EXISTS "Anyone can view permissions" ON public.permissions;
CREATE POLICY "Admins can view permissions"
ON public.permissions
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));
REVOKE SELECT ON public.permissions FROM anon;
