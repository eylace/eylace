
-- Fix overly permissive RLS policies on incomplete_orders
-- Drop the overly permissive non-admin policies
DROP POLICY IF EXISTS "Anyone can insert incomplete orders" ON public.incomplete_orders;
DROP POLICY IF EXISTS "Anyone can read own incomplete order by session" ON public.incomplete_orders;
DROP POLICY IF EXISTS "Anyone can update own incomplete order by session" ON public.incomplete_orders;
DROP POLICY IF EXISTS "Anyone can delete own incomplete order by session" ON public.incomplete_orders;

-- Recreate with session_id scoping for anonymous users
CREATE POLICY "Anon can insert incomplete orders"
ON public.incomplete_orders FOR INSERT TO anon
WITH CHECK (session_id IS NOT NULL AND session_id != '');

CREATE POLICY "Anon can read own incomplete order by session"
ON public.incomplete_orders FOR SELECT TO anon
USING (session_id IS NOT NULL AND session_id != '');

CREATE POLICY "Anon can update own incomplete order by session"
ON public.incomplete_orders FOR UPDATE TO anon
USING (session_id IS NOT NULL AND session_id != '')
WITH CHECK (session_id IS NOT NULL AND session_id != '');

CREATE POLICY "Anon can delete own incomplete order by session"
ON public.incomplete_orders FOR DELETE TO anon
USING (session_id IS NOT NULL AND session_id != '');

-- Authenticated users: scope to their own user_id
CREATE POLICY "Auth users can insert incomplete orders"
ON public.incomplete_orders FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid()::text OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Auth users can read own incomplete orders"
ON public.incomplete_orders FOR SELECT TO authenticated
USING (user_id = auth.uid()::text OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Auth users can update own incomplete orders"
ON public.incomplete_orders FOR UPDATE TO authenticated
USING (user_id = auth.uid()::text OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (user_id = auth.uid()::text OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Auth users can delete own incomplete orders"
ON public.incomplete_orders FOR DELETE TO authenticated
USING (user_id = auth.uid()::text OR has_role(auth.uid(), 'admin'::app_role));
