
-- 1. preorder_products
CREATE TABLE public.preorder_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  preorder_price numeric NOT NULL DEFAULT 0,
  advance_amount numeric NOT NULL DEFAULT 0,
  advance_type text NOT NULL DEFAULT 'percentage',
  estimated_delivery timestamp with time zone,
  max_quantity integer NOT NULL DEFAULT 100,
  status text NOT NULL DEFAULT 'active',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.preorder_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage preorder products" ON public.preorder_products FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view active preorder products" ON public.preorder_products FOR SELECT TO anon, authenticated USING (status = 'active' OR public.has_role(auth.uid(), 'admin'::app_role));

-- 2. preorder_orders
CREATE TABLE public.preorder_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL,
  user_id uuid NOT NULL,
  preorder_product_id uuid REFERENCES public.preorder_products(id) ON DELETE CASCADE NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  advance_paid numeric NOT NULL DEFAULT 0,
  remaining_amount numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  shipping_address jsonb,
  payment_method text NOT NULL DEFAULT 'cod',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.preorder_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage preorder orders" ON public.preorder_orders FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view own preorder orders" ON public.preorder_orders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create preorder orders" ON public.preorder_orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 3. preorder_commissions
CREATE TABLE public.preorder_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  preorder_order_id uuid REFERENCES public.preorder_orders(id) ON DELETE CASCADE NOT NULL,
  seller_id uuid REFERENCES public.sellers(id) ON DELETE CASCADE NOT NULL,
  commission_rate numeric NOT NULL DEFAULT 0,
  commission_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  paid_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.preorder_commissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage preorder commissions" ON public.preorder_commissions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 4. preorder_settings
CREATE TABLE public.preorder_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.preorder_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage preorder settings" ON public.preorder_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view preorder settings" ON public.preorder_settings FOR SELECT TO anon, authenticated USING (true);

-- 5. preorder_conversations
CREATE TABLE public.preorder_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  preorder_product_id uuid REFERENCES public.preorder_products(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  seller_id uuid REFERENCES public.sellers(id) ON DELETE CASCADE NOT NULL,
  message text NOT NULL,
  sender_type text NOT NULL DEFAULT 'buyer',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.preorder_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage preorder conversations" ON public.preorder_conversations FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view own preorder conversations" ON public.preorder_conversations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create preorder conversations" ON public.preorder_conversations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 6. preorder_queries
CREATE TABLE public.preorder_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  preorder_product_id uuid REFERENCES public.preorder_products(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  question text NOT NULL,
  answer text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  answered_at timestamp with time zone
);
ALTER TABLE public.preorder_queries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage preorder queries" ON public.preorder_queries FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view own preorder queries" ON public.preorder_queries FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create preorder queries" ON public.preorder_queries FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 7. preorder_reviews
CREATE TABLE public.preorder_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  preorder_product_id uuid REFERENCES public.preorder_products(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  rating integer NOT NULL DEFAULT 5,
  title text NOT NULL,
  content text NOT NULL,
  images text[] DEFAULT ARRAY[]::text[],
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.preorder_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage preorder reviews" ON public.preorder_reviews FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view preorder reviews" ON public.preorder_reviews FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Users can create preorder reviews" ON public.preorder_reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 8. preorder_faqs
CREATE TABLE public.preorder_faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.preorder_faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage preorder faqs" ON public.preorder_faqs FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view active preorder faqs" ON public.preorder_faqs FOR SELECT TO anon, authenticated USING (is_active = true OR public.has_role(auth.uid(), 'admin'::app_role));

-- 9. preorder_notification_types
CREATE TABLE public.preorder_notification_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  email_enabled boolean NOT NULL DEFAULT true,
  sms_enabled boolean NOT NULL DEFAULT false,
  push_enabled boolean NOT NULL DEFAULT false,
  template text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.preorder_notification_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage preorder notification types" ON public.preorder_notification_types FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view preorder notification types" ON public.preorder_notification_types FOR SELECT TO anon, authenticated USING (true);
