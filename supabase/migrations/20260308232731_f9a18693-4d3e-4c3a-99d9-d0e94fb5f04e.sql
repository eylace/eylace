
-- Flash Deals table
CREATE TABLE public.flash_deals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  discount INTEGER NOT NULL DEFAULT 20,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT false,
  products INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.flash_deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage flash deals" ON public.flash_deals FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view active flash deals" ON public.flash_deals FOR SELECT USING ((is_active = true) OR public.has_role(auth.uid(), 'admin'::app_role));

-- Dynamic Popups table
CREATE TABLE public.dynamic_popups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  trigger_type TEXT NOT NULL DEFAULT 'welcome',
  content TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  delay_seconds INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.dynamic_popups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage popups" ON public.dynamic_popups FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view active popups" ON public.dynamic_popups FOR SELECT USING ((is_active = true) OR public.has_role(auth.uid(), 'admin'::app_role));

-- Custom Alerts table
CREATE TABLE public.custom_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT,
  alert_type TEXT NOT NULL DEFAULT 'info',
  placement TEXT NOT NULL DEFAULT 'top',
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.custom_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage custom alerts" ON public.custom_alerts FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view active alerts" ON public.custom_alerts FOR SELECT USING ((is_active = true) OR public.has_role(auth.uid(), 'admin'::app_role));

-- Custom Sell Alerts table
CREATE TABLE public.custom_sell_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT,
  min_amount NUMERIC NOT NULL DEFAULT 0,
  discount_code TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.custom_sell_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage sell alerts" ON public.custom_sell_alerts FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view active sell alerts" ON public.custom_sell_alerts FOR SELECT USING ((is_active = true) OR public.has_role(auth.uid(), 'admin'::app_role));

-- Email Templates table
CREATE TABLE public.marketing_email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  template_type TEXT NOT NULL DEFAULT 'custom',
  body TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.marketing_email_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage email templates" ON public.marketing_email_templates FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Newsletters table
CREATE TABLE public.newsletters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject TEXT NOT NULL,
  content TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  recipients INTEGER NOT NULL DEFAULT 0,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.newsletters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage newsletters" ON public.newsletters FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Push Notifications table
CREATE TABLE public.push_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT,
  audience TEXT NOT NULL DEFAULT 'All Users',
  status TEXT NOT NULL DEFAULT 'draft',
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.push_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage push notifications" ON public.push_notifications FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Bulk SMS Campaigns table
CREATE TABLE public.bulk_sms_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT,
  audience TEXT NOT NULL DEFAULT 'All Customers',
  status TEXT NOT NULL DEFAULT 'draft',
  recipients INTEGER NOT NULL DEFAULT 0,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.bulk_sms_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage sms campaigns" ON public.bulk_sms_campaigns FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Subscribers table
CREATE TABLE public.newsletter_subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  source TEXT DEFAULT 'Footer Form',
  status TEXT NOT NULL DEFAULT 'active',
  subscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage subscribers" ON public.newsletter_subscribers FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE UNIQUE INDEX idx_subscriber_email ON public.newsletter_subscribers(email);
