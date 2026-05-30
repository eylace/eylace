
-- Tighten order_items: remove broad anon/auth guest insert. checkout-create-order edge function uses service_role.
DROP POLICY IF EXISTS "Anyone can create guest order items" ON public.order_items;

-- Tighten incomplete_orders: remove anon insert that trusted client-controlled x-session-id header.
DROP POLICY IF EXISTS "Anon insert own session" ON public.incomplete_orders;
REVOKE INSERT, UPDATE, DELETE, SELECT ON public.incomplete_orders FROM anon;

-- Prevent sellers from updating sensitive product columns even though they own the row.
REVOKE UPDATE (cost_per_item, digital_file_url) ON public.products FROM authenticated;
REVOKE UPDATE (cost_per_item, digital_file_url) ON public.products FROM anon;
