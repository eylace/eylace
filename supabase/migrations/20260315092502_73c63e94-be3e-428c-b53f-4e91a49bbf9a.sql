
-- FIX 1: seller_applications_safe - restrict to own rows only
DROP VIEW IF EXISTS public.seller_applications_safe;
CREATE OR REPLACE VIEW public.seller_applications_safe
WITH (security_invoker = true)
AS
SELECT id, user_id, store_name, store_description, business_type, phone, status, created_at, updated_at
FROM public.seller_applications;

-- Revoke broad grants, only authenticated needs it
REVOKE ALL ON public.seller_applications_safe FROM anon, authenticated;
GRANT SELECT ON public.seller_applications_safe TO authenticated;

-- Since security_invoker=true, RLS on seller_applications applies.
-- Users can only see rows matching existing policies (admin sees all, user sees own via INSERT policy).
-- We need a SELECT policy for users to see their own application:
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'seller_applications' AND policyname = 'Users can view own application'
  ) THEN
    CREATE POLICY "Users can view own application"
    ON public.seller_applications FOR SELECT TO authenticated
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- FIX 2: review_votes - restrict SELECT to own votes only
DROP POLICY IF EXISTS "Anyone can view review votes" ON public.review_votes;
DROP POLICY IF EXISTS "Authenticated can view all votes" ON public.review_votes;

-- Check and recreate with restricted access
DO $$
BEGIN
  -- Drop any SELECT policy that uses 'true'
  DELETE FROM pg_catalog.pg_policy WHERE polrelid = 'public.review_votes'::regclass AND polcmd = 'r' AND polqual::text LIKE '%true%';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Create restricted SELECT policy
DROP POLICY IF EXISTS "Users can view own votes" ON public.review_votes;
CREATE POLICY "Users can view own votes"
ON public.review_votes FOR SELECT TO authenticated
USING (auth.uid() = user_id);
