
-- Drop the overly broad guest order SELECT policies
DROP POLICY IF EXISTS "Anyone can view guest orders by order number" ON public.orders;
DROP POLICY IF EXISTS "Anyone can view guest order items" ON public.order_items;
DROP POLICY IF EXISTS "Anyone can view guest order tracking events" ON public.order_tracking_events;

-- Create a secure lookup function for guest order tracking
CREATE OR REPLACE FUNCTION public.lookup_guest_order(
  _order_number text,
  _contact text
)
RETURNS TABLE(
  id uuid,
  order_number text,
  status text,
  total numeric,
  shipping numeric,
  tax numeric,
  discount numeric,
  subtotal numeric,
  payment_method text,
  carrier text,
  tracking_number text,
  estimated_delivery timestamptz,
  shipped_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  shipping_address jsonb,
  guest_email text,
  guest_phone text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    o.id, o.order_number, o.status, o.total, o.shipping, o.tax,
    o.discount, o.subtotal, o.payment_method, o.carrier, o.tracking_number,
    o.estimated_delivery, o.shipped_at, o.delivered_at,
    o.created_at, o.updated_at, o.shipping_address,
    o.guest_email, o.guest_phone
  FROM public.orders o
  WHERE o.user_id IS NULL
    AND o.order_number = _order_number
    AND (o.guest_email = _contact OR o.guest_phone = _contact);
$$;

-- Narrower guest order SELECT: only anon users can see guest orders (for tracking pages)
CREATE POLICY "Anon can view guest orders"
ON public.orders
FOR SELECT
TO anon
USING (user_id IS NULL);

-- Guest order items: only anon
CREATE POLICY "Anon can view guest order items"
ON public.order_items
FOR SELECT
TO anon
USING (EXISTS (
  SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id IS NULL
));

-- Guest tracking events: only anon
CREATE POLICY "Anon can view guest order tracking"
ON public.order_tracking_events
FOR SELECT
TO anon
USING (EXISTS (
  SELECT 1 FROM orders WHERE orders.id = order_tracking_events.order_id AND orders.user_id IS NULL
));
