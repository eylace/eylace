DROP POLICY IF EXISTS "Anyone can view labels" ON public.product_labels;
CREATE POLICY "Anyone can view labels" ON public.product_labels FOR SELECT TO public USING (is_active IS TRUE);

DROP POLICY IF EXISTS "Anyone can view flash deal products" ON public.flash_deal_products;
CREATE POLICY "Anyone can view flash deal products" ON public.flash_deal_products FOR SELECT TO public
USING (
  EXISTS (
    SELECT 1 FROM public.flash_deals fd
    WHERE fd.id = flash_deal_products.flash_deal_id
      AND fd.is_active IS TRUE
      AND (fd.start_date IS NULL OR fd.start_date <= now())
      AND (fd.end_date IS NULL OR fd.end_date >= now())
  )
  AND EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = flash_deal_products.product_id
      AND p.is_active IS TRUE
  )
);

DROP POLICY IF EXISTS "Anyone can view size guides" ON public.size_guides;
CREATE POLICY "Anyone can view size guides" ON public.size_guides FOR SELECT TO public USING (is_active IS TRUE);

DROP POLICY IF EXISTS "Anyone can view colors" ON public.colors;
CREATE POLICY "Anyone can view colors" ON public.colors FOR SELECT TO public USING (is_active IS TRUE);

DROP POLICY IF EXISTS "Anyone can view attributes" ON public.product_attributes;
CREATE POLICY "Anyone can view attributes" ON public.product_attributes FOR SELECT TO public USING (is_active IS TRUE);

DROP POLICY IF EXISTS "Anyone can view preorder notification types" ON public.preorder_notification_types;

DROP POLICY IF EXISTS "Anyone can view brands" ON public.brands;
CREATE POLICY "Anyone can view brands" ON public.brands FOR SELECT TO public USING (is_active IS TRUE);

DROP POLICY IF EXISTS "Anyone can view warranties" ON public.warranties;
CREATE POLICY "Anyone can view warranties" ON public.warranties FOR SELECT TO public USING (is_active IS TRUE);

DROP POLICY IF EXISTS "Public read avatar images by exact name" ON storage.objects;
CREATE POLICY "Public read avatar images by exact name" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'avatars' AND owner_id = (SELECT auth.uid()::text));

DROP POLICY IF EXISTS "Public read product images by exact name" ON storage.objects;
CREATE POLICY "Public read product images by exact name" ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'product-images'
  AND (
    owner_id = (SELECT auth.uid()::text)
    OR public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
    OR public.has_role((SELECT auth.uid()), 'super_admin'::public.app_role)
    OR public.has_role((SELECT auth.uid()), 'product_manager'::public.app_role)
  )
);

DROP POLICY IF EXISTS "Public read review images by exact name" ON storage.objects;
CREATE POLICY "Public read review images by exact name" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'review-images' AND owner_id = (SELECT auth.uid()::text));