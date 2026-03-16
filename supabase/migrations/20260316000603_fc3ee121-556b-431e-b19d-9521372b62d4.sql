
CREATE TABLE public.incomplete_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text,
  first_name text,
  last_name text,
  email text,
  phone text,
  address text,
  city text,
  state text,
  zip_code text,
  country text,
  cart_items jsonb DEFAULT '[]'::jsonb,
  cart_total numeric DEFAULT 0,
  status text DEFAULT 'abandoned',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.incomplete_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert incomplete orders"
ON public.incomplete_orders FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admin can read incomplete orders"
ON public.incomplete_orders FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update incomplete orders"
ON public.incomplete_orders FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can delete incomplete orders"
ON public.incomplete_orders FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
