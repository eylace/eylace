REVOKE ALL ON FUNCTION public.can_access_admin_products(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_manage_admin_products(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_access_admin_orders(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_manage_website_settings(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.can_access_admin_products(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_manage_admin_products(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_access_admin_orders(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_manage_website_settings(uuid) TO authenticated, service_role;