
-- Drop the existing overly-permissive SELECT policy
DROP POLICY IF EXISTS "Anyone can view settings" ON public.system_settings;

-- Create policy: public can view non-sensitive settings only
CREATE POLICY "Public can view non-sensitive settings"
ON public.system_settings
FOR SELECT
TO anon, authenticated
USING (key NOT IN ('shipping_providers_config', 'payment_gateway_config', 'smtp_config'));

-- Create policy: admins can view ALL settings (including sensitive ones)
CREATE POLICY "Admins can view all settings"
ON public.system_settings
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
