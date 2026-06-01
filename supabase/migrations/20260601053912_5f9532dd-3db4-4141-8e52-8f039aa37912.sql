
-- 1. Storage: enforce path ownership on product-images uploads
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
CREATE POLICY "Owners or admins can upload product images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'super_admin'::app_role)
    OR has_role(auth.uid(), 'product_manager'::app_role)
  )
);

-- 2. Coupons: scope admin policy to authenticated only (was public)
DROP POLICY IF EXISTS "Admins can manage coupons" ON public.coupons;
CREATE POLICY "Admins can manage coupons"
ON public.coupons FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3. system_settings: strip secrets from publicly readable store_settings_v2 row
UPDATE public.system_settings
SET value = (value::jsonb
  - 'smtpPassword' - 'smtpUsername' - 'smtpHost' - 'smtpPort' - 'smtpEncryption'
  - 'smtpFromEmail' - 'smtpFromName'
  - 'facebookAppSecret' - 'googleClientSecret'
)::jsonb
WHERE key = 'store_settings_v2'
  AND value::jsonb ?| ARRAY['smtpPassword','smtpUsername','facebookAppSecret','googleClientSecret'];

-- 4. Realtime: restrict support ticket topic subscriptions to the ticket owner / staff
DROP POLICY IF EXISTS "Restrict support topic subscriptions" ON realtime.messages;
CREATE POLICY "Restrict support topic subscriptions"
ON realtime.messages AS RESTRICTIVE FOR SELECT TO authenticated
USING (
  realtime.topic() NOT LIKE 'support:%'
  OR EXISTS (
    SELECT 1 FROM public.support_tickets st
    WHERE st.id::text = split_part(realtime.topic(), ':', 2)
      AND (
        st.customer_id = auth.uid()
        OR has_role(auth.uid(), 'admin'::app_role)
        OR has_role(auth.uid(), 'super_admin'::app_role)
        OR has_role(auth.uid(), 'support_manager'::app_role)
      )
  )
);
