
-- 1) PRODUCTS: re-grant SELECT to authenticated on all columns EXCEPT sensitive ones
--    (anon continues to use products_public view; admins/sellers needing cost use RPC)
DO $$
DECLARE
  col_list text;
BEGIN
  SELECT string_agg(quote_ident(column_name), ', ')
    INTO col_list
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'products'
    AND column_name NOT IN ('cost_per_item', 'digital_file_url');

  EXECUTE format('GRANT SELECT (%s) ON public.products TO authenticated', col_list);
  -- explicit revoke of sensitive cols in case any prior grant remained
  EXECUTE 'REVOKE SELECT (cost_per_item, digital_file_url) ON public.products FROM authenticated';
  EXECUTE 'REVOKE SELECT (cost_per_item, digital_file_url) ON public.products FROM anon';
END $$;

-- writes for admin/seller management
GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;

-- products_public view: ensure read access for public catalog (excludes sensitive cols by design)
GRANT SELECT ON public.products_public TO anon, authenticated;
GRANT ALL ON public.products_public TO service_role;

-- 2) ORDER_ITEMS: hide cost_per_item from customers; keep all other columns readable
DO $$
DECLARE
  col_list text;
BEGIN
  SELECT string_agg(quote_ident(column_name), ', ')
    INTO col_list
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'order_items'
    AND column_name <> 'cost_per_item';

  EXECUTE format('GRANT SELECT (%s) ON public.order_items TO authenticated', col_list);
  EXECUTE 'REVOKE SELECT (cost_per_item) ON public.order_items FROM authenticated';
  EXECUTE 'REVOKE SELECT (cost_per_item) ON public.order_items FROM anon';
END $$;

GRANT INSERT, UPDATE, DELETE ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;

-- 3) REALTIME: block authenticated non-admins from subscribing to admin:% topics
DROP POLICY IF EXISTS "Block admin topics for non-admins" ON realtime.messages;
CREATE POLICY "Block admin topics for non-admins"
  ON realtime.messages
  AS RESTRICTIVE
  FOR SELECT
  TO authenticated
  USING (
    NOT (realtime.topic() LIKE 'admin:%')
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  );
