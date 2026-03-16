-- Allow authenticated users to read basic profile info (for review names)
CREATE POLICY "Authenticated can view all profiles basic info" ON public.profiles
FOR SELECT TO authenticated USING (true);