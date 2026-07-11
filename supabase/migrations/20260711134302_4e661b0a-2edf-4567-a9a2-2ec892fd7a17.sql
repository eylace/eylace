
-- 1. Revoke SELECT on order_items.cost_per_item from customers
REVOKE SELECT (cost_per_item) ON public.order_items FROM authenticated;
REVOKE SELECT (cost_per_item) ON public.order_items FROM anon;

-- 2. Restrict role_permissions SELECT to admin/super_admin only
DROP POLICY IF EXISTS "Authenticated can view role_permissions" ON public.role_permissions;
CREATE POLICY "Admins can view role_permissions"
  ON public.role_permissions
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));

-- 3. Revoke EXECUTE from anon on SECURITY DEFINER functions that aren't meant to be public.
-- Trigger / internal helpers (never needed by anon):
REVOKE EXECUTE ON FUNCTION public.decrement_stock_on_order_item() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.audit_courier_expenses() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_product_review_stats() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.auto_grant_public_table_privs() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.support_message_after_insert() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.prevent_affiliate_self_escalation() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.auto_record_courier_expense() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.audit_courier_advance_payments() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.audit_courier_status_mapping() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enforce_incomplete_orders_user_id() FROM anon, PUBLIC;

-- Authorization helpers referenced by RLS - only authenticated needs them:
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_support_staff(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.can_access_accounting(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.can_access_admin_products(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.can_access_admin_orders(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.can_manage_admin_products(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.can_manage_website_settings(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_owner_of_order(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_owner_of_order_tracking(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_realtime_topics_for_user() FROM anon, PUBLIC;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_support_staff(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_accounting(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_admin_products(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_admin_orders(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_admin_products(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_website_settings(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_owner_of_order(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_owner_of_order_tracking(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_realtime_topics_for_user() TO authenticated;

-- Keep public guest-facing lookups callable by anon (no revoke): lookup_guest_order,
-- lookup_guest_order_tracking, lookup_guest_order_items, lookup_return_by_tracking,
-- lookup_coupon, get_public_tracking_settings, compute_shipping_amount.
