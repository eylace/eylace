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
import { Ruler, Plus, Edit, Trash2, Loader2, X } from 'lucide-react';

const AdminSizeGuides = () => {
  const [guides, setGuides] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', category_id: '', sizes: [] as string[] });
  const [newSize, setNewSize] = useState('');
  const [saving, setSaving] = useState(false);

  const fetch = async () => {
    setLoading(true);
    const [{ data: g }, { data: c }] = await Promise.all([
      supabase.from('size_guides').select('*, categories(name)').order('name'),
      supabase.from('categories').select('id, name').order('name'),
    ]);
    if (g) setGuides(g);
    if (c) setCategories(c);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const openNew = () => { setEditing(null); setForm({ name: '', category_id: 'all', sizes: [] }); setDialogOpen(true); };
  const openEdit = (g: any) => {
    setEditing(g);
    const sizes = Array.isArray(g.sizes) ? g.sizes : [];
    setForm({ name: g.name, category_id: g.category_id || 'all', sizes });
    setDialogOpen(true);
  };

  const addSize = () => { if (!newSize.trim()) return; setForm(f => ({ ...f, sizes: [...f.sizes, newSize.trim()] })); setNewSize(''); };

  const handleSave = async () => {
    if (!form.name) { toast.error('Name required'); return; }
    setSaving(true);
    const payload = { name: form.name, category_id: form.category_id === 'all' ? null : form.category_id || null, sizes: form.sizes };
    const { error } = editing
      ? await supabase.from('size_guides').update(payload).eq('id', editing.id)
      : await supabase.from('size_guides').insert(payload);
    if (error) { toast.error(error.message); } else { toast.success(editing ? 'Updated' : 'Created'); setDialogOpen(false); fetch(); }
    setSaving(false);
  };

  const toggleActive = async (id: string, v: boolean) => { await supabase.from('size_guides').update({ is_active: v }).eq('id', id); fetch(); };
  const deleteGuide = async (id: string) => { await supabase.from('size_guides').delete().eq('id', id); toast.success('Deleted'); fetch(); };

  if (loading) return <AdminLayout title="Size Guides"><div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div></AdminLayout>;

  return (
    <AdminLayout title="Size Guides" description="Manage size charts for product categories">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base"><Ruler className="h-5 w-5" />Size Guides ({guides.length})</CardTitle>
          <Button size="sm" onClick={openNew} className="gap-1"><Plus className="h-4 w-4" />Add Size Guide</Button>
        </CardHeader>
        <CardContent>
          {guides.length === 0 ? <p className="text-center py-8 text-muted-foreground">No size guides yet</p> : (
            <div className="space-y-3">
              {guides.map(g => (
                <div key={g.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 border border-border rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{g.name}</p>
                    <p className="text-xs text-muted-foreground">{(g as any).categories?.name || 'All categories'}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(Array.isArray(g.sizes) ? g.sizes : []).map((s: string, i: number) => <Badge key={i} variant="outline" className="text-xs">{s}</Badge>)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch checked={g.is_active} onCheckedChange={v => toggleActive(g.id, v)} />
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(g)}><Edit className="h-4 w-4" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                      <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Size Guide</AlertDialogTitle><AlertDialogDescription>Delete "{g.name}"?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteGuide(g.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
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
          <DialogHeader><DialogTitle>{editing ? 'Edit Size Guide' : 'Add Size Guide'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Men's Clothing" /></div>
            <div><Label>Category</Label>
              <Select value={form.category_id} onValueChange={v => setForm(f => ({ ...f, category_id: v }))}>
                <SelectTrigger><SelectValue placeholder="All categories" /></SelectTrigger>
                <SelectContent><SelectItem value="all">All</SelectItem>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Sizes</Label>
              <div className="flex gap-2 mt-1"><Input value={newSize} onChange={e => setNewSize(e.target.value)} placeholder="Add size..." onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSize())} /><Button variant="outline" onClick={addSize}>Add</Button></div>
              <div className="flex flex-wrap gap-1 mt-2">
                {form.sizes.map((s, i) => <Badge key={i} variant="secondary" className="gap-1 text-xs">{s}<button onClick={() => setForm(f => ({ ...f, sizes: f.sizes.filter((_, idx) => idx !== i) }))}><X className="h-3 w-3" /></button></Badge>)}
              </div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}{editing ? 'Update' : 'Create'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminSizeGuides;
