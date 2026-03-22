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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Ruler, Plus, Edit, Trash2, Loader2, X } from 'lucide-react';

interface Measurements {
  columns: string[];
  data: Record<string, string[]>;
}

const DEFAULT_MEASUREMENTS: Measurements = { columns: [], data: {} };
const PRESET_COLUMNS = ['Chest (in)', 'Waist (in)', 'Hip (in)', 'Length (in)', 'Shoulder (in)', 'Sleeve (in)'];

const AdminSizeGuides = () => {
  const [guides, setGuides] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', category_id: '', sizes: [] as string[] });
  const [measurements, setMeasurements] = useState<Measurements>(DEFAULT_MEASUREMENTS);
  const [newSize, setNewSize] = useState('');
  const [newColumn, setNewColumn] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [{ data: g }, { data: c }] = await Promise.all([
      supabase.from('size_guides').select('*, categories(name)').order('name'),
      supabase.from('categories').select('id, name').order('name'),
    ]);
    if (g) setGuides(g);
    if (c) setCategories(c);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', category_id: 'all', sizes: [] });
    setMeasurements({ columns: ['Chest (in)', 'Waist (in)', 'Hip (in)'], data: {} });
    setDialogOpen(true);
  };

  const openEdit = (g: any) => {
    setEditing(g);
    const sizes = Array.isArray(g.sizes) ? g.sizes : [];
    setForm({ name: g.name, category_id: g.category_id || 'all', sizes });
    const m = g.measurements as any;
    if (m && Array.isArray(m.columns)) {
      setMeasurements({ columns: m.columns, data: m.data || {} });
    } else {
      setMeasurements({ columns: ['Chest (in)', 'Waist (in)', 'Hip (in)'], data: {} });
    }
    setDialogOpen(true);
  };

  const addSize = () => {
    if (!newSize.trim()) return;
    const s = newSize.trim();
    setForm(f => ({ ...f, sizes: [...f.sizes, s] }));
    setMeasurements(m => ({
      ...m,
      data: { ...m.data, [s]: m.columns.map(() => '') }
    }));
    setNewSize('');
  };

  const removeSize = (idx: number) => {
    const removed = form.sizes[idx];
    setForm(f => ({ ...f, sizes: f.sizes.filter((_, i) => i !== idx) }));
    setMeasurements(m => {
      const newData = { ...m.data };
      delete newData[removed];
      return { ...m, data: newData };
    });
  };

  const addColumn = (col?: string) => {
    const c = (col || newColumn).trim();
    if (!c || measurements.columns.includes(c)) return;
    setMeasurements(m => ({
      columns: [...m.columns, c],
      data: Object.fromEntries(
        Object.entries(m.data).map(([size, vals]) => [size, [...vals, '']])
      )
    }));
    setNewColumn('');
  };

  const removeColumn = (colIdx: number) => {
    setMeasurements(m => ({
      columns: m.columns.filter((_, i) => i !== colIdx),
      data: Object.fromEntries(
        Object.entries(m.data).map(([size, vals]) => [size, vals.filter((_, i) => i !== colIdx)])
      )
    }));
  };

  const updateCell = (size: string, colIdx: number, value: string) => {
    setMeasurements(m => {
      const row = [...(m.data[size] || m.columns.map(() => ''))];
      row[colIdx] = value;
      return { ...m, data: { ...m.data, [size]: row } };
    });
  };

  const handleSave = async () => {
    if (!form.name) { toast.error('Name required'); return; }
    setSaving(true);
    const payload = {
      name: form.name,
      category_id: form.category_id === 'all' ? null : form.category_id || null,
      sizes: form.sizes,
      measurements: JSON.parse(JSON.stringify(measurements)),
    };
    const { error } = editing
      ? await supabase.from('size_guides').update(payload).eq('id', editing.id)
      : await supabase.from('size_guides').insert(payload);
    if (error) { toast.error(error.message); } else { toast.success(editing ? 'Updated' : 'Created'); setDialogOpen(false); fetchData(); }
    setSaving(false);
  };

  const toggleActive = async (id: string, v: boolean) => { await supabase.from('size_guides').update({ is_active: v }).eq('id', id); fetchData(); };
  const deleteGuide = async (id: string) => { await supabase.from('size_guides').delete().eq('id', id); toast.success('Deleted'); fetchData(); };

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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit Size Guide' : 'Add Size Guide'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {/* Name & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Men's Clothing" /></div>
              <div><Label>Category</Label>
                <Select value={form.category_id} onValueChange={v => setForm(f => ({ ...f, category_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="All categories" /></SelectTrigger>
                  <SelectContent><SelectItem value="all">All</SelectItem>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            {/* Sizes */}
            <div>
              <Label>Sizes</Label>
              <div className="flex gap-2 mt-1">
                <Input value={newSize} onChange={e => setNewSize(e.target.value)} placeholder="Add size (e.g. S, M, L)..." onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSize())} />
                <Button variant="outline" onClick={addSize} size="sm">Add</Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {form.sizes.map((s, i) => (
                  <Badge key={i} variant="secondary" className="gap-1 text-xs">
                    {s}
                    <button onClick={() => removeSize(i)}><X className="h-3 w-3" /></button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Measurement Columns */}
            <div>
              <Label>Measurement Columns</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {PRESET_COLUMNS.filter(p => !measurements.columns.includes(p)).map(p => (
                  <Button key={p} variant="outline" size="sm" className="text-xs h-7" onClick={() => addColumn(p)}>
                    <Plus className="h-3 w-3 mr-1" />{p}
                  </Button>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <Input value={newColumn} onChange={e => setNewColumn(e.target.value)} placeholder="Custom column name..." onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addColumn())} className="text-sm" />
                <Button variant="outline" onClick={() => addColumn()} size="sm">Add</Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {measurements.columns.map((col, i) => (
                  <Badge key={i} variant="secondary" className="gap-1 text-xs">
                    {col}
                    <button onClick={() => removeColumn(i)}><X className="h-3 w-3" /></button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Measurement Chart Table */}
            {form.sizes.length > 0 && measurements.columns.length > 0 && (
              <div>
                <Label className="mb-2 block">Measurement Chart</Label>
                <div className="border border-border rounded-lg overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-20 font-semibold text-xs">Size</TableHead>
                        {measurements.columns.map((col, i) => (
                          <TableHead key={i} className="text-xs font-semibold min-w-[80px]">{col}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {form.sizes.map(size => (
                        <TableRow key={size}>
                          <TableCell className="font-medium text-sm py-1">{size}</TableCell>
                          {measurements.columns.map((_, colIdx) => (
                            <TableCell key={colIdx} className="py-1 px-1">
                              <Input
                                value={(measurements.data[size] || [])[colIdx] || ''}
                                onChange={e => updateCell(size, colIdx, e.target.value)}
                                className="h-8 text-xs"
                                placeholder="—"
                              />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminSizeGuides;
