import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Bell, Plus, Send, Trash2, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface PushNotification {
  id: string;
  title: string;
  message: string | null;
  audience: string;
  status: string;
  sent_at: string | null;
}

const AdminMarketingNotification = () => {
  const [notifications, setNotifications] = useState<PushNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', audience: 'All Users' });

  const fetchNotifications = async () => {
    const { data, error } = await supabase.from('push_notifications').select('*').order('created_at', { ascending: false });
    if (error) console.error(error);
    else setNotifications(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchNotifications(); }, []);

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    const { error } = await supabase.from('push_notifications').insert(form);
    if (error) { toast.error('Failed to create'); console.error(error); return; }
    toast.success('Notification created');
    setForm({ title: '', message: '', audience: 'All Users' });
    setAddOpen(false);
    fetchNotifications();
  };

  const sendNotification = async (id: string) => {
    const { error } = await supabase.from('push_notifications').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', id);
    if (error) { toast.error('Failed'); return; }
    toast.success('Sent!');
    fetchNotifications();
  };

  const deleteNotification = async (id: string) => {
    await supabase.from('push_notifications').delete().eq('id', id);
    toast.success('Deleted');
    fetchNotifications();
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
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Audience</TableHead><TableHead>Status</TableHead><TableHead>Sent At</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {notifications.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No notifications yet</TableCell></TableRow>
                ) : notifications.map(n => (
                  <TableRow key={n.id}>
                    <TableCell className="font-medium">{n.title}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{n.audience}</TableCell>
                    <TableCell>{n.status === 'sent' ? <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Sent</Badge> : <Badge variant="secondary">Draft</Badge>}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{n.sent_at?.split('T')[0] || '—'}</TableCell>
                    <TableCell className="text-right space-x-1">
                      {n.status === 'draft' && <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => sendNotification(n.id)}><Send className="h-4 w-4" /></Button>}
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteNotification(n.id)}><Trash2 className="h-4 w-4" /></Button>
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

export default AdminMarketingNotification;
