import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Bell, Plus, Send, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface PushNotification {
  id: string;
  title: string;
  message: string;
  audience: string;
  status: 'draft' | 'sent';
  sentAt: string | null;
}

const AdminMarketingNotification = () => {
  const [notifications, setNotifications] = useState<PushNotification[]>([
    { id: '1', title: 'Flash Sale Starting!', message: 'Up to 50% off for the next 2 hours', audience: 'All Users', status: 'sent', sentAt: '2026-03-07' },
    { id: '2', title: 'New Arrivals', message: 'Check out what just dropped', audience: 'Active Users', status: 'draft', sentAt: null },
  ]);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', audience: 'All Users' });

  const handleCreate = () => {
    if (!form.title.trim()) return;
    setNotifications(prev => [{ id: Date.now().toString(), ...form, status: 'draft', sentAt: null }, ...prev]);
    setForm({ title: '', message: '', audience: 'All Users' });
    setAddOpen(false);
    toast.success('Notification created');
  };

  return (
    <AdminLayout titleKey="admin.marketing.notification" descriptionKey="admin.marketing.notification">
      <Card className="border border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2"><Bell className="h-5 w-5" /> Push Notifications ({notifications.length})</CardTitle>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> New Notification</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Notification</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Message</Label><Textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} /></div>
                <div className="space-y-2">
                  <Label>Audience</Label>
                  <Select value={form.audience} onValueChange={v => setForm(p => ({ ...p, audience: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="All Users">All Users</SelectItem><SelectItem value="Active Users">Active Users</SelectItem><SelectItem value="New Users">New Users</SelectItem></SelectContent>
                  </Select>
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
            <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Audience</TableHead><TableHead>Status</TableHead><TableHead>Sent At</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {notifications.map(n => (
                <TableRow key={n.id}>
                  <TableCell className="font-medium">{n.title}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{n.audience}</TableCell>
                  <TableCell>{n.status === 'sent' ? <Badge className="bg-green-500/10 text-green-600">Sent</Badge> : <Badge variant="secondary">Draft</Badge>}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{n.sentAt || '—'}</TableCell>
                  <TableCell className="text-right space-x-1">
                    {n.status === 'draft' && <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, status: 'sent' as const, sentAt: new Date().toISOString().split('T')[0] } : x)); toast.success('Sent!'); }}><Send className="h-4 w-4" /></Button>}
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { setNotifications(prev => prev.filter(x => x.id !== n.id)); toast.success('Deleted'); }}><Trash2 className="h-4 w-4" /></Button>
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

export default AdminMarketingNotification;
