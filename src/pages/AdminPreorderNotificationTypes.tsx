import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Edit, Trash2, Bell, Mail, Smartphone } from 'lucide-react';

export default function AdminPreorderNotificationTypes() {
  const { toast } = useToast();
  const [types, setTypes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '', slug: '', description: '', email_enabled: true, sms_enabled: false, push_enabled: false, template: '', is_active: true
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const { data } = await supabase.from('preorder_notification_types').select('*').order('created_at');
    setTypes(data || []);
    setIsLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openNew = () => {
    setEditId(null);
    setForm({ name: '', slug: '', description: '', email_enabled: true, sms_enabled: false, push_enabled: false, template: '', is_active: true });
    setShowModal(true);
  };

  const openEdit = (t: any) => {
    setEditId(t.id);
    setForm({ name: t.name, slug: t.slug, description: t.description || '', email_enabled: t.email_enabled, sms_enabled: t.sms_enabled, push_enabled: t.push_enabled, template: t.template || '', is_active: t.is_active });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.slug.trim()) {
      toast({ title: 'Name and slug are required', variant: 'destructive' }); return;
    }
    const payload = { ...form };
    if (editId) {
      await supabase.from('preorder_notification_types').update(payload).eq('id', editId);
    } else {
      await supabase.from('preorder_notification_types').insert(payload);
    }
    toast({ title: editId ? 'Notification type updated' : 'Notification type created' });
    setShowModal(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('preorder_notification_types').delete().eq('id', id);
    toast({ title: 'Notification type deleted' });
    fetchData();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Preorder Notification Types</h1>
            <p className="text-muted-foreground">Configure notification channels and templates</p>
          </div>
          <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" /> Add Type</Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : types.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No notification types yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Channels</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {types.map(t => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell className="font-mono text-xs">{t.slug}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {t.email_enabled && <Badge variant="outline" className="gap-1"><Mail className="h-3 w-3" /> Email</Badge>}
                          {t.sms_enabled && <Badge variant="outline" className="gap-1"><Smartphone className="h-3 w-3" /> SMS</Badge>}
                          {t.push_enabled && <Badge variant="outline" className="gap-1"><Bell className="h-3 w-3" /> Push</Badge>}
                        </div>
                      </TableCell>
                      <TableCell><Badge variant={t.is_active ? 'default' : 'secondary'}>{t.is_active ? 'Active' : 'Inactive'}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(t)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editId ? 'Edit Notification Type' : 'Add Notification Type'}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Order Confirmed" />
                </div>
                <div className="space-y-2">
                  <Label>Slug *</Label>
                  <Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="order-confirmed" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Template</Label>
                <Textarea value={form.template} onChange={e => setForm(f => ({ ...f, template: e.target.value }))} rows={3} placeholder="Hi {{name}}, your preorder #{{order_number}} has been confirmed." />
              </div>
              <div className="space-y-3">
                <Label>Channels</Label>
                <div className="flex gap-6">
                  <div className="flex items-center gap-2"><Switch checked={form.email_enabled} onCheckedChange={v => setForm(f => ({ ...f, email_enabled: v }))} /><span className="text-sm">Email</span></div>
                  <div className="flex items-center gap-2"><Switch checked={form.sms_enabled} onCheckedChange={v => setForm(f => ({ ...f, sms_enabled: v }))} /><span className="text-sm">SMS</span></div>
                  <div className="flex items-center gap-2"><Switch checked={form.push_enabled} onCheckedChange={v => setForm(f => ({ ...f, push_enabled: v }))} /><span className="text-sm">Push</span></div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
                <Label>Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button onClick={handleSave}>{editId ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
