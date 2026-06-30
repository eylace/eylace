
-- 1. Webhook idempotency log
CREATE TABLE IF NOT EXISTS public.webhook_idempotency (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gateway TEXT NOT NULL,
  external_event_id TEXT NOT NULL,
  payload_hash TEXT,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT webhook_idempotency_unique UNIQUE (gateway, external_event_id)
);

GRANT ALL ON public.webhook_idempotency TO service_role;
ALTER TABLE public.webhook_idempotency ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service role only" ON public.webhook_idempotency
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_webhook_idempotency_gateway_time
  ON public.webhook_idempotency (gateway, processed_at DESC);

-- 2. Harden courier_advance event recorder with row lock + terminal-state guard
CREATE OR REPLACE FUNCTION public.record_courier_advance_event(
  _gateway text,
  _txn_ref text,
  _status text,
  _gateway_payment_id text DEFAULT NULL::text,
  _amount numeric DEFAULT NULL::numeric,
  _raw jsonb DEFAULT NULL::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_id uuid;
  v_order_id uuid;
  v_status text;
  v_existing_status text;
BEGIN
  v_status := lower(_status);

  -- Lock the payment row to serialize concurrent webhook calls.
  SELECT id, order_id, status
    INTO v_id, v_order_id, v_existing_status
    FROM public.courier_advance_payments
   WHERE gateway = lower(_gateway) AND txn_ref = _txn_ref
   FOR UPDATE;

  IF v_id IS NULL THEN
    RAISE EXCEPTION 'no_payment_for_ref %', _txn_ref;
  END IF;

  -- Refuse to regress out of a terminal state. Duplicate "success" is a no-op.
  IF v_existing_status IN ('success', 'failed', 'cancelled') THEN
    IF v_existing_status = v_status THEN
      RETURN v_id; -- idempotent: already applied
    END IF;
    -- Allow success to overwrite an earlier failure ONLY if the new event is success.
    IF NOT (v_existing_status IN ('failed','cancelled') AND v_status = 'success') THEN
      RAISE NOTICE 'Ignoring out-of-order event % -> % for %', v_existing_status, v_status, _txn_ref;
      RETURN v_id;
    END IF;
  END IF;

  UPDATE public.courier_advance_payments
     SET status = v_status,
         gateway_payment_id = COALESCE(_gateway_payment_id, gateway_payment_id),
         amount = COALESCE(_amount, amount),
         raw_payload = COALESCE(_raw, raw_payload),
         completed_at = CASE WHEN v_status IN ('success','failed','cancelled') THEN now() ELSE completed_at END,
         updated_at = now()
   WHERE id = v_id;

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
END;
$function$;

-- 3. Harden courier shipment webhook with row lock + terminal-state guard
CREATE OR REPLACE FUNCTION public.courier_webhook_apply_event(
  _provider text,
  _tracking_number text,
  _courier_status text,
  _location text DEFAULT NULL::text,
  _description text DEFAULT NULL::text,
  _raw jsonb DEFAULT NULL::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_order_id uuid;
  v_existing_status text;
  v_internal text;
  v_is_terminal boolean := false;
  v_event_id uuid;
BEGIN
  SELECT id, status INTO v_order_id, v_existing_status
    FROM public.orders
   WHERE tracking_number = _tracking_number
     AND (carrier IS NULL OR lower(carrier) = lower(_provider))
   ORDER BY updated_at DESC LIMIT 1
   FOR UPDATE;

  IF v_order_id IS NULL THEN
    SELECT order_id INTO v_order_id FROM public.courier_dispatch_log
     WHERE tracking_number = _tracking_number AND lower(provider) = lower(_provider)
     ORDER BY created_at DESC LIMIT 1;
    IF v_order_id IS NOT NULL THEN
      SELECT status INTO v_existing_status FROM public.orders WHERE id = v_order_id FOR UPDATE;
    END IF;
  END IF;

  IF v_order_id IS NULL THEN
    RAISE EXCEPTION 'no_order_for_tracking %', _tracking_number;
  END IF;

  SELECT internal_status, is_terminal INTO v_internal, v_is_terminal
  FROM public.courier_status_mapping
  WHERE lower(provider) = lower(_provider)
    AND lower(courier_status) = lower(_courier_status)
  LIMIT 1;

  v_internal := COALESCE(v_internal, _courier_status);

  -- Always record the raw event for audit, even if we skip the status update.
  INSERT INTO public.order_tracking_events (order_id, status, location, description, created_at)
  VALUES (
    v_order_id, v_internal, COALESCE(_location, _provider),
    COALESCE(_description, format('%s reported: %s', _provider, _courier_status)),
    now()
  )
  RETURNING id INTO v_event_id;

  -- Refuse to regress out of a terminal order state via a stale/duplicate event.
  IF v_existing_status IN ('delivered', 'cancelled', 'returned') THEN
    IF v_internal <> v_existing_status THEN
      RAISE NOTICE 'Ignoring late webhook % for order already in %', v_internal, v_existing_status;
      RETURN v_event_id;
    END IF;
  END IF;

  UPDATE public.orders
     SET status = CASE WHEN v_is_terminal OR v_internal IN ('delivered','cancelled','returned','shipped','out_for_delivery','sent_to_courier')
                       THEN v_internal ELSE status END,
         delivered_at = CASE WHEN v_internal = 'delivered' THEN now() ELSE delivered_at END,
         shipped_at = CASE WHEN v_internal IN ('shipped','sent_to_courier') AND shipped_at IS NULL THEN now() ELSE shipped_at END,
         updated_at = now()
   WHERE id = v_order_id;

  RETURN v_event_id;
END;
$function$;
