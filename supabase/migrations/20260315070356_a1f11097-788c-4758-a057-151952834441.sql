
CREATE TABLE public.flash_deal_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flash_deal_id uuid NOT NULL REFERENCES public.flash_deals(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  deal_price numeric,
  deal_discount numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(flash_deal_id, product_id)
);

ALTER TABLE public.flash_deal_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage flash deal products" ON public.flash_deal_products
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view flash deal products" ON public.flash_deal_products
  FOR SELECT TO public USING (true);
