
CREATE TABLE public.otp_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  code text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 3,
  is_used boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_otp_codes_phone ON public.otp_codes (phone, is_used, expires_at);

-- Only service role should access this table (from edge functions)
-- No public RLS policies needed
