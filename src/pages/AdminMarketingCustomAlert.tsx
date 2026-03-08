import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, Plus, Trash2, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface CustomAlert {
  id: string;
  title: string;
  message: string | null;
  alert_type: string;
  placement: string;
  is_active: boolean;
}

const AdminMarketingCustomAlert = () => {
  const [alerts, setAlerts] = useState<CustomAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', alert_type: 'info', placement: 'top' });

  const fetchAlerts = async () => {
    const { data, error } = await supabase.from('custom_alerts').select('*').order('created_at', { ascending: false });
    if (error) console.error(error);
    else setAlerts(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAlerts(); }, []);

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    const { error } = await supabase.from('custom_alerts').insert(form);
    if (error) { toast.error('Failed to create'); console.error(error); return; }
    toast.success('Alert created');
    setForm({ title: '', message: '', alert_type: 'info', placement: 'top' });
    setAddOpen(false);
    fetchAlerts();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from('custom_alerts').update({ is_active: !current }).eq('id', id);
    fetchAlerts();
  };

  const deleteAlert = async (id: string) => {
    await supabase.from('custom_alerts').delete().eq('id', id);
    toast.success('Deleted');
    fetchAlerts();
  };

  const typeColors: Record<string, string> = { info: 'bg-blue-500/10 text-blue-600', warning: 'bg-orange-500/10 text-orange-600', success: 'bg-green-500/10 text-green-600', error: 'bg-red-500/10 text-red-600' };

  return (
    <AdminLayout titleKey="admin.marketing.customAlert" descriptionKey="admin.marketing.customAlert">
      <Card className="border border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> Custom Alerts ({alerts.length})</CardTitle>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> New Alert</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Custom Alert</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Message</Label><Textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={form.alert_type} onValueChange={v => setForm(p => ({ ...p, alert_type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="info">Info</SelectItem><SelectItem value="warning">Warning</SelectItem><SelectItem value="success">Success</SelectItem><SelectItem value="error">Error</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Placement</Label>
                    <Select value={form.placement} onValueChange={v => setForm(p => ({ ...p, placement: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="top">Top Bar</SelectItem><SelectItem value="bottom">Bottom Bar</SelectItem><SelectItem value="modal">Modal</SelectItem></SelectContent>
                    </Select>
                  </div>
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
              <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Type</TableHead><TableHead>Placement</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {alerts.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No alerts yet</TableCell></TableRow>
                ) : alerts.map(a => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.title}</TableCell>
                    <TableCell><Badge className={`capitalize ${typeColors[a.alert_type] || ''}`}>{a.alert_type}</Badge></TableCell>
                    <TableCell className="capitalize text-sm text-muted-foreground">{a.placement}</TableCell>
                    <TableCell><Switch checked={a.is_active} onCheckedChange={() => toggleActive(a.id, a.is_active)} /></TableCell>
                    <TableCell className="text-right"><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteAlert(a.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
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

export default AdminMarketingCustomAlert;
