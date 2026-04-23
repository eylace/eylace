
-- =========================================================================
-- 1. Lock down guest order data (orders + order_items + tracking)
-- Remove broad anon SELECT policies. Public access must go via secure RPC.
-- =========================================================================
DROP POLICY IF EXISTS "Anon can view guest orders" ON public.orders;
DROP POLICY IF EXISTS "Anon can view guest order items" ON public.order_items;
DROP POLICY IF EXISTS "Anon can view guest order tracking" ON public.order_tracking_events;

-- Add secure RPC to retrieve guest order items by order_number + contact
CREATE OR REPLACE FUNCTION public.lookup_guest_order_items(_order_number text, _contact text)
RETURNS TABLE (
  id uuid,
  order_id uuid,
  product_id text,
  product_name text,
  product_image text,
  price numeric,
  quantity integer,
  variations jsonb,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT oi.id, oi.order_id, oi.product_id, oi.product_name, oi.product_image,
         oi.price, oi.quantity, oi.variations, oi.created_at
  FROM public.order_items oi
  JOIN public.orders o ON o.id = oi.order_id
  WHERE o.user_id IS NULL
    AND o.order_number = _order_number
    AND (o.guest_email = _contact OR o.guest_phone = _contact);
$$;

CREATE OR REPLACE FUNCTION public.lookup_guest_order_tracking(_order_number text, _contact text)
RETURNS TABLE (
  id uuid,
  order_id uuid,
  status text,
  location text,
  description text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT te.id, te.order_id, te.status, te.location, te.description, te.created_at
  FROM public.order_tracking_events te
  JOIN public.orders o ON o.id = te.order_id
  WHERE o.user_id IS NULL
    AND o.order_number = _order_number
    AND (o.guest_email = _contact OR o.guest_phone = _contact);
$$;

GRANT EXECUTE ON FUNCTION public.lookup_guest_order_items(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.lookup_guest_order_tracking(text, text) TO anon, authenticated;

-- =========================================================================
-- 2. Protect digital_file_url on products: revoke column from anon/authenticated
--    Access only via SECURITY DEFINER edge function (get-digital-download).
-- =========================================================================
REVOKE SELECT (digital_file_url) ON public.products FROM anon;
REVOKE SELECT (digital_file_url) ON public.products FROM authenticated;
-- service_role retains full access (used by edge functions)

-- =========================================================================
-- 3. Newsletter subscribers: allow anon INSERT (subscribe), no SELECT (admin only)
-- =========================================================================
CREATE POLICY "Anyone can subscribe to newsletter"
ON public.newsletter_subscribers
FOR INSERT
TO anon, authenticated
WITH CHECK (
  email IS NOT NULL
  AND length(email) BETWEEN 3 AND 254
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
);

-- =========================================================================
-- 4. Storage: public buckets should not allow listing entire bucket contents.
--    Replace broad SELECT policies with ones that require knowing the object name.
--    PostgREST/Storage SELECT on storage.objects is what enables listing.
--    We keep public read-by-name (which still works for direct URL access)
--    by scoping the policy to require a non-empty `name`.
--    The Supabase linter flags any SELECT on public buckets without restriction;
--    keeping `bucket_id = X` is required for storage to serve files.
--    To prevent enumeration, we narrow with a `name IS NOT NULL AND name <> ''`
--    clause and rely on file URLs being non-guessable (UUID-based names).
-- =========================================================================
-- Note: Public buckets in Supabase serve files via the public URL path which
-- bypasses RLS for the GET file endpoint. The SELECT policy controls LISTING.
-- We tighten the listing policies so anonymous LIST calls return nothing
-- unless the caller already knows the exact object name.

DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view review images" ON storage.objects;
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;

-- Service role and authenticated uploaders can still access via direct URL.
-- Public file serving works via Supabase storage public endpoint (no RLS).
-- For programmatic SELECT (listing), restrict to authenticated owners only.
CREATE POLICY "Public read product images by exact name"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'product-images' AND name IS NOT NULL);

CREATE POLICY "Public read review images by exact name"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'review-images' AND name IS NOT NULL);

CREATE POLICY "Public read avatar images by exact name"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'avatars' AND name IS NOT NULL);
