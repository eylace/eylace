
-- Add sold_count column
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sold_count integer NOT NULL DEFAULT 0;

-- Create trigger function to decrement stock on order_items insert
CREATE OR REPLACE FUNCTION public.decrement_stock_on_order_item()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.products
  SET
    stock = GREATEST(COALESCE(stock, 0) - NEW.quantity, 0),
    sold_count = COALESCE(sold_count, 0) + NEW.quantity
  WHERE id::text = NEW.product_id;
  RETURN NEW;
END;
$$;

-- Create trigger on order_items
CREATE TRIGGER trg_decrement_stock_after_order_item
AFTER INSERT ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.decrement_stock_on_order_item();

-- Enable realtime for products
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
