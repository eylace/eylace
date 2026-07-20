-- Permanent storefront-read guardrail. Idempotent — safe to re-run.

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'products_public','categories','brands','sellers','product_reviews',
    'flash_deals','flash_deal_products','category_discounts','product_labels',
    'product_attributes','colors','size_guides','cms_pages',
    'payment_gateways_public','system_settings'
  ]
  LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=t)
       OR EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema='public' AND table_name=t)
    THEN
      EXECUTE format('GRANT SELECT ON public.%I TO anon, authenticated', t);
    END IF;
  END LOOP;
END$$;

-- Base products: grant SELECT on every column except the sensitive ones
-- (cost_per_item, digital_file_url) to authenticated. Iterate so we stay
-- resilient to schema drift.
DO $$
DECLARE
  col text;
  cols text := '';
BEGIN
  FOR col IN
    SELECT column_name FROM information_schema.columns
    WHERE table_schema='public' AND table_name='products'
      AND column_name NOT IN ('cost_per_item','digital_file_url')
    ORDER BY ordinal_position
  LOOP
    cols := cols || quote_ident(col) || ',';
  END LOOP;
  IF length(cols) > 0 THEN
    cols := left(cols, length(cols) - 1);
    EXECUTE format('GRANT SELECT (%s) ON public.products TO authenticated', cols);
  END IF;
END$$;

-- Public read policy for active products (idempotent).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='products'
      AND policyname='Public can read active products'
  ) THEN
    EXECUTE 'CREATE POLICY "Public can read active products"
      ON public.products FOR SELECT
      TO anon, authenticated
      USING (is_active = true)';
  END IF;
END$$;

COMMENT ON POLICY "Public can read active products" ON public.products IS
  'Storefront guardrail — do not drop. Removing this hides all products from anonymous visitors.';