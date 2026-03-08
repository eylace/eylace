import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Zap, Plus, Trash2, Clock, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface FlashDeal {
  id: string;
  title: string;
  discount: number;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  products: number;
}

const AdminMarketingFlashDeals = () => {
  const [deals, setDeals] = useState<FlashDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ title: '', discount: 20, startDate: '', endDate: '' });

  const fetchDeals = async () => {
    const { data, error } = await supabase.from('flash_deals').select('*').order('created_at', { ascending: false });
    if (error) { toast.error('Failed to load flash deals'); console.error(error); }
    else setDeals(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchDeals(); }, []);

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    const { error } = await supabase.from('flash_deals').insert({
      title: form.title,
      discount: form.discount,
      start_date: form.startDate || null,
      end_date: form.endDate || null,
    });
    if (error) { toast.error('Failed to create'); console.error(error); return; }
    toast.success('Flash deal created');
    setForm({ title: '', discount: 20, startDate: '', endDate: '' });
    setAddOpen(false);
    fetchDeals();
  };

  const toggleActive = async (id: string, current: boolean) => {
    const { error } = await supabase.from('flash_deals').update({ is_active: !current }).eq('id', id);
    if (error) { toast.error('Failed to update'); return; }
    toast.success('Status updated');
    fetchDeals();
  };

  const deleteDeal = async (id: string) => {
    const { error } = await supabase.from('flash_deals').delete().eq('id', id);
    if (error) { toast.error('Failed to delete'); return; }
    toast.success('Flash deal deleted');
    fetchDeals();
  };

  return (
    <AdminLayout titleKey="admin.marketing.flashDeals" descriptionKey="admin.marketing.flashDeals">
      <Card className="border border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2"><Zap className="h-5 w-5" /> Flash Deals ({deals.length})</CardTitle>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> New Flash Deal</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Flash Deal</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Weekend Flash Sale" /></div>
                <div className="space-y-2"><Label>Discount %</Label><Input type="number" value={form.discount} onChange={e => setForm(p => ({ ...p, discount: Number(e.target.value) }))} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>End Date</Label><Input type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} /></div>
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
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deals.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No flash deals yet</TableCell></TableRow>
                ) : deals.map(d => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.title}</TableCell>
                    <TableCell><Badge variant="secondary">{d.discount}% OFF</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground"><span className="flex items-center gap-1"><Clock className="h-3 w-3" />{d.start_date?.split('T')[0] || '—'} → {d.end_date?.split('T')[0] || '—'}</span></TableCell>
                    <TableCell>{d.products}</TableCell>
                    <TableCell><Switch checked={d.is_active} onCheckedChange={() => toggleActive(d.id, d.is_active)} /></TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteDeal(d.id)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
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

export default AdminMarketingFlashDeals;
