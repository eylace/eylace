import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Loader2, Plus, Trash2, Edit, ShieldCheck, GripVertical } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const defaultForm = { field_name: '', field_type: 'text', is_required: true, sort_order: '0' };

const AdminSellerVerification = () => {
  const [fields, setFields] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const { data } = await supabase.from('seller_verification_fields').select('*').order('sort_order');
    if (data) setFields(data);
    setIsLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const save = async () => {
    if (!form.field_name) { toast.error('Field name required'); return; }
    const payload = { field_name: form.field_name, field_type: form.field_type, is_required: form.is_required, sort_order: parseInt(form.sort_order) };
    if (editId) {
      const { error } = await supabase.from('seller_verification_fields').update(payload).eq('id', editId);
      if (!error) toast.success('Updated'); else { toast.error(error.message); return; }
    } else {
      const { error } = await supabase.from('seller_verification_fields').insert(payload);
      if (!error) toast.success('Created'); else { toast.error(error.message); return; }
    }
    setShowForm(false); setEditId(null); setForm(defaultForm); fetchData();
  };

  const toggle = async (id: string, current: boolean) => {
    await supabase.from('seller_verification_fields').update({ is_active: !current }).eq('id', id);
    fetchData();
  };

  const remove = async (id: string) => {
    await supabase.from('seller_verification_fields').delete().eq('id', id);
    toast.success('Deleted'); fetchData();
  };

  const openEdit = (f: any) => {
    setEditId(f.id);
    setForm({ field_name: f.field_name, field_type: f.field_type, is_required: f.is_required, sort_order: String(f.sort_order) });
    setShowForm(true);
  };

  const fieldTypes = ['text', 'textarea', 'number', 'email', 'phone', 'file', 'select', 'date'];

  return (
    <AdminLayout titleKey="admin.sellers.verification" descriptionKey="admin.sellers.verificationDesc">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="text-lg flex items-center gap-2"><ShieldCheck className="h-5 w-5" /> Seller Verification Form</CardTitle>
              <CardDescription>Configure the fields sellers must fill to get verified.</CardDescription>
            </div>
            <Button size="sm" onClick={() => { setEditId(null); setForm(defaultForm); setShowForm(true); }}><Plus className="h-4 w-4 mr-1" /> Add Field</Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div> : fields.length === 0 ? <p className="text-center text-muted-foreground py-8">No verification fields configured</p> : (
            <Table>
              <TableHeader><TableRow><TableHead>Order</TableHead><TableHead>Field Name</TableHead><TableHead>Type</TableHead><TableHead>Required</TableHead><TableHead>Active</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {fields.map(f => (
                  <TableRow key={f.id}>
                    <TableCell><span className="text-muted-foreground">{f.sort_order}</span></TableCell>
                    <TableCell className="font-medium">{f.field_name}</TableCell>
                    <TableCell><Badge variant="outline">{f.field_type}</Badge></TableCell>
                    <TableCell>{f.is_required ? <Badge className="bg-accent/10 text-accent">Required</Badge> : <Badge variant="secondary">Optional</Badge>}</TableCell>
                    <TableCell><Switch checked={f.is_active} onCheckedChange={() => toggle(f.id, f.is_active)} /></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(f)}><Edit className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove(f.id)}><Trash2 className="h-4 w-4" /></Button>
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
          <DialogHeader><DialogTitle>{editId ? 'Edit' : 'Add'} Verification Field</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Field Name</Label><Input value={form.field_name} onChange={e => setForm(f => ({ ...f, field_name: e.target.value }))} placeholder="e.g. Business License Number" /></div>
            <div><Label>Field Type</Label>
              <Select value={form.field_type} onValueChange={v => setForm(f => ({ ...f, field_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{fieldTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={form.is_required} onCheckedChange={c => setForm(f => ({ ...f, is_required: !!c }))} />
              <Label>Required</Label>
            </div>
            <div><Label>Sort Order</Label><Input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button><Button onClick={save}>{editId ? 'Update' : 'Create'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminSellerVerification;
