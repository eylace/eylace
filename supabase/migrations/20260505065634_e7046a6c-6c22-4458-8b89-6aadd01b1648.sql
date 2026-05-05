
-- 1. Audit table for courier_status_mapping changes
CREATE TABLE IF NOT EXISTS public.courier_status_mapping_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mapping_id uuid,
  action text NOT NULL,
  before_data jsonb,
  after_data jsonb,
  changed_by uuid,
  changed_by_email text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.courier_status_mapping_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff view status mapping audit" ON public.courier_status_mapping_audit
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'order_manager'::app_role)
  );

CREATE OR REPLACE FUNCTION public.audit_courier_status_mapping()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_email text;
BEGIN
  IF v_uid IS NOT NULL THEN
    SELECT email INTO v_email FROM auth.users WHERE id = v_uid LIMIT 1;
  END IF;
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.courier_status_mapping_audit(mapping_id, action, after_data, changed_by, changed_by_email)
    VALUES (NEW.id, 'INSERT', to_jsonb(NEW), v_uid, v_email);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.courier_status_mapping_audit(mapping_id, action, before_data, after_data, changed_by, changed_by_email)
    VALUES (NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), v_uid, v_email);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.courier_status_mapping_audit(mapping_id, action, before_data, changed_by, changed_by_email)
    VALUES (OLD.id, 'DELETE', to_jsonb(OLD), v_uid, v_email);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_courier_status_mapping ON public.courier_status_mapping;
CREATE TRIGGER trg_audit_courier_status_mapping
AFTER INSERT OR UPDATE OR DELETE ON public.courier_status_mapping
FOR EACH ROW EXECUTE FUNCTION public.audit_courier_status_mapping();

-- 2. In-flight dispatch reservation table to prevent concurrent duplicates
CREATE TABLE IF NOT EXISTS public.courier_dispatch_inflight (
  order_id uuid NOT NULL,
  provider text NOT NULL,
  idempotency_key text NOT NULL,
  acquired_at timestamptz NOT NULL DEFAULT now(),
  acquired_by uuid,
  PRIMARY KEY (order_id, provider, idempotency_key)
);
ALTER TABLE public.courier_dispatch_inflight ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff view inflight" ON public.courier_dispatch_inflight
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'order_manager'::app_role)
  );

-- Auto-cleanup stale rows older than 5 minutes
CREATE OR REPLACE FUNCTION public.try_acquire_dispatch_slot(_order_id uuid, _provider text, _key text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Clean stale reservations (>5 min)
  DELETE FROM public.courier_dispatch_inflight
   WHERE order_id = _order_id AND provider = _provider AND acquired_at < now() - interval '5 minutes';
  BEGIN
    INSERT INTO public.courier_dispatch_inflight(order_id, provider, idempotency_key, acquired_by)
    VALUES (_order_id, _provider, _key, auth.uid());
    RETURN true;
  EXCEPTION WHEN unique_violation THEN
    RETURN false;
  END;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_dispatch_slot(_order_id uuid, _provider text, _key text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  DELETE FROM public.courier_dispatch_inflight
   WHERE order_id = _order_id AND provider = _provider AND idempotency_key = _key;
$$;

-- 3. Webhook event applier — used by webhook edge function (called via service role)
CREATE OR REPLACE FUNCTION public.courier_webhook_apply_event(
  _provider text,
  _tracking_number text,
  _courier_status text,
  _location text DEFAULT NULL,
  _description text DEFAULT NULL,
  _raw jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_order_id uuid;
  v_internal text;
  v_is_terminal boolean := false;
  v_event_id uuid;
BEGIN
  -- Find order by tracking number (most recent matching dispatch log or order row)
  SELECT id INTO v_order_id FROM public.orders
   WHERE tracking_number = _tracking_number
     AND (carrier IS NULL OR lower(carrier) = lower(_provider))
   ORDER BY updated_at DESC LIMIT 1;

  IF v_order_id IS NULL THEN
    SELECT order_id INTO v_order_id FROM public.courier_dispatch_log
     WHERE tracking_number = _tracking_number AND lower(provider) = lower(_provider)
     ORDER BY created_at DESC LIMIT 1;
  END IF;

  IF v_order_id IS NULL THEN
    RAISE EXCEPTION 'no_order_for_tracking %', _tracking_number;
  END IF;

  -- Map external -> internal
  SELECT internal_status, is_terminal INTO v_internal, v_is_terminal
  FROM public.courier_status_mapping
  WHERE lower(provider) = lower(_provider)
    AND lower(courier_status) = lower(_courier_status)
  LIMIT 1;

  v_internal := COALESCE(v_internal, _courier_status);

  INSERT INTO public.order_tracking_events (order_id, status, location, description, created_at)
  VALUES (
    v_order_id, v_internal, COALESCE(_location, _provider),
    COALESCE(_description, format('%s reported: %s', _provider, _courier_status)),
    now()
  )
  RETURNING id INTO v_event_id;

  UPDATE public.orders
     SET status = CASE WHEN v_is_terminal OR v_internal IN ('delivered','cancelled','returned','shipped','out_for_delivery','sent_to_courier')
                       THEN v_internal ELSE status END,
         delivered_at = CASE WHEN v_internal = 'delivered' THEN now() ELSE delivered_at END,
         shipped_at = CASE WHEN v_internal IN ('shipped','sent_to_courier') AND shipped_at IS NULL THEN now() ELSE shipped_at END,
         updated_at = now()
   WHERE id = v_order_id;

  RETURN v_event_id;
END;
$$;

-- 4. Realtime: add tables to publication so admin UI can subscribe
DO $$ BEGIN
  PERFORM 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='courier_dispatch_log';
  IF NOT FOUND THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.courier_dispatch_log';
  END IF;
  PERFORM 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='order_tracking_events';
  IF NOT FOUND THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.order_tracking_events';
  END IF;
END $$;

ALTER TABLE public.courier_dispatch_log REPLICA IDENTITY FULL;
ALTER TABLE public.order_tracking_events REPLICA IDENTITY FULL;
