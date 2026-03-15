-- Add store_settings_v2 and website_setup_v1 to the public allowlist
DROP POLICY IF EXISTS "Public can view safe settings" ON public.system_settings;
CREATE POLICY "Public can view safe settings"
ON public.system_settings FOR SELECT TO anon, authenticated
USING (key = ANY (ARRAY['store_settings'::text, 'smart_bar'::text, 'menu_config_v1'::text, 'store_settings_v2'::text, 'website_setup_v1'::text]));