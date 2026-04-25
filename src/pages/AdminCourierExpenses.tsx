import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Truck, Plus, Trash2, Loader2, TrendingUp, Calendar, Package } from 'lucide-react';
import { toast } from 'sonner';

interface CourierExpense {
  id: string;
  order_id: string | null;
  order_number: string | null;
  courier_provider: string | null;
  area_zone: string | null;
  amount: number;
  expense_date: string;
  source: string;
  notes: string | null;
  created_at: string;
}

interface CourierSetting {
  id: string;
  courier_provider: string;
  area_zone: string;
  default_amount: number;
  is_active: boolean;
  notes: string | null;
}

const ZONES = [
  { value: 'inside_dhaka', label: 'Inside Dhaka' },
  { value: 'sub_city', label: 'Sub City' },
  { value: 'outside_dhaka', label: 'Outside Dhaka' },
];

const PROVIDERS = ['default', 'steadfast', 'pathao', 'shiprocket', 'redx', 'sundarban', 'manual'];

export default function AdminCourierExpenses() {
  const { formatPrice } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<CourierExpense[]>([]);
  const [settings, setSettings] = useState<CourierSetting[]>([]);
  const [summary, setSummary] = useState({
    total_expense: 0,
    delivery_count: 0,
    avg_per_delivery: 0,
    today_expense: 0,
    week_expense: 0,
    month_expense: 0,
  });
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [addOpen, setAddOpen] = useState(false);
  const [settingOpen, setSettingOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({
    order_number: '', courier_provider: 'default', area_zone: 'inside_dhaka',
    amount: '', expense_date: new Date().toISOString().slice(0, 10), notes: '',
  });
  const [newSetting, setNewSetting] = useState({
    courier_provider: 'default', area_zone: 'inside_dhaka', default_amount: '', notes: '',
  });

  const load = async () => {
    setLoading(true);
    const [expRes, setRes, sumRes] = await Promise.all([
      (supabase as any).from('courier_expenses').select('*')
        .gte('expense_date', dateFrom).lte('expense_date', dateTo)
        .order('expense_date', { ascending: false })
        .limit(500),
      (supabase as any).from('courier_expense_settings').select('*').order('courier_provider'),
      (supabase as any).rpc('courier_expense_summary', { _from: dateFrom, _to: dateTo }),
    ]);
    if (expRes.data) {
      const filtered = providerFilter === 'all' ? expRes.data : expRes.data.filter((e: CourierExpense) => e.courier_provider === providerFilter);
      setExpenses(filtered);
    }
    if (setRes.data) setSettings(setRes.data);
    if (sumRes.data?.[0]) setSummary(sumRes.data[0]);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [dateFrom, dateTo, providerFilter]);

  const addExpense = async () => {
    if (!newExpense.amount || parseFloat(newExpense.amount) <= 0) {
      toast.error('Enter a valid amount'); return;
    }
    const { error } = await (supabase as any).from('courier_expenses').insert({
      order_number: newExpense.order_number || null,
      courier_provider: newExpense.courier_provider,
      area_zone: newExpense.area_zone,
      amount: parseFloat(newExpense.amount),
      expense_date: newExpense.expense_date,
      source: 'manual',
      notes: newExpense.notes || null,
    });
    if (error) return toast.error(error.message);
    toast.success('Courier expense recorded');
    setAddOpen(false);
    setNewExpense({ ...newExpense, amount: '', notes: '', order_number: '' });
    load();
  };

  const deleteExpense = async (id: string) => {
    if (!confirm('Delete this expense?')) return;
    const { error } = await (supabase as any).from('courier_expenses').delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Deleted');
    load();
  };

  const saveSetting = async () => {
    if (!newSetting.default_amount) { toast.error('Amount required'); return; }
    const { error } = await (supabase as any).from('courier_expense_settings').upsert({
      courier_provider: newSetting.courier_provider,
      area_zone: newSetting.area_zone,
      default_amount: parseFloat(newSetting.default_amount),
      notes: newSetting.notes || null,
      is_active: true,
    }, { onConflict: 'courier_provider,area_zone' });
    if (error) return toast.error(error.message);
    toast.success('Default rate saved');
    setSettingOpen(false);
    load();
  };

  const deleteSetting = async (id: string) => {
    if (!confirm('Delete this rate?')) return;
    const { error } = await (supabase as any).from('courier_expense_settings').delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Deleted');
    load();
  };

  // Group expenses by date for daily report
  const dailyTotals = expenses.reduce((acc: Record<string, { date: string; total: number; count: number }>, e) => {
    if (!acc[e.expense_date]) acc[e.expense_date] = { date: e.expense_date, total: 0, count: 0 };
    acc[e.expense_date].total += Number(e.amount);
    acc[e.expense_date].count += 1;
    return acc;
  }, {});
  const dailyRows = Object.values(dailyTotals).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <AdminLayout title="Courier Expenses" description="Track courier delivery costs by date, provider, and zone">
      {/* Summary widgets */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Today</p>
                <p className="text-xl font-bold mt-0.5">{formatPrice(Number(summary.today_expense))}</p>
              </div>
              <Calendar className="h-7 w-7 text-accent" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Last 7 days</p>
                <p className="text-xl font-bold mt-0.5">{formatPrice(Number(summary.week_expense))}</p>
              </div>
              <TrendingUp className="h-7 w-7 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">This month</p>
                <p className="text-xl font-bold mt-0.5">{formatPrice(Number(summary.month_expense))}</p>
              </div>
              <Package className="h-7 w-7 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Avg / delivery</p>
                <p className="text-xl font-bold mt-0.5">{formatPrice(Number(summary.avg_per_delivery))}</p>
              </div>
              <Truck className="h-7 w-7 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="expenses">
        <TabsList>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="daily">Daily Report</TabsTrigger>
          <TabsTrigger value="settings">Default Rates</TabsTrigger>
        </TabsList>

        {/* Filters + Expense list */}
        <TabsContent value="expenses" className="mt-4">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Truck className="h-4 w-4" /> Expense Ledger ({expenses.length})
              </CardTitle>
              <div className="flex flex-wrap items-end gap-2">
                <div>
                  <Label className="text-[11px]">From</Label>
                  <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-8 w-36 text-xs" />
                </div>
                <div>
                  <Label className="text-[11px]">To</Label>
                  <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-8 w-36 text-xs" />
                </div>
                <div>
                  <Label className="text-[11px]">Provider</Label>
                  <Select value={providerFilter} onValueChange={setProviderFilter}>
                    <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {PROVIDERS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Dialog open={addOpen} onOpenChange={setAddOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="h-8"><Plus className="h-3.5 w-3.5 mr-1" />Add Manual</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Record Courier Expense</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                      <div><Label>Order # (optional)</Label><Input value={newExpense.order_number} onChange={e => setNewExpense({ ...newExpense, order_number: e.target.value })} /></div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Provider</Label>
                          <Select value={newExpense.courier_provider} onValueChange={v => setNewExpense({ ...newExpense, courier_provider: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>{PROVIDERS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Zone</Label>
                          <Select value={newExpense.area_zone} onValueChange={v => setNewExpense({ ...newExpense, area_zone: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>{ZONES.map(z => <SelectItem key={z.value} value={z.value}>{z.label}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><Label>Amount (৳)</Label><Input type="number" value={newExpense.amount} onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })} /></div>
                        <div><Label>Date</Label><Input type="date" value={newExpense.expense_date} onChange={e => setNewExpense({ ...newExpense, expense_date: e.target.value })} /></div>
                      </div>
                      <div><Label>Notes</Label><Input value={newExpense.notes} onChange={e => setNewExpense({ ...newExpense, notes: e.target.value })} /></div>
                    </div>
                    <DialogFooter><Button onClick={addExpense}>Save</Button></DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-accent" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Order #</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Zone</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map(e => (
                      <TableRow key={e.id}>
                        <TableCell className="text-xs">{e.expense_date}</TableCell>
                        <TableCell className="text-xs font-mono">{e.order_number || '—'}</TableCell>
                        <TableCell className="text-xs">{e.courier_provider}</TableCell>
                        <TableCell className="text-xs"><Badge variant="secondary">{e.area_zone}</Badge></TableCell>
                        <TableCell className="text-xs font-semibold">{formatPrice(Number(e.amount))}</TableCell>
                        <TableCell><Badge variant={e.source === 'manual' ? 'outline' : 'default'} className="text-[10px]">{e.source}</Badge></TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{e.notes || '—'}</TableCell>
                        <TableCell><Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteExpense(e.id)}><Trash2 className="h-3.5 w-3.5" /></Button></TableCell>
                      </TableRow>
                    ))}
                    {expenses.length === 0 && (
                      <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-sm">No courier expenses in selected range</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Daily Report */}
        <TabsContent value="daily" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Daily Totals</CardTitle></CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Deliveries</TableHead><TableHead>Total Expense</TableHead><TableHead>Avg / delivery</TableHead></TableRow></TableHeader>
                <TableBody>
                  {dailyRows.map(r => (
                    <TableRow key={r.date}>
                      <TableCell className="text-xs">{r.date}</TableCell>
                      <TableCell className="text-xs">{r.count}</TableCell>
                      <TableCell className="text-xs font-semibold">{formatPrice(r.total)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatPrice(r.total / Math.max(r.count, 1))}</TableCell>
                    </TableRow>
                  ))}
                  {dailyRows.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground text-sm">No data</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Default Rates Settings */}
        <TabsContent value="settings" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Default Rates per Provider × Zone</CardTitle>
              <Dialog open={settingOpen} onOpenChange={setSettingOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-8"><Plus className="h-3.5 w-3.5 mr-1" />Add Rate</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add / Update Rate</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Provider</Label>
                        <Select value={newSetting.courier_provider} onValueChange={v => setNewSetting({ ...newSetting, courier_provider: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{PROVIDERS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Zone</Label>
                        <Select value={newSetting.area_zone} onValueChange={v => setNewSetting({ ...newSetting, area_zone: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{ZONES.map(z => <SelectItem key={z.value} value={z.value}>{z.label}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div><Label>Default Amount (৳)</Label><Input type="number" value={newSetting.default_amount} onChange={e => setNewSetting({ ...newSetting, default_amount: e.target.value })} /></div>
                    <div><Label>Notes</Label><Input value={newSetting.notes} onChange={e => setNewSetting({ ...newSetting, notes: e.target.value })} /></div>
                  </div>
                  <DialogFooter><Button onClick={saveSetting}>Save</Button></DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Provider</TableHead><TableHead>Zone</TableHead><TableHead>Default Amount</TableHead><TableHead>Active</TableHead><TableHead>Notes</TableHead><TableHead></TableHead></TableRow></TableHeader>
                <TableBody>
                  {settings.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="text-xs">{s.courier_provider}</TableCell>
                      <TableCell className="text-xs"><Badge variant="secondary">{s.area_zone}</Badge></TableCell>
                      <TableCell className="text-xs font-semibold">{formatPrice(Number(s.default_amount))}</TableCell>
                      <TableCell><Badge variant={s.is_active ? 'default' : 'secondary'}>{s.is_active ? 'Yes' : 'No'}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{s.notes || '—'}</TableCell>
                      <TableCell><Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteSetting(s.id)}><Trash2 className="h-3.5 w-3.5" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}