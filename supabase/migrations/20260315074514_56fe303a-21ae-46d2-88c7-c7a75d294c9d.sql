
-- Fix: Convert products_public view from SECURITY DEFINER to SECURITY INVOKER
ALTER VIEW public.products_public SET (security_invoker = true);

-- Re-add a public SELECT policy on products so the SECURITY INVOKER view can read data
-- This is needed because the view now runs with the caller's permissions
CREATE POLICY "Anyone can view active products public" ON public.products
  FOR SELECT TO public
  USING (is_active = true);
