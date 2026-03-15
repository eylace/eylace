
-- Fix seller_applications_safe: ensure SECURITY INVOKER
ALTER VIEW public.seller_applications_safe SET (security_invoker = true);

-- Fix review_votes: drop the broad SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view review votes" ON public.review_votes;
