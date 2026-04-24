
-- ============================================================
-- SECURITY HARDENING MIGRATION
-- 1) Hide cost_per_item from public/customer queries
-- 2) Restrict realtime.messages to user-scoped topics
-- 3) Lock down courier_auth_tokens (admin-only)
-- 4) Explicit RLS on otp_codes (service-role only)
-- 5) Remove public SELECT on payment_gateways (admin-only)
-- ============================================================

-- ---------- 1) cost_per_item exposure ----------
-- order_items already uses is_owner_of_order(); customers can SELECT their
-- order_items rows including cost_per_item. Revoke column-level access for
-- non-admin roles by creating a safe view and removing SELECT on the column.

-- Create safe view for customer-facing order items (no cost_per_item)
CREATE OR REPLACE VIEW public.order_items_safe
WITH (security_invoker = true)
AS
SELECT
  id,
  order_id,
  product_id,
  product_name,
  product_image,
  price,
  quantity,
  variations,
  created_at
FROM public.order_items;

GRANT SELECT ON public.order_items_safe TO anon, authenticated;

-- Revoke column-level SELECT on cost_per_item from public roles
REVOKE SELECT (cost_per_item) ON public.order_items FROM anon, authenticated;
-- Admins still bypass via has_role() in RLS policies and have full table grants
-- via the postgres/service_role; ensure authenticated admins keep access via
-- a SECURITY DEFINER helper if needed (current admin queries run with elevated
-- service role from edge functions — unaffected).

-- Same for products.cost_per_item — products_public view already excludes it.
-- The base table `products` has a public SELECT policy ("Anyone can view active products"
-- if exists). Revoke column access defensively.
REVOKE SELECT (cost_per_item) ON public.products FROM anon, authenticated;

-- Re-grant cost_per_item visibility to admins/sellers via SECURITY DEFINER RPC
CREATE OR REPLACE FUNCTION public.admin_get_order_item_cost(_order_item_id uuid)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cost_per_item
  FROM public.order_items
  WHERE id = _order_item_id
    AND (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'super_admin'::app_role)
      OR public.has_role(auth.uid(), 'finance_manager'::app_role)
    );
$$;

REVOKE ALL ON FUNCTION public.admin_get_order_item_cost(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_get_order_item_cost(uuid) TO authenticated;

-- ---------- 2) realtime.messages user-scoped subscriptions ----------
-- Restrict realtime channels so authenticated users may subscribe only to
-- topics matching their auth.uid() (e.g. "user:<uid>", "orders:<uid>:*",
-- "returns:<uid>:*", "tracking:<uid>:*"). Admins can subscribe to anything.

DO $$
BEGIN
  -- Drop any prior permissive policy if present
  IF EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polrelid = 'realtime.messages'::regclass
      AND polname = 'Authenticated can listen to own topics'
  ) THEN
    EXECUTE 'DROP POLICY "Authenticated can listen to own topics" ON realtime.messages';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polrelid = 'realtime.messages'::regclass
      AND polname = 'Admins can listen to any topic'
  ) THEN
    EXECUTE 'DROP POLICY "Admins can listen to any topic" ON realtime.messages';
  END IF;
END $$;

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can listen to own topics"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() LIKE 'user:' || auth.uid()::text
  OR realtime.topic() LIKE 'orders:' || auth.uid()::text || ':%'
  OR realtime.topic() LIKE 'returns:' || auth.uid()::text || ':%'
  OR realtime.topic() LIKE 'tracking:' || auth.uid()::text || ':%'
);

CREATE POLICY "Admins can listen to any topic"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
);

-- ---------- 3) courier_auth_tokens admin-only ----------
ALTER TABLE public.courier_auth_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view courier tokens" ON public.courier_auth_tokens;
DROP POLICY IF EXISTS "Admins can manage courier tokens" ON public.courier_auth_tokens;

CREATE POLICY "Admins can manage courier tokens"
ON public.courier_auth_tokens
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

-- Defensive: revoke any blanket grants to non-admin roles
REVOKE ALL ON public.courier_auth_tokens FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.courier_auth_tokens TO authenticated;
-- (RLS still enforces admin-only; authenticated grant is required so the
--  policy can evaluate, but rows are filtered.)

-- ---------- 4) otp_codes — explicit RLS, server-side only ----------
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Block all client access to otp_codes" ON public.otp_codes;
DROP POLICY IF EXISTS "Admins can view otp codes" ON public.otp_codes;

-- Default-deny: no policies for anon/authenticated means no access.
-- Add explicit admin-read for audit purposes only.
CREATE POLICY "Admins can view otp codes"
ON public.otp_codes
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
);

-- Revoke any direct grants; only service_role (via edge function) can read/write.
REVOKE ALL ON public.otp_codes FROM anon, authenticated;
GRANT SELECT ON public.otp_codes TO authenticated;
-- (Filtered by admin RLS above. Service role bypasses RLS.)

-- ---------- 5) payment_gateways — remove public credential exposure ----------
DROP POLICY IF EXISTS "Public can see enabled gateways" ON public.payment_gateways;

-- Admins keep full access via existing "Admins can manage payment gateways" ALL policy.
-- Public clients must use payment_gateways_public view (already excludes credentials).
GRANT SELECT ON public.payment_gateways_public TO anon, authenticated;
