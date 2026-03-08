
-- Brands table
CREATE TABLE public.brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  logo text,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view brands" ON public.brands FOR SELECT USING (true);
CREATE POLICY "Admins can manage brands" ON public.brands FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Warranties table
CREATE TABLE public.warranties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  duration text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.warranties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view warranties" ON public.warranties FOR SELECT USING (true);
CREATE POLICY "Admins can manage warranties" ON public.warranties FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Colors table
CREATE TABLE public.colors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  hex_code text NOT NULL DEFAULT '#000000',
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.colors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view colors" ON public.colors FOR SELECT USING (true);
CREATE POLICY "Admins can manage colors" ON public.colors FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Size guides table
CREATE TABLE public.size_guides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  sizes jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.size_guides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view size guides" ON public.size_guides FOR SELECT USING (true);
CREATE POLICY "Admins can manage size guides" ON public.size_guides FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Product labels (Custom Labels)
CREATE TABLE public.product_labels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text NOT NULL DEFAULT '#3b82f6',
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.product_labels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view labels" ON public.product_labels FOR SELECT USING (true);
CREATE POLICY "Admins can manage labels" ON public.product_labels FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Category discounts
CREATE TABLE public.category_discounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  discount_type text NOT NULL DEFAULT 'percentage',
  discount_value numeric NOT NULL DEFAULT 0,
  starts_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.category_discounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view category discounts" ON public.category_discounts FOR SELECT USING (true);
CREATE POLICY "Admins can manage category discounts" ON public.category_discounts FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Product attributes (master list)
CREATE TABLE public.product_attributes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  values text[] NOT NULL DEFAULT '{}'::text[],
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.product_attributes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view attributes" ON public.product_attributes FOR SELECT USING (true);
CREATE POLICY "Admins can manage attributes" ON public.product_attributes FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Add new columns to products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_digital boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS digital_file_url text,
  ADD COLUMN IF NOT EXISTS warranty_id uuid REFERENCES public.warranties(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS label_id uuid REFERENCES public.product_labels(id) ON DELETE SET NULL;
