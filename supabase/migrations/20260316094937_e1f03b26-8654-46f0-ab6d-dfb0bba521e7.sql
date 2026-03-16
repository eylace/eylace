-- 1. Allow anyone to SELECT product_reviews (reviews are public content)
CREATE POLICY "Anyone can view reviews" ON public.product_reviews
FOR SELECT TO public USING (true);

-- 2. Trigger function to auto-update products.rating and products.review_count
CREATE OR REPLACE FUNCTION public.update_product_review_stats()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE _product_id text;
BEGIN
  _product_id := COALESCE(NEW.product_id, OLD.product_id);
  UPDATE public.products SET
    review_count = (SELECT COUNT(*)::integer FROM product_reviews WHERE product_id = _product_id),
    rating = COALESCE((SELECT ROUND(AVG(rating)::numeric, 2) FROM product_reviews WHERE product_id = _product_id), 0)
  WHERE id::text = _product_id;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_update_product_review_stats
AFTER INSERT OR UPDATE OR DELETE ON public.product_reviews
FOR EACH ROW EXECUTE FUNCTION public.update_product_review_stats();