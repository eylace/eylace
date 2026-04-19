
CREATE TABLE IF NOT EXISTS public.courier_auth_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL,
  environment TEXT NOT NULL DEFAULT 'live',
  client_id TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS courier_auth_tokens_provider_env_client_idx
  ON public.courier_auth_tokens (provider, environment, COALESCE(client_id, ''));

ALTER TABLE public.courier_auth_tokens ENABLE ROW LEVEL SECURITY;

-- No user policies: only service role (used by edge functions) can access this table.
-- Service role bypasses RLS automatically.

CREATE TRIGGER trg_courier_auth_tokens_updated_at
BEFORE UPDATE ON public.courier_auth_tokens
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
