
-- 1. Revoke anon/authenticated column access to sensitive product columns
REVOKE SELECT (cost_per_item, digital_file_url) ON public.products FROM anon;
REVOKE SELECT (cost_per_item, digital_file_url) ON public.products FROM authenticated;

-- 2. Remove products from realtime publication to prevent leaking sensitive cols in broadcasts
ALTER PUBLICATION supabase_realtime DROP TABLE public.products;

-- 3. Harden incomplete_orders: force user_id to auth.uid() when authenticated, prevent spoofing
CREATE OR REPLACE FUNCTION public.enforce_incomplete_orders_user_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    -- Authenticated users may only write rows owned by themselves (admins bypass)
    IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
      NEW.user_id := (auth.uid())::text;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_incomplete_orders_user_id ON public.incomplete_orders;
CREATE TRIGGER trg_enforce_incomplete_orders_user_id
BEFORE INSERT OR UPDATE ON public.incomplete_orders
FOR EACH ROW EXECUTE FUNCTION public.enforce_incomplete_orders_user_id();
