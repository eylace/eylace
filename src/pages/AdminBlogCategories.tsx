import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const initialCategories = [
  { id: 1, name: 'Fashion', slug: 'fashion', posts: 12 },
  { id: 2, name: 'Tech', slug: 'tech', posts: 8 },
  { id: 3, name: 'Deals', slug: 'deals', posts: 5 },
  { id: 4, name: 'Sellers', slug: 'sellers', posts: 3 },
  { id: 5, name: 'News', slug: 'news', posts: 7 },
];

export default function AdminBlogCategories() {
  const [categories, setCategories] = useState(initialCategories);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', slug: '' });

  const openAdd = () => { setForm({ name: '', slug: '' }); setEditId(null); setShowModal(true); };
  const openEdit = (cat: typeof initialCategories[0]) => { setForm({ name: cat.name, slug: cat.slug }); setEditId(cat.id); setShowModal(true); };

  const handleSave = () => {
    if (!form.name) { toast.error('Name is required'); return; }
    if (editId) {
      setCategories(prev => prev.map(c => c.id === editId ? { ...c, ...form } : c));
      toast.success('Category updated');
    } else {
      setCategories(prev => [...prev, { id: Date.now(), ...form, posts: 0 }]);
      toast.success('Category created');
    }
    setShowModal(false);
  };

  const handleDelete = (id: number) => {
    setCategories(prev => prev.filter(c => c.id !== id));
    toast.success('Category deleted');
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Blog Categories</h1>
          <Button onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Add Category</Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Posts</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map(c => (
                  <TableRow key={c.id}>
                    <TableCell>{c.id}</TableCell>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell><Badge variant="outline">{c.slug}</Badge></TableCell>
                    <TableCell>{c.posts}</TableCell>
                    <TableCell className="space-x-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(c)}><Edit className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(c.id)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? 'Edit' : 'Add'} Category</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name</Label><Input value={form.name} onChange={e => setForm({ name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') })} /></div>
            <div><Label>Slug</Label><Input value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button onClick={handleSave}>{editId ? 'Update' : 'Create'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
