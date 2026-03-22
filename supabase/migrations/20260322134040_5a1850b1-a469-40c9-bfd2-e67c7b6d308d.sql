
-- Drop existing overly-permissive anon policies
DROP POLICY IF EXISTS "Anon can read own incomplete order by session" ON public.incomplete_orders;
DROP POLICY IF EXISTS "Anon can insert incomplete orders" ON public.incomplete_orders;
DROP POLICY IF EXISTS "Anon can update own incomplete order by session" ON public.incomplete_orders;
DROP POLICY IF EXISTS "Anon can delete own incomplete order by session" ON public.incomplete_orders;

-- Recreate anon policies scoped to caller's session via x-session-id header
CREATE POLICY "Anon select own session"
ON public.incomplete_orders FOR SELECT TO anon
USING (
  session_id IS NOT NULL
  AND session_id <> ''
  AND session_id = (current_setting('request.headers', true)::json->>'x-session-id')
);

CREATE POLICY "Anon insert own session"
ON public.incomplete_orders FOR INSERT TO anon
WITH CHECK (
  session_id IS NOT NULL
  AND session_id <> ''
  AND session_id = (current_setting('request.headers', true)::json->>'x-session-id')
);

CREATE POLICY "Anon update own session"
ON public.incomplete_orders FOR UPDATE TO anon
USING (
  session_id IS NOT NULL
  AND session_id <> ''
  AND session_id = (current_setting('request.headers', true)::json->>'x-session-id')
)
WITH CHECK (
  session_id IS NOT NULL
  AND session_id <> ''
  AND session_id = (current_setting('request.headers', true)::json->>'x-session-id')
);

CREATE POLICY "Anon delete own session"
ON public.incomplete_orders FOR DELETE TO anon
USING (
  session_id IS NOT NULL
  AND session_id <> ''
  AND session_id = (current_setting('request.headers', true)::json->>'x-session-id')
);
