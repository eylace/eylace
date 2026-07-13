DO $$
DECLARE
    tbl record;
    public_read_tables text[] := ARRAY[
      'products','categories','brands','colors','product_labels','product_attributes',
      'size_guides','warranties','flash_deals','flash_deal_products','product_reviews',
      'review_votes','cms_pages','dynamic_popups','custom_alerts','custom_sell_alerts',
      'coupons','category_discounts','couriers','seller_packages','sellers',
      'preorder_products','preorder_faqs','preorder_reviews','preorder_settings',
      'preorder_notification_types','marketing_email_templates','otp_sms_templates',
      'payment_gateways','seller_verification_fields','permissions'
    ];
BEGIN
    FOR tbl IN
        SELECT c.relname AS table_name
          FROM pg_class c
          JOIN pg_namespace n ON n.oid = c.relnamespace
         WHERE c.relkind = 'r' AND n.nspname = 'public'
    LOOP
        EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', tbl.table_name);
        EXECUTE format('GRANT ALL ON public.%I TO service_role', tbl.table_name);
        IF tbl.table_name = ANY(public_read_tables) THEN
            EXECUTE format('GRANT SELECT ON public.%I TO anon', tbl.table_name);
        END IF;
    END LOOP;
END;
$$;