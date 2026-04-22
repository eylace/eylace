-- 1. Create accounting_sync_logs table
CREATE TABLE IF NOT EXISTS public.accounting_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID,
  order_number TEXT,
  status TEXT NOT NULL DEFAULT 'success',
  message TEXT,
  amount NUMERIC,
  account_id UUID,
  transaction_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_accounting_sync_logs_created_at ON public.accounting_sync_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_accounting_sync_logs_status ON public.accounting_sync_logs(status);

ALTER TABLE public.accounting_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Finance roles can view sync logs"
  ON public.accounting_sync_logs FOR SELECT TO authenticated
  USING (public.can_access_accounting(auth.uid()));

CREATE POLICY "Finance roles can insert sync logs"
  ON public.accounting_sync_logs FOR INSERT TO authenticated
  WITH CHECK (public.can_access_accounting(auth.uid()));

CREATE POLICY "Finance roles can delete sync logs"
  ON public.accounting_sync_logs FOR DELETE TO authenticated
  USING (public.can_access_accounting(auth.uid()));

-- 2. Update sync_order_to_accounting to honor configurable settings + write logs
CREATE OR REPLACE FUNCTION public.sync_order_to_accounting()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_sales_account_id UUID;
  v_existing UUID;
  v_settings JSONB;
  v_enabled BOOLEAN := true;
  v_revenue_account_code TEXT := '4000';
  v_new_tx_id UUID;
BEGIN
  IF NEW.status = 'delivered' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'delivered') THEN
    -- Read settings
    SELECT value INTO v_settings
    FROM public.system_settings
    WHERE key = 'accounting_settings'
    LIMIT 1;

    IF v_settings IS NOT NULL THEN
      v_enabled := COALESCE((v_settings->>'auto_sync_enabled')::boolean, true);
      v_revenue_account_code := COALESCE(v_settings->>'revenue_account_code', '4000');
    END IF;

    IF NOT v_enabled THEN
      INSERT INTO public.accounting_sync_logs(order_id, order_number, status, message, amount)
      VALUES (NEW.id, NEW.order_number, 'skipped', 'Auto-sync disabled in settings', NEW.total);
      RETURN NEW;
    END IF;

    SELECT id INTO v_sales_account_id
    FROM public.accounting_accounts
    WHERE code = v_revenue_account_code
    LIMIT 1;

    SELECT id INTO v_existing
    FROM public.accounting_transactions
    WHERE order_id = NEW.id AND is_auto_generated = true
    LIMIT 1;

    IF v_existing IS NOT NULL THEN
      INSERT INTO public.accounting_sync_logs(order_id, order_number, status, message, amount, transaction_id)
      VALUES (NEW.id, NEW.order_number, 'skipped', 'Already synced', NEW.total, v_existing);
      RETURN NEW;
    END IF;

    IF v_sales_account_id IS NULL THEN
      INSERT INTO public.accounting_sync_logs(order_id, order_number, status, message, amount)
      VALUES (NEW.id, NEW.order_number, 'failed', 'Revenue account not found: ' || v_revenue_account_code, NEW.total);
      RETURN NEW;
    END IF;

    INSERT INTO public.accounting_transactions (
      reference_number, transaction_date, type, account_id, amount,
      category, payment_method, description, order_id, is_auto_generated
    ) VALUES (
      'AUTO-' || NEW.order_number,
      COALESCE(NEW.delivered_at::date, CURRENT_DATE),
      'income',
      v_sales_account_id,
      NEW.total,
      'Sales',
      NEW.payment_method,
      'Auto-generated from delivered order #' || NEW.order_number,
      NEW.id,
      true
    )
    RETURNING id INTO v_new_tx_id;

    INSERT INTO public.accounting_sync_logs(order_id, order_number, status, message, amount, account_id, transaction_id)
    VALUES (NEW.id, NEW.order_number, 'success', 'Synced to ' || v_revenue_account_code, NEW.total, v_sales_account_id, v_new_tx_id);
  END IF;
  RETURN NEW;
END;
$function$;