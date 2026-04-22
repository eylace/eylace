import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, FileText, Receipt, BookOpen, BarChart3, LayoutDashboard, Loader2, Download, Settings as SettingsIcon, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router-dom';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useAccountingAccounts, useAccountingTransactions, useAccountingInvoices, useAccountingBills, useAccountingPermissions, generateRefNumber } from '@/hooks/useAccounting';
import { AccountingOverview } from '@/components/admin/accounting/AccountingOverview';
import { JournalEntriesTab } from '@/components/admin/accounting/JournalEntriesTab';
import { AccountingSettingsTab } from '@/components/admin/accounting/AccountingSettingsTab';
import { exportToCSV } from '@/lib/csvExport';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ACCOUNT_TYPES = ['asset', 'liability', 'equity', 'income', 'expense'] as const;

const AccountsTab = () => {
  const { accounts, isLoading, refetch } = useAccountingAccounts();
  const { formatPrice } = useCurrency();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ code: '', name: '', type: 'expense', description: '', opening_balance: 0 });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!form.code || !form.name) return toast.error('Code and name required');
    setSaving(true);
    const { error } = await (supabase as any).from('accounting_accounts').insert({ ...form, current_balance: form.opening_balance });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success('Account created');
    setOpen(false);
    setForm({ code: '', name: '', type: 'expense', description: '', opening_balance: 0 });
    refetch();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this account?')) return;
    const { error } = await (supabase as any).from('accounting_accounts').delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Deleted');
    refetch();
  };

  const typeColors: Record<string, string> = {
    asset: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
    liability: 'bg-orange-500/10 text-orange-700 dark:text-orange-300',
    equity: 'bg-purple-500/10 text-purple-700 dark:text-purple-300',
    income: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    expense: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">Chart of Accounts</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm" variant="accent"><Plus className="h-4 w-4 mr-1" />New Account</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Account</DialogTitle></DialogHeader>
            <div className="space-y-3 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Code</Label><Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="6000" /></div>
                <div><Label>Type</Label>
                  <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{ACCOUNT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Opening Balance</Label><Input type="number" value={form.opening_balance} onChange={e => setForm({ ...form, opening_balance: Number(e.target.value) })} /></div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            </div>
            <DialogFooter><Button onClick={submit} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead className="text-right">Balance</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={5} className="text-center py-6"><Loader2 className="h-4 w-4 animate-spin inline" /></TableCell></TableRow>}
            {accounts.map(a => (
              <TableRow key={a.id}>
                <TableCell className="font-mono text-xs">{a.code}</TableCell>
                <TableCell className="text-sm">{a.name}{a.is_system && <span className="ml-2 text-[10px] text-muted-foreground">system</span>}</TableCell>
                <TableCell><Badge variant="outline" className={typeColors[a.type]}>{a.type}</Badge></TableCell>
                <TableCell className="text-right tabular-nums text-sm">{formatPrice(Number(a.current_balance))}</TableCell>
                <TableCell className="w-16">{!a.is_system && <Button size="icon" variant="ghost" onClick={() => remove(a.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

const TransactionsTab = () => {
  const { transactions, isLoading, refetch } = useAccountingTransactions();
  const { accounts } = useAccountingAccounts();
  const { formatPrice } = useCurrency();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ type: 'expense', account_id: '', amount: 0, transaction_date: new Date().toISOString().slice(0, 10), category: '', payment_method: 'cash', description: '' });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!form.account_id || !form.amount) return toast.error('Account & amount required');
    setSaving(true);
    const { error } = await (supabase as any).from('accounting_transactions').insert({ ...form, reference_number: generateRefNumber('TX') });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success('Transaction recorded');
    setOpen(false);
    setForm({ type: 'expense', account_id: '', amount: 0, transaction_date: new Date().toISOString().slice(0, 10), category: '', payment_method: 'cash', description: '' });
    refetch();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this transaction?')) return;
    const { error } = await (supabase as any).from('accounting_transactions').delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Deleted'); refetch();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">Transactions / Journal Entries</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm" variant="accent"><Plus className="h-4 w-4 mr-1" />New Entry</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Record Transaction</DialogTitle></DialogHeader>
            <div className="space-y-3 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Type</Label>
                  <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Income</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                      <SelectItem value="transfer">Transfer</SelectItem>
                      <SelectItem value="journal">Journal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Date</Label><Input type="date" value={form.transaction_date} onChange={e => setForm({ ...form, transaction_date: e.target.value })} /></div>
              </div>
              <div><Label>Account</Label>
                <Select value={form.account_id} onValueChange={v => setForm({ ...form, account_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                  <SelectContent className="max-h-60">
                    {accounts.filter(a => a.type === form.type || form.type === 'transfer' || form.type === 'journal').map(a => (
                      <SelectItem key={a.id} value={a.id}>{a.code} — {a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Amount</Label><Input type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} /></div>
                <div><Label>Payment Method</Label><Input value={form.payment_method} onChange={e => setForm({ ...form, payment_method: e.target.value })} placeholder="cash, bkash, bank" /></div>
              </div>
              <div><Label>Category</Label><Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} /></div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            </div>
            <DialogFooter><Button onClick={submit} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Reference</TableHead><TableHead>Type</TableHead><TableHead>Account</TableHead><TableHead>Description</TableHead><TableHead className="text-right">Amount</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={7} className="text-center py-6"><Loader2 className="h-4 w-4 animate-spin inline" /></TableCell></TableRow>}
            {transactions.map(t => (
              <TableRow key={t.id}>
                <TableCell className="text-xs">{new Date(t.transaction_date).toLocaleDateString()}</TableCell>
                <TableCell className="font-mono text-[11px] text-muted-foreground">{t.reference_number}{t.is_auto_generated && <Badge variant="outline" className="ml-1 text-[9px] py-0">auto</Badge>}</TableCell>
                <TableCell><Badge variant="outline" className={t.type === 'income' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-rose-500/10 text-rose-700 dark:text-rose-300'}>{t.type}</Badge></TableCell>
                <TableCell className="text-xs">{t.account?.name || '—'}</TableCell>
                <TableCell className="text-xs max-w-xs truncate">{t.description}</TableCell>
                <TableCell className={`text-right tabular-nums text-sm font-medium ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>{t.type === 'income' ? '+' : '-'}{formatPrice(Number(t.amount))}</TableCell>
                <TableCell><Button size="icon" variant="ghost" onClick={() => remove(t.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button></TableCell>
              </TableRow>
            ))}
            {transactions.length === 0 && !isLoading && <TableRow><TableCell colSpan={7} className="text-center py-8 text-sm text-muted-foreground">No transactions yet</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

const InvoicesTab = () => {
  const { invoices, isLoading, refetch } = useAccountingInvoices();
  const { formatPrice } = useCurrency();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ customer_name: '', customer_email: '', customer_phone: '', issue_date: new Date().toISOString().slice(0, 10), due_date: '', subtotal: 0, tax: 0, discount: 0, status: 'draft', notes: '' });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!form.customer_name) return toast.error('Customer name required');
    setSaving(true);
    const total = Number(form.subtotal) + Number(form.tax) - Number(form.discount);
    const payload: any = { ...form, invoice_number: generateRefNumber('INV'), total };
    if (!payload.due_date) delete payload.due_date;
    const { error } = await (supabase as any).from('accounting_invoices').insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success('Invoice created'); setOpen(false); refetch();
    setForm({ customer_name: '', customer_email: '', customer_phone: '', issue_date: new Date().toISOString().slice(0, 10), due_date: '', subtotal: 0, tax: 0, discount: 0, status: 'draft', notes: '' });
  };

  const updateStatus = async (id: string, status: string) => {
    const updates: any = { status };
    if (status === 'paid') {
      const inv = invoices.find(i => i.id === id);
      if (inv) updates.amount_paid = Number(inv.total);
    }
    const { error } = await (supabase as any).from('accounting_invoices').update(updates).eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Updated'); refetch();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete invoice?')) return;
    const { error } = await (supabase as any).from('accounting_invoices').delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Deleted'); refetch();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">Customer Invoices</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm" variant="accent"><Plus className="h-4 w-4 mr-1" />New Invoice</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Invoice</DialogTitle></DialogHeader>
            <div className="space-y-3 py-2">
              <div><Label>Customer Name</Label><Input value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Email</Label><Input value={form.customer_email} onChange={e => setForm({ ...form, customer_email: e.target.value })} /></div>
                <div><Label>Phone</Label><Input value={form.customer_phone} onChange={e => setForm({ ...form, customer_phone: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Issue Date</Label><Input type="date" value={form.issue_date} onChange={e => setForm({ ...form, issue_date: e.target.value })} /></div>
                <div><Label>Due Date</Label><Input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Subtotal</Label><Input type="number" value={form.subtotal} onChange={e => setForm({ ...form, subtotal: Number(e.target.value) })} /></div>
                <div><Label>Tax</Label><Input type="number" value={form.tax} onChange={e => setForm({ ...form, tax: Number(e.target.value) })} /></div>
                <div><Label>Discount</Label><Input type="number" value={form.discount} onChange={e => setForm({ ...form, discount: Number(e.target.value) })} /></div>
              </div>
              <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
            </div>
            <DialogFooter><Button onClick={submit} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>Invoice #</TableHead><TableHead>Customer</TableHead><TableHead>Date</TableHead><TableHead>Total</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={6} className="text-center py-6"><Loader2 className="h-4 w-4 animate-spin inline" /></TableCell></TableRow>}
            {invoices.map(i => (
              <TableRow key={i.id}>
                <TableCell className="font-mono text-xs">{i.invoice_number}</TableCell>
                <TableCell className="text-sm">{i.customer_name}</TableCell>
                <TableCell className="text-xs">{new Date(i.issue_date).toLocaleDateString()}</TableCell>
                <TableCell className="tabular-nums text-sm">{formatPrice(Number(i.total))}</TableCell>
                <TableCell>
                  <Select value={i.status} onValueChange={v => updateStatus(i.id, v)}>
                    <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell><Button size="icon" variant="ghost" onClick={() => remove(i.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button></TableCell>
              </TableRow>
            ))}
            {invoices.length === 0 && !isLoading && <TableRow><TableCell colSpan={6} className="text-center py-8 text-sm text-muted-foreground">No invoices yet</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

const BillsTab = () => {
  const { bills, isLoading, refetch } = useAccountingBills();
  const { formatPrice } = useCurrency();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ supplier_name: '', supplier_email: '', category: '', bill_date: new Date().toISOString().slice(0, 10), due_date: '', amount: 0, status: 'unpaid', payment_method: '', description: '' });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!form.supplier_name || !form.amount) return toast.error('Supplier and amount required');
    setSaving(true);
    const payload: any = { ...form, bill_number: generateRefNumber('BILL') };
    if (!payload.due_date) delete payload.due_date;
    const { error } = await (supabase as any).from('accounting_bills').insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success('Bill recorded'); setOpen(false); refetch();
    setForm({ supplier_name: '', supplier_email: '', category: '', bill_date: new Date().toISOString().slice(0, 10), due_date: '', amount: 0, status: 'unpaid', payment_method: '', description: '' });
  };

  const updateStatus = async (id: string, status: string) => {
    const updates: any = { status };
    if (status === 'paid') {
      const b = bills.find(x => x.id === id);
      if (b) updates.amount_paid = Number(b.amount);
    }
    const { error } = await (supabase as any).from('accounting_bills').update(updates).eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Updated'); refetch();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete bill?')) return;
    const { error } = await (supabase as any).from('accounting_bills').delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Deleted'); refetch();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">Supplier Bills</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm" variant="accent"><Plus className="h-4 w-4 mr-1" />New Bill</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Record Bill</DialogTitle></DialogHeader>
            <div className="space-y-3 py-2">
              <div><Label>Supplier Name</Label><Input value={form.supplier_name} onChange={e => setForm({ ...form, supplier_name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Email</Label><Input value={form.supplier_email} onChange={e => setForm({ ...form, supplier_email: e.target.value })} /></div>
                <div><Label>Category</Label><Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Bill Date</Label><Input type="date" value={form.bill_date} onChange={e => setForm({ ...form, bill_date: e.target.value })} /></div>
                <div><Label>Due Date</Label><Input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Amount</Label><Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} /></div>
                <div><Label>Payment Method</Label><Input value={form.payment_method} onChange={e => setForm({ ...form, payment_method: e.target.value })} /></div>
              </div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            </div>
            <DialogFooter><Button onClick={submit} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>Bill #</TableHead><TableHead>Supplier</TableHead><TableHead>Category</TableHead><TableHead>Date</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={7} className="text-center py-6"><Loader2 className="h-4 w-4 animate-spin inline" /></TableCell></TableRow>}
            {bills.map(b => (
              <TableRow key={b.id}>
                <TableCell className="font-mono text-xs">{b.bill_number}</TableCell>
                <TableCell className="text-sm">{b.supplier_name}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{b.category || '—'}</TableCell>
                <TableCell className="text-xs">{new Date(b.bill_date).toLocaleDateString()}</TableCell>
                <TableCell className="tabular-nums text-sm">{formatPrice(Number(b.amount))}</TableCell>
                <TableCell>
                  <Select value={b.status} onValueChange={v => updateStatus(b.id, v)}>
                    <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell><Button size="icon" variant="ghost" onClick={() => remove(b.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button></TableCell>
              </TableRow>
            ))}
            {bills.length === 0 && !isLoading && <TableRow><TableCell colSpan={7} className="text-center py-8 text-sm text-muted-foreground">No bills yet</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

const ReportsTab = () => {
  const [from, setFrom] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10));
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const { transactions } = useAccountingTransactions({ from, to });
  const { accounts } = useAccountingAccounts();
  const { formatPrice } = useCurrency();

  const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  const profit = income - expense;

  const grouped = (type: string) => {
    const map = new Map<string, number>();
    transactions.filter(t => t.type === type).forEach(t => {
      const key = t.account?.name || t.category || 'Uncategorized';
      map.set(key, (map.get(key) || 0) + Number(t.amount));
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  };

  const assets = accounts.filter(a => a.type === 'asset').reduce((s, a) => s + Number(a.current_balance), 0);
  const liabilities = accounts.filter(a => a.type === 'liability').reduce((s, a) => s + Number(a.current_balance), 0);
  const equity = accounts.filter(a => a.type === 'equity').reduce((s, a) => s + Number(a.current_balance), 0);

  const exportCSV = (kind: 'pl' | 'bs' | 'cf') => {
    if (kind === 'pl') {
      const rows = [
        ...grouped('income').map(([k, v]) => ({ section: 'Income', account: k, amount: v })),
        { section: 'Income', account: 'Total Income', amount: income },
        ...grouped('expense').map(([k, v]) => ({ section: 'Expense', account: k, amount: v })),
        { section: 'Expense', account: 'Total Expense', amount: expense },
        { section: 'Summary', account: 'Net Profit', amount: profit },
      ];
      exportToCSV(rows, [{ key: 'section', label: 'Section' }, { key: 'account', label: 'Account' }, { key: 'amount', label: 'Amount' }], `profit-loss-${from}-to-${to}`);
    } else if (kind === 'bs') {
      const rows = [
        { item: 'Total Assets', amount: assets },
        { item: 'Total Liabilities', amount: liabilities },
        { item: 'Total Equity', amount: equity },
        { item: 'Net Worth', amount: assets - liabilities },
      ];
      exportToCSV(rows, [{ key: 'item', label: 'Item' }, { key: 'amount', label: 'Amount' }], `balance-sheet-${to}`);
    } else {
      const rows = [
        { item: 'Cash Inflow', amount: income },
        { item: 'Cash Outflow', amount: expense },
        { item: 'Net Cash Flow', amount: profit },
      ];
      exportToCSV(rows, [{ key: 'item', label: 'Item' }, { key: 'amount', label: 'Amount' }], `cash-flow-${from}-to-${to}`);
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Accounting Reports', 14, 16);
    doc.setFontSize(10);
    doc.text(`Period: ${from} to ${to}`, 14, 22);

    autoTable(doc, {
      startY: 28,
      head: [['Profit & Loss', 'Amount']],
      body: [
        ...grouped('income').map(([k, v]) => [`Income — ${k}`, formatPrice(v)]),
        ['Total Income', formatPrice(income)],
        ...grouped('expense').map(([k, v]) => [`Expense — ${k}`, formatPrice(v)]),
        ['Total Expense', formatPrice(expense)],
        ['Net Profit', formatPrice(profit)],
      ],
      styles: { fontSize: 9 },
    });

    autoTable(doc, {
      head: [['Balance Sheet', 'Amount']],
      body: [
        ['Total Assets', formatPrice(assets)],
        ['Total Liabilities', formatPrice(liabilities)],
        ['Total Equity', formatPrice(equity)],
        ['Net Worth', formatPrice(assets - liabilities)],
      ],
      styles: { fontSize: 9 },
    });

    autoTable(doc, {
      head: [['Cash Flow', 'Amount']],
      body: [
        ['Inflow', formatPrice(income)],
        ['Outflow', formatPrice(expense)],
        ['Net Cash Flow', formatPrice(profit)],
      ],
      styles: { fontSize: 9 },
    });

    doc.save(`accounting-reports-${from}-to-${to}.pdf`);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 flex flex-wrap items-end gap-3 justify-between">
          <div className="flex flex-wrap items-end gap-3">
          <div><Label className="text-xs">From</Label><Input type="date" value={from} onChange={e => setFrom(e.target.value)} className="w-40" /></div>
          <div><Label className="text-xs">To</Label><Input type="date" value={to} onChange={e => setTo(e.target.value)} className="w-40" /></div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => exportCSV('pl')}><Download className="h-3.5 w-3.5 mr-1" />P&L CSV</Button>
            <Button variant="outline" size="sm" onClick={() => exportCSV('bs')}><Download className="h-3.5 w-3.5 mr-1" />Balance CSV</Button>
            <Button variant="outline" size="sm" onClick={() => exportCSV('cf')}><Download className="h-3.5 w-3.5 mr-1" />Cash Flow CSV</Button>
            <Button size="sm" onClick={exportPDF}><Download className="h-3.5 w-3.5 mr-1" />All as PDF</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Profit & Loss</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs uppercase text-muted-foreground mb-1">Income</p>
              {grouped('income').map(([k, v]) => <div key={k} className="flex justify-between text-sm py-0.5"><span>{k}</span><span className="tabular-nums text-emerald-600 dark:text-emerald-400">{formatPrice(v)}</span></div>)}
              <div className="flex justify-between font-semibold pt-1 border-t mt-1"><span>Total Income</span><span className="tabular-nums">{formatPrice(income)}</span></div>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground mb-1">Expenses</p>
              {grouped('expense').map(([k, v]) => <div key={k} className="flex justify-between text-sm py-0.5"><span>{k}</span><span className="tabular-nums text-rose-600 dark:text-rose-400">{formatPrice(v)}</span></div>)}
              <div className="flex justify-between font-semibold pt-1 border-t mt-1"><span>Total Expenses</span><span className="tabular-nums">{formatPrice(expense)}</span></div>
            </div>
            <div className="flex justify-between font-bold text-base pt-2 border-t-2"><span>Net Profit</span><span className={`tabular-nums ${profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>{formatPrice(profit)}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Balance Sheet (Current)</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm"><span>Total Assets</span><span className="tabular-nums font-medium">{formatPrice(assets)}</span></div>
            <div className="flex justify-between text-sm"><span>Total Liabilities</span><span className="tabular-nums font-medium">{formatPrice(liabilities)}</span></div>
            <div className="flex justify-between text-sm"><span>Total Equity</span><span className="tabular-nums font-medium">{formatPrice(equity)}</span></div>
            <div className="flex justify-between font-bold pt-2 border-t"><span>Net Worth</span><span className="tabular-nums">{formatPrice(assets - liabilities)}</span></div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Cash Flow Summary</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 rounded-lg bg-emerald-500/10"><p className="text-xs text-muted-foreground">Inflow</p><p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{formatPrice(income)}</p></div>
            <div className="text-center p-3 rounded-lg bg-rose-500/10"><p className="text-xs text-muted-foreground">Outflow</p><p className="text-lg font-bold text-rose-600 dark:text-rose-400 tabular-nums">{formatPrice(expense)}</p></div>
            <div className="text-center p-3 rounded-lg bg-primary/10"><p className="text-xs text-muted-foreground">Net Cash Flow</p><p className={`text-lg font-bold tabular-nums ${profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>{formatPrice(profit)}</p></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const AdminAccounting = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'overview';
  const validTabs = ['overview', 'accounts', 'transactions', 'invoices', 'bills', 'reports'];
  const activeTab = validTabs.includes(tab) ? tab : 'overview';
  return (
    <AdminLayout title="Accounting Management" description="Financial records, transactions, invoices, bills and reports">
      <Tabs value={activeTab} onValueChange={(v) => setSearchParams({ tab: v })} className="space-y-4">
        <TabsList className="bg-card border h-auto p-1 flex-wrap">
          <TabsTrigger value="overview" className="gap-1.5"><LayoutDashboard className="h-3.5 w-3.5" />Overview</TabsTrigger>
          <TabsTrigger value="accounts" className="gap-1.5"><BookOpen className="h-3.5 w-3.5" />Chart of Accounts</TabsTrigger>
          <TabsTrigger value="transactions" className="gap-1.5"><Receipt className="h-3.5 w-3.5" />Transactions</TabsTrigger>
          <TabsTrigger value="invoices" className="gap-1.5"><FileText className="h-3.5 w-3.5" />Invoices</TabsTrigger>
          <TabsTrigger value="bills" className="gap-1.5"><Receipt className="h-3.5 w-3.5" />Bills</TabsTrigger>
          <TabsTrigger value="reports" className="gap-1.5"><BarChart3 className="h-3.5 w-3.5" />Reports</TabsTrigger>
        </TabsList>
        <TabsContent value="overview"><AccountingOverview /></TabsContent>
        <TabsContent value="accounts"><AccountsTab /></TabsContent>
        <TabsContent value="transactions"><TransactionsTab /></TabsContent>
        <TabsContent value="invoices"><InvoicesTab /></TabsContent>
        <TabsContent value="bills"><BillsTab /></TabsContent>
        <TabsContent value="reports"><ReportsTab /></TabsContent>
      </Tabs>
    </AdminLayout>
  );
};

export default AdminAccounting;