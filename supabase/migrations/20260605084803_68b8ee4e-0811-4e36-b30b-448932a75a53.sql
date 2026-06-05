
GRANT SELECT (cost_per_item) ON public.products TO authenticated;
GRANT SELECT (digital_file_url) ON public.products TO authenticated;
GRANT SELECT (cost_per_item) ON public.order_items TO authenticated;
-- Keep anon revoked: anon never legitimately needs cost or digital file URL.
-- (Already revoked from anon in previous migration; do NOT regrant.)
