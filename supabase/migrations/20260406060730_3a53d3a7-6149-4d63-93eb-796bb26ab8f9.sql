
-- Payment gateway configurations table
CREATE TABLE public.payment_gateways (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gateway_key TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  is_sandbox BOOLEAN NOT NULL DEFAULT false,
  credentials JSONB NOT NULL DEFAULT '{}'::jsonb,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_gateways ENABLE ROW LEVEL SECURITY;

-- Only admins can manage
CREATE POLICY "Admins can manage payment gateways"
ON public.payment_gateways
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Public read for enabled gateways only (no credentials exposed - handled in code)
CREATE POLICY "Public can see enabled gateways"
ON public.payment_gateways
FOR SELECT
TO anon, authenticated
USING (is_enabled = true);

-- Create a secure view that hides credentials for public access
CREATE OR REPLACE VIEW public.payment_gateways_public AS
SELECT id, gateway_key, display_name, is_enabled, is_sandbox, settings, sort_order
FROM public.payment_gateways
WHERE is_enabled = true;

-- Trigger for updated_at
CREATE TRIGGER update_payment_gateways_updated_at
BEFORE UPDATE ON public.payment_gateways
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
