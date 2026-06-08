REVOKE SELECT (cost_per_item) ON public.products FROM anon;
REVOKE SELECT (cost_per_item) ON public.products FROM authenticated;
REVOKE SELECT (digital_file_url) ON public.products FROM anon;

-- Re-grant cost_per_item to authenticated only for admin/finance flows (RLS still restricts rows).
-- Sellers/admins read cost via the admin RPCs that are SECURITY DEFINER and check roles,
-- so authenticated does not need direct column SELECT here. Keep revoked.