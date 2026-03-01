
-- System settings table for feature toggles (like seller registration on/off)
CREATE TABLE public.system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings
CREATE POLICY "Anyone can view settings" ON public.system_settings
  FOR SELECT USING (true);

-- Only admins can modify settings
CREATE POLICY "Admins can manage settings" ON public.system_settings
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default setting: seller registration enabled
INSERT INTO public.system_settings (key, value) 
VALUES ('seller_registration_enabled', '{"enabled": true}'::jsonb);

-- Seller applications table
CREATE TABLE public.seller_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  store_name text NOT NULL,
  store_description text,
  phone text,
  business_type text,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.seller_applications ENABLE ROW LEVEL SECURITY;

-- Users can view their own application
CREATE POLICY "Users can view own application" ON public.seller_applications
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own application
CREATE POLICY "Users can submit application" ON public.seller_applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can view all applications
CREATE POLICY "Admins can view all applications" ON public.seller_applications
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update applications (approve/reject)
CREATE POLICY "Admins can update applications" ON public.seller_applications
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
