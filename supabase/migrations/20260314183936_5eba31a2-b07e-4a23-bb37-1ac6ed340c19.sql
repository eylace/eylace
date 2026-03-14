
-- Create a public view that excludes the sensitive digital_file_url column
CREATE VIEW public.products_public
WITH (security_invoker = on) AS
SELECT 
  id, name, slug, description, price, original_price, discount,
  images, category_id, seller_id, rating, review_count, stock,
  variations, attributes, is_flash_sale, flash_sale_ends,
  is_prime, is_free_shipping, is_active, is_digital,
  brand_id, label_id, warranty_id,
  created_at, updated_at
FROM public.products;
-- NOTE: digital_file_url is intentionally excluded
