ALTER TABLE public.otp_codes ADD COLUMN IF NOT EXISTS ip_address text;
CREATE INDEX IF NOT EXISTS otp_codes_ip_created_at_idx ON public.otp_codes (ip_address, created_at DESC);