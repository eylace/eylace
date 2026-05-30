
-- 1. Drop unused legacy 'credentials' column on payment_gateways (secrets live in payment_gateway_secrets)
ALTER TABLE public.payment_gateways DROP COLUMN IF EXISTS credentials;

-- 2. Defense-in-depth: revoke column-level UPDATE on sensitive affiliate fields from authenticated.
-- Trigger trg_prevent_affiliate_self_escalation already blocks these, but column grants ensure
-- the privilege escalation surface is closed even if the trigger is ever dropped.
REVOKE UPDATE (commission_rate, status, total_earnings, total_paid, total_clicks, total_conversions, referral_code, admin_notes, user_id)
  ON public.affiliates FROM authenticated;
-- Allow updating only the safe, user-owned fields:
GRANT UPDATE (payment_method, payment_details, updated_at) ON public.affiliates TO authenticated;

-- 3. Re-assert that cost_per_item on order_items is NOT readable by anon/authenticated
-- (already revoked in prior migration; reapply as no-op safety net).
REVOKE SELECT (cost_per_item) ON public.order_items FROM anon, authenticated;
