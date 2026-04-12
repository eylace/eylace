
-- Allow inserting order items for guest orders
CREATE POLICY "Anyone can create guest order items"
ON public.order_items FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id 
    AND orders.user_id IS NULL
  )
);

-- Allow viewing guest order items
CREATE POLICY "Anyone can view guest order items"
ON public.order_items FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id 
    AND orders.user_id IS NULL
  )
);
