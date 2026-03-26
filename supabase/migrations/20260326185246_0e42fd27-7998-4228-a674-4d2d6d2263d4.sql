-- Keep product rating/review_count in sync immediately after review write/update/delete
DROP TRIGGER IF EXISTS trg_update_product_review_stats ON public.product_reviews;

CREATE TRIGGER trg_update_product_review_stats
AFTER INSERT OR UPDATE OF rating, product_id OR DELETE
ON public.product_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_product_review_stats();