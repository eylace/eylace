import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ShieldCheck, Plus, Edit, Trash2, Loader2 } from 'lucide-react';

const AdminWarranties = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', duration: '', description: '' });
  const [saving, setSaving] = useState(false);

  const fetch = async () => { setLoading(true); const { data } = await supabase.from('warranties').select('*').order('name'); if (data) setItems(data); setLoading(false); };
  useEffect(() => { fetch(); }, []);

  const openNew = () => { setEditing(null); setForm({ name: '', duration: '', description: '' }); setDialogOpen(true); };
  const openEdit = (w: any) => { setEditing(w); setForm({ name: w.name, duration: w.duration, description: w.description || '' }); setDialogOpen(true); };

  const handleSave = async () => {
    if (!form.name || !form.duration) { toast.error('Name and duration required'); return; }
    setSaving(true);
    const payload = { name: form.name, duration: form.duration, description: form.description || null };
    const { error } = editing
      ? await supabase.from('warranties').update(payload).eq('id', editing.id)
      : await supabase.from('warranties').insert(payload);
    if (error) { toast.error(error.message); } else { toast.success(editing ? 'Updated' : 'Created'); setDialogOpen(false); fetch(); }
    setSaving(false);
  };

  const toggleActive = async (id: string, v: boolean) => { await supabase.from('warranties').update({ is_active: v }).eq('id', id); fetch(); };
  const deleteItem = async (id: string) => { await supabase.from('warranties').delete().eq('id', id); toast.success('Deleted'); fetch(); };

  if (loading) return <AdminLayout title="Warranties"><div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div></AdminLayout>;

  return (
    <AdminLayout title="Warranties" description="Manage warranty options for products">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="h-5 w-5" />Warranties ({items.length})</CardTitle>
          <Button size="sm" onClick={openNew} className="gap-1"><Plus className="h-4 w-4" />Add Warranty</Button>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? <p className="text-center py-8 text-muted-foreground">No warranties yet</p> : (
            <div className="space-y-3">
              {items.map(w => (
                <div key={w.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 border border-border rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{w.name}</p>
                    <p className="text-xs text-muted-foreground">Duration: {w.duration}</p>
                    {w.description && <p className="text-xs text-muted-foreground mt-1">{w.description}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch checked={w.is_active} onCheckedChange={v => toggleActive(w.id, v)} />
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(w)}><Edit className="h-4 w-4" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                      <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Warranty</AlertDialogTitle><AlertDialogDescription>Delete "{w.name}"?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteItem(w.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
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
          <DialogHeader><DialogTitle>{editing ? 'Edit Warranty' : 'Add Warranty'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Standard Warranty" /></div>
            <div><Label>Duration *</Label><Input value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} placeholder="e.g. 1 Year, 6 Months" /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}{editing ? 'Update' : 'Create'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminWarranties;
