
ALTER TABLE public.affiliates
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS social_handles jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS audience_size text,
  ADD COLUMN IF NOT EXISTS marketing_channels text[] DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS terms_accepted boolean DEFAULT false;

-- Allow prevent_affiliate_self_escalation to still let users update own profile fields
CREATE OR REPLACE FUNCTION public.prevent_affiliate_self_escalation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.commission_rate IS DISTINCT FROM OLD.commission_rate
     OR NEW.total_earnings IS DISTINCT FROM OLD.total_earnings
     OR NEW.total_paid IS DISTINCT FROM OLD.total_paid
     OR NEW.total_clicks IS DISTINCT FROM OLD.total_clicks
     OR NEW.total_conversions IS DISTINCT FROM OLD.total_conversions
     OR NEW.referral_code IS DISTINCT FROM OLD.referral_code
     OR NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.admin_notes IS DISTINCT FROM OLD.admin_notes
  THEN
    RAISE EXCEPTION 'Not authorized to modify protected affiliate fields'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$function$;
