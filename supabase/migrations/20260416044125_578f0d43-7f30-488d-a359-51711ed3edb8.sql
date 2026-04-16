
-- Drop the old admin policy that only checks 'admin' role
DROP POLICY IF EXISTS "Admins can manage all products" ON public.products;

-- Create new admin policy that covers both admin and super_admin
CREATE POLICY "Admins can manage all products"
ON public.products
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)
);
