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
      AND role IN ('super_admin'::app_role, 'admin'::app_role, 'content_manager'::app_role, 'marketing_manager'::app_role, 'product_manager'::app_role)
  );
$$;

REVOKE ALL ON FUNCTION public.can_manage_website_settings(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_manage_website_settings(uuid) TO authenticated, service_role;