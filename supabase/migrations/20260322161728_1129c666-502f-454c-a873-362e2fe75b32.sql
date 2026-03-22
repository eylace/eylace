
-- Affiliates table
CREATE TABLE public.affiliates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code text NOT NULL UNIQUE,
  commission_rate numeric NOT NULL DEFAULT 5,
  status text NOT NULL DEFAULT 'pending',
  payment_method text DEFAULT 'bkash',
  payment_details jsonb DEFAULT '{}',
  total_earnings numeric DEFAULT 0,
  total_paid numeric DEFAULT 0,
  total_clicks integer DEFAULT 0,
  total_conversions integer DEFAULT 0,
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own affiliate" ON public.affiliates FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own affiliate" ON public.affiliates FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own affiliate" ON public.affiliates FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage affiliates" ON public.affiliates FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_affiliates_user_id ON public.affiliates(user_id);
CREATE INDEX idx_affiliates_referral_code ON public.affiliates(referral_code);
CREATE INDEX idx_affiliates_status ON public.affiliates(status);

-- Affiliate clicks table
CREATE TABLE public.affiliate_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  ip_address text,
  user_agent text,
  landing_page text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliates can view own clicks" ON public.affiliate_clicks FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.affiliates WHERE affiliates.id = affiliate_clicks.affiliate_id AND affiliates.user_id = auth.uid()));
CREATE POLICY "Anyone can insert clicks" ON public.affiliate_clicks FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins can manage clicks" ON public.affiliate_clicks FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_affiliate_clicks_affiliate_id ON public.affiliate_clicks(affiliate_id);

-- Affiliate conversions table
CREATE TABLE public.affiliate_conversions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  order_id uuid,
  order_total numeric NOT NULL DEFAULT 0,
  commission_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.affiliate_conversions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliates can view own conversions" ON public.affiliate_conversions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.affiliates WHERE affiliates.id = affiliate_conversions.affiliate_id AND affiliates.user_id = auth.uid()));
CREATE POLICY "Admins can manage conversions" ON public.affiliate_conversions FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_affiliate_conversions_affiliate_id ON public.affiliate_conversions(affiliate_id);
CREATE INDEX idx_affiliate_conversions_order_id ON public.affiliate_conversions(order_id);

-- Affiliate payouts table
CREATE TABLE public.affiliate_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  payment_method text,
  transaction_id text,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.affiliate_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliates can view own payouts" ON public.affiliate_payouts FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.affiliates WHERE affiliates.id = affiliate_payouts.affiliate_id AND affiliates.user_id = auth.uid()));
CREATE POLICY "Affiliates can request payouts" ON public.affiliate_payouts FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.affiliates WHERE affiliates.id = affiliate_payouts.affiliate_id AND affiliates.user_id = auth.uid()));
CREATE POLICY "Admins can manage payouts" ON public.affiliate_payouts FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_affiliate_payouts_affiliate_id ON public.affiliate_payouts(affiliate_id);
