import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Loader2, DollarSign, Plus, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const AdminSellerPayouts = () => {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [sellers, setSellers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ seller_id: '', amount: '', payment_method: 'bank_transfer', reference_number: '', notes: '' });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const [{ data: p }, { data: s }] = await Promise.all([
      supabase.from('seller_payouts').select('*, seller:sellers(name)').order('created_at', { ascending: false }),
      supabase.from('sellers').select('id, name'),
    ]);
    if (p) setPayouts(p);
    if (s) setSellers(s);
    setIsLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const addPayout = async () => {
    if (!form.seller_id || !form.amount) { toast.error('Seller and amount required'); return; }
    const { error } = await supabase.from('seller_payouts').insert({
      seller_id: form.seller_id, amount: parseFloat(form.amount), payment_method: form.payment_method,
      reference_number: form.reference_number || null, notes: form.notes || null,
    });
    if (!error) { toast.success('Payout recorded'); setShowAdd(false); setForm({ seller_id: '', amount: '', payment_method: 'bank_transfer', reference_number: '', notes: '' }); fetchData(); }
    else toast.error('Failed');
  };

  return (
    <AdminLayout titleKey="admin.sellers.payouts" descriptionKey="admin.sellers.payoutsDesc">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-lg flex items-center gap-2"><DollarSign className="h-5 w-5" /> Payouts</CardTitle>
            <Button size="sm" onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-1" /> Record Payout</Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div> : payouts.length === 0 ? <p className="text-center text-muted-foreground py-8">No payouts recorded</p> : (
            <Table>
              <TableHeader><TableRow><TableHead>Seller</TableHead><TableHead>Amount</TableHead><TableHead>Method</TableHead><TableHead>Reference</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
              <TableBody>
                {payouts.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{(p.seller as any)?.name || 'N/A'}</TableCell>
                    <TableCell>${p.amount}</TableCell>
                    <TableCell><Badge variant="secondary">{p.payment_method}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{p.reference_number || '-'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(p.paid_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Payout</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Seller</Label>
              <Select value={form.seller_id} onValueChange={v => setForm(f => ({ ...f, seller_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select seller" /></SelectTrigger>
                <SelectContent>{sellers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Amount</Label><Input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} /></div>
            <div><Label>Payment Method</Label>
              <Select value={form.payment_method} onValueChange={v => setForm(f => ({ ...f, payment_method: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="bank_transfer">Bank Transfer</SelectItem><SelectItem value="paypal">PayPal</SelectItem><SelectItem value="cash">Cash</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Reference Number</Label><Input value={form.reference_number} onChange={e => setForm(f => ({ ...f, reference_number: e.target.value }))} /></div>
            <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button><Button onClick={addPayout}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminSellerPayouts;
