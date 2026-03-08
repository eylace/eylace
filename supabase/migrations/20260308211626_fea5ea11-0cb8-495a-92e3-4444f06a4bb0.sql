
-- Fix system_settings RLS policies to be PERMISSIVE instead of RESTRICTIVE
DROP POLICY IF EXISTS "Admins can manage settings" ON public.system_settings;
DROP POLICY IF EXISTS "Anyone can view settings" ON public.system_settings;

CREATE POLICY "Admins can manage settings"
ON public.system_settings
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view settings"
ON public.system_settings
FOR SELECT
TO anon, authenticated
USING (true);
