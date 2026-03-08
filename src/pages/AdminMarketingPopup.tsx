import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { MousePointerClick, Plus, Trash2, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Popup {
  id: string;
  title: string;
  trigger_type: string;
  content: string | null;
  is_active: boolean;
  delay_seconds: number;
}

const AdminMarketingPopup = () => {
  const [popups, setPopups] = useState<Popup[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ title: '', trigger_type: 'welcome', content: '', delay_seconds: 3 });

  const fetchPopups = async () => {
    const { data, error } = await supabase.from('dynamic_popups').select('*').order('created_at', { ascending: false });
    if (error) { toast.error('Failed to load'); console.error(error); }
    else setPopups(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchPopups(); }, []);

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    const { error } = await supabase.from('dynamic_popups').insert(form);
    if (error) { toast.error('Failed to create'); console.error(error); return; }
    toast.success('Pop-up created');
    setForm({ title: '', trigger_type: 'welcome', content: '', delay_seconds: 3 });
    setAddOpen(false);
    fetchPopups();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from('dynamic_popups').update({ is_active: !current }).eq('id', id);
    fetchPopups();
  };

  const deletePopup = async (id: string) => {
    await supabase.from('dynamic_popups').delete().eq('id', id);
    toast.success('Deleted');
    fetchPopups();
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
                  <Select value={form.trigger_type} onValueChange={v => setForm(p => ({ ...p, trigger_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="welcome">Welcome (On Load)</SelectItem>
                      <SelectItem value="exit">Exit Intent</SelectItem>
                      <SelectItem value="timed">Timed Delay</SelectItem>
                      <SelectItem value="scroll">Scroll Triggered</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Delay (seconds)</Label><Input type="number" value={form.delay_seconds} onChange={e => setForm(p => ({ ...p, delay_seconds: Number(e.target.value) }))} /></div>
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
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Type</TableHead><TableHead>Delay</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {popups.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No pop-ups yet</TableCell></TableRow>
                ) : popups.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.title}</TableCell>
                    <TableCell><Badge variant="outline" className="capitalize">{p.trigger_type}</Badge></TableCell>
                    <TableCell>{p.delay_seconds}s</TableCell>
                    <TableCell><Switch checked={p.is_active} onCheckedChange={() => toggleActive(p.id, p.is_active)} /></TableCell>
                    <TableCell className="text-right"><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deletePopup(p.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
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

export default AdminMarketingPopup;
