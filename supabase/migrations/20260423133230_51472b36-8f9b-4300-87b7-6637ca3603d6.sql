
-- 1. Lock down digital_file_url at the COLUMN level
REVOKE SELECT (digital_file_url) ON public.products FROM anon;
REVOKE SELECT (digital_file_url) ON public.products FROM PUBLIC;

-- Re-grant authenticated full table SELECT (admins/sellers need it)
GRANT SELECT ON public.products TO authenticated;

-- 2. Secure RPC: get_digital_download_url(product_id, order_id)
CREATE OR REPLACE FUNCTION public.get_digital_download_url(
  _product_id uuid,
  _order_id uuid
)
RETURNS TABLE(download_url text, product_name text)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.orders o
    JOIN public.order_items oi ON oi.order_id = o.id
    WHERE o.id = _order_id
      AND o.user_id = auth.uid()
      AND oi.product_id = _product_id::text
      AND o.status IN ('processing', 'shipped', 'delivered', 'completed')
  ) THEN
    RAISE EXCEPTION 'Not authorized to download this product'
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT p.digital_file_url, p.name
  FROM public.products p
  WHERE p.id = _product_id
    AND p.is_digital = true
    AND p.digital_file_url IS NOT NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.get_digital_download_url(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_digital_download_url(uuid, uuid) TO authenticated;

-- 3. OTP cleanup function
CREATE OR REPLACE FUNCTION public.cleanup_expired_otp_codes()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _deleted integer;
BEGIN
  DELETE FROM public.otp_codes
  WHERE expires_at < now() - interval '1 hour'
     OR is_used = true;
  GET DIAGNOSTICS _deleted = ROW_COUNT;
  RETURN _deleted;
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_expired_otp_codes() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_otp_codes() TO service_role;

-- 4. Defensive cleanup of any stray OTP select policies
DO $$
BEGIN
  EXECUTE 'DROP POLICY IF EXISTS "Anyone can view otp" ON public.otp_codes';
  EXECUTE 'DROP POLICY IF EXISTS "Users can view own otp" ON public.otp_codes';
END$$;
