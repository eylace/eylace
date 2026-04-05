
DROP VIEW IF EXISTS public.preorder_reviews_public;
CREATE VIEW public.preorder_reviews_public
WITH (security_invoker = true)
AS
SELECT
  id, preorder_product_id, rating, title, content, images, created_at
FROM public.preorder_reviews;
