DROP POLICY IF EXISTS "Anyone can view category discounts" ON public.category_discounts;
CREATE POLICY "Anyone can view category discounts"
ON public.category_discounts
FOR SELECT
TO anon, authenticated
USING (is_active IS TRUE);

DROP POLICY IF EXISTS "Anyone can view reviews" ON public.product_reviews;
DROP POLICY IF EXISTS "Public can view reviews without user_id" ON public.product_reviews;
DROP POLICY IF EXISTS "Anon can view product reviews" ON public.product_reviews;
DROP POLICY IF EXISTS "Public can view reviews for active products" ON public.product_reviews;
DROP POLICY IF EXISTS "Users can view own reviews" ON public.product_reviews;
CREATE POLICY "Public can view reviews for active products"
ON public.product_reviews
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.products AS p
    WHERE p.id::text = product_reviews.product_id
      AND p.is_active IS TRUE
  )
);
CREATE POLICY "Users can view own reviews"
ON public.product_reviews
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view active couriers" ON public.couriers;
CREATE POLICY "Anyone can view active couriers"
ON public.couriers
FOR SELECT
TO anon, authenticated
USING (is_active IS TRUE);

DROP POLICY IF EXISTS "Authenticated users can upload review images" ON storage.objects;
CREATE POLICY "Authenticated users can upload review images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'review-images'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);