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
import { Palette, Plus, Edit, Trash2, Loader2 } from 'lucide-react';

const AdminColors = () => {
  const [colors, setColors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', hex_code: '#000000' });
  const [saving, setSaving] = useState(false);

  const fetch = async () => { setLoading(true); const { data } = await supabase.from('colors').select('*').order('name'); if (data) setColors(data); setLoading(false); };
  useEffect(() => { fetch(); }, []);

  const openNew = () => { setEditing(null); setForm({ name: '', hex_code: '#000000' }); setDialogOpen(true); };
  const openEdit = (c: any) => { setEditing(c); setForm({ name: c.name, hex_code: c.hex_code }); setDialogOpen(true); };

  const handleSave = async () => {
    if (!form.name) { toast.error('Name required'); return; }
    setSaving(true);
    const { error } = editing
      ? await supabase.from('colors').update(form).eq('id', editing.id)
      : await supabase.from('colors').insert(form);
    if (error) { toast.error(error.message); } else { toast.success(editing ? 'Updated' : 'Created'); setDialogOpen(false); fetch(); }
    setSaving(false);
  };

  const toggleActive = async (id: string, v: boolean) => { await supabase.from('colors').update({ is_active: v }).eq('id', id); fetch(); };
  const deleteColor = async (id: string) => { await supabase.from('colors').delete().eq('id', id); toast.success('Deleted'); fetch(); };

  if (loading) return <AdminLayout title="Colors"><div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div></AdminLayout>;

  return (
    <AdminLayout title="Colors" description="Manage product color options">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base"><Palette className="h-5 w-5" />Colors ({colors.length})</CardTitle>
          <Button size="sm" onClick={openNew} className="gap-1"><Plus className="h-4 w-4" />Add Color</Button>
        </CardHeader>
        <CardContent>
          {colors.length === 0 ? <p className="text-center py-8 text-muted-foreground">No colors yet</p> : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {colors.map(c => (
                <div key={c.id} className="flex items-center gap-3 p-3 border border-border rounded-lg">
                  <div className="h-8 w-8 rounded-full border-2 border-border shrink-0" style={{ backgroundColor: c.hex_code }} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.hex_code}</p>
                  </div>
                  <Switch checked={c.is_active} onCheckedChange={v => toggleActive(c.id, v)} />
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}><Edit className="h-3.5 w-3.5" /></Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button></AlertDialogTrigger>
                    <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Color</AlertDialogTitle><AlertDialogDescription>Delete "{c.name}"?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteColor(c.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editing ? 'Edit Color' : 'Add Color'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><Label>Hex Code</Label><div className="flex gap-2"><input type="color" value={form.hex_code} onChange={e => setForm(f => ({ ...f, hex_code: e.target.value }))} className="h-10 w-14 rounded border cursor-pointer" /><Input value={form.hex_code} onChange={e => setForm(f => ({ ...f, hex_code: e.target.value }))} /></div></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}{editing ? 'Update' : 'Create'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminColors;
