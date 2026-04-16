import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Plus, Edit, Trash2, Eye, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { deleteMarketingTemplate } from '@/lib/adminMarketing';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  template_type: string;
  body: string | null;
  updated_at: string;
}

const AdminMarketingEmailTemplates = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ name: '', subject: '', body: '' });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchTemplates = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('marketing_email_templates').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error(error);
      toast.error('Failed to load email templates');
      setTemplates([]);
    } else setTemplates(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchTemplates(); }, []);

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    const { error } = await supabase.from('marketing_email_templates').insert({ name: form.name, subject: form.subject, body: form.body });
    if (error) { toast.error('Failed to create'); console.error(error); return; }
    toast.success('Template created');
    setForm({ name: '', subject: '', body: '' });
    setAddOpen(false);
    fetchTemplates();
  };

  const deleteTemplate = async (id: string) => {
    if (deletingId === id) return;

    const previousTemplates = templates;
    setDeletingId(id);
    setTemplates((current) => current.filter((template) => template.id !== id));

    try {
      await deleteMarketingTemplate(id);
      toast.success('Template deleted');
    } catch (error) {
      console.error(error);
      setTemplates(previousTemplates);
      toast.error(error instanceof Error ? error.message : 'Failed to delete template');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AdminLayout titleKey="admin.marketing.emailTemplates" descriptionKey="admin.marketing.emailTemplates">
      <Card className="border border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2"><Mail className="h-5 w-5" /> Email Templates ({templates.length})</CardTitle>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> New Template</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Email Template</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2"><Label>Template Name</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Subject Line</Label><Input value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Body (HTML)</Label><Textarea rows={8} value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))} /></div>
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
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Subject</TableHead><TableHead>Type</TableHead><TableHead>Last Edited</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {templates.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No templates yet</TableCell></TableRow>
                ) : templates.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{t.subject}</TableCell>
                    <TableCell><Badge variant="outline">{t.template_type}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{t.updated_at?.split('T')[0]}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" disabled={deletingId === t.id} onClick={() => deleteTemplate(t.id)}>{deletingId === t.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}</Button>
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

export default AdminMarketingEmailTemplates;
