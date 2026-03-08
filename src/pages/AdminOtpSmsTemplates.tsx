import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Pencil, Trash2, MessageSquare } from 'lucide-react';

interface SmsTemplate {
  id: string;
  name: string;
  template_key: string;
  message: string;
  variables: string[];
  is_active: boolean;
  created_at: string;
}

export default function AdminOtpSmsTemplates() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<SmsTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SmsTemplate | null>(null);
  const [form, setForm] = useState({ name: '', template_key: '', message: '', variables: '{{otp}}' });

  useEffect(() => { fetchTemplates(); }, []);

  const fetchTemplates = async () => {
    const { data } = await supabase.from('otp_sms_templates').select('*').order('created_at');
    setTemplates((data as SmsTemplate[]) || []);
    setLoading(false);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', template_key: '', message: '', variables: '{{otp}}' });
    setDialogOpen(true);
  };

  const openEdit = (t: SmsTemplate) => {
    setEditing(t);
    setForm({ name: t.name, template_key: t.template_key, message: t.message, variables: t.variables.join(', ') });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.template_key || !form.message) {
      toast({ title: 'Error', description: 'All fields are required', variant: 'destructive' });
      return;
    }
    const variables = form.variables.split(',').map(v => v.trim()).filter(Boolean);

    if (editing) {
      await supabase.from('otp_sms_templates').update({ name: form.name, template_key: form.template_key, message: form.message, variables }).eq('id', editing.id);
      toast({ title: 'Updated', description: 'Template updated successfully.' });
    } else {
      await supabase.from('otp_sms_templates').insert({ name: form.name, template_key: form.template_key, message: form.message, variables });
      toast({ title: 'Created', description: 'Template created successfully.' });
    }
    setDialogOpen(false);
    fetchTemplates();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('otp_sms_templates').delete().eq('id', id);
    toast({ title: 'Deleted', description: 'Template removed.' });
    fetchTemplates();
  };

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from('otp_sms_templates').update({ is_active: active }).eq('id', id);
    fetchTemplates();
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">SMS Templates</h1>
            <p className="text-muted-foreground">Manage OTP SMS message templates</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Add Template</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? 'Edit Template' : 'Add SMS Template'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Template Name</Label>
                  <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Login OTP" className="mt-1" />
                </div>
                <div>
                  <Label>Template Key</Label>
                  <Input value={form.template_key} onChange={(e) => setForm(f => ({ ...f, template_key: e.target.value }))} placeholder="e.g. login_otp" className="mt-1" />
                  <p className="text-xs text-muted-foreground mt-1">Unique identifier used in code</p>
                </div>
                <div>
                  <Label>Message</Label>
                  <Textarea value={form.message} onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))} rows={3} placeholder="Your OTP is {{otp}}. Valid for 5 minutes." className="mt-1" />
                </div>
                <div>
                  <Label>Variables (comma-separated)</Label>
                  <Input value={form.variables} onChange={(e) => setForm(f => ({ ...f, variables: e.target.value }))} placeholder="{{otp}}, {{name}}" className="mt-1" />
                </div>
                <Button onClick={handleSave} className="w-full">{editing ? 'Update' : 'Create'} Template</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5" /> All SMS Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Variables</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell><code className="text-xs bg-muted px-1.5 py-0.5 rounded">{t.template_key}</code></TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">{t.message}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {t.variables.map((v) => <Badge key={v} variant="secondary" className="text-xs">{v}</Badge>)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch checked={t.is_active} onCheckedChange={(v) => toggleActive(t.id, v)} />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(t)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(t.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {templates.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No SMS templates found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
