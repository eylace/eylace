-- The privileged has_role() function intentionally remains unavailable to anon.
-- Any RLS policy that invokes it must therefore never run as anon.

ALTER POLICY "Admins can manage categories" ON public.categories TO authenticated;
ALTER POLICY "Admins can view all usage" ON public.coupon_usage TO authenticated;
ALTER POLICY "Admins can manage otp sms templates" ON public.otp_sms_templates TO authenticated;
ALTER POLICY "Admins can update applications" ON public.seller_applications TO authenticated;
ALTER POLICY "Admins can view all applications" ON public.seller_applications TO authenticated;
ALTER POLICY "Admins can manage sellers" ON public.sellers TO authenticated;
ALTER POLICY "managers_all" ON public.support_managers TO authenticated;
ALTER POLICY "tickets_delete" ON public.support_tickets TO authenticated;

-- Combined public/admin read policies are restricted to authenticated users,
-- then mirrored with a safe anon-only predicate that never calls has_role().
ALTER POLICY "Anyone can view active alerts" ON public.custom_alerts TO authenticated;
DROP POLICY IF EXISTS "Anon can view active alerts" ON public.custom_alerts;
CREATE POLICY "Anon can view active alerts"
ON public.custom_alerts FOR SELECT TO anon
USING (is_active = true);

ALTER POLICY "Anyone can view active sell alerts" ON public.custom_sell_alerts TO authenticated;
DROP POLICY IF EXISTS "Anon can view active sell alerts" ON public.custom_sell_alerts;
CREATE POLICY "Anon can view active sell alerts"
ON public.custom_sell_alerts FOR SELECT TO anon
USING (is_active = true);

ALTER POLICY "Anyone can view active popups" ON public.dynamic_popups TO authenticated;
DROP POLICY IF EXISTS "Anon can view active popups" ON public.dynamic_popups;
CREATE POLICY "Anon can view active popups"
ON public.dynamic_popups FOR SELECT TO anon
USING (is_active = true);

ALTER POLICY "Anyone can view active flash deals" ON public.flash_deals TO authenticated;
DROP POLICY IF EXISTS "Anon can view active flash deals" ON public.flash_deals;
CREATE POLICY "Anon can view active flash deals"
ON public.flash_deals FOR SELECT TO anon
USING (is_active = true);

ALTER POLICY "Anyone can view active preorder faqs" ON public.preorder_faqs TO authenticated;
DROP POLICY IF EXISTS "Anon can view active preorder faqs" ON public.preorder_faqs;
CREATE POLICY "Anon can view active preorder faqs"
ON public.preorder_faqs FOR SELECT TO anon
USING (is_active = true);

ALTER POLICY "Anyone can view active preorder products" ON public.preorder_products TO authenticated;
DROP POLICY IF EXISTS "Anon can view active preorder products" ON public.preorder_products;
CREATE POLICY "Anon can view active preorder products"
ON public.preorder_products FOR SELECT TO anon
USING (status = 'active');

ALTER POLICY "Anyone can view active seller packages" ON public.seller_packages TO authenticated;
DROP POLICY IF EXISTS "Anon can view active seller packages" ON public.seller_packages;
CREATE POLICY "Anon can view active seller packages"
ON public.seller_packages FOR SELECT TO anon
USING (is_active = true);

ALTER POLICY "Anyone can view active verification fields" ON public.seller_verification_fields TO authenticated;
DROP POLICY IF EXISTS "Anon can view active verification fields" ON public.seller_verification_fields;
CREATE POLICY "Anon can view active verification fields"
ON public.seller_verification_fields FOR SELECT TO anon
USING (is_active = true);

-- Defense in depth: keep privileged role checks unavailable to signed-out users.
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;