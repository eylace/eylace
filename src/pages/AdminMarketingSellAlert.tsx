import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ShoppingBag, Plus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface SellAlert {
  id: string;
  title: string;
  message: string;
  minAmount: number;
  discountCode: string;
  isActive: boolean;
}

const AdminMarketingSellAlert = () => {
  const [alerts, setAlerts] = useState<SellAlert[]>([
    { id: '1', title: 'Spend $100 Alert', message: 'Spend $100 and get 15% off!', minAmount: 100, discountCode: 'SPEND100', isActive: true },
    { id: '2', title: 'Cart Reminder', message: 'Complete your purchase and save!', minAmount: 50, discountCode: 'SAVE50', isActive: false },
  ]);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', minAmount: 0, discountCode: '' });

  const handleCreate = () => {
    if (!form.title.trim()) return;
    setAlerts(prev => [{ id: Date.now().toString(), ...form, isActive: false }, ...prev]);
    setForm({ title: '', message: '', minAmount: 0, discountCode: '' });
    setAddOpen(false);
    toast.success('Sell alert created');
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
                  <div className="space-y-2"><Label>Min Amount ($)</Label><Input type="number" value={form.minAmount} onChange={e => setForm(p => ({ ...p, minAmount: Number(e.target.value) }))} /></div>
                  <div className="space-y-2"><Label>Coupon Code</Label><Input value={form.discountCode} onChange={e => setForm(p => ({ ...p, discountCode: e.target.value }))} /></div>
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
            <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Min Amount</TableHead><TableHead>Coupon</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {alerts.map(a => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.title}</TableCell>
                  <TableCell>${a.minAmount}</TableCell>
                  <TableCell><Badge variant="outline">{a.discountCode}</Badge></TableCell>
                  <TableCell><Switch checked={a.isActive} onCheckedChange={() => setAlerts(prev => prev.map(x => x.id === a.id ? { ...x, isActive: !x.isActive } : x))} /></TableCell>
                  <TableCell className="text-right"><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { setAlerts(prev => prev.filter(x => x.id !== a.id)); toast.success('Deleted'); }}><Trash2 className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminMarketingSellAlert;
