import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { MousePointerClick, Plus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface Popup {
  id: string;
  title: string;
  type: 'welcome' | 'exit' | 'timed' | 'scroll';
  content: string;
  isActive: boolean;
  delay: number;
}

const AdminMarketingPopup = () => {
  const [popups, setPopups] = useState<Popup[]>([
    { id: '1', title: 'Welcome Discount', type: 'welcome', content: 'Get 10% off your first order!', isActive: true, delay: 3 },
    { id: '2', title: 'Exit Intent Offer', type: 'exit', content: 'Wait! Get free shipping before you go.', isActive: false, delay: 0 },
  ]);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ title: '', type: 'welcome' as Popup['type'], content: '', delay: 3 });

  const handleCreate = () => {
    if (!form.title.trim()) return;
    setPopups(prev => [{ id: Date.now().toString(), ...form, isActive: false }, ...prev]);
    setForm({ title: '', type: 'welcome', content: '', delay: 3 });
    setAddOpen(false);
    toast.success('Pop-up created');
  };

  return (
    <AdminLayout titleKey="admin.marketing.popup" descriptionKey="admin.marketing.popup">
      <Card className="border border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2"><MousePointerClick className="h-5 w-5" /> Dynamic Pop-ups ({popups.length})</CardTitle>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> New Pop-up</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Pop-up</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} /></div>
                <div className="space-y-2">
                  <Label>Trigger Type</Label>
                  <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v as Popup['type'] }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="welcome">Welcome (On Load)</SelectItem>
                      <SelectItem value="exit">Exit Intent</SelectItem>
                      <SelectItem value="timed">Timed Delay</SelectItem>
                      <SelectItem value="scroll">Scroll Triggered</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Delay (seconds)</Label><Input type="number" value={form.delay} onChange={e => setForm(p => ({ ...p, delay: Number(e.target.value) }))} /></div>
                <div className="space-y-2"><Label>Content</Label><Textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} /></div>
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
            <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Type</TableHead><TableHead>Delay</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {popups.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.title}</TableCell>
                  <TableCell><Badge variant="outline" className="capitalize">{p.type}</Badge></TableCell>
                  <TableCell>{p.delay}s</TableCell>
                  <TableCell><Switch checked={p.isActive} onCheckedChange={() => setPopups(prev => prev.map(x => x.id === p.id ? { ...x, isActive: !x.isActive } : x))} /></TableCell>
                  <TableCell className="text-right"><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { setPopups(prev => prev.filter(x => x.id !== p.id)); toast.success('Deleted'); }}><Trash2 className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminMarketingPopup;
