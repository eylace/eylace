
-- OTP SMS Templates table
CREATE TABLE public.otp_sms_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  template_key TEXT NOT NULL UNIQUE,
  message TEXT NOT NULL,
  variables TEXT[] NOT NULL DEFAULT ARRAY['{{otp}}']::text[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.otp_sms_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage otp sms templates" ON public.otp_sms_templates FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view active otp sms templates" ON public.otp_sms_templates FOR SELECT USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role));

-- Insert default templates
INSERT INTO public.otp_sms_templates (name, template_key, message) VALUES
('Login OTP', 'login_otp', 'Your login OTP is {{otp}}. Valid for 5 minutes. Do not share with anyone.'),
('Registration OTP', 'registration_otp', 'Your registration OTP is {{otp}}. Valid for 10 minutes.'),
('Password Reset OTP', 'password_reset_otp', 'Your password reset OTP is {{otp}}. Valid for 5 minutes.'),
('Order Confirmation OTP', 'order_confirmation_otp', 'Your order confirmation OTP is {{otp}}. Use this to confirm your order.');
