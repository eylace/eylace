
-- 1) Revoke cost_per_item column access from authenticated/anon on order_items and products
REVOKE SELECT (cost_per_item) ON public.order_items FROM authenticated;
REVOKE SELECT (cost_per_item) ON public.order_items FROM anon;
REVOKE SELECT (cost_per_item) ON public.products FROM authenticated;
REVOKE SELECT (cost_per_item) ON public.products FROM anon;

-- Ensure service_role retains access
GRANT SELECT ON public.order_items TO service_role;
GRANT SELECT ON public.products TO service_role;

-- 2) Server-side shipping computation RPC
CREATE OR REPLACE FUNCTION public.compute_shipping_amount(_carrier text, _shipping_address jsonb)
RETURNS numeric
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_zone text;
  v_district text;
  v_amount numeric;
  v_provider text;
BEGIN
  v_district := lower(coalesce(_shipping_address->>'district', _shipping_address->>'city', ''));
  IF v_district = 'dhaka' THEN
    v_zone := 'inside_dhaka';
  ELSIF v_district IN ('gazipur','narayanganj','keraniganj','savar') THEN
    v_zone := 'sub_city';
  ELSE
    v_zone := 'outside_dhaka';
  END IF;

  v_provider := lower(coalesce(_carrier, 'default'));

  SELECT default_amount INTO v_amount
  FROM public.courier_expense_settings
  WHERE courier_provider = v_provider AND area_zone = v_zone AND is_active = true
  LIMIT 1;

  IF v_amount IS NULL THEN
    SELECT default_amount INTO v_amount
    FROM public.courier_expense_settings
    WHERE courier_provider = 'default' AND area_zone = v_zone AND is_active = true
    LIMIT 1;
  END IF;

  RETURN COALESCE(v_amount, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.compute_shipping_amount(text, jsonb) TO service_role;

-- 3) Public tracking settings RPC (excludes server-side secrets)
CREATE OR REPLACE FUNCTION public.get_public_tracking_settings()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v jsonb;
  v_clean jsonb;
BEGIN
  SELECT value INTO v FROM public.system_settings WHERE key = 'tracking_analytics_v1' LIMIT 1;
  IF v IS NULL THEN
    RETURN '{}'::jsonb;
  END IF;

  v_clean := v;
  -- Strip server-side secrets
  IF v_clean ? 'facebookCapi' THEN
    v_clean := jsonb_set(v_clean, '{facebookCapi,accessToken}', '""'::jsonb, false);
    v_clean := jsonb_set(v_clean, '{facebookCapi,testEventCode}', '""'::jsonb, false);
  END IF;
  IF v_clean ? 'ga4Server' THEN
    v_clean := jsonb_set(v_clean, '{ga4Server,apiSecret}', '""'::jsonb, false);
  END IF;

  RETURN v_clean;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_tracking_settings() TO anon, authenticated;
