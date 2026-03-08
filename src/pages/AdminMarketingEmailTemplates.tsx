import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Plus, Edit, Trash2, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  type: string;
  body: string;
  lastEdited: string;
}

const AdminMarketingEmailTemplates = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([
    { id: '1', name: 'Welcome Email', subject: 'Welcome to Eylace!', type: 'Transactional', body: '<h1>Welcome!</h1>', lastEdited: '2026-03-01' },
    { id: '2', name: 'Order Confirmation', subject: 'Your order has been placed', type: 'Transactional', body: '<h1>Order Confirmed</h1>', lastEdited: '2026-03-05' },
    { id: '3', name: 'Abandoned Cart', subject: 'You left something behind!', type: 'Marketing', body: '<h1>Come back!</h1>', lastEdited: '2026-02-20' },
    { id: '4', name: 'Password Reset', subject: 'Reset your password', type: 'Transactional', body: '<h1>Reset Password</h1>', lastEdited: '2026-01-15' },
  ]);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ name: '', subject: '', body: '' });

  const handleCreate = () => {
    if (!form.name.trim()) return;
    setTemplates(prev => [{ id: Date.now().toString(), ...form, type: 'Custom', lastEdited: new Date().toISOString().split('T')[0] }, ...prev]);
    setForm({ name: '', subject: '', body: '' });
    setAddOpen(false);
    toast.success('Template created');
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
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Subject</TableHead><TableHead>Type</TableHead><TableHead>Last Edited</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {templates.map(t => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{t.subject}</TableCell>
                  <TableCell><Badge variant="outline">{t.type}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{t.lastEdited}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { setTemplates(prev => prev.filter(x => x.id !== t.id)); toast.success('Deleted'); }}><Trash2 className="h-4 w-4" /></Button>
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

export default AdminMarketingEmailTemplates;
