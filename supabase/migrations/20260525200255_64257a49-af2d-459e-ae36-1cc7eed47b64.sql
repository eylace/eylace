
-- ============ affiliate_payouts: restrict affiliate self-insert ============
DROP POLICY IF EXISTS "Affiliates can request payouts" ON public.affiliate_payouts;

CREATE POLICY "Affiliates can request payouts"
ON public.affiliate_payouts
FOR INSERT
TO authenticated
WITH CHECK (
  status = 'pending'
  AND transaction_id IS NULL
  AND admin_notes IS NULL
  AND amount > 0
  AND EXISTS (
    SELECT 1 FROM public.affiliates a
    WHERE a.id = affiliate_payouts.affiliate_id
      AND a.user_id = auth.uid()
      AND a.status = 'active'
      AND amount <= (COALESCE(a.total_earnings, 0) - COALESCE(a.total_paid, 0))
  )
);

-- Prevent affiliates from updating payout rows (only admins via "Admins can manage payouts")
-- The existing "Admins can manage payouts" FOR ALL policy already covers admin updates.
-- No affiliate-scoped UPDATE policy exists, so affiliates cannot update — good.

-- ============ affiliates: block self-escalation via trigger ============
CREATE OR REPLACE FUNCTION public.prevent_affiliate_self_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admins bypass
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  -- Non-admins (affiliate updating own row): block sensitive column changes
  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.commission_rate IS DISTINCT FROM OLD.commission_rate
     OR NEW.total_earnings IS DISTINCT FROM OLD.total_earnings
     OR NEW.total_paid IS DISTINCT FROM OLD.total_paid
     OR NEW.referral_code IS DISTINCT FROM OLD.referral_code
     OR NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.admin_notes IS DISTINCT FROM OLD.admin_notes
  THEN
    RAISE EXCEPTION 'Not authorized to modify protected affiliate fields'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_affiliate_self_escalation ON public.affiliates;
CREATE TRIGGER trg_prevent_affiliate_self_escalation
BEFORE UPDATE ON public.affiliates
FOR EACH ROW
EXECUTE FUNCTION public.prevent_affiliate_self_escalation();

-- ============ incomplete_orders: remove anon read/update/delete ============
DROP POLICY IF EXISTS "Anon select own session" ON public.incomplete_orders;
DROP POLICY IF EXISTS "Anon update own session" ON public.incomplete_orders;
DROP POLICY IF EXISTS "Anon delete own session" ON public.incomplete_orders;

-- Keep "Anon insert own session" so abandoned-cart capture still works.
-- Recovery / admin views go through authenticated admin policies and edge functions
-- using the service role, which already bypass RLS.
