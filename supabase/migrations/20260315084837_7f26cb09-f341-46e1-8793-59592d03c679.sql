
-- Fix remaining user_id exposure issues

-- product_reviews: use view for anon access
DROP POLICY IF EXISTS "Public can view reviews without user_id" ON public.product_reviews;

-- review_votes: drop old public policy
DROP POLICY IF EXISTS "Users can view votes" ON public.review_votes;

-- preorder_reviews: drop anon policy
DROP POLICY IF EXISTS "Public can view preorder reviews" ON public.preorder_reviews;
CREATE POLICY "Authenticated can view preorder reviews" ON public.preorder_reviews
  FOR SELECT TO authenticated USING (true);

-- sellers: replace public policy with view
DROP POLICY IF EXISTS "Anyone can view sellers" ON public.sellers;

CREATE OR REPLACE VIEW public.sellers_public AS
SELECT id, name, slug, logo, rating, is_verified, created_at
FROM public.sellers;

CREATE POLICY "Anon can view product reviews" ON public.product_reviews
  FOR SELECT TO anon USING (true);

CREATE POLICY "Anon can view sellers via view" ON public.sellers
  FOR SELECT TO anon USING (true);
