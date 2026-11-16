CREATE OR REPLACE FUNCTION public.prevent_affiliate_self_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.role() = 'service_role'
     OR public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.commission_rate IS DISTINCT FROM OLD.commission_rate
     OR NEW.total_earnings IS DISTINCT FROM OLD.total_earnings
     OR NEW.total_paid IS DISTINCT FROM OLD.total_paid
     OR NEW.total_clicks IS DISTINCT FROM OLD.total_clicks
     OR NEW.total_conversions IS DISTINCT FROM OLD.total_conversions
     OR NEW.referral_code IS DISTINCT FROM OLD.referral_code
     OR NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.admin_notes IS DISTINCT FROM OLD.admin_notes
  THEN
    RAISE EXCEPTION 'Not authorized to modify protected affiliate fields'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_courier_advance_payment(
  _order_id uuid,
  _user_id uuid,
  _gateway text,
  _txn_ref text,
  _amount numeric,
  _customer_phone text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE v_id uuid;
BEGIN
  INSERT INTO public.courier_advance_payments(order_id, user_id, gateway, txn_ref, amount, status, customer_phone)
  VALUES (
    _order_id, _user_id, lower(_gateway), _txn_ref, _amount, 'initiated',
    NULLIF(regexp_replace(COALESCE(_customer_phone, ''), '[^0-9]', '', 'g'), '')
  )
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.claim_courier_advance_payment(
  _txn_ref text,
  _order_id uuid,
  _user_id uuid,
  _customer_phone text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.courier_advance_payments
  SET order_id = _order_id, updated_at = now()
  WHERE txn_ref = _txn_ref
    AND status = 'success'
    AND order_id IS NULL
    AND (
      (_user_id IS NOT NULL AND user_id = _user_id)
      OR (
        user_id IS NULL
        AND customer_phone = NULLIF(regexp_replace(COALESCE(_customer_phone, ''), '[^0-9]', '', 'g'), '')
      )
    );
  RETURN FOUND;
END;
$function$;

CREATE OR REPLACE FUNCTION public.record_delivered_affiliate_conversion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_affiliate_id uuid;
  v_affiliate_user_id uuid;
  v_rate numeric;
  v_commission numeric;
  v_conversion_id uuid;
BEGIN
  -- Never reward a client-supplied order inserted already marked delivered.
  IF TG_OP <> 'UPDATE'
     OR NEW.status NOT IN ('delivered', 'completed')
     OR OLD.status IS NOT DISTINCT FROM NEW.status
     OR NEW.affiliate_referral_code IS NULL THEN
    RETURN NEW;
  END IF;

  -- Only the order-management roles or trusted server-side functions may
  -- confirm fulfillment and create commission records.
  IF auth.role() IS DISTINCT FROM 'service_role'
     AND (auth.uid() IS NULL OR NOT public.can_access_admin_orders(auth.uid())) THEN
    RETURN NEW;
  END IF;

  SELECT id, user_id, commission_rate
    INTO v_affiliate_id, v_affiliate_user_id, v_rate
  FROM public.affiliates
  WHERE referral_code = NEW.affiliate_referral_code
    AND status = 'approved'
  LIMIT 1;

  IF v_affiliate_id IS NULL OR v_affiliate_user_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  v_commission := GREATEST(COALESCE(NEW.total, 0), 0) * GREATEST(COALESCE(v_rate, 0), 0) / 100;
  INSERT INTO public.affiliate_conversions(affiliate_id, order_id, order_total, commission_amount, status)
  VALUES (v_affiliate_id, NEW.id, GREATEST(COALESCE(NEW.total, 0), 0), v_commission, 'pending')
  ON CONFLICT (order_id) WHERE order_id IS NOT NULL DO NOTHING
  RETURNING id INTO v_conversion_id;

  IF v_conversion_id IS NOT NULL THEN
    UPDATE public.affiliates
    SET total_conversions = COALESCE(total_conversions, 0) + 1,
        total_earnings = COALESCE(total_earnings, 0) + v_commission,
        updated_at = now()
    WHERE id = v_affiliate_id;
  END IF;

  RETURN NEW;
END;
$function$;