
ALTER TABLE public.orders ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS guest_email text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS guest_phone text;

-- Allow anon/authenticated to insert guest orders (user_id IS NULL)
CREATE POLICY "Anyone can create guest orders"
ON public.orders FOR INSERT
TO anon, authenticated
WITH CHECK (user_id IS NULL);

-- Allow anon to view their own guest orders by order_number (for tracking)
CREATE POLICY "Anyone can view guest orders by order number"
ON public.orders FOR SELECT
TO anon, authenticated
USING (user_id IS NULL);
