import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Loader2, Plus, Trash2, Package, Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const defaultForm = { name: '', slug: '', description: '', price: '0', duration_days: '30', product_limit: '50', commission_rate: '10' };

const AdminSellerPackages = () => {
  const [packages, setPackages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const { data } = await supabase.from('seller_packages').select('*').order('sort_order');
    if (data) setPackages(data);
    setIsLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const save = async () => {
    if (!form.name || !form.slug) { toast.error('Name and slug required'); return; }
    const payload = { name: form.name, slug: form.slug, description: form.description || null, price: parseFloat(form.price), duration_days: parseInt(form.duration_days), product_limit: parseInt(form.product_limit), commission_rate: parseFloat(form.commission_rate) };
    if (editId) {
      const { error } = await supabase.from('seller_packages').update(payload).eq('id', editId);
      if (!error) { toast.success('Updated'); } else { toast.error(error.message); return; }
    } else {
      const { error } = await supabase.from('seller_packages').insert(payload);
      if (!error) { toast.success('Created'); } else { toast.error(error.message); return; }
    }
    setShowForm(false); setEditId(null); setForm(defaultForm); fetchData();
  };

  const toggle = async (id: string, current: boolean) => {
    await supabase.from('seller_packages').update({ is_active: !current }).eq('id', id);
    fetchData();
  };

  const remove = async (id: string) => {
    await supabase.from('seller_packages').delete().eq('id', id);
    toast.success('Deleted'); fetchData();
  };

  const openEdit = (p: any) => {
    setEditId(p.id);
    setForm({ name: p.name, slug: p.slug, description: p.description || '', price: String(p.price), duration_days: String(p.duration_days), product_limit: String(p.product_limit), commission_rate: String(p.commission_rate) });
    setShowForm(true);
  };

  return (
    <AdminLayout titleKey="admin.sellers.packages" descriptionKey="admin.sellers.packagesDesc">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-lg flex items-center gap-2"><Package className="h-5 w-5" /> Seller Packages</CardTitle>
            <Button size="sm" onClick={() => { setEditId(null); setForm(defaultForm); setShowForm(true); }}><Plus className="h-4 w-4 mr-1" /> Add Package</Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div> : packages.length === 0 ? <p className="text-center text-muted-foreground py-8">No packages</p> : (
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Price</TableHead><TableHead>Duration</TableHead><TableHead>Product Limit</TableHead><TableHead>Commission</TableHead><TableHead>Active</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {packages.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>${p.price}</TableCell>
                    <TableCell>{p.duration_days} days</TableCell>
                    <TableCell>{p.product_limit}</TableCell>
                    <TableCell>{p.commission_rate}%</TableCell>
                    <TableCell><Switch checked={p.is_active} onCheckedChange={() => toggle(p.id, p.is_active)} /></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(p)}><Edit className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? 'Edit' : 'Add'} Package</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><Label>Slug</Label><Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Price ($)</Label><Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} /></div>
              <div><Label>Duration (days)</Label><Input type="number" value={form.duration_days} onChange={e => setForm(f => ({ ...f, duration_days: e.target.value }))} /></div>
              <div><Label>Product Limit</Label><Input type="number" value={form.product_limit} onChange={e => setForm(f => ({ ...f, product_limit: e.target.value }))} /></div>
              <div><Label>Commission (%)</Label><Input type="number" value={form.commission_rate} onChange={e => setForm(f => ({ ...f, commission_rate: e.target.value }))} /></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button><Button onClick={save}>{editId ? 'Update' : 'Create'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminSellerPackages;
