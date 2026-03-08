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
import { Loader2, Plus, Trash2, Edit } from 'lucide-react';

export default function AdminPreorderFaqs() {
  const { toast } = useToast();
  const [faqs, setFaqs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ question: '', answer: '', sort_order: 0, is_active: true });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const { data } = await supabase.from('preorder_faqs').select('*').order('sort_order');
    setFaqs(data || []);
    setIsLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openNew = () => { setEditId(null); setForm({ question: '', answer: '', sort_order: faqs.length, is_active: true }); setShowModal(true); };
  const openEdit = (f: any) => { setEditId(f.id); setForm({ question: f.question, answer: f.answer, sort_order: f.sort_order, is_active: f.is_active }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.question.trim() || !form.answer.trim()) {
      toast({ title: 'Please fill all fields', variant: 'destructive' }); return;
    }
    const payload = { question: form.question, answer: form.answer, sort_order: form.sort_order, is_active: form.is_active };

    if (editId) {
      await supabase.from('preorder_faqs').update(payload).eq('id', editId);
    } else {
      await supabase.from('preorder_faqs').insert(payload);
    }
    toast({ title: editId ? 'FAQ updated' : 'FAQ created' });
    setShowModal(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('preorder_faqs').delete().eq('id', id);
    toast({ title: 'FAQ deleted' });
    fetchData();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Preorder FAQs</h1>
            <p className="text-muted-foreground">{faqs.length} FAQs</p>
          </div>
          <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" /> Add FAQ</Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : faqs.length === 0 ? (
              <p className="text-center py-12 text-muted-foreground">No FAQs yet. Create one to get started.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Question</TableHead>
                    <TableHead>Answer</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {faqs.map(f => (
                    <TableRow key={f.id}>
                      <TableCell>{f.sort_order}</TableCell>
                      <TableCell className="font-medium max-w-xs truncate">{f.question}</TableCell>
                      <TableCell className="max-w-xs truncate">{f.answer}</TableCell>
                      <TableCell><Badge variant={f.is_active ? 'default' : 'secondary'}>{f.is_active ? 'Active' : 'Inactive'}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(f)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(f.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
          <DialogContent>
            <DialogHeader><DialogTitle>{editId ? 'Edit FAQ' : 'Add FAQ'}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Question *</Label>
                <Input value={form.question} onChange={e => setForm(f => ({ ...f, question: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Answer *</Label>
                <Textarea value={form.answer} onChange={e => setForm(f => ({ ...f, answer: e.target.value }))} rows={4} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Sort Order</Label>
                  <Input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))} />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
                  <Label>Active</Label>
                </div>
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
