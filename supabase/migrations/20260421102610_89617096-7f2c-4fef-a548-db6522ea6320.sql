-- Persistent fraud risk cache (per phone number)
CREATE TABLE IF NOT EXISTS public.fraud_risk_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_normalized TEXT NOT NULL UNIQUE,
  risk_score INTEGER NOT NULL DEFAULT 0,
  risk_level TEXT NOT NULL DEFAULT 'low',
  total_orders INTEGER NOT NULL DEFAULT 0,
  success_orders INTEGER NOT NULL DEFAULT 0,
  failed_orders INTEGER NOT NULL DEFAULT 0,
  pending_orders INTEGER NOT NULL DEFAULT 0,
  breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
  computed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fraud_risk_cache_phone ON public.fraud_risk_cache(phone_normalized);
CREATE INDEX IF NOT EXISTS idx_fraud_risk_cache_level ON public.fraud_risk_cache(risk_level);

ALTER TABLE public.fraud_risk_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view fraud cache" ON public.fraud_risk_cache;
CREATE POLICY "Admins can view fraud cache"
  ON public.fraud_risk_cache FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

DROP POLICY IF EXISTS "Admins can upsert fraud cache" ON public.fraud_risk_cache;
CREATE POLICY "Admins can upsert fraud cache"
  ON public.fraud_risk_cache FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

DROP POLICY IF EXISTS "Admins can update fraud cache" ON public.fraud_risk_cache;
CREATE POLICY "Admins can update fraud cache"
  ON public.fraud_risk_cache FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

DROP POLICY IF EXISTS "Admins can delete fraud cache" ON public.fraud_risk_cache;
CREATE POLICY "Admins can delete fraud cache"
  ON public.fraud_risk_cache FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

DROP TRIGGER IF EXISTS update_fraud_risk_cache_updated_at ON public.fraud_risk_cache;
CREATE TRIGGER update_fraud_risk_cache_updated_at
  BEFORE UPDATE ON public.fraud_risk_cache
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Tighten blocked_ips: allow admin and super_admin (existing policy only admin)
DROP POLICY IF EXISTS "Admins can manage blocked IPs" ON public.blocked_ips;
CREATE POLICY "Admins can view blocked IPs" ON public.blocked_ips
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Admins can insert blocked IPs" ON public.blocked_ips
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Admins can update blocked IPs" ON public.blocked_ips
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Admins can delete blocked IPs" ON public.blocked_ips
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));