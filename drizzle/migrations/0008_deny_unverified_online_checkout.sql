CREATE OR REPLACE FUNCTION public.enforce_verified_checkout_payment_method()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.payment_method IS DISTINCT FROM 'cod' THEN
    RAISE EXCEPTION 'Online checkout is unavailable until payment confirmation is configured.' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS enforce_verified_checkout_payment_method ON public.orders;
CREATE TRIGGER enforce_verified_checkout_payment_method
BEFORE INSERT OR UPDATE OF payment_method ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.enforce_verified_checkout_payment_method();

REVOKE ALL ON FUNCTION public.enforce_verified_checkout_payment_method() FROM PUBLIC, anon, authenticated, service_role;