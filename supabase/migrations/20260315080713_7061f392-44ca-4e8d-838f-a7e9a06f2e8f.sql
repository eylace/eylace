-- SECURITY FIX #1: Remove public access to OTP SMS templates
DROP POLICY IF EXISTS "Anyone can view active otp sms templates" ON public.otp_sms_templates;

-- SECURITY FIX #2: Restrict preorder_settings with allowlist
DROP POLICY IF EXISTS "Anyone can view preorder settings" ON public.preorder_settings;

CREATE POLICY "Public can view safe preorder settings" ON public.preorder_settings
  FOR SELECT TO anon, authenticated
  USING (key IN ('preorder_enabled', 'preorder_terms', 'preorder_display_config'));

-- PERFORMANCE: Database indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products (is_active);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products (category_id);
CREATE INDEX IF NOT EXISTS idx_products_seller_id ON public.products (seller_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products (slug);
CREATE INDEX IF NOT EXISTS idx_products_is_flash_sale ON public.products (is_flash_sale) WHERE is_flash_sale = true;
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items (product_id);

CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON public.product_reviews (product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_user_id ON public.product_reviews (user_id);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories (slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories (parent_id);

CREATE INDEX IF NOT EXISTS idx_sellers_slug ON public.sellers (slug);
CREATE INDEX IF NOT EXISTS idx_sellers_user_id ON public.sellers (user_id);

CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON public.wishlist (user_id);
CREATE INDEX IF NOT EXISTS idx_saved_cart_user_id ON public.saved_cart (user_id);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id_role ON public.user_roles (user_id, role);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles (user_id);

CREATE INDEX IF NOT EXISTS idx_coupon_usage_user_id ON public.coupon_usage (user_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon_id ON public.coupon_usage (coupon_id);

CREATE INDEX IF NOT EXISTS idx_flash_deal_products_deal_id ON public.flash_deal_products (flash_deal_id);
CREATE INDEX IF NOT EXISTS idx_flash_deal_products_product_id ON public.flash_deal_products (product_id);