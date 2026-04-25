
-- 1. Add override_status column to courier_expenses
ALTER TABLE public.courier_expenses
  ADD COLUMN IF NOT EXISTS override_status text NOT NULL DEFAULT 'auto_default';

-- Allowed values: auto_default | auto_api | manual_override | api_overwrite
ALTER TABLE public.courier_expenses
  DROP CONSTRAINT IF EXISTS courier_expenses_override_status_check;
ALTER TABLE public.courier_expenses
  ADD CONSTRAINT courier_expenses_override_status_check
  CHECK (override_status IN ('auto_default','auto_api','manual_override','api_overwrite'));

-- 2. Audit log table
CREATE TABLE IF NOT EXISTS public.courier_expenses_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id uuid,
  action text NOT NULL,
  before_data jsonb,
  after_data jsonb,
  changed_by uuid,
  changed_by_email text,
  source text,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_courier_expenses_audit_expense ON public.courier_expenses_audit(expense_id);
CREATE INDEX IF NOT EXISTS idx_courier_expenses_audit_created ON public.courier_expenses_audit(created_at DESC);

ALTER TABLE public.courier_expenses_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Finance staff can view courier audit" ON public.courier_expenses_audit;
CREATE POLICY "Finance staff can view courier audit"
  ON public.courier_expenses_audit
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'super_admin'::app_role)
    OR has_role(auth.uid(), 'finance_manager'::app_role)
  );

-- No direct insert/update/delete: trigger only.

-- 3. Audit trigger on courier_expenses
CREATE OR REPLACE FUNCTION public.audit_courier_expenses()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_email text;
BEGIN
  IF v_uid IS NOT NULL THEN
    SELECT email INTO v_email FROM auth.users WHERE id = v_uid LIMIT 1;
  END IF;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.courier_expenses_audit(expense_id, action, before_data, after_data, changed_by, changed_by_email, source)
    VALUES (NEW.id, 'INSERT', NULL, to_jsonb(NEW), v_uid, v_email, COALESCE(NEW.source,'manual'));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.courier_expenses_audit(expense_id, action, before_data, after_data, changed_by, changed_by_email, source)
    VALUES (NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), v_uid, v_email, COALESCE(NEW.source, OLD.source));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.courier_expenses_audit(expense_id, action, before_data, after_data, changed_by, changed_by_email, source)
    VALUES (OLD.id, 'DELETE', to_jsonb(OLD), NULL, v_uid, v_email, OLD.source);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_courier_expenses ON public.courier_expenses;
CREATE TRIGGER trg_audit_courier_expenses
AFTER INSERT OR UPDATE OR DELETE ON public.courier_expenses
FOR EACH ROW EXECUTE FUNCTION public.audit_courier_expenses();

-- 4. Variant rows validation on products
CREATE OR REPLACE FUNCTION public.validate_product_variant_rows()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  rows jsonb;
  row jsonb;
  v_stock numeric;
  v_price numeric;
BEGIN
  IF NEW.attributes IS NULL OR jsonb_typeof(NEW.attributes) <> 'object' THEN
    RETURN NEW;
  END IF;

  rows := NEW.attributes -> 'variant_rows';
  IF rows IS NULL OR jsonb_typeof(rows) <> 'array' THEN
    RETURN NEW;
  END IF;

  FOR row IN SELECT * FROM jsonb_array_elements(rows) LOOP
    -- Stock validation
    IF row ? 'stock' AND (row ->> 'stock') IS NOT NULL AND (row ->> 'stock') <> '' THEN
      BEGIN
        v_stock := (row ->> 'stock')::numeric;
        IF v_stock < 0 THEN
          RAISE EXCEPTION 'Variant stock cannot be negative (got %)', v_stock USING ERRCODE='check_violation';
        END IF;
      EXCEPTION WHEN invalid_text_representation THEN
        RAISE EXCEPTION 'Variant stock must be a number';
      END;
    END IF;

    -- Price validation
    IF row ? 'price' AND (row ->> 'price') IS NOT NULL AND (row ->> 'price') <> '' THEN
      BEGIN
        v_price := (row ->> 'price')::numeric;
        IF v_price < 0 THEN
          RAISE EXCEPTION 'Variant price cannot be negative (got %)', v_price USING ERRCODE='check_violation';
        END IF;
      EXCEPTION WHEN invalid_text_representation THEN
        RAISE EXCEPTION 'Variant price must be a number';
      END;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_product_variant_rows ON public.products;
CREATE TRIGGER trg_validate_product_variant_rows
BEFORE INSERT OR UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.validate_product_variant_rows();

-- 5. Admin RPC: list audit entries
CREATE OR REPLACE FUNCTION public.admin_list_courier_expense_audit(
  _limit int DEFAULT 200,
  _expense uuid DEFAULT NULL
)
RETURNS SETOF public.courier_expenses_audit
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'super_admin'::app_role)
    OR has_role(auth.uid(), 'finance_manager'::app_role)
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
    SELECT *
    FROM public.courier_expenses_audit
    WHERE (_expense IS NULL OR expense_id = _expense)
    ORDER BY created_at DESC
    LIMIT GREATEST(1, LEAST(COALESCE(_limit,200), 1000));
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_courier_expense_audit(int, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_courier_expense_audit(int, uuid) TO authenticated;

-- 6. Helper: upsert/overwrite courier expense from courier API result
-- This lets the shipping-provider edge function update an existing auto record
-- with the actual cost reported by the courier API and mark the override status.
CREATE OR REPLACE FUNCTION public.apply_courier_api_cost(
  _order_id uuid,
  _provider text,
  _amount numeric,
  _zone text DEFAULT NULL,
  _notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  -- Look for the most recent auto-recorded expense for this order
  SELECT id INTO v_id
  FROM public.courier_expenses
  WHERE order_id = _order_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_id IS NULL THEN
    INSERT INTO public.courier_expenses(order_id, courier_provider, area_zone, amount, source, override_status, notes)
    VALUES (_order_id, _provider, _zone, _amount, 'api', 'auto_api', COALESCE(_notes,'Cost fetched from courier API'))
    RETURNING id INTO v_id;
  ELSE
    UPDATE public.courier_expenses
       SET amount = _amount,
           courier_provider = COALESCE(_provider, courier_provider),
           area_zone = COALESCE(_zone, area_zone),
           source = 'api',
           override_status = CASE WHEN override_status = 'manual_override' THEN 'manual_override' ELSE 'api_overwrite' END,
           notes = COALESCE(_notes, notes),
           updated_at = now()
     WHERE id = v_id;
  END IF;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.apply_courier_api_cost(uuid, text, numeric, text, text) FROM PUBLIC;
-- Service role only (called from edge function); no grant to authenticated.
