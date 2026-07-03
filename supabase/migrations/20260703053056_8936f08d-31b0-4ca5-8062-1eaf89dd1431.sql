
-- 1. Hide order_items.cost_per_item from regular customers (admins fetch via RPC)
REVOKE SELECT (cost_per_item) ON public.order_items FROM authenticated;
REVOKE SELECT (cost_per_item) ON public.order_items FROM anon;

-- 2. Reaffirm anon cannot read sensitive product columns
REVOKE SELECT (cost_per_item, digital_file_url) ON public.products FROM anon;
REVOKE SELECT (cost_per_item) ON public.products FROM authenticated;

-- 3. Restrict support ticket creation to authenticated users only (was TO public)
DROP POLICY IF EXISTS tickets_insert ON public.support_tickets;
CREATE POLICY tickets_insert ON public.support_tickets
  FOR INSERT TO authenticated
  WITH CHECK (
    customer_email IS NOT NULL
    AND length(trim(customer_email)) > 0
    AND (customer_id = auth.uid() OR is_support_staff(auth.uid()))
  );

-- 4. Revoke EXECUTE on privileged SECURITY DEFINER functions from anon/PUBLIC.
--    These do internal role checks; anon has no legitimate reason to call them.
DO $$
DECLARE
  fn text;
  admin_fns text[] := ARRAY[
    'admin_get_order_item_cost(uuid)',
    'admin_get_order_item_costs(uuid)',
    'admin_get_payment_gateway_secrets(uuid)',
    'admin_save_payment_gateway_secrets(uuid,jsonb)',
    'admin_list_affiliate_clicks(integer,text)',
    'admin_list_courier_expense_audit(integer,uuid)',
    'admin_list_courier_tokens()',
    'admin_list_otp_audit(text,integer)',
    'apply_courier_api_cost(uuid,text,numeric,text,text)',
    'mark_courier_dispatch_succeeded(uuid,text,text,text)',
    'courier_expense_summary(date,date)',
    'courier_webhook_apply_event(text,text,text,text,text,jsonb)',
    'record_courier_advance_event(text,text,text,text,numeric,jsonb)',
    'create_courier_advance_payment(uuid,uuid,text,text,numeric)',
    'try_acquire_dispatch_slot(uuid,text,text)',
    'release_dispatch_slot(uuid,text,text)',
    'cleanup_expired_otp_codes()',
    'sync_order_to_accounting()',
    'update_account_balance()',
    'seller_safe_update(text,text,text)',
    'user_cancel_order(uuid)',
    'user_update_review(uuid,text,text,integer,text[])',
    'record_coupon_usage(uuid,uuid,numeric)',
    'get_digital_download_url(uuid,uuid)',
    'find_seo_duplicates(uuid,text,text,text)',
    'get_user_role_and_name(uuid)'
  ];
BEGIN
  FOREACH fn IN ARRAY admin_fns LOOP
    BEGIN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%s FROM anon, PUBLIC', fn);
    EXCEPTION WHEN undefined_function THEN
      RAISE NOTICE 'skip missing function %', fn;
    END;
  END LOOP;
END $$;

-- 5. Revoke admin/user-mutating functions from authenticated too where safe
--    (admins bypass by calling as service_role via edge functions where needed).
--    Keep these callable from authenticated because they check has_role internally:
--      admin_get_*, admin_list_*, admin_save_*, seller_safe_update, user_cancel_order,
--      user_update_review, record_coupon_usage, get_digital_download_url,
--      find_seo_duplicates, get_user_role_and_name, apply_courier_api_cost,
--      mark_courier_dispatch_succeeded, courier_expense_summary.
--    Revoke from authenticated the ones that should ONLY run from webhooks/edge functions:
REVOKE EXECUTE ON FUNCTION public.courier_webhook_apply_event(text,text,text,text,text,jsonb) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.record_courier_advance_event(text,text,text,text,numeric,jsonb) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.create_courier_advance_payment(uuid,uuid,text,text,numeric) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.try_acquire_dispatch_slot(uuid,text,text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.release_dispatch_slot(uuid,text,text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_otp_codes() FROM authenticated;
