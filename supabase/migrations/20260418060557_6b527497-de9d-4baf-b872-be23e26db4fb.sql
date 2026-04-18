ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS assigned_user_id uuid,
  ADD COLUMN IF NOT EXISTS assigned_user_name text,
  ADD COLUMN IF NOT EXISTS assigned_role text,
  ADD COLUMN IF NOT EXISTS assigned_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_orders_assigned_user ON public.orders(assigned_user_id);

CREATE OR REPLACE FUNCTION public.get_user_role_and_name(_user_id uuid)
RETURNS TABLE(role_name text, display_name text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role text;
  _name text;
BEGIN
  SELECT role::text INTO _role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY CASE role::text
    WHEN 'super_admin' THEN 1
    WHEN 'admin' THEN 2
    WHEN 'order_manager' THEN 3
    WHEN 'product_manager' THEN 4
    WHEN 'vendor_manager' THEN 5
    WHEN 'customer_manager' THEN 6
    WHEN 'finance_manager' THEN 7
    WHEN 'marketing_manager' THEN 8
    WHEN 'support_manager' THEN 9
    WHEN 'content_manager' THEN 10
    WHEN 'moderator' THEN 11
    ELSE 99
  END
  LIMIT 1;

  SELECT COALESCE(NULLIF(TRIM(CONCAT_WS(' ', first_name, last_name)), ''), email, 'Unknown')
    INTO _name
  FROM public.profiles
  WHERE user_id = _user_id
  LIMIT 1;

  RETURN QUERY SELECT _role, _name;
END;
$$;