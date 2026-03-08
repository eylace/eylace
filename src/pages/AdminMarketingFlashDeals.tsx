import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Zap, Plus, Trash2, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

interface FlashDeal {
  id: string;
  title: string;
  discount: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  products: number;
}

const AdminMarketingFlashDeals = () => {
  const [deals, setDeals] = useState<FlashDeal[]>([
    { id: '1', title: 'Weekend Flash Sale', discount: 30, startDate: '2026-03-08', endDate: '2026-03-10', isActive: true, products: 25 },
    { id: '2', title: 'Monday Madness', discount: 50, startDate: '2026-03-11', endDate: '2026-03-11', isActive: false, products: 10 },
  ]);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ title: '', discount: 20, startDate: '', endDate: '' });

  const handleCreate = () => {
    if (!form.title.trim()) return;
    setDeals(prev => [{ id: Date.now().toString(), ...form, isActive: false, products: 0 }, ...prev]);
    setForm({ title: '', discount: 20, startDate: '', endDate: '' });
    setAddOpen(false);
    toast.success('Flash deal created');
  };

  const toggleActive = (id: string) => {
    setDeals(prev => prev.map(d => d.id === id ? { ...d, isActive: !d.isActive } : d));
  };

  const deleteDeal = (id: string) => {
    setDeals(prev => prev.filter(d => d.id !== id));
    toast.success('Flash deal deleted');
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
              {deals.map(d => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.title}</TableCell>
                  <TableCell><Badge variant="secondary">{d.discount}% OFF</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{d.startDate} → {d.endDate}</TableCell>
                  <TableCell>{d.products}</TableCell>
                  <TableCell><Switch checked={d.isActive} onCheckedChange={() => toggleActive(d.id)} /></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteDeal(d.id)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminMarketingFlashDeals;
