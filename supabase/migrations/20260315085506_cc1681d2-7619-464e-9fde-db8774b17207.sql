
-- FIX: Remove anon direct table access for sellers (use sellers_public view instead)
DROP POLICY IF EXISTS "Anon can view sellers via view" ON public.sellers;

-- Make sellers_public view SECURITY INVOKER to resolve linter warning
ALTER VIEW public.sellers_public SET (security_invoker = true);

-- Grant anon SELECT on sellers_public view (no user_id column)
GRANT SELECT ON public.sellers_public TO anon;
GRANT SELECT ON public.sellers_public TO authenticated;

-- Sellers need anon SELECT via the view, so we need a policy that allows reading
-- but only through the view. Since SECURITY INVOKER means RLS applies,
-- we need a limited anon policy on sellers table for the view to work.
-- Instead, keep SECURITY DEFINER on sellers_public to bypass RLS safely.
ALTER VIEW public.sellers_public SET (security_invoker = false);

-- FIX: Remove anon direct access to product_reviews, create safe view
DROP POLICY IF EXISTS "Anon can view product reviews" ON public.product_reviews;

CREATE OR REPLACE VIEW public.product_reviews_public AS
SELECT id, product_id, rating, title, content, images, helpful_count, verified_purchase, created_at, updated_at
FROM public.product_reviews;

GRANT SELECT ON public.product_reviews_public TO anon;
GRANT SELECT ON public.product_reviews_public TO authenticated;
