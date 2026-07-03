
-- Restore table-level SELECT that was accidentally stripped, then
-- re-revoke ONLY the sensitive columns from anon/authenticated.
GRANT SELECT ON public.products TO anon, authenticated;

REVOKE SELECT (cost_per_item, digital_file_url) ON public.products FROM anon;
REVOKE SELECT (cost_per_item)                    ON public.products FROM authenticated;

-- Make sure related tables also still have their public/admin read grants.
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT SELECT ON public.brands     TO anon, authenticated;
GRANT SELECT ON public.sellers    TO authenticated;
