
-- SECURITY FIX: Remove ai_settings from public allowlist
DROP POLICY IF EXISTS "Public can view safe settings" ON public.system_settings;

CREATE POLICY "Public can view safe settings" ON public.system_settings
  FOR SELECT TO anon, authenticated
  USING (key IN ('store_settings', 'smart_bar', 'menu_config_v1'));

-- SECURITY FIX: Restrict product_reviews SELECT to authenticated only
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.product_reviews;
DROP POLICY IF EXISTS "Public can view reviews" ON public.product_reviews;

CREATE POLICY "Public can view reviews without user_id" ON public.product_reviews
  FOR SELECT TO anon
  USING (true);

-- Revoke user_id column from anon on product_reviews
REVOKE SELECT ON public.product_reviews FROM anon;
GRANT SELECT (id, product_id, rating, title, content, images, helpful_count, verified_purchase, created_at, updated_at) ON public.product_reviews TO anon;
GRANT SELECT ON public.product_reviews TO authenticated;

-- SECURITY FIX: Restrict preorder_reviews SELECT
DROP POLICY IF EXISTS "Anyone can view preorder reviews" ON public.preorder_reviews;
DROP POLICY IF EXISTS "Public can view preorder reviews" ON public.preorder_reviews;

CREATE POLICY "Public can view preorder reviews" ON public.preorder_reviews
  FOR SELECT TO anon
  USING (true);

REVOKE SELECT ON public.preorder_reviews FROM anon;
GRANT SELECT (id, preorder_product_id, rating, title, content, images, created_at) ON public.preorder_reviews TO anon;
GRANT SELECT ON public.preorder_reviews TO authenticated;

-- SECURITY FIX: Restrict review_votes to authenticated only
DROP POLICY IF EXISTS "Anyone can view review votes" ON public.review_votes;
DROP POLICY IF EXISTS "Public can view review votes" ON public.review_votes;

CREATE POLICY "Authenticated users can view review votes" ON public.review_votes
  FOR SELECT TO authenticated
  USING (true);
