import { useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Settings {
  enabled: boolean;
  mode: 'flat' | 'zone' | 'percent';
  flat_amount: number;
  zone_amounts: { inside_dhaka: number; sub_city: number; outside_dhaka: number };
  percent_of_shipping: number;
  gateways: string[];
}

const DEFAULTS: Settings = {
  enabled: true,
  mode: 'flat',
  flat_amount: 100,
  zone_amounts: { inside_dhaka: 80, sub_city: 100, outside_dhaka: 150 },
  percent_of_shipping: 100,
  gateways: ['bkash', 'nagad'],
};

interface Payment {
  id: string;
  order_id: string | null;
  gateway: string;
  txn_ref: string;
  gateway_payment_id: string | null;
  amount: number;
  status: string;
  created_at: string;
  completed_at: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  initiated: 'bg-muted text-muted-foreground',
  pending: 'bg-yellow-500/15 text-yellow-700',
  success: 'bg-emerald-500/15 text-emerald-700',
  failed: 'bg-destructive/15 text-destructive',
  cancelled: 'bg-muted text-muted-foreground',
};

const AdminCourierAdvancePayments = () => {
  const [tab, setTab] = useState('settings');
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filter, setFilter] = useState({ status: 'all', gateway: 'all', search: '' });

  const load = async () => {
    setLoading(true);
    const [{ data: s }, { data: p }] = await Promise.all([
      supabase.from('system_settings').select('value').eq('key', 'courier_advance_settings').limit(1),
      supabase
        .from('courier_advance_payments')
        .select('id,order_id,gateway,txn_ref,gateway_payment_id,amount,status,created_at,completed_at')
        .order('created_at', { ascending: false })
        .limit(500),
    ]);
    if (s?.[0]?.value) setSettings({ ...DEFAULTS, ...(s[0].value as any) });
    if (p) setPayments(p as Payment[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('system_settings')
      .upsert({ key: 'courier_advance_settings', value: settings as any }, { onConflict: 'key' });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success('Settings saved');
  };

  const filtered = useMemo(() => payments.filter((p) => {
    if (filter.status !== 'all' && p.status !== filter.status) return false;
    if (filter.gateway !== 'all' && p.gateway !== filter.gateway) return false;
    if (filter.search && !`${p.txn_ref} ${p.gateway_payment_id ?? ''}`.toLowerCase().includes(filter.search.toLowerCase())) return false;
    return true;
  }), [payments, filter]);

  return (
    <AdminLayout titleKey="admin.courierAdvancePayments">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Courier Advance Payments</h1>
          <p className="text-muted-foreground text-sm">Configure advance courier charge collection and audit transactions.</p>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="audit">Audit Log ({payments.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Advance Charge Configuration</CardTitle>
                <CardDescription>How much customers should pay online when choosing Cash on Delivery.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Enabled</Label>
                    <p className="text-xs text-muted-foreground">Show "Pay courier charge in advance" option in checkout.</p>
                  </div>
                  <Switch checked={settings.enabled} onCheckedChange={(v) => setSettings({ ...settings, enabled: v })} />
                </div>

                <div className="space-y-2">
                  <Label>Calculation mode</Label>
                  <Select value={settings.mode} onValueChange={(v) => setSettings({ ...settings, mode: v as Settings['mode'] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="flat">Flat amount</SelectItem>
                      <SelectItem value="zone">Per-zone amount</SelectItem>
                      <SelectItem value="percent">Percent of shipping</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {settings.mode === 'flat' && (
                  <div className="space-y-2 max-w-xs">
                    <Label>Flat amount (BDT)</Label>
                    <Input type="number" min={0} value={settings.flat_amount}
                      onChange={(e) => setSettings({ ...settings, flat_amount: Number(e.target.value) })} />
                  </div>
                )}

                {settings.mode === 'zone' && (
                  <div className="grid sm:grid-cols-3 gap-3">
                    {(['inside_dhaka', 'sub_city', 'outside_dhaka'] as const).map((z) => (
                      <div key={z} className="space-y-2">
                        <Label className="capitalize">{z.replace('_', ' ')}</Label>
                        <Input type="number" min={0} value={settings.zone_amounts[z]}
                          onChange={(e) => setSettings({
                            ...settings,
                            zone_amounts: { ...settings.zone_amounts, [z]: Number(e.target.value) },
                          })} />
                      </div>
                    ))}
                  </div>
                )}

                {settings.mode === 'percent' && (
                  <div className="space-y-2 max-w-xs">
                    <Label>Percent of shipping (%)</Label>
                    <Input type="number" min={0} max={100} value={settings.percent_of_shipping}
                      onChange={(e) => setSettings({ ...settings, percent_of_shipping: Number(e.target.value) })} />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Enabled gateways</Label>
                  <div className="flex gap-3">
                    {['bkash', 'nagad'].map((g) => {
                      const on = settings.gateways.includes(g);
                      return (
                        <label key={g} className="flex items-center gap-2 px-3 py-1.5 border rounded-md cursor-pointer">
                          <Switch checked={on} onCheckedChange={(v) => setSettings({
                            ...settings,
                            gateways: v ? [...new Set([...settings.gateways, g])] : settings.gateways.filter((x) => x !== g),
                          })} />
                          <span className="text-sm capitalize">{g}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <Button onClick={save} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Transactions</CardTitle>
                <CardDescription>All advance courier payment attempts.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid sm:grid-cols-3 gap-2">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-2 top-2.5 text-muted-foreground" />
                    <Input placeholder="Search ref / payment ID" className="pl-8"
                      value={filter.search} onChange={(e) => setFilter({ ...filter, search: e.target.value })} />
                  </div>
                  <Select value={filter.status} onValueChange={(v) => setFilter({ ...filter, status: v })}>
                    <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      {['initiated', 'pending', 'success', 'failed', 'cancelled'].map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filter.gateway} onValueChange={(v) => setFilter({ ...filter, gateway: v })}>
                    <SelectTrigger><SelectValue placeholder="Gateway" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All gateways</SelectItem>
                      <SelectItem value="bkash">bKash</SelectItem>
                      <SelectItem value="nagad">Nagad</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Created</TableHead>
                        <TableHead>Gateway</TableHead>
                        <TableHead>Txn Ref</TableHead>
                        <TableHead>Gateway Payment ID</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Order</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow><TableCell colSpan={7} className="text-center py-6"><Loader2 className="h-4 w-4 animate-spin inline" /></TableCell></TableRow>
                      ) : filtered.length === 0 ? (
                        <TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground text-sm">No payments yet.</TableCell></TableRow>
                      ) : filtered.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="text-xs">{new Date(p.created_at).toLocaleString()}</TableCell>
                          <TableCell className="capitalize">{p.gateway}</TableCell>
                          <TableCell className="font-mono text-xs">{p.txn_ref}</TableCell>
                          <TableCell className="font-mono text-xs">{p.gateway_payment_id || '—'}</TableCell>
                          <TableCell>৳{Number(p.amount).toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge className={STATUS_COLORS[p.status] || ''} variant="secondary">{p.status}</Badge>
                          </TableCell>
                          <TableCell className="text-xs">{p.order_id?.slice(0, 8) || '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminCourierAdvancePayments;