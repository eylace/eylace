import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Plus, Send, Trash2, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface SMSCampaign {
  id: string;
  title: string;
  message: string | null;
  audience: string;
  status: string;
  recipients: number;
  sent_at: string | null;
}

const AdminMarketingBulkSMS = () => {
  const [campaigns, setCampaigns] = useState<SMSCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', audience: 'All Customers' });

  const fetchCampaigns = async () => {
    const { data, error } = await supabase.from('bulk_sms_campaigns').select('*').order('created_at', { ascending: false });
    if (error) console.error(error);
    else setCampaigns(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchCampaigns(); }, []);

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    const { error } = await supabase.from('bulk_sms_campaigns').insert(form);
    if (error) { toast.error('Failed to create'); console.error(error); return; }
    toast.success('SMS campaign created');
    setForm({ title: '', message: '', audience: 'All Customers' });
    setAddOpen(false);
    fetchCampaigns();
  };

  const sendCampaign = async (id: string) => {
    const { error } = await supabase.from('bulk_sms_campaigns').update({ status: 'sent', recipients: 2000, sent_at: new Date().toISOString() }).eq('id', id);
    if (error) { toast.error('Failed'); return; }
    toast.success('SMS campaign sent!');
    fetchCampaigns();
  };

  const deleteCampaign = async (id: string) => {
    await supabase.from('bulk_sms_campaigns').delete().eq('id', id);
    toast.success('Deleted');
    fetchCampaigns();
  };

  return (
    <AdminLayout titleKey="admin.marketing.bulkSMS" descriptionKey="admin.marketing.bulkSMS">
      <Card className="border border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2"><MessageSquare className="h-5 w-5" /> Bulk SMS ({campaigns.length})</CardTitle>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> New SMS Campaign</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create SMS Campaign</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Message (max 160 chars)</Label><Textarea maxLength={160} value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} /><p className="text-xs text-muted-foreground">{form.message.length}/160</p></div>
                <div className="space-y-2">
                  <Label>Audience</Label>
                  <Select value={form.audience} onValueChange={v => setForm(p => ({ ...p, audience: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="All Customers">All Customers</SelectItem><SelectItem value="Active Users">Active Users</SelectItem><SelectItem value="Cart Abandoners">Cart Abandoners</SelectItem><SelectItem value="New Users">New Users</SelectItem></SelectContent>
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
              <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Audience</TableHead><TableHead>Recipients</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {campaigns.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No SMS campaigns yet</TableCell></TableRow>
                ) : campaigns.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.title}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.audience}</TableCell>
                    <TableCell>{c.recipients.toLocaleString()}</TableCell>
                    <TableCell>{c.status === 'sent' ? <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Sent</Badge> : <Badge variant="secondary">Draft</Badge>}</TableCell>
                    <TableCell className="text-right space-x-1">
                      {c.status === 'draft' && <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => sendCampaign(c.id)}><Send className="h-4 w-4" /></Button>}
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteCampaign(c.id)}><Trash2 className="h-4 w-4" /></Button>
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

export default AdminMarketingBulkSMS;
