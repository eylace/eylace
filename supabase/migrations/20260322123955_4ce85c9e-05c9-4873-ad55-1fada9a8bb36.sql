
DROP POLICY IF EXISTS "Authenticated users can delete their product images" ON storage.objects;

CREATE POLICY "Sellers can delete their own product images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'product-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
