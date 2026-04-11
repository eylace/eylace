import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ShoppingBag, Plus, Trash2, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface SellAlert {
  id: string;
  title: string;
  message: string | null;
  min_amount: number;
  discount_code: string | null;
  is_active: boolean;
}

const AdminMarketingSellAlert = () => {
  const [alerts, setAlerts] = useState<SellAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', min_amount: 0, discount_code: '' });

  const fetchAlerts = async () => {
    const { data, error } = await supabase.from('custom_sell_alerts').select('*').order('created_at', { ascending: false });
    if (error) console.error(error);
    else setAlerts(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAlerts(); }, []);

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    const { error } = await supabase.from('custom_sell_alerts').insert(form);
    if (error) { toast.error('Failed to create'); console.error(error); return; }
    toast.success('Sell alert created');
    setForm({ title: '', message: '', min_amount: 0, discount_code: '' });
    setAddOpen(false);
    fetchAlerts();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from('custom_sell_alerts').update({ is_active: !current }).eq('id', id);
    fetchAlerts();
  };

  const deleteAlert = async (id: string) => {
    await supabase.from('custom_sell_alerts').delete().eq('id', id);
    toast.success('Deleted');
    fetchAlerts();
  };

  return (
    <AdminLayout titleKey="admin.marketing.sellAlert" descriptionKey="admin.marketing.sellAlert">
      <Card className="border border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2"><ShoppingBag className="h-5 w-5" /> Custom Sell Alerts ({alerts.length})</CardTitle>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> New Sell Alert</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Sell Alert</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Message</Label><Input value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Min Amount ($)</Label><Input type="number" value={form.min_amount} onChange={e => setForm(p => ({ ...p, min_amount: Number(e.target.value) }))} /></div>
                  <div className="space-y-2"><Label>Coupon Code</Label><Input value={form.discount_code} onChange={e => setForm(p => ({ ...p, discount_code: e.target.value }))} /></div>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button onClick={handleCreate}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Min Amount</TableHead><TableHead>Coupon</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {alerts.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No sell alerts yet</TableCell></TableRow>
                ) : alerts.map(a => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.title}</TableCell>
                    <TableCell>৳{a.min_amount}</TableCell>
                    <TableCell><Badge variant="outline">{a.discount_code || '—'}</Badge></TableCell>
                    <TableCell><Switch checked={a.is_active} onCheckedChange={() => toggleActive(a.id, a.is_active)} /></TableCell>
                    <TableCell className="text-right"><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteAlert(a.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminMarketingSellAlert;
