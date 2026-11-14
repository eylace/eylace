DROP POLICY IF EXISTS "Anyone can view category discounts" ON public.category_discounts;
CREATE POLICY "Anyone can view category discounts"
ON public.category_discounts
FOR SELECT
TO anon, authenticated
USING (
  is_active IS TRUE
  AND (starts_at IS NULL OR starts_at <= now())
  AND (expires_at IS NULL OR expires_at > now())
);