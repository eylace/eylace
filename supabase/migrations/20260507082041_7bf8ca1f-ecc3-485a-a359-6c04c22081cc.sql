
-- Settings seed
INSERT INTO public.system_settings (key, value)
VALUES (
  'courier_advance_settings',
  jsonb_build_object(
    'enabled', true,
    'mode', 'flat',           -- flat | zone | percent
    'flat_amount', 100,
    'zone_amounts', jsonb_build_object('inside_dhaka', 80, 'sub_city', 100, 'outside_dhaka', 150),
    'percent_of_shipping', 100,
    'gateways', jsonb_build_array('bkash','nagad')
  )
)
ON CONFLICT (key) DO NOTHING;

-- Main payments table
CREATE TABLE IF NOT EXISTS public.courier_advance_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id uuid,
  gateway text NOT NULL,
  txn_ref text NOT NULL,
  gateway_payment_id text,
  amount numeric(12,2) NOT NULL,
  currency text NOT NULL DEFAULT 'BDT',
  status text NOT NULL DEFAULT 'initiated', -- initiated|pending|success|failed|cancelled
  raw_payload jsonb,
  initiated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (gateway, txn_ref)
);
CREATE INDEX IF NOT EXISTS idx_cap_order ON public.courier_advance_payments(order_id);
CREATE INDEX IF NOT EXISTS idx_cap_user ON public.courier_advance_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_cap_status ON public.courier_advance_payments(status);

ALTER TABLE public.courier_advance_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cap_admin_all ON public.courier_advance_payments;
CREATE POLICY cap_admin_all ON public.courier_advance_payments
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(),'admin'::app_role)
    OR public.has_role(auth.uid(),'super_admin'::app_role)
    OR public.has_role(auth.uid(),'finance_manager'::app_role)
  );

DROP POLICY IF EXISTS cap_owner_select ON public.courier_advance_payments;
CREATE POLICY cap_owner_select ON public.courier_advance_payments
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Audit table
CREATE TABLE IF NOT EXISTS public.courier_advance_payments_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid,
  action text NOT NULL,
  before_data jsonb,
  after_data jsonb,
  changed_by uuid,
  changed_by_email text,
  source text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.courier_advance_payments_audit ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cap_audit_admin ON public.courier_advance_payments_audit;
CREATE POLICY cap_audit_admin ON public.courier_advance_payments_audit
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(),'admin'::app_role)
    OR public.has_role(auth.uid(),'super_admin'::app_role)
    OR public.has_role(auth.uid(),'finance_manager'::app_role)
  );

CREATE OR REPLACE FUNCTION public.audit_courier_advance_payments()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_uid uuid := auth.uid(); v_email text;
BEGIN
  IF v_uid IS NOT NULL THEN
    SELECT email INTO v_email FROM auth.users WHERE id = v_uid LIMIT 1;
  END IF;
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.courier_advance_payments_audit(payment_id,action,after_data,changed_by,changed_by_email,source)
    VALUES (NEW.id,'INSERT',to_jsonb(NEW),v_uid,v_email,NEW.gateway);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.courier_advance_payments_audit(payment_id,action,before_data,after_data,changed_by,changed_by_email,source)
    VALUES (NEW.id,'UPDATE',to_jsonb(OLD),to_jsonb(NEW),v_uid,v_email,NEW.gateway);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.courier_advance_payments_audit(payment_id,action,before_data,changed_by,changed_by_email,source)
    VALUES (OLD.id,'DELETE',to_jsonb(OLD),v_uid,v_email,OLD.gateway);
    RETURN OLD;
  END IF;
  RETURN NULL;
END; $$;

DROP TRIGGER IF EXISTS trg_audit_cap ON public.courier_advance_payments;
CREATE TRIGGER trg_audit_cap
AFTER INSERT OR UPDATE OR DELETE ON public.courier_advance_payments
FOR EACH ROW EXECUTE FUNCTION public.audit_courier_advance_payments();

DROP TRIGGER IF EXISTS trg_cap_updated_at ON public.courier_advance_payments;
CREATE TRIGGER trg_cap_updated_at
BEFORE UPDATE ON public.courier_advance_payments
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Compute advance amount
CREATE OR REPLACE FUNCTION public.compute_courier_advance_amount(_zone text, _shipping numeric)
RETURNS numeric LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v jsonb; v_mode text; v_amt numeric := 0;
BEGIN
  SELECT value INTO v FROM public.system_settings WHERE key = 'courier_advance_settings' LIMIT 1;
  IF v IS NULL OR COALESCE((v->>'enabled')::boolean,false) = false THEN RETURN 0; END IF;
  v_mode := COALESCE(v->>'mode','flat');
  IF v_mode = 'flat' THEN
    v_amt := COALESCE((v->>'flat_amount')::numeric, 0);
  ELSIF v_mode = 'zone' THEN
    v_amt := COALESCE(((v->'zone_amounts')->> COALESCE(_zone,'outside_dhaka'))::numeric, 0);
  ELSIF v_mode = 'percent' THEN
    v_amt := ROUND(COALESCE(_shipping,0) * COALESCE((v->>'percent_of_shipping')::numeric, 0) / 100.0, 2);
  END IF;
  RETURN GREATEST(v_amt, 0);
END; $$;

-- Webhook event applier (called by edge function with service role)
CREATE OR REPLACE FUNCTION public.record_courier_advance_event(
  _gateway text,
  _txn_ref text,
  _status text,
  _gateway_payment_id text DEFAULT NULL,
  _amount numeric DEFAULT NULL,
  _raw jsonb DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_id uuid; v_order_id uuid; v_status text;
BEGIN
  v_status := lower(_status);
  UPDATE public.courier_advance_payments
     SET status = v_status,
         gateway_payment_id = COALESCE(_gateway_payment_id, gateway_payment_id),
         amount = COALESCE(_amount, amount),
         raw_payload = COALESCE(_raw, raw_payload),
         completed_at = CASE WHEN v_status IN ('success','failed','cancelled') THEN now() ELSE completed_at END,
         updated_at = now()
   WHERE gateway = lower(_gateway) AND txn_ref = _txn_ref
   RETURNING id, order_id INTO v_id, v_order_id;

  IF v_id IS NULL THEN
    RAISE EXCEPTION 'no_payment_for_ref %', _txn_ref;
  END IF;

  IF v_status = 'success' AND v_order_id IS NOT NULL THEN
    UPDATE public.orders
       SET advance_courier_payment_ref = _txn_ref,
           advance_courier_amount = COALESCE(_amount, advance_courier_amount),
           updated_at = now()
     WHERE id = v_order_id;

    INSERT INTO public.order_tracking_events(order_id,status,location,description,created_at)
    VALUES (v_order_id,'advance_courier_paid', _gateway,
            format('Advance courier charge paid via %s (ref: %s)', _gateway, _txn_ref), now());
  END IF;

  RETURN v_id;
END; $$;

-- Initiate (called by edge function, service role)
CREATE OR REPLACE FUNCTION public.create_courier_advance_payment(
  _order_id uuid,
  _user_id uuid,
  _gateway text,
  _txn_ref text,
  _amount numeric
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_id uuid;
BEGIN
  INSERT INTO public.courier_advance_payments(order_id,user_id,gateway,txn_ref,amount,status)
  VALUES (_order_id, _user_id, lower(_gateway), _txn_ref, _amount, 'initiated')
  RETURNING id INTO v_id;
  RETURN v_id;
END; $$;
