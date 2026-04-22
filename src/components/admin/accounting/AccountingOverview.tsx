import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Wallet, FileText, Receipt, AlertCircle } from 'lucide-react';
import { useAccountingTransactions, useAccountingInvoices, useAccountingBills, useAccountingAccounts } from '@/hooks/useAccounting';
import { useCurrency } from '@/contexts/CurrencyContext';

export const AccountingOverview = () => {
  const { transactions, isLoading: txLoading } = useAccountingTransactions();
  const { invoices } = useAccountingInvoices();
  const { bills } = useAccountingBills();
  const { accounts } = useAccountingAccounts();
  const { format } = useCurrency();

  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const inMonth = transactions.filter(t => new Date(t.transaction_date) >= monthStart);
    const income = inMonth.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const expense = inMonth.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
    const cashAccounts = accounts.filter(a => ['1000', '1010', '1020'].includes(a.code));
    const cashBalance = cashAccounts.reduce((s, a) => s + Number(a.current_balance), 0);
    const unpaidInvoices = invoices.filter(i => ['sent', 'partial', 'overdue'].includes(i.status));
    const unpaidInvoiceAmt = unpaidInvoices.reduce((s, i) => s + (Number(i.total) - Number(i.amount_paid)), 0);
    const unpaidBills = bills.filter(b => ['unpaid', 'partial', 'overdue'].includes(b.status));
    const unpaidBillAmt = unpaidBills.reduce((s, b) => s + (Number(b.amount) - Number(b.amount_paid)), 0);
    return { income, expense, profit: income - expense, cashBalance, unpaidInvoiceAmt, unpaidInvoiceCount: unpaidInvoices.length, unpaidBillAmt, unpaidBillCount: unpaidBills.length };
  }, [transactions, invoices, bills, accounts]);

  const cards = [
    { label: 'Income (this month)', value: stats.income, icon: TrendingUp, tone: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Expense (this month)', value: stats.expense, icon: TrendingDown, tone: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/10' },
    { label: 'Net Profit', value: stats.profit, icon: Wallet, tone: stats.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400', bg: 'bg-primary/10' },
    { label: 'Cash & Bank Balance', value: stats.cashBalance, icon: Wallet, tone: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' },
    { label: `Unpaid Invoices (${stats.unpaidInvoiceCount})`, value: stats.unpaidInvoiceAmt, icon: FileText, tone: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' },
    { label: `Unpaid Bills (${stats.unpaidBillCount})`, value: stats.unpaidBillAmt, icon: Receipt, tone: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {cards.map((c, i) => (
          <Card key={i} className="border-border/50">
            <CardContent className="p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{c.label}</p>
                {txLoading ? <Skeleton className="h-7 w-24 mt-1" /> : <p className={`text-xl font-bold ${c.tone}`}>{format(c.value)}</p>}
              </div>
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${c.bg}`}>
                <c.icon className={`h-5 w-5 ${c.tone}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-accent" />
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {transactions.slice(0, 8).map(t => (
              <div key={t.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/30">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{t.description || t.reference_number}</p>
                  <p className="text-xs text-muted-foreground">{new Date(t.transaction_date).toLocaleDateString()} · {t.account?.name || t.category || '—'}</p>
                </div>
                <div className={`text-sm font-semibold tabular-nums ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {t.type === 'income' ? '+' : '-'}{format(Number(t.amount))}
                </div>
              </div>
            ))}
            {transactions.length === 0 && !txLoading && (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">No transactions yet. Delivered orders will appear here automatically.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};