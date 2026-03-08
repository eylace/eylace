import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Percent, Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const AdminCategoryDiscount = () => {
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ category_id: '', discount_type: 'percentage', discount_value: '', expires_at: '' });
  const [saving, setSaving] = useState(false);

  const fetch = async () => {
    setLoading(true);
    const [{ data: d }, { data: c }] = await Promise.all([
      supabase.from('category_discounts').select('*, categories(name)').order('created_at', { ascending: false }),
      supabase.from('categories').select('id, name').order('name'),
    ]);
    if (d) setDiscounts(d);
    if (c) setCategories(c);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const openNew = () => { setEditing(null); setForm({ category_id: '', discount_type: 'percentage', discount_value: '', expires_at: '' }); setDialogOpen(true); };
  const openEdit = (d: any) => { setEditing(d); setForm({ category_id: d.category_id, discount_type: d.discount_type, discount_value: String(d.discount_value), expires_at: d.expires_at ? d.expires_at.slice(0, 16) : '' }); setDialogOpen(true); };

  const handleSave = async () => {
    if (!form.category_id || !form.discount_value) { toast.error('Category and value required'); return; }
    setSaving(true);
    const payload = {
      category_id: form.category_id, discount_type: form.discount_type,
      discount_value: parseFloat(form.discount_value),
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
    };
    const { error } = editing
      ? await supabase.from('category_discounts').update(payload).eq('id', editing.id)
      : await supabase.from('category_discounts').insert(payload);
    if (error) { toast.error(error.message); } else { toast.success(editing ? 'Updated' : 'Created'); setDialogOpen(false); fetch(); }
    setSaving(false);
  };

  const toggleActive = async (id: string, v: boolean) => { await supabase.from('category_discounts').update({ is_active: v }).eq('id', id); fetch(); };
  const deleteDiscount = async (id: string) => { await supabase.from('category_discounts').delete().eq('id', id); toast.success('Deleted'); fetch(); };

  if (loading) return <AdminLayout title="Category Discounts"><div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div></AdminLayout>;

  return (
    <AdminLayout title="Category Based Discount" description="Set discounts per category">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base"><Percent className="h-5 w-5" />Category Discounts ({discounts.length})</CardTitle>
          <Button size="sm" onClick={openNew} className="gap-1"><Plus className="h-4 w-4" />Add Discount</Button>
        </CardHeader>
        <CardContent>
          {discounts.length === 0 ? <p className="text-center py-8 text-muted-foreground">No category discounts yet</p> : (
            <div className="space-y-3">
              {discounts.map(d => (
                <div key={d.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 border border-border rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{(d as any).categories?.name || 'Unknown'}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{d.discount_type === 'percentage' ? `${d.discount_value}%` : `$${d.discount_value}`} off</Badge>
                      {d.expires_at && <span className="text-xs text-muted-foreground">Expires: {format(new Date(d.expires_at), 'MMM d, yyyy')}</span>}
                      <Badge variant={d.is_active ? 'default' : 'secondary'} className="text-xs">{d.is_active ? 'Active' : 'Inactive'}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch checked={d.is_active} onCheckedChange={v => toggleActive(d.id, v)} />
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(d)}><Edit className="h-4 w-4" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                      <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Discount</AlertDialogTitle><AlertDialogDescription>Remove this category discount?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteDiscount(d.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? 'Edit Category Discount' : 'Add Category Discount'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Category *</Label>
              <Select value={form.category_id} onValueChange={v => setForm(f => ({ ...f, category_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Type</Label>
                <Select value={form.discount_type} onValueChange={v => setForm(f => ({ ...f, discount_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="percentage">Percentage</SelectItem><SelectItem value="fixed">Fixed Amount</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Value *</Label><Input type="number" value={form.discount_value} onChange={e => setForm(f => ({ ...f, discount_value: e.target.value }))} /></div>
            </div>
            <div><Label>Expires At</Label><Input type="datetime-local" value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}{editing ? 'Update' : 'Create'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminCategoryDiscount;
