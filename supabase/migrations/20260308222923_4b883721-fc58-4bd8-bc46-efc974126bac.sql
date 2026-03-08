
-- Fix ALL preorder tables: drop RESTRICTIVE policies, recreate as PERMISSIVE

-- 1. preorder_settings
DROP POLICY IF EXISTS "Admins can manage preorder settings" ON public.preorder_settings;
DROP POLICY IF EXISTS "Anyone can view preorder settings" ON public.preorder_settings;
CREATE POLICY "Admins can manage preorder settings" ON public.preorder_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view preorder settings" ON public.preorder_settings FOR SELECT USING (true);

-- 2. preorder_products
DROP POLICY IF EXISTS "Admins can manage preorder products" ON public.preorder_products;
DROP POLICY IF EXISTS "Anyone can view active preorder products" ON public.preorder_products;
CREATE POLICY "Admins can manage preorder products" ON public.preorder_products FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view active preorder products" ON public.preorder_products FOR SELECT USING (status = 'active' OR public.has_role(auth.uid(), 'admin'::app_role));

-- 3. preorder_orders
DROP POLICY IF EXISTS "Admins can manage preorder orders" ON public.preorder_orders;
DROP POLICY IF EXISTS "Users can create preorder orders" ON public.preorder_orders;
DROP POLICY IF EXISTS "Users can view own preorder orders" ON public.preorder_orders;
CREATE POLICY "Admins can manage preorder orders" ON public.preorder_orders FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can create preorder orders" ON public.preorder_orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own preorder orders" ON public.preorder_orders FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 4. preorder_commissions
DROP POLICY IF EXISTS "Admins can manage preorder commissions" ON public.preorder_commissions;
CREATE POLICY "Admins can manage preorder commissions" ON public.preorder_commissions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 5. preorder_conversations
DROP POLICY IF EXISTS "Admins can manage preorder conversations" ON public.preorder_conversations;
DROP POLICY IF EXISTS "Users can create preorder conversations" ON public.preorder_conversations;
DROP POLICY IF EXISTS "Users can view own preorder conversations" ON public.preorder_conversations;
CREATE POLICY "Admins can manage preorder conversations" ON public.preorder_conversations FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can create preorder conversations" ON public.preorder_conversations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own preorder conversations" ON public.preorder_conversations FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 6. preorder_queries
DROP POLICY IF EXISTS "Admins can manage preorder queries" ON public.preorder_queries;
DROP POLICY IF EXISTS "Users can create preorder queries" ON public.preorder_queries;
DROP POLICY IF EXISTS "Users can view own preorder queries" ON public.preorder_queries;
CREATE POLICY "Admins can manage preorder queries" ON public.preorder_queries FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can create preorder queries" ON public.preorder_queries FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own preorder queries" ON public.preorder_queries FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 7. preorder_reviews
DROP POLICY IF EXISTS "Admins can manage preorder reviews" ON public.preorder_reviews;
DROP POLICY IF EXISTS "Anyone can view preorder reviews" ON public.preorder_reviews;
DROP POLICY IF EXISTS "Users can create preorder reviews" ON public.preorder_reviews;
CREATE POLICY "Admins can manage preorder reviews" ON public.preorder_reviews FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view preorder reviews" ON public.preorder_reviews FOR SELECT USING (true);
CREATE POLICY "Users can create preorder reviews" ON public.preorder_reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 8. preorder_faqs
DROP POLICY IF EXISTS "Admins can manage preorder faqs" ON public.preorder_faqs;
DROP POLICY IF EXISTS "Anyone can view active preorder faqs" ON public.preorder_faqs;
CREATE POLICY "Admins can manage preorder faqs" ON public.preorder_faqs FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view active preorder faqs" ON public.preorder_faqs FOR SELECT USING (is_active = true OR public.has_role(auth.uid(), 'admin'::app_role));

-- 9. preorder_notification_types
DROP POLICY IF EXISTS "Admins can manage preorder notification types" ON public.preorder_notification_types;
DROP POLICY IF EXISTS "Anyone can view preorder notification types" ON public.preorder_notification_types;
CREATE POLICY "Admins can manage preorder notification types" ON public.preorder_notification_types FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view preorder notification types" ON public.preorder_notification_types FOR SELECT USING (true);
