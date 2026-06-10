
-- Explicit realtime channel-level policy for support_tickets:* topics.
-- Postgres-changes broadcasts already respect the underlying table RLS, but
-- this satisfies the scanner requirement for explicit topic-scoped policies
-- and protects broadcast/presence channels named under this prefix.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'realtime' AND tablename = 'messages' AND policyname = 'support_tickets_channel_scope') THEN
    DROP POLICY "support_tickets_channel_scope" ON realtime.messages;
  END IF;
END $$;

CREATE POLICY "support_tickets_channel_scope"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  (
    realtime.topic() LIKE 'support_tickets:%'
    OR realtime.topic() = 'support_tickets_admin'
  )
  AND (
    public.is_support_staff(auth.uid())
    OR realtime.topic() = 'support_tickets:' || auth.uid()::text
  )
);
