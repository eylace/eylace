REVOKE SELECT (cost_per_item) ON public.order_items FROM authenticated;
REVOKE SELECT (cost_per_item) ON public.order_items FROM anon;