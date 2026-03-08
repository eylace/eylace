import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Plus, Send, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface SMSCampaign {
  id: string;
  title: string;
  message: string;
  audience: string;
  status: 'draft' | 'sent';
  recipients: number;
  sentAt: string | null;
}

const AdminMarketingBulkSMS = () => {
  const [campaigns, setCampaigns] = useState<SMSCampaign[]>([
    { id: '1', title: 'Flash Sale SMS', message: 'Flash sale is live! Up to 50% off. Shop now at eylace.com', audience: 'All Customers', status: 'sent', recipients: 3500, sentAt: '2026-03-06' },
    { id: '2', title: 'Order Reminder', message: 'Your cart is waiting! Complete your purchase today.', audience: 'Cart Abandoners', status: 'draft', recipients: 0, sentAt: null },
  ]);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', audience: 'All Customers' });

  const handleCreate = () => {
    if (!form.title.trim()) return;
    setCampaigns(prev => [{ id: Date.now().toString(), ...form, status: 'draft', recipients: 0, sentAt: null }, ...prev]);
    setForm({ title: '', message: '', audience: 'All Customers' });
    setAddOpen(false);
    toast.success('SMS campaign created');
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
          <Table>
            <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Audience</TableHead><TableHead>Recipients</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {campaigns.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.title}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.audience}</TableCell>
                  <TableCell>{c.recipients.toLocaleString()}</TableCell>
                  <TableCell>{c.status === 'sent' ? <Badge className="bg-green-500/10 text-green-600">Sent</Badge> : <Badge variant="secondary">Draft</Badge>}</TableCell>
                  <TableCell className="text-right space-x-1">
                    {c.status === 'draft' && <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setCampaigns(prev => prev.map(x => x.id === c.id ? { ...x, status: 'sent' as const, recipients: 2000, sentAt: new Date().toISOString().split('T')[0] } : x)); toast.success('SMS campaign sent!'); }}><Send className="h-4 w-4" /></Button>}
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { setCampaigns(prev => prev.filter(x => x.id !== c.id)); toast.success('Deleted'); }}><Trash2 className="h-4 w-4" /></Button>
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

export default AdminMarketingBulkSMS;
