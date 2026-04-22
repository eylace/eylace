import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  ALL_ACCOUNTING_KEYS,
  resolveAccountingPermissions,
  type ResolvedAccountingPermissions,
  type AccountingPermissionKey,
} from '@/lib/accountingPermissions';

export interface AccountingAccount {
  id: string;
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'income' | 'expense';
  parent_id: string | null;
  description: string | null;
  opening_balance: number;
  current_balance: number;
  is_active: boolean;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface AccountingTransaction {
  id: string;
  reference_number: string;
  transaction_date: string;
  type: 'income' | 'expense' | 'transfer' | 'journal';
  account_id: string | null;
  contra_account_id: string | null;
  amount: number;
  category: string | null;
  payment_method: string | null;
  description: string | null;
  notes: string | null;
  order_id: string | null;
  is_auto_generated: boolean;
  created_at: string;
  updated_at: string;
  account?: { name: string; code: string; type: string } | null;
}

export interface AccountingInvoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  issue_date: string;
  due_date: string | null;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  amount_paid: number;
  status: 'draft' | 'sent' | 'partial' | 'paid' | 'overdue' | 'cancelled';
  items: Array<{ description: string; quantity: number; price: number }>;
  notes: string | null;
  order_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AccountingBill {
  id: string;
  bill_number: string;
  supplier_name: string;
  supplier_email: string | null;
  supplier_phone: string | null;
  category: string | null;
  bill_date: string;
  due_date: string | null;
  amount: number;
  amount_paid: number;
  status: 'draft' | 'unpaid' | 'partial' | 'paid' | 'overdue' | 'cancelled';
  payment_method: string | null;
  description: string | null;
  attachment_url: string | null;
  created_at: string;
  updated_at: string;
}

export const useAccountingAccounts = () => {
  const [accounts, setAccounts] = useState<AccountingAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await (supabase as any)
      .from('accounting_accounts')
      .select('*')
      .order('code', { ascending: true });
    if (!error && data) setAccounts(data as AccountingAccount[]);
    setIsLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { accounts, isLoading, refetch: fetch };
};

export const useAccountingTransactions = (filters?: { from?: string; to?: string; type?: string }) => {
  const [transactions, setTransactions] = useState<AccountingTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    let q = (supabase as any)
      .from('accounting_transactions')
      .select('*, account:accounting_accounts!accounting_transactions_account_id_fkey(name, code, type)')
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false });
    if (filters?.from) q = q.gte('transaction_date', filters.from);
    if (filters?.to) q = q.lte('transaction_date', filters.to);
    if (filters?.type && filters.type !== 'all') q = q.eq('type', filters.type);
    const { data, error } = await q;
    if (!error && data) setTransactions(data as AccountingTransaction[]);
    setIsLoading(false);
  }, [filters?.from, filters?.to, filters?.type]);

  useEffect(() => { fetch(); }, [fetch]);

  return { transactions, isLoading, refetch: fetch };
};

export const useAccountingInvoices = () => {
  const [invoices, setInvoices] = useState<AccountingInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await (supabase as any)
      .from('accounting_invoices')
      .select('*')
      .order('issue_date', { ascending: false });
    if (!error && data) setInvoices(data as AccountingInvoice[]);
    setIsLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { invoices, isLoading, refetch: fetch };
};

export const useAccountingBills = () => {
  const [bills, setBills] = useState<AccountingBill[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await (supabase as any)
      .from('accounting_bills')
      .select('*')
      .order('bill_date', { ascending: false });
    if (!error && data) setBills(data as AccountingBill[]);
    setIsLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { bills, isLoading, refetch: fetch };
};

export const generateRefNumber = (prefix: string) => {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${ts}-${rand}`;
};

export interface AccountingSyncLog {
  id: string;
  order_id: string | null;
  order_number: string | null;
  status: 'success' | 'skipped' | 'failed' | string;
  message: string | null;
  amount: number | null;
  account_id: string | null;
  transaction_id: string | null;
  created_at: string;
}

export const useAccountingSyncLogs = (limit = 100) => {
  const [logs, setLogs] = useState<AccountingSyncLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await (supabase as any)
      .from('accounting_sync_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (!error && data) setLogs(data as AccountingSyncLog[]);
    setIsLoading(false);
  }, [limit]);

  useEffect(() => { fetch(); }, [fetch]);

  return { logs, isLoading, refetch: fetch };
};

export interface AccountingSettings {
  auto_sync_enabled: boolean;
  revenue_account_code: string;
}

const DEFAULT_SETTINGS: AccountingSettings = {
  auto_sync_enabled: true,
  revenue_account_code: '4000',
};

export const useAccountingSettings = () => {
  const [settings, setSettings] = useState<AccountingSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'accounting_settings')
      .maybeSingle();
    if (data?.value && typeof data.value === 'object') {
      setSettings({ ...DEFAULT_SETTINGS, ...(data.value as Partial<AccountingSettings>) });
    }
    setIsLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const save = async (next: AccountingSettings) => {
    setIsSaving(true);
    const { error } = await supabase.from('system_settings').upsert({
      key: 'accounting_settings',
      value: next as any,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'key' });
    setIsSaving(false);
    if (!error) setSettings(next);
    return { error };
  };

  return { settings, isLoading, isSaving, save, refetch: fetch };
};

/** Resolve the current user's accounting permissions (role + per-user overrides). */
export const useAccountingPermissions = (): { perms: ResolvedAccountingPermissions; isLoading: boolean } => {
  const { user } = useAuth();
  const [perms, setPerms] = useState<ResolvedAccountingPermissions>({ granted: new Set(), hasFullAccess: false });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!user) {
        if (!cancelled) { setPerms({ granted: new Set(), hasFullAccess: false }); setIsLoading(false); }
        return;
      }
      const { data } = await supabase.from('user_roles').select('role').eq('user_id', user.id);
      const roles = (data || []).map((r: any) => r.role as string);
      const resolved = await resolveAccountingPermissions(user.id, roles);
      if (!cancelled) { setPerms(resolved); setIsLoading(false); }
    };
    run();
    return () => { cancelled = true; };
  }, [user]);

  return { perms, isLoading };
};

export { ALL_ACCOUNTING_KEYS };
export type { AccountingPermissionKey };