-- Allow sellers to view their own seller row
CREATE POLICY "Sellers can view their own seller row"
ON public.sellers
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Allow public (anon + authenticated) to view verified sellers (for public storefront queries via sellers_public view already exists, but ensure public read of verified sellers works for product joins)
CREATE POLICY "Anyone can view verified sellers"
ON public.sellers
FOR SELECT
TO anon, authenticated
USING (is_verified = true);

-- Backfill: assign vendor_admin role to all existing approved sellers who don't have it
INSERT INTO public.user_roles (user_id, role)
SELECT s.user_id, 'vendor_admin'::app_role
FROM public.sellers s
WHERE s.user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = s.user_id AND ur.role = 'vendor_admin'::app_role
  )
ON CONFLICT (user_id, role) DO NOTHING;