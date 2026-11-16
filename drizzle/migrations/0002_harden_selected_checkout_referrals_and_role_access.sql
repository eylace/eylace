ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS affiliate_referral_code text;
ALTER TABLE public.courier_advance_payments ADD COLUMN IF NOT EXISTS customer_phone text;
ALTER TABLE public.affiliate_clicks ADD COLUMN IF NOT EXISTS click_day date NOT NULL DEFAULT CURRENT_DATE;

CREATE UNIQUE INDEX IF NOT EXISTS affiliate_clicks_daily_ip_unique
  ON public.affiliate_clicks (affiliate_id, ip_address, click_day)
  WHERE ip_address IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS affiliate_conversions_order_unique
  ON public.affiliate_conversions (order_id)
  WHERE order_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT auth.uid() IS NOT NULL AND _user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND (role = _role OR role = 'super_admin'::public.app_role)
  );
$function$;

CREATE OR REPLACE FUNCTION public.can_access_accounting(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT auth.uid() IS NOT NULL AND _user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin', 'finance_manager')
  );
$function$;

CREATE OR REPLACE FUNCTION public.can_access_admin_orders(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT auth.uid() IS NOT NULL AND _user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()
      AND role IN ('super_admin'::public.app_role, 'admin'::public.app_role, 'order_manager'::public.app_role, 'support_manager'::public.app_role, 'moderator'::public.app_role)
  );
$function$;

CREATE OR REPLACE FUNCTION public.can_access_admin_products(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT auth.uid() IS NOT NULL AND _user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()
      AND role IN ('super_admin'::public.app_role, 'admin'::public.app_role, 'product_manager'::public.app_role, 'moderator'::public.app_role)
  );
$function$;

CREATE OR REPLACE FUNCTION public.can_manage_admin_products(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT auth.uid() IS NOT NULL AND _user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()
      AND role IN ('super_admin'::public.app_role, 'admin'::public.app_role, 'product_manager'::public.app_role)
  );
$function$;

CREATE OR REPLACE FUNCTION public.can_manage_website_settings(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT auth.uid() IS NOT NULL AND _user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()
      AND role IN ('super_admin'::public.app_role, 'admin'::public.app_role, 'content_manager'::public.app_role, 'marketing_manager'::public.app_role, 'product_manager'::public.app_role)
  );
$function$;

CREATE OR REPLACE FUNCTION public.get_user_role_and_name(_user_id uuid)
RETURNS TABLE(role_name text, display_name text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE _role text; _name text;
BEGIN
  IF auth.uid() IS NULL OR (
    auth.uid() <> _user_id
    AND NOT (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'super_admin'::public.app_role))
  ) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  SELECT role::text INTO _role FROM public.user_roles WHERE user_id = _user_id
  ORDER BY CASE role::text WHEN 'super_admin' THEN 1 WHEN 'admin' THEN 2 WHEN 'order_manager' THEN 3 WHEN 'product_manager' THEN 4 WHEN 'vendor_manager' THEN 5 WHEN 'customer_manager' THEN 6 WHEN 'finance_manager' THEN 7 WHEN 'marketing_manager' THEN 8 WHEN 'support_manager' THEN 9 WHEN 'content_manager' THEN 10 WHEN 'moderator' THEN 11 ELSE 99 END
  LIMIT 1;
  SELECT COALESCE(NULLIF(TRIM(CONCAT_WS(' ', first_name, last_name)), ''), email, 'Unknown') INTO _name
  FROM public.profiles WHERE user_id = _user_id LIMIT 1;
  RETURN QUERY SELECT _role, _name;
END;
$function$;

CREATE OR REPLACE FUNCTION public.find_seo_duplicates(_product_id uuid, _meta_title text, _meta_description text, _canonical_url text)
RETURNS TABLE(id uuid, name text, slug text, match_type text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT p.id, p.name, p.slug, 'canonical_url'::text FROM public.products p
  WHERE public.can_manage_admin_products(auth.uid()) AND _canonical_url IS NOT NULL AND length(trim(_canonical_url)) > 0 AND p.canonical_url = _canonical_url AND (_product_id IS NULL OR p.id <> _product_id)
  UNION
  SELECT p.id, p.name, p.slug, 'meta_title'::text FROM public.products p
  WHERE public.can_manage_admin_products(auth.uid()) AND _meta_title IS NOT NULL AND length(trim(_meta_title)) > 0 AND p.meta_title = _meta_title AND (_product_id IS NULL OR p.id <> _product_id)
  UNION
  SELECT p.id, p.name, p.slug, 'meta_description'::text FROM public.products p
  WHERE public.can_manage_admin_products(auth.uid()) AND _meta_description IS NOT NULL AND length(trim(_meta_description)) > 0 AND p.meta_description = _meta_description AND (_product_id IS NULL OR p.id <> _product_id)
  LIMIT 50;
$function$;

REVOKE ALL ON FUNCTION public.get_user_role_and_name(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_role_and_name(uuid) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.apply_courier_api_cost(uuid, text, numeric, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_courier_api_cost(uuid, text, numeric, text, text) TO service_role;
REVOKE ALL ON FUNCTION public.find_seo_duplicates(uuid, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.find_seo_duplicates(uuid, text, text, text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.create_courier_advance_payment(
  _order_id uuid, _user_id uuid, _gateway text, _txn_ref text, _amount numeric, _customer_phone text
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_id uuid;
BEGIN
  INSERT INTO public.courier_advance_payments(order_id, user_id, gateway, txn_ref, amount, status, customer_phone)
  VALUES (_order_id, _user_id, lower(_gateway), _txn_ref, _amount, 'initiated', NULLIF(regexp_replace(COALESCE(_customer_phone, ''), '\\D', '', 'g'), ''))
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$function$;
REVOKE ALL ON FUNCTION public.create_courier_advance_payment(uuid, uuid, text, text, numeric) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_courier_advance_payment(uuid, uuid, text, text, numeric) TO service_role;
REVOKE ALL ON FUNCTION public.create_courier_advance_payment(uuid, uuid, text, text, numeric, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_courier_advance_payment(uuid, uuid, text, text, numeric, text) TO service_role;

CREATE OR REPLACE FUNCTION public.claim_courier_advance_payment(_txn_ref text, _order_id uuid, _user_id uuid, _customer_phone text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.courier_advance_payments SET order_id = _order_id, updated_at = now()
  WHERE txn_ref = _txn_ref AND status = 'success' AND order_id IS NULL
    AND ((_user_id IS NOT NULL AND user_id = _user_id)
      OR (user_id IS NULL AND customer_phone = NULLIF(regexp_replace(COALESCE(_customer_phone, ''), '\\D', '', 'g'), '')));
  RETURN FOUND;
END;
$function$;
REVOKE ALL ON FUNCTION public.claim_courier_advance_payment(text, uuid, uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_courier_advance_payment(text, uuid, uuid, text) TO service_role;

CREATE OR REPLACE FUNCTION public.record_affiliate_click(_affiliate_id uuid, _ip_address text, _user_agent text, _landing_page text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_click_id uuid;
BEGIN
  INSERT INTO public.affiliate_clicks(affiliate_id, ip_address, user_agent, landing_page, click_day)
  SELECT a.id, _ip_address, left(COALESCE(_user_agent, ''), 500), left(COALESCE(_landing_page, '/'), 300), CURRENT_DATE
  FROM public.affiliates a WHERE a.id = _affiliate_id AND a.status = 'approved'
  ON CONFLICT (affiliate_id, ip_address, click_day) WHERE ip_address IS NOT NULL DO NOTHING
  RETURNING id INTO v_click_id;
  IF v_click_id IS NULL THEN RETURN false; END IF;
  UPDATE public.affiliates SET total_clicks = COALESCE(total_clicks, 0) + 1, updated_at = now() WHERE id = _affiliate_id;
  RETURN true;
END;
$function$;
REVOKE ALL ON FUNCTION public.record_affiliate_click(uuid, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_affiliate_click(uuid, text, text, text) TO service_role;

CREATE OR REPLACE FUNCTION public.record_delivered_affiliate_conversion()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_affiliate_id uuid; v_affiliate_user_id uuid; v_rate numeric; v_commission numeric; v_conversion_id uuid;
BEGIN
  IF NEW.status NOT IN ('delivered', 'completed') OR NEW.affiliate_referral_code IS NULL
     OR (TG_OP = 'UPDATE' AND OLD.status IS NOT DISTINCT FROM NEW.status) THEN RETURN NEW; END IF;
  SELECT id, user_id, commission_rate INTO v_affiliate_id, v_affiliate_user_id, v_rate
  FROM public.affiliates WHERE referral_code = NEW.affiliate_referral_code AND status = 'approved' LIMIT 1;
  IF v_affiliate_id IS NULL OR v_affiliate_user_id = NEW.user_id THEN RETURN NEW; END IF;
  v_commission := GREATEST(COALESCE(NEW.total, 0), 0) * GREATEST(COALESCE(v_rate, 0), 0) / 100;
  INSERT INTO public.affiliate_conversions(affiliate_id, order_id, order_total, commission_amount, status)
  VALUES (v_affiliate_id, NEW.id, GREATEST(COALESCE(NEW.total, 0), 0), v_commission, 'pending')
  ON CONFLICT (order_id) WHERE order_id IS NOT NULL DO NOTHING
  RETURNING id INTO v_conversion_id;
  IF v_conversion_id IS NOT NULL THEN
    UPDATE public.affiliates SET total_conversions = COALESCE(total_conversions, 0) + 1, total_earnings = COALESCE(total_earnings, 0) + v_commission, updated_at = now() WHERE id = v_affiliate_id;
  END IF;
  RETURN NEW;
END;
$function$;
REVOKE ALL ON FUNCTION public.record_delivered_affiliate_conversion() FROM PUBLIC, anon, authenticated, service_role;
DROP TRIGGER IF EXISTS record_delivered_affiliate_conversion ON public.orders;
CREATE TRIGGER record_delivered_affiliate_conversion AFTER INSERT OR UPDATE OF status ON public.orders FOR EACH ROW EXECUTE FUNCTION public.record_delivered_affiliate_conversion();