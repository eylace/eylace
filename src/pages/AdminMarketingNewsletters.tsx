import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Newspaper, Plus, Send, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface Newsletter {
  id: string;
  subject: string;
  content: string;
  status: 'draft' | 'sent' | 'scheduled';
  recipients: number;
  sentAt: string | null;
}

const AdminMarketingNewsletters = () => {
  const [newsletters, setNewsletters] = useState<Newsletter[]>([
    { id: '1', subject: 'March Collection Launch', content: 'Check out our new spring collection!', status: 'sent', recipients: 1250, sentAt: '2026-03-01' },
    { id: '2', subject: 'Exclusive Member Deals', content: 'Members-only deals this weekend', status: 'draft', recipients: 0, sentAt: null },
  ]);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ subject: '', content: '' });

  const handleCreate = () => {
    if (!form.subject.trim()) return;
    setNewsletters(prev => [{ id: Date.now().toString(), ...form, status: 'draft', recipients: 0, sentAt: null }, ...prev]);
    setForm({ subject: '', content: '' });
    setAddOpen(false);
    toast.success('Newsletter draft created');
  };

  const sendNewsletter = (id: string) => {
    setNewsletters(prev => prev.map(n => n.id === id ? { ...n, status: 'sent' as const, recipients: 1500, sentAt: new Date().toISOString().split('T')[0] } : n));
    toast.success('Newsletter sent!');
  };

  const statusBadge = (s: string) => {
    if (s === 'sent') return <Badge className="bg-green-500/10 text-green-600">Sent</Badge>;
    if (s === 'scheduled') return <Badge className="bg-blue-500/10 text-blue-600">Scheduled</Badge>;
    return <Badge variant="secondary">Draft</Badge>;
  };

  return (
    <AdminLayout titleKey="admin.marketing.newsletters" descriptionKey="admin.marketing.newsletters">
      <Card className="border border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2"><Newspaper className="h-5 w-5" /> Newsletters ({newsletters.length})</CardTitle>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> New Newsletter</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Newsletter</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2"><Label>Subject</Label><Input value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Content</Label><Textarea rows={6} value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} /></div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button onClick={handleCreate}>Save Draft</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Subject</TableHead><TableHead>Status</TableHead><TableHead>Recipients</TableHead><TableHead>Sent At</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {newsletters.map(n => (
                <TableRow key={n.id}>
                  <TableCell className="font-medium">{n.subject}</TableCell>
                  <TableCell>{statusBadge(n.status)}</TableCell>
                  <TableCell>{n.recipients.toLocaleString()}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{n.sentAt || '—'}</TableCell>
                  <TableCell className="text-right space-x-1">
                    {n.status === 'draft' && <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => sendNewsletter(n.id)}><Send className="h-4 w-4" /></Button>}
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { setNewsletters(prev => prev.filter(x => x.id !== n.id)); toast.success('Deleted'); }}><Trash2 className="h-4 w-4" /></Button>
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

export default AdminMarketingNewsletters;
