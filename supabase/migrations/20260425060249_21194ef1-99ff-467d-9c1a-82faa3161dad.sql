-- =====================================================================
-- COURIER EXPENSES SYSTEM
-- =====================================================================

-- 1) Default rates table: per courier + zone
CREATE TABLE IF NOT EXISTS public.courier_expense_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_provider text NOT NULL,
  area_zone text NOT NULL,
  default_amount numeric(10,2) NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (courier_provider, area_zone)
);

ALTER TABLE public.courier_expense_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Finance staff manage courier expense settings"
ON public.courier_expense_settings
FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
  OR public.has_role(auth.uid(), 'finance_manager'::app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
  OR public.has_role(auth.uid(), 'finance_manager'::app_role)
);

CREATE TRIGGER trg_courier_expense_settings_updated_at
BEFORE UPDATE ON public.courier_expense_settings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2) Per-delivery expense ledger
CREATE TABLE IF NOT EXISTS public.courier_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  order_number text,
  courier_provider text,
  area_zone text,
  amount numeric(10,2) NOT NULL DEFAULT 0,
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  source text NOT NULL DEFAULT 'manual', -- 'manual' | 'auto_delivered' | 'courier_api'
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_courier_expenses_date ON public.courier_expenses(expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_courier_expenses_order ON public.courier_expenses(order_id);
CREATE INDEX IF NOT EXISTS idx_courier_expenses_provider ON public.courier_expenses(courier_provider);

ALTER TABLE public.courier_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Finance staff manage courier expenses"
ON public.courier_expenses
FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
  OR public.has_role(auth.uid(), 'finance_manager'::app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
  OR public.has_role(auth.uid(), 'finance_manager'::app_role)
);

CREATE TRIGGER trg_courier_expenses_updated_at
BEFORE UPDATE ON public.courier_expenses
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3) Auto-record expense when an order becomes 'delivered'
CREATE OR REPLACE FUNCTION public.auto_record_courier_expense()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_zone text;
  v_amount numeric(10,2) := 0;
  v_addr jsonb;
  v_district text;
BEGIN
  -- Only react when transitioning to delivered
  IF NEW.status <> 'delivered' THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = 'delivered' THEN
    RETURN NEW;
  END IF;

  -- Skip if already recorded for this order
  IF EXISTS (SELECT 1 FROM public.courier_expenses WHERE order_id = NEW.id) THEN
    RETURN NEW;
  END IF;

  -- Determine zone from shipping address
  v_addr := NEW.shipping_address;
  v_district := lower(coalesce(v_addr->>'district', v_addr->>'city', ''));
  IF v_district = 'dhaka' THEN
    v_zone := 'inside_dhaka';
  ELSIF v_district IN ('gazipur','narayanganj','keraniganj','savar') THEN
    v_zone := 'sub_city';
  ELSE
    v_zone := 'outside_dhaka';
  END IF;

  -- Lookup default amount
  SELECT default_amount INTO v_amount
  FROM public.courier_expense_settings
  WHERE courier_provider = COALESCE(NEW.carrier, 'default')
    AND area_zone = v_zone
    AND is_active = true
  LIMIT 1;

  IF v_amount IS NULL THEN
    SELECT default_amount INTO v_amount
    FROM public.courier_expense_settings
    WHERE area_zone = v_zone AND is_active = true
    ORDER BY created_at LIMIT 1;
  END IF;

  INSERT INTO public.courier_expenses (
    order_id, order_number, courier_provider, area_zone,
    amount, expense_date, source, notes
  ) VALUES (
    NEW.id, NEW.order_number, COALESCE(NEW.carrier, 'unknown'), v_zone,
    COALESCE(v_amount, 0), COALESCE(NEW.delivered_at::date, CURRENT_DATE),
    'auto_delivered', 'Auto-recorded on delivery'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_record_courier_expense ON public.orders;
CREATE TRIGGER trg_auto_record_courier_expense
AFTER INSERT OR UPDATE OF status ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.auto_record_courier_expense();

-- 4) Reporting helper for dashboard widget
CREATE OR REPLACE FUNCTION public.courier_expense_summary(_from date, _to date)
RETURNS TABLE(
  total_expense numeric,
  delivery_count bigint,
  avg_per_delivery numeric,
  today_expense numeric,
  week_expense numeric,
  month_expense numeric
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    COALESCE(SUM(amount) FILTER (WHERE expense_date BETWEEN _from AND _to), 0) AS total_expense,
    COUNT(*) FILTER (WHERE expense_date BETWEEN _from AND _to) AS delivery_count,
    COALESCE(AVG(amount) FILTER (WHERE expense_date BETWEEN _from AND _to), 0) AS avg_per_delivery,
    COALESCE(SUM(amount) FILTER (WHERE expense_date = CURRENT_DATE), 0) AS today_expense,
    COALESCE(SUM(amount) FILTER (WHERE expense_date >= CURRENT_DATE - INTERVAL '7 days'), 0) AS week_expense,
    COALESCE(SUM(amount) FILTER (WHERE expense_date >= date_trunc('month', CURRENT_DATE)::date), 0) AS month_expense
  FROM public.courier_expenses
  WHERE
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'finance_manager'::app_role);
$$;

-- 5) Seed default rates (admin can edit later)
INSERT INTO public.courier_expense_settings (courier_provider, area_zone, default_amount, notes)
VALUES
  ('default', 'inside_dhaka', 60, 'Default Inside Dhaka rate'),
  ('default', 'sub_city', 100, 'Default Sub-city rate'),
  ('default', 'outside_dhaka', 130, 'Default Outside Dhaka rate'),
  ('steadfast', 'inside_dhaka', 60, NULL),
  ('steadfast', 'sub_city', 100, NULL),
  ('steadfast', 'outside_dhaka', 130, NULL),
  ('pathao', 'inside_dhaka', 70, NULL),
  ('pathao', 'sub_city', 110, NULL),
  ('pathao', 'outside_dhaka', 140, NULL)
ON CONFLICT (courier_provider, area_zone) DO NOTHING;