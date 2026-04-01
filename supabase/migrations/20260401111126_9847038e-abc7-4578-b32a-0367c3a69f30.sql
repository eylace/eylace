
-- Add return tracking columns
ALTER TABLE public.return_requests
  ADD COLUMN IF NOT EXISTS return_tracking_number text UNIQUE,
  ADD COLUMN IF NOT EXISTS acknowledgement_data jsonb DEFAULT '{}'::jsonb;

-- Function to auto-generate tracking number
CREATE OR REPLACE FUNCTION public.generate_return_tracking_number()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.return_tracking_number IS NULL THEN
    NEW.return_tracking_number := 'RTN-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(md5(random()::text), 1, 6));
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to set tracking number on insert
CREATE TRIGGER set_return_tracking_number
  BEFORE INSERT ON public.return_requests
  FOR EACH ROW EXECUTE FUNCTION generate_return_tracking_number();

-- Security definer function for public return tracking lookup (limited info)
CREATE OR REPLACE FUNCTION public.lookup_return_by_tracking(tracking_number text)
RETURNS TABLE(
  return_tracking_number text,
  status text,
  reason text,
  created_at timestamptz,
  updated_at timestamptz,
  resolved_at timestamptz,
  refund_amount numeric,
  refund_method text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    r.return_tracking_number,
    r.status,
    r.reason,
    r.created_at,
    r.updated_at,
    r.resolved_at,
    r.refund_amount,
    r.refund_method
  FROM public.return_requests r
  WHERE r.return_tracking_number = tracking_number;
$$;
