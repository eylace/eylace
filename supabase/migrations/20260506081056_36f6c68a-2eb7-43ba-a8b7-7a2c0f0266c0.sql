ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS advance_courier_amount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS advance_courier_payment_ref text;