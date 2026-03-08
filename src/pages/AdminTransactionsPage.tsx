import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, Search, Loader2, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';

const AdminTransactionsPage = () => {
  const { t } = useLanguage();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.functions.invoke('admin-get-orders');
    setOrders(data?.orders || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const transactions = orders.map(o => ({
    id: o.id, orderNumber: o.order_number, customer: o.profile?.email || 'N/A',
    amount: o.total || 0, method: o.payment_method || 'Unknown',
    status: o.status === 'delivered' ? 'completed' : o.status === 'cancelled' ? 'refunded' : 'pending',
    date: o.created_at,
  }));

  const filtered = transactions.filter(tr => {
    const matchSearch = tr.orderNumber.toLowerCase().includes(search.toLowerCase()) || tr.customer.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || tr.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalCompleted = transactions.filter(tr => tr.status === 'completed').reduce((s, tr) => s + tr.amount, 0);
  const totalPending = transactions.filter(tr => tr.status === 'pending').reduce((s, tr) => s + tr.amount, 0);
  const totalRefunded = transactions.filter(tr => tr.status === 'refunded').reduce((s, tr) => s + tr.amount, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">{t('admin.completed')}</Badge>;
      case 'pending': return <Badge variant="secondary">{t('admin.pending')}</Badge>;
      case 'refunded': return <Badge variant="destructive">{t('admin.refunded')}</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <AdminLayout titleKey="admin.title.transactions" descriptionKey="admin.desc.transactions">
      {loading ? (<div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border border-border"><CardContent className="p-4 flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center"><ArrowUpRight className="h-5 w-5 text-green-500" /></div><div><p className="text-xs text-muted-foreground">{t('admin.completed')}</p><p className="text-xl font-bold text-foreground">${totalCompleted.toFixed(2)}</p></div></CardContent></Card>
            <Card className="border border-border"><CardContent className="p-4 flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center"><DollarSign className="h-5 w-5 text-muted-foreground" /></div><div><p className="text-xs text-muted-foreground">{t('admin.pending')}</p><p className="text-xl font-bold text-foreground">${totalPending.toFixed(2)}</p></div></CardContent></Card>
            <Card className="border border-border"><CardContent className="p-4 flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center"><ArrowDownRight className="h-5 w-5 text-destructive" /></div><div><p className="text-xs text-muted-foreground">{t('admin.refunded')}</p><p className="text-xl font-bold text-foreground">${totalRefunded.toFixed(2)}</p></div></CardContent></Card>
          </div>

          <Card className="border border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><CreditCard className="h-5 w-5" /> {t('admin.transactions')} ({filtered.length})</CardTitle>
              <div className="flex items-center gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('admin.all')}</SelectItem>
                    <SelectItem value="completed">{t('admin.completed')}</SelectItem>
                    <SelectItem value="pending">{t('admin.pending')}</SelectItem>
                    <SelectItem value="refunded">{t('admin.refunded')}</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder={t('admin.search')} value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-56" /></div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>{t('admin.order')}</TableHead><TableHead>{t('admin.customer')}</TableHead><TableHead>{t('admin.method')}</TableHead><TableHead>{t('admin.amount')}</TableHead><TableHead>{t('admin.status')}</TableHead><TableHead>{t('admin.date')}</TableHead></TableRow></TableHeader>
                <TableBody>
                  {filtered.map(tr => (
                    <TableRow key={tr.id}>
                      <TableCell className="font-mono text-sm">{tr.orderNumber}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{tr.customer}</TableCell>
                      <TableCell><Badge variant="outline" className="capitalize">{tr.method}</Badge></TableCell>
                      <TableCell className="font-medium">${tr.amount.toFixed(2)}</TableCell>
                      <TableCell>{getStatusBadge(tr.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{format(new Date(tr.date), 'MMM d, yyyy')}</TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (<TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">{t('admin.noTransactions')}</TableCell></TableRow>)}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminTransactionsPage;
