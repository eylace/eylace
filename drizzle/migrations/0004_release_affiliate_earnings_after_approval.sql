CREATE OR REPLACE FUNCTION public.record_delivered_affiliate_conversion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_affiliate_id uuid;
  v_affiliate_user_id uuid;
  v_affiliate_phone text;
  v_affiliate_email text;
  v_rate numeric;
  v_commission numeric;
  v_conversion_id uuid;
  v_order_phone text;
  v_order_email text;
BEGIN
  IF NEW.status NOT IN ('delivered', 'completed') OR NEW.affiliate_referral_code IS NULL THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  -- Fulfillment is trusted only from server-side integrations or authorized order staff.
  IF auth.role() IS DISTINCT FROM 'service_role'
     AND (auth.uid() IS NULL OR NOT public.can_access_admin_orders(auth.uid())) THEN
    RETURN NEW;
  END IF;

  SELECT a.id, a.user_id, a.phone, p.email, a.commission_rate
    INTO v_affiliate_id, v_affiliate_user_id, v_affiliate_phone, v_affiliate_email, v_rate
  FROM public.affiliates a
  LEFT JOIN public.profiles p ON p.user_id = a.user_id
  WHERE a.referral_code = NEW.affiliate_referral_code
    AND a.status = 'approved'
  LIMIT 1;

  IF v_affiliate_id IS NULL OR v_affiliate_user_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  v_order_phone := NULLIF(regexp_replace(COALESCE(NEW.guest_phone, NEW.shipping_address->>'phone', ''), '[^0-9]', '', 'g'), '');
  v_order_email := lower(COALESCE(NEW.guest_email, NEW.shipping_address->>'email', ''));
  IF (v_affiliate_phone IS NOT NULL AND NULLIF(regexp_replace(v_affiliate_phone, '[^0-9]', '', 'g'), '') = v_order_phone)
     OR (v_affiliate_email IS NOT NULL AND lower(v_affiliate_email) = v_order_email) THEN
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
        updated_at = now()
    WHERE id = v_affiliate_id;
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.sync_approved_affiliate_earnings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_old_is_earned boolean := false;
  v_new_is_earned boolean := false;
  v_delta numeric := 0;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_new_is_earned := NEW.status IN ('approved', 'paid');
    IF v_new_is_earned THEN v_delta := GREATEST(COALESCE(NEW.commission_amount, 0), 0); END IF;
  ELSE
    v_old_is_earned := OLD.status IN ('approved', 'paid');
    v_new_is_earned := NEW.status IN ('approved', 'paid');
    IF v_old_is_earned AND NOT v_new_is_earned THEN
      v_delta := -GREATEST(COALESCE(OLD.commission_amount, 0), 0);
    ELSIF NOT v_old_is_earned AND v_new_is_earned THEN
      v_delta := GREATEST(COALESCE(NEW.commission_amount, 0), 0);
    END IF;
  END IF;

  IF v_delta <> 0 THEN
    UPDATE public.affiliates
    SET total_earnings = GREATEST(COALESCE(total_earnings, 0) + v_delta, 0),
        updated_at = now()
    WHERE id = NEW.affiliate_id;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS sync_approved_affiliate_earnings ON public.affiliate_conversions;
CREATE TRIGGER sync_approved_affiliate_earnings
AFTER INSERT OR UPDATE OF status ON public.affiliate_conversions
FOR EACH ROW EXECUTE FUNCTION public.sync_approved_affiliate_earnings();

REVOKE ALL ON FUNCTION public.sync_approved_affiliate_earnings() FROM PUBLIC, anon, authenticated, service_role;