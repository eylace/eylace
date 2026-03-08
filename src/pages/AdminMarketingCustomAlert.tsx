import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface CustomAlert {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  placement: 'top' | 'bottom' | 'modal';
  isActive: boolean;
}

const AdminMarketingCustomAlert = () => {
  const [alerts, setAlerts] = useState<CustomAlert[]>([
    { id: '1', title: 'Maintenance Notice', message: 'Scheduled maintenance on March 15', type: 'warning', placement: 'top', isActive: true },
    { id: '2', title: 'Free Shipping', message: 'Free shipping on all orders today!', type: 'success', placement: 'top', isActive: false },
  ]);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', type: 'info' as CustomAlert['type'], placement: 'top' as CustomAlert['placement'] });

  const handleCreate = () => {
    if (!form.title.trim()) return;
    setAlerts(prev => [{ id: Date.now().toString(), ...form, isActive: false }, ...prev]);
    setForm({ title: '', message: '', type: 'info', placement: 'top' });
    setAddOpen(false);
    toast.success('Alert created');
  };

  const typeColors: Record<string, string> = { info: 'bg-blue-500/10 text-blue-600', warning: 'bg-orange-500/10 text-orange-600', success: 'bg-green-500/10 text-green-600', error: 'bg-red-500/10 text-red-600' };

  return (
    <AdminLayout titleKey="admin.marketing.customAlert" descriptionKey="admin.marketing.customAlert">
      <Card className="border border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> Custom Alerts ({alerts.length})</CardTitle>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> New Alert</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Custom Alert</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Message</Label><Textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v as CustomAlert['type'] }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="info">Info</SelectItem><SelectItem value="warning">Warning</SelectItem><SelectItem value="success">Success</SelectItem><SelectItem value="error">Error</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Placement</Label>
                    <Select value={form.placement} onValueChange={v => setForm(p => ({ ...p, placement: v as CustomAlert['placement'] }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="top">Top Bar</SelectItem><SelectItem value="bottom">Bottom Bar</SelectItem><SelectItem value="modal">Modal</SelectItem></SelectContent>
                    </Select>
                  </div>
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
            <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Type</TableHead><TableHead>Placement</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {alerts.map(a => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.title}</TableCell>
                  <TableCell><Badge className={`capitalize ${typeColors[a.type]}`}>{a.type}</Badge></TableCell>
                  <TableCell className="capitalize text-sm text-muted-foreground">{a.placement}</TableCell>
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

export default AdminMarketingCustomAlert;
