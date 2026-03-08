import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Type, Plus, Edit, Trash2, Loader2 } from 'lucide-react';

const AdminLabels = () => {
  const [labels, setLabels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', color: '#3b82f6' });
  const [saving, setSaving] = useState(false);

  const fetch = async () => { setLoading(true); const { data } = await supabase.from('product_labels').select('*').order('name'); if (data) setLabels(data); setLoading(false); };
  useEffect(() => { fetch(); }, []);

  const openNew = () => { setEditing(null); setForm({ name: '', color: '#3b82f6' }); setDialogOpen(true); };
  const openEdit = (l: any) => { setEditing(l); setForm({ name: l.name, color: l.color }); setDialogOpen(true); };

  const handleSave = async () => {
    if (!form.name) { toast.error('Name required'); return; }
    setSaving(true);
    const { error } = editing
      ? await supabase.from('product_labels').update(form).eq('id', editing.id)
      : await supabase.from('product_labels').insert(form);
    if (error) { toast.error(error.message); } else { toast.success(editing ? 'Updated' : 'Created'); setDialogOpen(false); fetch(); }
    setSaving(false);
  };

  const toggleActive = async (id: string, v: boolean) => { await supabase.from('product_labels').update({ is_active: v }).eq('id', id); fetch(); };
  const deleteLabel = async (id: string) => { await supabase.from('product_labels').delete().eq('id', id); toast.success('Deleted'); fetch(); };

  if (loading) return <AdminLayout title="Custom Labels"><div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div></AdminLayout>;

  return (
    <AdminLayout title="Custom Labels" description="Manage product labels like 'New', 'Bestseller', 'Hot'">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base"><Type className="h-5 w-5" />Custom Labels ({labels.length})</CardTitle>
          <Button size="sm" onClick={openNew} className="gap-1"><Plus className="h-4 w-4" />Add Label</Button>
        </CardHeader>
        <CardContent>
          {labels.length === 0 ? <p className="text-center py-8 text-muted-foreground">No labels yet</p> : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {labels.map(l => (
                <div key={l.id} className="flex items-center gap-3 p-3 border border-border rounded-lg">
                  <div className="h-8 px-3 rounded-full flex items-center text-white text-xs font-bold" style={{ backgroundColor: l.color }}>{l.name}</div>
                  <div className="flex-1" />
                  <Switch checked={l.is_active} onCheckedChange={v => toggleActive(l.id, v)} />
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(l)}><Edit className="h-4 w-4" /></Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                    <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Label</AlertDialogTitle><AlertDialogDescription>Delete "{l.name}"?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteLabel(l.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editing ? 'Edit Label' : 'Add Label'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Label Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. New Arrival" /></div>
            <div><Label>Color</Label><div className="flex gap-2"><input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} className="h-10 w-14 rounded border cursor-pointer" /><Input value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} /></div></div>
            <div className="text-center"><div className="inline-block px-4 py-1.5 rounded-full text-white text-sm font-bold" style={{ backgroundColor: form.color }}>{form.name || 'Preview'}</div></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}{editing ? 'Update' : 'Create'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminLabels;
