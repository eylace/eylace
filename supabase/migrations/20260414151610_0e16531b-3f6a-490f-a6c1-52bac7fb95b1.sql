
-- Add customer_ip column to orders
ALTER TABLE public.orders ADD COLUMN customer_ip text;

-- Create blocked_ips table
CREATE TABLE public.blocked_ips (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address text NOT NULL,
  reason text,
  blocked_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT blocked_ips_ip_address_key UNIQUE (ip_address)
);

-- Enable RLS
ALTER TABLE public.blocked_ips ENABLE ROW LEVEL SECURITY;

-- Admin-only policies
CREATE POLICY "Admins can manage blocked IPs"
  ON public.blocked_ips
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
