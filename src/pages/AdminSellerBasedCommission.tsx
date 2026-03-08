import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Loader2, Plus, Trash2, Store } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const AdminSellerBasedCommission = () => {
  const [configs, setConfigs] = useState<any[]>([]);
  const [sellers, setSellers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ seller_id: '', commission_rate: '10' });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const [{ data: c }, { data: s }] = await Promise.all([
      supabase.from('seller_commission_config').select('*, seller:sellers(name)').eq('commission_type', 'seller').order('created_at', { ascending: false }),
      supabase.from('sellers').select('id, name'),
    ]);
    if (c) setConfigs(c);
    if (s) setSellers(s);
    setIsLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const add = async () => {
    if (!form.seller_id) { toast.error('Select a seller'); return; }
    const { error } = await supabase.from('seller_commission_config').insert({ seller_id: form.seller_id, commission_rate: parseFloat(form.commission_rate), commission_type: 'seller' });
    if (!error) { toast.success('Added'); setShowAdd(false); setForm({ seller_id: '', commission_rate: '10' }); fetchData(); } else toast.error(error.message);
  };

  const toggle = async (id: string, current: boolean) => {
    await supabase.from('seller_commission_config').update({ is_active: !current }).eq('id', id);
    fetchData();
  };

  const remove = async (id: string) => {
    await supabase.from('seller_commission_config').delete().eq('id', id);
    toast.success('Deleted');
    fetchData();
  };

  return (
    <AdminLayout titleKey="admin.sellers.sellerCommission" descriptionKey="admin.sellers.sellerCommissionDesc">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-lg flex items-center gap-2"><Store className="h-5 w-5" /> Seller Based Commission</CardTitle>
            <Button size="sm" onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-1" /> Add</Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div> : configs.length === 0 ? <p className="text-center text-muted-foreground py-8">No seller-specific commission configured</p> : (
            <Table>
              <TableHeader><TableRow><TableHead>Seller</TableHead><TableHead>Rate (%)</TableHead><TableHead>Active</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {configs.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{(c.seller as any)?.name || 'N/A'}</TableCell>
                    <TableCell>{c.commission_rate}%</TableCell>
                    <TableCell><Switch checked={c.is_active} onCheckedChange={() => toggle(c.id, c.is_active)} /></TableCell>
                    <TableCell><Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Seller Commission</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Seller</Label>
              <Select value={form.seller_id} onValueChange={v => setForm(f => ({ ...f, seller_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select seller" /></SelectTrigger>
                <SelectContent>{sellers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Commission Rate (%)</Label><Input type="number" min={0} max={100} value={form.commission_rate} onChange={e => setForm(f => ({ ...f, commission_rate: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button><Button onClick={add}>Add</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminSellerBasedCommission;
