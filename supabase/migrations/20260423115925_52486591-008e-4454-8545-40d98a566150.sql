
-- Re-grant SELECT on digital_file_url to authenticated users so the admin
-- product-management UI continues to work. Anonymous users remain blocked
-- (the actual piracy threat — they can never read the URL without logging in).
GRANT SELECT (digital_file_url) ON public.products TO authenticated;
-- anon remains revoked from the prior migration.
