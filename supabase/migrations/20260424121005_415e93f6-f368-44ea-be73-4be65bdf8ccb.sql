
-- ============================================================
-- ADMIN-ONLY SECRETS, OTP AUDIT, ORDER COSTS, REALTIME TOPICS
-- ============================================================

-- ---------- 1) payment_gateway_secrets table ----------
CREATE TABLE IF NOT EXISTS public.payment_gateway_secrets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway_id uuid NOT NULL UNIQUE REFERENCES public.payment_gateways(id) ON DELETE CASCADE,
  credentials jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_gateway_secrets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage gateway secrets" ON public.payment_gateway_secrets;
CREATE POLICY "Admins can manage gateway secrets"
ON public.payment_gateway_secrets
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
);

-- Defensive grants — RLS still filters
REVOKE ALL ON public.payment_gateway_secrets FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_gateway_secrets TO authenticated;

-- updated_at trigger
DROP TRIGGER IF EXISTS set_payment_gateway_secrets_updated_at ON public.payment_gateway_secrets;
CREATE TRIGGER set_payment_gateway_secrets_updated_at
BEFORE UPDATE ON public.payment_gateway_secrets
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Migrate existing credentials data from payment_gateways into secrets
INSERT INTO public.payment_gateway_secrets (gateway_id, credentials)
SELECT id, credentials
FROM public.payment_gateways
WHERE credentials IS NOT NULL
  AND credentials <> '{}'::jsonb
ON CONFLICT (gateway_id) DO UPDATE
SET credentials = EXCLUDED.credentials;

-- Clear sensitive data from the public-accessible base table
UPDATE public.payment_gateways SET credentials = '{}'::jsonb;

-- Recreate payment_gateways_public to be explicit and never join secrets
DROP VIEW IF EXISTS public.payment_gateways_public CASCADE;
CREATE VIEW public.payment_gateways_public
WITH (security_invoker = true)
AS
SELECT
  id,
  gateway_key,
  display_name,
  is_enabled,
  is_sandbox,
  settings,
  sort_order
FROM public.payment_gateways
WHERE is_enabled = true;

GRANT SELECT ON public.payment_gateways_public TO anon, authenticated;

-- ---------- 2) Admin-only RPCs for secrets ----------
CREATE OR REPLACE FUNCTION public.admin_get_payment_gateway_secrets(_gateway_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_creds jsonb;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin'::app_role)
          OR public.has_role(auth.uid(), 'super_admin'::app_role)) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  SELECT credentials INTO v_creds
  FROM public.payment_gateway_secrets
  WHERE gateway_id = _gateway_id;

  RETURN COALESCE(v_creds, '{}'::jsonb);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_get_payment_gateway_secrets(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_get_payment_gateway_secrets(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_save_payment_gateway_secrets(
  _gateway_id uuid,
  _credentials jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin'::app_role)
          OR public.has_role(auth.uid(), 'super_admin'::app_role)) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.payment_gateway_secrets (gateway_id, credentials)
  VALUES (_gateway_id, COALESCE(_credentials, '{}'::jsonb))
  ON CONFLICT (gateway_id) DO UPDATE
  SET credentials = EXCLUDED.credentials,
      updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION public.admin_save_payment_gateway_secrets(uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_save_payment_gateway_secrets(uuid, jsonb) TO authenticated;

-- ---------- 3) Admin-only courier tokens RPC ----------
CREATE OR REPLACE FUNCTION public.admin_list_courier_tokens()
RETURNS TABLE(
  id uuid,
  provider text,
  environment text,
  client_id text,
  expires_at timestamptz,
  has_refresh boolean,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin'::app_role)
          OR public.has_role(auth.uid(), 'super_admin'::app_role)) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT t.id, t.provider, t.environment, t.client_id, t.expires_at,
         (t.refresh_token IS NOT NULL) AS has_refresh,
         t.created_at, t.updated_at
  FROM public.courier_auth_tokens t
  ORDER BY t.provider, t.environment;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_courier_tokens() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_courier_tokens() TO authenticated;

-- ---------- 4) Admin-only OTP audit RPC ----------
CREATE OR REPLACE FUNCTION public.admin_list_otp_audit(_phone text DEFAULT NULL, _limit integer DEFAULT 50)
RETURNS TABLE(
  id uuid,
  phone text,
  created_at timestamptz,
  expires_at timestamptz,
  attempts integer,
  max_attempts integer,
  is_used boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin'::app_role)
          OR public.has_role(auth.uid(), 'super_admin'::app_role)) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT o.id, o.phone, o.created_at, o.expires_at, o.attempts, o.max_attempts, o.is_used
  FROM public.otp_codes o
  WHERE _phone IS NULL OR o.phone = _phone
  ORDER BY o.created_at DESC
  LIMIT GREATEST(LEAST(COALESCE(_limit, 50), 500), 1);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_otp_audit(text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_otp_audit(text, integer) TO authenticated;

-- ---------- 5) Admin-only order item cost RPC ----------
CREATE OR REPLACE FUNCTION public.admin_get_order_item_costs(_order_id uuid)
RETURNS TABLE(
  id uuid,
  product_id text,
  product_name text,
  quantity integer,
  price numeric,
  cost_per_item numeric,
  total_cost numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin'::app_role)
          OR public.has_role(auth.uid(), 'super_admin'::app_role)
          OR public.has_role(auth.uid(), 'finance_manager'::app_role)) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT oi.id, oi.product_id, oi.product_name, oi.quantity, oi.price,
         oi.cost_per_item,
         (COALESCE(oi.cost_per_item, 0) * oi.quantity) AS total_cost
  FROM public.order_items oi
  WHERE oi.order_id = _order_id
  ORDER BY oi.created_at;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_get_order_item_costs(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_get_order_item_costs(uuid) TO authenticated;

-- ---------- 6) Realtime allowed topics generator ----------
CREATE OR REPLACE FUNCTION public.get_realtime_topics_for_user()
RETURNS TABLE(topic text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RETURN;
  END IF;

  topic := 'user:' || v_uid::text;             RETURN NEXT;
  topic := 'orders:' || v_uid::text;           RETURN NEXT;
  topic := 'returns:' || v_uid::text;          RETURN NEXT;
  topic := 'tracking:' || v_uid::text;         RETURN NEXT;

  IF public.has_role(v_uid, 'admin'::app_role)
     OR public.has_role(v_uid, 'super_admin'::app_role) THEN
    topic := 'admin:orders';     RETURN NEXT;
    topic := 'admin:reviews';    RETURN NEXT;
    topic := 'admin:returns';    RETURN NEXT;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.get_realtime_topics_for_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_realtime_topics_for_user() TO authenticated;
