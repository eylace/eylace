-- anon: remove blanket table SELECT, grant column-level SELECT excluding sensitive cols
REVOKE SELECT ON public.products FROM anon;
GRANT SELECT (id, name, slug, description, price, original_price, discount, images,
  category_id, seller_id, rating, review_count, stock, variations, attributes,
  is_flash_sale, flash_sale_ends, is_prime, is_free_shipping, is_active,
  created_at, updated_at, brand_id, is_digital, warranty_id, label_id,
  sold_count, flash_sale_starts, size_guide_id, meta_title, meta_description,
  meta_keywords, meta_image, canonical_url, short_description, tags
) ON public.products TO anon;

-- authenticated: same column-level restriction so non-admins can't read cost via direct API
REVOKE SELECT ON public.products FROM authenticated;
GRANT SELECT (id, name, slug, description, price, original_price, discount, images,
  category_id, seller_id, rating, review_count, stock, variations, attributes,
  is_flash_sale, flash_sale_ends, is_prime, is_free_shipping, is_active,
  created_at, updated_at, brand_id, is_digital, digital_file_url, warranty_id, label_id,
  sold_count, flash_sale_starts, size_guide_id, meta_title, meta_description,
  meta_keywords, meta_image, canonical_url, short_description, tags
) ON public.products TO authenticated;