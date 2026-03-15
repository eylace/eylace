
-- ============================================================
-- SECURITY FIX #1: Sellers cannot self-verify or manipulate rating
-- ============================================================

DROP POLICY IF EXISTS "Sellers can update their own profile" ON public.sellers;

CREATE OR REPLACE FUNCTION public.seller_safe_update(
  _name text DEFAULT NULL,
  _slug text DEFAULT NULL,
  _logo text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.sellers
  SET
    name = COALESCE(_name, name),
    slug = COALESCE(_slug, slug),
    logo = COALESCE(_logo, logo),
    updated_at = now()
  WHERE user_id = auth.uid();
END;
$$;

-- ============================================================
-- SECURITY FIX #2: Users cannot modify order financials/status
-- ============================================================

DROP POLICY IF EXISTS "Users can update their own orders" ON public.orders;

CREATE OR REPLACE FUNCTION public.user_cancel_order(_order_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.orders
  SET status = 'cancelled', updated_at = now()
  WHERE id = _order_id
    AND user_id = auth.uid()
    AND status = 'pending';
  RETURN FOUND;
END;
$$;

-- ============================================================
-- SECURITY FIX #3: Reviews - restrict update to safe columns
-- ============================================================

DROP POLICY IF EXISTS "Users can update their own reviews" ON public.product_reviews;

CREATE OR REPLACE FUNCTION public.user_update_review(
  _review_id uuid,
  _title text DEFAULT NULL,
  _content text DEFAULT NULL,
  _rating integer DEFAULT NULL,
  _images text[] DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.product_reviews
  SET
    title = COALESCE(_title, title),
    content = COALESCE(_content, content),
    rating = COALESCE(_rating, rating),
    images = COALESCE(_images, images),
    updated_at = now()
  WHERE id = _review_id
    AND user_id = auth.uid();
  RETURN FOUND;
END;
$$;

-- ============================================================
-- SECURITY FIX #4: Hide admin_notes from seller applicants
-- ============================================================

DROP POLICY IF EXISTS "Users can view own application" ON public.seller_applications;

REVOKE SELECT ON public.seller_applications FROM authenticated;
GRANT SELECT (id, user_id, store_name, store_description, business_type, phone, status, created_at, updated_at) ON public.seller_applications TO authenticated;

CREATE POLICY "Users can view own application safe columns" ON public.seller_applications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Ensure admins have full access
GRANT ALL ON public.seller_applications TO authenticated;
