
-- Fix: Change view to SECURITY INVOKER
DROP VIEW IF EXISTS public.payment_gateways_public;
CREATE VIEW public.payment_gateways_public
WITH (security_invoker = true)
AS
SELECT id, gateway_key, display_name, is_enabled, is_sandbox, settings, sort_order
FROM public.payment_gateways
WHERE is_enabled = true;
