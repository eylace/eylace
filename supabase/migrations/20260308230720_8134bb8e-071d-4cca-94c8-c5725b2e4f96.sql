
-- Seller Payouts
CREATE TABLE public.seller_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'bank_transfer',
  reference_number text,
  notes text,
  status text NOT NULL DEFAULT 'completed',
  paid_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.seller_payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage seller payouts" ON public.seller_payouts FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Seller Payout Requests
CREATE TABLE public.seller_payout_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'bank_transfer',
  account_details jsonb,
  notes text,
  admin_notes text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.seller_payout_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage payout requests" ON public.seller_payout_requests FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Sellers can view own payout requests" ON public.seller_payout_requests FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.sellers WHERE sellers.id = seller_payout_requests.seller_id AND sellers.user_id = auth.uid()));
CREATE POLICY "Sellers can create payout requests" ON public.seller_payout_requests FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.sellers WHERE sellers.id = seller_payout_requests.seller_id AND sellers.user_id = auth.uid()));

-- Seller Commission Config (seller-specific and category-specific)
CREATE TABLE public.seller_commission_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid REFERENCES public.sellers(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.categories(id) ON DELETE CASCADE,
  commission_type text NOT NULL DEFAULT 'seller',
  commission_rate numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.seller_commission_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage commission config" ON public.seller_commission_config FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Seller Packages
CREATE TABLE public.seller_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  price numeric NOT NULL DEFAULT 0,
  duration_days integer NOT NULL DEFAULT 30,
  product_limit integer NOT NULL DEFAULT 50,
  commission_rate numeric NOT NULL DEFAULT 10,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.seller_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage seller packages" ON public.seller_packages FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view active seller packages" ON public.seller_packages FOR SELECT USING ((is_active = true) OR public.has_role(auth.uid(), 'admin'::app_role));

-- Seller Verification Forms
CREATE TABLE public.seller_verification_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  field_name text NOT NULL,
  field_type text NOT NULL DEFAULT 'text',
  is_required boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  options jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.seller_verification_fields ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage verification fields" ON public.seller_verification_fields FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view active verification fields" ON public.seller_verification_fields FOR SELECT USING ((is_active = true) OR public.has_role(auth.uid(), 'admin'::app_role));
