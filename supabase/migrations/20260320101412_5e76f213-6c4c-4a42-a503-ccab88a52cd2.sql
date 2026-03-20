
-- Add fulfillment_type column to seller_applications
ALTER TABLE public.seller_applications
ADD COLUMN fulfillment_type text NOT NULL DEFAULT 'fbm';

-- Add fulfillment_type column to sellers
ALTER TABLE public.sellers
ADD COLUMN fulfillment_type text NOT NULL DEFAULT 'fbm';

-- Also make seller_registration_enabled visible publicly
UPDATE public.system_settings SET key = key WHERE key = 'seller_registration_enabled';

-- Add seller_registration_enabled to public safe settings list
DROP POLICY IF EXISTS "Public can view safe settings" ON public.system_settings;
CREATE POLICY "Public can view safe settings"
ON public.system_settings
FOR SELECT
TO anon, authenticated
USING (key = ANY (ARRAY['store_settings', 'smart_bar', 'menu_config_v1', 'store_settings_v2', 'website_setup_v1', 'seller_registration_enabled']));
