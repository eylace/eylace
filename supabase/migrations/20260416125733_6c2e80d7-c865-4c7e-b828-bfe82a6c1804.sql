ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS cost_per_item numeric(12,2) NOT NULL DEFAULT 0;

ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS cost_per_item numeric(12,2) NOT NULL DEFAULT 0;

UPDATE public.order_items oi
SET cost_per_item = COALESCE(p.cost_per_item, 0)
FROM public.products p
WHERE oi.product_id = p.id::text
  AND COALESCE(oi.cost_per_item, 0) = 0;

CREATE INDEX IF NOT EXISTS idx_order_items_product_id_cost_per_item
ON public.order_items (product_id, cost_per_item);

CREATE INDEX IF NOT EXISTS idx_products_cost_per_item
ON public.products (cost_per_item);