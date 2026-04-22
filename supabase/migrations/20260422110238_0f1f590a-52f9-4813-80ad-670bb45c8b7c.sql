-- Helper: updated_at trigger function (idempotent)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 1. Chart of Accounts
CREATE TABLE IF NOT EXISTS public.accounting_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('asset', 'liability', 'equity', 'income', 'expense')),
  parent_id UUID REFERENCES public.accounting_accounts(id) ON DELETE SET NULL,
  description TEXT,
  opening_balance NUMERIC NOT NULL DEFAULT 0,
  current_balance NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Transactions
CREATE TABLE IF NOT EXISTS public.accounting_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reference_number TEXT NOT NULL UNIQUE,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer', 'journal')),
  account_id UUID REFERENCES public.accounting_accounts(id) ON DELETE RESTRICT,
  contra_account_id UUID REFERENCES public.accounting_accounts(id) ON DELETE RESTRICT,
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  category TEXT,
  payment_method TEXT,
  description TEXT,
  notes TEXT,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  is_auto_generated BOOLEAN NOT NULL DEFAULT false,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_acct_tx_date ON public.accounting_transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_acct_tx_type ON public.accounting_transactions(type);
CREATE INDEX IF NOT EXISTS idx_acct_tx_account ON public.accounting_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_acct_tx_order ON public.accounting_transactions(order_id);

-- 3. Invoices
CREATE TABLE IF NOT EXISTS public.accounting_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  customer_address TEXT,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  amount_paid NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'partial', 'paid', 'overdue', 'cancelled')),
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_acct_inv_status ON public.accounting_invoices(status);
CREATE INDEX IF NOT EXISTS idx_acct_inv_date ON public.accounting_invoices(issue_date DESC);

-- 4. Bills
CREATE TABLE IF NOT EXISTS public.accounting_bills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bill_number TEXT NOT NULL UNIQUE,
  supplier_name TEXT NOT NULL,
  supplier_email TEXT,
  supplier_phone TEXT,
  category TEXT,
  bill_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  amount NUMERIC NOT NULL DEFAULT 0,
  amount_paid NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('draft', 'unpaid', 'partial', 'paid', 'overdue', 'cancelled')),
  payment_method TEXT,
  description TEXT,
  attachment_url TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_acct_bill_status ON public.accounting_bills(status);
CREATE INDEX IF NOT EXISTS idx_acct_bill_date ON public.accounting_bills(bill_date DESC);

-- Access check function
CREATE OR REPLACE FUNCTION public.can_access_accounting(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('super_admin', 'admin', 'finance_manager')
  );
$$;

-- Enable RLS
ALTER TABLE public.accounting_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_bills ENABLE ROW LEVEL SECURITY;

-- RLS: accounts
CREATE POLICY "Finance roles can view accounts" ON public.accounting_accounts FOR SELECT TO authenticated USING (public.can_access_accounting(auth.uid()));
CREATE POLICY "Finance roles can insert accounts" ON public.accounting_accounts FOR INSERT TO authenticated WITH CHECK (public.can_access_accounting(auth.uid()));
CREATE POLICY "Finance roles can update accounts" ON public.accounting_accounts FOR UPDATE TO authenticated USING (public.can_access_accounting(auth.uid())) WITH CHECK (public.can_access_accounting(auth.uid()));
CREATE POLICY "Finance roles can delete accounts" ON public.accounting_accounts FOR DELETE TO authenticated USING (public.can_access_accounting(auth.uid()) AND is_system = false);

-- RLS: transactions
CREATE POLICY "Finance roles can view transactions" ON public.accounting_transactions FOR SELECT TO authenticated USING (public.can_access_accounting(auth.uid()));
CREATE POLICY "Finance roles can insert transactions" ON public.accounting_transactions FOR INSERT TO authenticated WITH CHECK (public.can_access_accounting(auth.uid()));
CREATE POLICY "Finance roles can update transactions" ON public.accounting_transactions FOR UPDATE TO authenticated USING (public.can_access_accounting(auth.uid())) WITH CHECK (public.can_access_accounting(auth.uid()));
CREATE POLICY "Finance roles can delete transactions" ON public.accounting_transactions FOR DELETE TO authenticated USING (public.can_access_accounting(auth.uid()));

-- RLS: invoices
CREATE POLICY "Finance roles can view invoices" ON public.accounting_invoices FOR SELECT TO authenticated USING (public.can_access_accounting(auth.uid()));
CREATE POLICY "Finance roles can insert invoices" ON public.accounting_invoices FOR INSERT TO authenticated WITH CHECK (public.can_access_accounting(auth.uid()));
CREATE POLICY "Finance roles can update invoices" ON public.accounting_invoices FOR UPDATE TO authenticated USING (public.can_access_accounting(auth.uid())) WITH CHECK (public.can_access_accounting(auth.uid()));
CREATE POLICY "Finance roles can delete invoices" ON public.accounting_invoices FOR DELETE TO authenticated USING (public.can_access_accounting(auth.uid()));

-- RLS: bills
CREATE POLICY "Finance roles can view bills" ON public.accounting_bills FOR SELECT TO authenticated USING (public.can_access_accounting(auth.uid()));
CREATE POLICY "Finance roles can insert bills" ON public.accounting_bills FOR INSERT TO authenticated WITH CHECK (public.can_access_accounting(auth.uid()));
CREATE POLICY "Finance roles can update bills" ON public.accounting_bills FOR UPDATE TO authenticated USING (public.can_access_accounting(auth.uid())) WITH CHECK (public.can_access_accounting(auth.uid()));
CREATE POLICY "Finance roles can delete bills" ON public.accounting_bills FOR DELETE TO authenticated USING (public.can_access_accounting(auth.uid()));

-- updated_at triggers
CREATE TRIGGER trg_acct_accounts_updated BEFORE UPDATE ON public.accounting_accounts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_acct_tx_updated BEFORE UPDATE ON public.accounting_transactions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_acct_inv_updated BEFORE UPDATE ON public.accounting_invoices FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_acct_bill_updated BEFORE UPDATE ON public.accounting_bills FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-update account balance trigger
CREATE OR REPLACE FUNCTION public.update_account_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account_type TEXT;
  v_old_account_type TEXT;
BEGIN
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.account_id IS NOT NULL THEN
    SELECT type INTO v_account_type FROM public.accounting_accounts WHERE id = NEW.account_id;
    IF v_account_type IN ('income', 'liability', 'equity') THEN
      IF NEW.type = 'income' THEN
        UPDATE public.accounting_accounts SET current_balance = current_balance + NEW.amount WHERE id = NEW.account_id;
      ELSE
        UPDATE public.accounting_accounts SET current_balance = current_balance - NEW.amount WHERE id = NEW.account_id;
      END IF;
    ELSE
      IF NEW.type = 'expense' THEN
        UPDATE public.accounting_accounts SET current_balance = current_balance + NEW.amount WHERE id = NEW.account_id;
      ELSE
        UPDATE public.accounting_accounts SET current_balance = current_balance - NEW.amount WHERE id = NEW.account_id;
      END IF;
    END IF;
  END IF;

  IF (TG_OP = 'UPDATE' OR TG_OP = 'DELETE') AND OLD.account_id IS NOT NULL THEN
    SELECT type INTO v_old_account_type FROM public.accounting_accounts WHERE id = OLD.account_id;
    IF v_old_account_type IN ('income', 'liability', 'equity') THEN
      IF OLD.type = 'income' THEN
        UPDATE public.accounting_accounts SET current_balance = current_balance - OLD.amount WHERE id = OLD.account_id;
      ELSE
        UPDATE public.accounting_accounts SET current_balance = current_balance + OLD.amount WHERE id = OLD.account_id;
      END IF;
    ELSE
      IF OLD.type = 'expense' THEN
        UPDATE public.accounting_accounts SET current_balance = current_balance - OLD.amount WHERE id = OLD.account_id;
      ELSE
        UPDATE public.accounting_accounts SET current_balance = current_balance + OLD.amount WHERE id = OLD.account_id;
      END IF;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_acct_tx_balance
  AFTER INSERT OR UPDATE OR DELETE ON public.accounting_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_account_balance();

-- Auto-sync delivered orders -> income transaction
CREATE OR REPLACE FUNCTION public.sync_order_to_accounting()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sales_account_id UUID;
  v_existing UUID;
BEGIN
  IF NEW.status = 'delivered' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'delivered') THEN
    SELECT id INTO v_sales_account_id FROM public.accounting_accounts WHERE code = '4000' LIMIT 1;
    SELECT id INTO v_existing FROM public.accounting_transactions WHERE order_id = NEW.id AND is_auto_generated = true LIMIT 1;

    IF v_existing IS NULL AND v_sales_account_id IS NOT NULL THEN
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
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_order_to_accounting
  AFTER INSERT OR UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.sync_order_to_accounting();

-- Seed default Chart of Accounts
INSERT INTO public.accounting_accounts (code, name, type, description, is_system) VALUES
  ('1000', 'Cash on Hand', 'asset', 'Physical cash available', true),
  ('1010', 'Bank Account', 'asset', 'Primary bank account balance', true),
  ('1020', 'Mobile Wallet (bKash/Nagad/Rocket)', 'asset', 'Mobile financial services balance', true),
  ('1100', 'Accounts Receivable', 'asset', 'Money owed by customers', true),
  ('1200', 'Inventory', 'asset', 'Stock value', true),
  ('2000', 'Accounts Payable', 'liability', 'Money owed to suppliers', true),
  ('2100', 'Sales Tax Payable', 'liability', 'Tax collected from customers', true),
  ('3000', 'Owner Equity', 'equity', 'Owner capital', true),
  ('4000', 'Sales Revenue', 'income', 'Revenue from product sales', true),
  ('4010', 'Shipping Income', 'income', 'Revenue from shipping fees', true),
  ('4020', 'Other Income', 'income', 'Miscellaneous income', true),
  ('5000', 'Cost of Goods Sold', 'expense', 'Direct cost of products sold', true),
  ('5100', 'Shipping Expense', 'expense', 'Courier and delivery costs', true),
  ('5200', 'Marketing & Advertising', 'expense', 'Marketing campaigns and ads', true),
  ('5300', 'Salaries & Wages', 'expense', 'Employee salaries', true),
  ('5400', 'Rent', 'expense', 'Office or warehouse rent', true),
  ('5500', 'Utilities', 'expense', 'Electricity, internet, water', true),
  ('5600', 'Office Supplies', 'expense', 'Stationery and supplies', true),
  ('5700', 'Refunds & Returns', 'expense', 'Customer refunds', true),
  ('5800', 'Bank & Payment Fees', 'expense', 'Transaction fees', true),
  ('5900', 'Other Expenses', 'expense', 'Miscellaneous expenses', true)
ON CONFLICT (code) DO NOTHING;