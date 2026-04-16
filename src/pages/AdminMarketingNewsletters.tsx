import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Newspaper, Plus, Send, Trash2, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { deleteMarketingNewsletter } from '@/lib/adminMarketing';

interface Newsletter {
  id: string;
  subject: string;
  content: string | null;
  status: string;
  recipients: number;
  sent_at: string | null;
}

const AdminMarketingNewsletters = () => {
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ subject: '', content: '' });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchNewsletters = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('newsletters').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error(error);
      toast.error('Failed to load newsletters');
      setNewsletters([]);
    } else setNewsletters(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchNewsletters(); }, []);

  const handleCreate = async () => {
    if (!form.subject.trim()) return;
    const { error } = await supabase.from('newsletters').insert({ subject: form.subject, content: form.content });
    if (error) { toast.error('Failed to create'); console.error(error); return; }
    toast.success('Newsletter draft created');
    setForm({ subject: '', content: '' });
    setAddOpen(false);
    fetchNewsletters();
  };

  const sendNewsletter = async (id: string) => {
    const { error } = await supabase.from('newsletters').update({ status: 'sent', recipients: 1500, sent_at: new Date().toISOString() }).eq('id', id);
    if (error) { toast.error('Failed to send'); return; }
    toast.success('Newsletter sent!');
    fetchNewsletters();
  };

  const deleteNewsletter = async (id: string) => {
    if (deletingId === id) return;

    const previousNewsletters = newsletters;
    setDeletingId(id);
    setNewsletters((current) => current.filter((newsletter) => newsletter.id !== id));

    try {
      await deleteMarketingNewsletter(id);
      toast.success('Newsletter deleted');
    } catch (error) {
      console.error(error);
      setNewsletters(previousNewsletters);
      toast.error(error instanceof Error ? error.message : 'Failed to delete newsletter');
    } finally {
      setDeletingId(null);
    }
  };

  const statusBadge = (s: string) => {
    if (s === 'sent') return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Sent</Badge>;
    if (s === 'scheduled') return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Scheduled</Badge>;
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
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Subject</TableHead><TableHead>Status</TableHead><TableHead>Recipients</TableHead><TableHead>Sent At</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {newsletters.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No newsletters yet</TableCell></TableRow>
                ) : newsletters.map(n => (
                  <TableRow key={n.id}>
                    <TableCell className="font-medium">{n.subject}</TableCell>
                    <TableCell>{statusBadge(n.status)}</TableCell>
                    <TableCell>{n.recipients.toLocaleString()}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{n.sent_at?.split('T')[0] || '—'}</TableCell>
                    <TableCell className="text-right space-x-1">
                      {n.status === 'draft' && <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => sendNewsletter(n.id)}><Send className="h-4 w-4" /></Button>}
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" disabled={deletingId === n.id} onClick={() => deleteNewsletter(n.id)}>{deletingId === n.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}</Button>
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

export default AdminMarketingNewsletters;
