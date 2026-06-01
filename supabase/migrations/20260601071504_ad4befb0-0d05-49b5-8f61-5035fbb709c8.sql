-- Normalize admin data visibility policies to match the admin panel role model.

CREATE OR REPLACE FUNCTION public.can_access_admin_products(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('super_admin'::app_role, 'admin'::app_role, 'product_manager'::app_role, 'moderator'::app_role)
  );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_admin_products(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('super_admin'::app_role, 'admin'::app_role, 'product_manager'::app_role)
  );
$$;

CREATE OR REPLACE FUNCTION public.can_access_admin_orders(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('super_admin'::app_role, 'admin'::app_role, 'order_manager'::app_role, 'support_manager'::app_role, 'moderator'::app_role)
  );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_website_settings(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('super_admin'::app_role, 'admin'::app_role, 'content_manager'::app_role, 'marketing_manager'::app_role)
  );
$$;

-- Products: keep public active-product reads, but add explicit admin-panel reads/writes for product roles.
DROP POLICY IF EXISTS "Admins can manage all products" ON public.products;
DROP POLICY IF EXISTS "Admin product roles can view all products" ON public.products;
DROP POLICY IF EXISTS "Admin product managers can create products" ON public.products;
DROP POLICY IF EXISTS "Admin product managers can update products" ON public.products;
DROP POLICY IF EXISTS "Admin product managers can delete products" ON public.products;

CREATE POLICY "Admin product roles can view all products"
ON public.products
FOR SELECT
TO authenticated
USING (public.can_access_admin_products(auth.uid()));

CREATE POLICY "Admin product managers can create products"
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (public.can_manage_admin_products(auth.uid()));

CREATE POLICY "Admin product managers can update products"
ON public.products
FOR UPDATE
TO authenticated
USING (public.can_manage_admin_products(auth.uid()))
WITH CHECK (public.can_manage_admin_products(auth.uid()));

CREATE POLICY "Admin product managers can delete products"
ON public.products
FOR DELETE
TO authenticated
USING (public.can_manage_admin_products(auth.uid()));

-- Orders and order items: direct admin reads/writes should work for the same roles as admin order backend functions.
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can delete orders" ON public.orders;
DROP POLICY IF EXISTS "Admin order roles can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admin order roles can update orders" ON public.orders;
DROP POLICY IF EXISTS "Admin order roles can delete orders" ON public.orders;

CREATE POLICY "Admin order roles can view all orders"
ON public.orders
FOR SELECT
TO authenticated
USING (public.can_access_admin_orders(auth.uid()));

CREATE POLICY "Admin order roles can update orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (public.can_access_admin_orders(auth.uid()))
WITH CHECK (public.can_access_admin_orders(auth.uid()));

CREATE POLICY "Admin order roles can delete orders"
ON public.orders
FOR DELETE
TO authenticated
USING (public.can_access_admin_orders(auth.uid()));

DROP POLICY IF EXISTS "Admins can update order items" ON public.order_items;
DROP POLICY IF EXISTS "Admins can delete order items" ON public.order_items;
DROP POLICY IF EXISTS "Admin order roles can view all order items" ON public.order_items;
DROP POLICY IF EXISTS "Admin order roles can update order items" ON public.order_items;
DROP POLICY IF EXISTS "Admin order roles can delete order items" ON public.order_items;

CREATE POLICY "Admin order roles can view all order items"
ON public.order_items
FOR SELECT
TO authenticated
USING (public.can_access_admin_orders(auth.uid()));

CREATE POLICY "Admin order roles can update order items"
ON public.order_items
FOR UPDATE
TO authenticated
USING (public.can_access_admin_orders(auth.uid()))
WITH CHECK (public.can_access_admin_orders(auth.uid()));

CREATE POLICY "Admin order roles can delete order items"
ON public.order_items
FOR DELETE
TO authenticated
USING (public.can_access_admin_orders(auth.uid()));

-- Smart Bar and website setup settings: content/marketing/admin roles can manage these settings.
DROP POLICY IF EXISTS "Admins can manage all settings" ON public.system_settings;
DROP POLICY IF EXISTS "Admins can view all settings" ON public.system_settings;
DROP POLICY IF EXISTS "Website setup roles can view settings" ON public.system_settings;
DROP POLICY IF EXISTS "Website setup roles can manage settings" ON public.system_settings;

CREATE POLICY "Website setup roles can view settings"
ON public.system_settings
FOR SELECT
TO authenticated
USING (public.can_manage_website_settings(auth.uid()));

CREATE POLICY "Website setup roles can manage settings"
ON public.system_settings
FOR ALL
TO authenticated
USING (public.can_manage_website_settings(auth.uid()))
WITH CHECK (public.can_manage_website_settings(auth.uid()));