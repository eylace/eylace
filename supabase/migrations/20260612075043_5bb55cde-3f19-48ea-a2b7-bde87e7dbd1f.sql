
-- 1. Revoke cost_per_item from order_items for anon/authenticated (was leaking)
REVOKE SELECT (cost_per_item) ON public.order_items FROM anon, authenticated, PUBLIC;

-- 2. Tighten products column revokes defensively (idempotent)
REVOKE SELECT (cost_per_item, digital_file_url) ON public.products FROM anon, authenticated, PUBLIC;

-- 3. Restrict support_managers SELECT to admin/super_admin only (hide peer emails)
DROP POLICY IF EXISTS "managers_view" ON public.support_managers;
DROP POLICY IF EXISTS "Support staff can view managers" ON public.support_managers;
CREATE POLICY "Admins can view support managers"
  ON public.support_managers
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
  );

-- 4. Add restrictive policy to realtime.messages covering support_tickets:% topic prefix
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname='messages' AND relnamespace='realtime'::regnamespace) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Restrict support_tickets topic subscriptions" ON realtime.messages';
    EXECUTE $p$
      CREATE POLICY "Restrict support_tickets topic subscriptions"
      ON realtime.messages
      AS RESTRICTIVE
      FOR SELECT
      TO authenticated
      USING (
        CASE
          WHEN realtime.topic() LIKE 'support_tickets:%' THEN
            public.has_role(auth.uid(), 'admin'::app_role)
            OR public.has_role(auth.uid(), 'super_admin'::app_role)
            OR public.has_role(auth.uid(), 'support_manager'::app_role)
            OR realtime.topic() = 'support_tickets:' || auth.uid()::text
          ELSE true
        END
      )
    $p$;
  END IF;
END$$;
