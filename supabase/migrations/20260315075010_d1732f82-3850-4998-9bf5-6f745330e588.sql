
-- Fix #1: Remove public SELECT on products table to protect digital_file_url
DROP POLICY IF EXISTS "Anyone can view active products public" ON public.products;

-- Revert view to SECURITY DEFINER so it can serve public data without needing a products SELECT policy
ALTER VIEW public.products_public SET (security_invoker = false);

-- Fix #2: Replace system_settings blocklist with allowlist
DROP POLICY IF EXISTS "Public can view non-sensitive settings" ON public.system_settings;
CREATE POLICY "Public can view safe settings" ON public.system_settings
  FOR SELECT TO anon, authenticated
  USING (key IN ('store_settings', 'store_settings_v2', 'smart_bar', 'sitemap_config', 'seller_registration_enabled', 'ai_settings', 'menu_config_v1', 'website_setup_v1'));
