CREATE TABLE public.couriers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  logo text,
  tracking_url_template text,
  is_active boolean DEFAULT true,
  delivery_zones jsonb DEFAULT '[]'::jsonb,
  estimated_days_min integer DEFAULT 1,
  estimated_days_max integer DEFAULT 7,
  base_cost numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.couriers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active couriers" ON public.couriers
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage couriers" ON public.couriers
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER couriers_updated_at
  BEFORE UPDATE ON public.couriers
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();