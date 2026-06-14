-- Fix products table: restore SELECT for anon, authenticated, service_role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT SELECT ON public.products TO anon;
GRANT ALL ON public.products TO service_role;

-- Also restore on related public views just in case
GRANT SELECT ON public.products_public TO anon, authenticated;
GRANT SELECT ON public.products_public TO service_role;

-- Permanent safeguard: event trigger that auto-grants standard privileges
-- on any new table created in the public schema so this class of bug cannot
-- recur silently. RLS policies still gate actual row visibility.
CREATE OR REPLACE FUNCTION public.auto_grant_public_table_privs()
RETURNS event_trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN
    SELECT * FROM pg_event_trigger_ddl_commands()
    WHERE command_tag = 'CREATE TABLE'
      AND schema_name = 'public'
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON %s TO authenticated', obj.object_identity);
    EXECUTE format('GRANT ALL ON %s TO service_role', obj.object_identity);
  END LOOP;
END;
$$;

DROP EVENT TRIGGER IF EXISTS auto_grant_public_table_privs_trg;
CREATE EVENT TRIGGER auto_grant_public_table_privs_trg
  ON ddl_command_end
  WHEN TAG IN ('CREATE TABLE')
  EXECUTE FUNCTION public.auto_grant_public_table_privs();