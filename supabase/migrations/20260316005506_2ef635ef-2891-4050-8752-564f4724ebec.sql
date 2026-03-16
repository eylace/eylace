
-- Create permissions table
CREATE TABLE IF NOT EXISTS public.permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module text NOT NULL,
  key text NOT NULL UNIQUE,
  label text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage permissions" ON public.permissions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Anyone can view permissions" ON public.permissions
  FOR SELECT TO public USING (true);

-- Create role_permissions table
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL,
  permission_key text NOT NULL REFERENCES public.permissions(key) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(role, permission_key)
);

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage role_permissions" ON public.role_permissions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Authenticated can view role_permissions" ON public.role_permissions
  FOR SELECT TO authenticated USING (true);

-- Seed default permissions
INSERT INTO public.permissions (module, key, label, description) VALUES
  ('Dashboard', 'dashboard.view', 'View Dashboard', 'Access main dashboard analytics'),
  ('Dashboard', 'dashboard.reports', 'Export Reports', 'Download CSV/PDF reports'),
  ('Products', 'products.view', 'View Products', 'See product listings'),
  ('Products', 'products.create', 'Create Products', 'Add new products'),
  ('Products', 'products.edit', 'Edit Products', 'Modify existing products'),
  ('Products', 'products.delete', 'Delete Products', 'Remove products'),
  ('Orders', 'orders.view', 'View Orders', 'See all orders'),
  ('Orders', 'orders.update', 'Update Status', 'Change order status & tracking'),
  ('Orders', 'orders.dispatch', 'Dispatch to Courier', 'Send orders to shipping'),
  ('Orders', 'orders.cancel', 'Cancel Orders', 'Cancel/refund orders'),
  ('Customers', 'customers.view', 'View Customers', 'See customer list'),
  ('Customers', 'customers.manage', 'Manage Customers', 'Edit customer details'),
  ('Sellers', 'sellers.view', 'View Sellers', 'See seller listings'),
  ('Sellers', 'sellers.approve', 'Approve Sellers', 'Approve/reject applications'),
  ('Sellers', 'sellers.manage', 'Manage Sellers', 'Edit seller profiles & payouts'),
  ('Marketing', 'marketing.view', 'View Campaigns', 'See marketing campaigns'),
  ('Marketing', 'marketing.manage', 'Manage Campaigns', 'Create/edit campaigns, coupons'),
  ('Content', 'content.view', 'View Content', 'See pages, media, SEO'),
  ('Content', 'content.manage', 'Manage Content', 'Edit pages, upload media'),
  ('Finance', 'finance.view', 'View Finance', 'See transactions and payouts'),
  ('Finance', 'finance.manage', 'Manage Finance', 'Process payouts and refunds'),
  ('Delivery', 'delivery.view', 'View Deliveries', 'See shipment status'),
  ('Delivery', 'delivery.manage', 'Manage Deliveries', 'Update tracking and assign agents'),
  ('Delivery', 'delivery.warehouse', 'Warehouse Management', 'Manage warehouse inventory'),
  ('Settings', 'settings.view', 'View Settings', 'See system configuration'),
  ('Settings', 'settings.manage', 'Manage Settings', 'Change system settings'),
  ('Settings', 'settings.roles', 'Manage Roles', 'Assign/remove user roles')
ON CONFLICT (key) DO NOTHING;

-- Update has_role to support super_admin having all access
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
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
      AND (role = _role OR role = 'super_admin')
  )
$$;
