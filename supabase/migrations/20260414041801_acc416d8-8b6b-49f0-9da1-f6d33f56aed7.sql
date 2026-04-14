
-- BUG 2: Recreate products_public view with missing columns
DROP VIEW IF EXISTS public.products_public;
CREATE VIEW public.products_public WITH (security_invoker = true) AS
SELECT
  id, name, slug, price, original_price, discount, images,
  rating, review_count, is_active, is_flash_sale, flash_sale_ends,
  flash_sale_starts, is_free_shipping, is_prime, is_digital,
  category_id, brand_id, label_id, warranty_id, seller_id,
  description, variations, attributes, stock, sold_count,
  created_at, updated_at
FROM public.products;

-- BUG 3: Clean up expired flash sales
UPDATE public.products
SET is_flash_sale = false
WHERE is_flash_sale = true
  AND flash_sale_ends IS NOT NULL
  AND flash_sale_ends < NOW();

-- BUG 4: Guest order tracking events - allow viewing for guest orders
CREATE POLICY "Anyone can view guest order tracking events"
ON public.order_tracking_events
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_tracking_events.order_id
      AND orders.user_id IS NULL
  )
);

-- BUG 5: Admin policies for order_tracking_events
CREATE POLICY "Admins can manage tracking events"
ON public.order_tracking_events
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
