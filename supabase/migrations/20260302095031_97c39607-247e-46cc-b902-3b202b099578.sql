-- Allow sellers to manage their own products
CREATE POLICY "Sellers can insert their own products"
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (
  seller_id IS NOT NULL AND
  EXISTS (SELECT 1 FROM public.sellers WHERE id = seller_id AND user_id = auth.uid())
);

CREATE POLICY "Sellers can update their own products"
ON public.products
FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.sellers WHERE id = seller_id AND user_id = auth.uid())
);

CREATE POLICY "Sellers can view their own products"
ON public.products
FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.sellers WHERE id = seller_id AND user_id = auth.uid())
);

CREATE POLICY "Sellers can delete their own products"
ON public.products
FOR DELETE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.sellers WHERE id = seller_id AND user_id = auth.uid())
);

-- Create product-images storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for product images
CREATE POLICY "Authenticated users can upload product images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Anyone can view product images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can delete their product images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');
