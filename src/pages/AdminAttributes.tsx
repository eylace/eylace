import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Tag, Plus, Edit, Trash2, Loader2, X } from 'lucide-react';

const AdminAttributes = () => {
  const [attrs, setAttrs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', values: [] as string[] });
  const [newValue, setNewValue] = useState('');
  const [saving, setSaving] = useState(false);

  const fetch = async () => { setLoading(true); const { data } = await supabase.from('product_attributes').select('*').order('name'); if (data) setAttrs(data); setLoading(false); };
  useEffect(() => { fetch(); }, []);

  const openNew = () => { setEditing(null); setForm({ name: '', values: [] }); setDialogOpen(true); };
  const openEdit = (a: any) => { setEditing(a); setForm({ name: a.name, values: a.values || [] }); setDialogOpen(true); };

  const addValue = () => {
    if (!newValue.trim()) return;
    setForm(f => ({ ...f, values: [...f.values, newValue.trim()] }));
    setNewValue('');
  };

  const handleSave = async () => {
    if (!form.name) { toast.error('Name required'); return; }
    setSaving(true);
    const { error } = editing
      ? await supabase.from('product_attributes').update({ name: form.name, values: form.values }).eq('id', editing.id)
      : await supabase.from('product_attributes').insert({ name: form.name, values: form.values });
    if (error) { toast.error(error.message); } else { toast.success(editing ? 'Updated' : 'Created'); setDialogOpen(false); fetch(); }
    setSaving(false);
  };

  const toggleActive = async (id: string, v: boolean) => { await supabase.from('product_attributes').update({ is_active: v }).eq('id', id); fetch(); };
  const deleteAttr = async (id: string) => { await supabase.from('product_attributes').delete().eq('id', id); toast.success('Deleted'); fetch(); };

  if (loading) return <AdminLayout title="Attributes"><div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div></AdminLayout>;

  return (
    <AdminLayout title="Attributes" description="Manage product attribute types">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base"><Tag className="h-5 w-5" />Attributes ({attrs.length})</CardTitle>
          <Button size="sm" onClick={openNew} className="gap-1"><Plus className="h-4 w-4" />Add Attribute</Button>
        </CardHeader>
        <CardContent>
          {attrs.length === 0 ? <p className="text-center py-8 text-muted-foreground">No attributes yet</p> : (
            <div className="space-y-3">
              {attrs.map(a => (
                <div key={a.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 border border-border rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{a.name}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(a.values || []).map((v: string, i: number) => <Badge key={i} variant="secondary" className="text-xs">{v}</Badge>)}
                      {(!a.values || a.values.length === 0) && <span className="text-xs text-muted-foreground">No values defined</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch checked={a.is_active} onCheckedChange={v => toggleActive(a.id, v)} />
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(a)}><Edit className="h-4 w-4" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                      <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Attribute</AlertDialogTitle><AlertDialogDescription>Delete "{a.name}"?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteAttr(a.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
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
          <DialogHeader><DialogTitle>{editing ? 'Edit Attribute' : 'Add Attribute'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Attribute Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Material, Weight" /></div>
            <div>
              <Label>Values</Label>
              <div className="flex gap-2 mt-1">
                <Input value={newValue} onChange={e => setNewValue(e.target.value)} placeholder="Add value..." onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addValue())} />
                <Button variant="outline" onClick={addValue} type="button">Add</Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {form.values.map((v, i) => (
                  <Badge key={i} variant="secondary" className="gap-1 text-xs">
                    {v}
                    <button onClick={() => setForm(f => ({ ...f, values: f.values.filter((_, idx) => idx !== i) }))}><X className="h-3 w-3" /></button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}{editing ? 'Update' : 'Create'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminAttributes;
