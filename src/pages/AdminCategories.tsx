import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Layers,
  Plus,
  Edit,
  Trash2,
  Loader2,
  ChevronRight,
  ChevronDown,
  GripVertical,
  FolderOpen,
  Folder,
  Image as ImageIcon,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  image: string | null;
  parent_id: string | null;
  sort_order: number | null;
  created_at: string;
  children?: Category[];
}

const emptyForm = {
  name: '',
  slug: '',
  icon: '',
  image: '',
  parent_id: '',
};

const AdminCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [flatCategories, setFlatCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (!error && data) {
      setFlatCategories(data);
      // Build tree
      const map = new Map<string, Category>();
      const roots: Category[] = [];
      data.forEach(c => map.set(c.id, { ...c, children: [] }));
      data.forEach(c => {
        const node = map.get(c.id)!;
        if (c.parent_id && map.has(c.parent_id)) {
          map.get(c.parent_id)!.children!.push(node);
        } else {
          roots.push(node);
        }
      });
      setCategories(roots);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const openNew = (parentId?: string) => {
    setEditCategory(null);
    setForm({ ...emptyForm, parent_id: parentId || '' });
    setFormOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditCategory(cat);
    setForm({
      name: cat.name,
      slug: cat.slug,
      icon: cat.icon || '',
      image: cat.image || '',
      parent_id: cat.parent_id || '',
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.slug) {
      toast.error('Name and slug are required');
      return;
    }
    setSaving(true);

    const payload = {
      name: form.name,
      slug: form.slug,
      icon: form.icon || null,
      image: form.image || null,
      parent_id: form.parent_id || null,
    };

    let error;
    if (editCategory) {
      ({ error } = await supabase.from('categories').update(payload).eq('id', editCategory.id));
    } else {
      // Get max sort_order for siblings
      const siblings = flatCategories.filter(c => (c.parent_id || '') === (form.parent_id || ''));
      const maxOrder = siblings.reduce((max, c) => Math.max(max, c.sort_order || 0), 0);
      ({ error } = await supabase.from('categories').insert({ ...payload, sort_order: maxOrder + 1 }));
    }

    if (error) {
      toast.error('Failed to save: ' + error.message);
    } else {
      toast.success(editCategory ? 'Category updated!' : 'Category created!');
      setFormOpen(false);
      fetchCategories();
    }
    setSaving(false);
  };

  const deleteCategory = async (id: string) => {
    // Check for children
    const hasChildren = flatCategories.some(c => c.parent_id === id);
    if (hasChildren) {
      toast.error('Cannot delete category with subcategories. Delete children first.');
      return;
    }
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (!error) {
      toast.success('Category deleted');
      fetchCategories();
    } else {
      toast.error('Delete failed: ' + error.message);
    }
  };

  const moveCategory = async (id: string, direction: 'up' | 'down') => {
    const cat = flatCategories.find(c => c.id === id);
    if (!cat) return;

    const siblings = flatCategories
      .filter(c => (c.parent_id || '') === (cat.parent_id || ''))
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    const idx = siblings.findIndex(c => c.id === id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= siblings.length) return;

    const currentOrder = cat.sort_order || 0;
    const swapOrder = siblings[swapIdx].sort_order || 0;

    await Promise.all([
      supabase.from('categories').update({ sort_order: swapOrder }).eq('id', id),
      supabase.from('categories').update({ sort_order: currentOrder }).eq('id', siblings[swapIdx].id),
    ]);

    fetchCategories();
  };

  const renderCategoryTree = (cats: Category[], depth = 0) => {
    return cats.map((cat) => {
      const hasChildren = cat.children && cat.children.length > 0;
      const isExpanded = expandedIds.has(cat.id);

      return (
        <div key={cat.id}>
          <div
            className={`flex items-center gap-2 py-2.5 px-3 hover:bg-muted/50 transition-colors border-b border-border ${
              depth > 0 ? 'bg-muted/20' : ''
            }`}
            style={{ paddingLeft: `${12 + depth * 24}px` }}
          >
            {/* Expand/Collapse */}
            <button
              onClick={() => hasChildren && toggleExpand(cat.id)}
              className={`h-5 w-5 flex items-center justify-center rounded ${
                hasChildren ? 'hover:bg-muted cursor-pointer' : 'opacity-0'
              }`}
            >
              {hasChildren && (isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />)}
            </button>

            {/* Icon */}
            <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
              {cat.image ? (
                <img src={cat.image} alt="" className="h-6 w-6 rounded object-cover" />
              ) : cat.icon ? (
                <span className="text-sm">{cat.icon}</span>
              ) : (
                hasChildren ? <FolderOpen className="h-4 w-4 text-accent" /> : <Folder className="h-4 w-4 text-muted-foreground" />
              )}
            </div>

            {/* Name */}
            <div className="flex-1 min-w-0">
              <span className="font-medium text-sm">{cat.name}</span>
              <span className="text-xs text-muted-foreground ml-2">/{cat.slug}</span>
            </div>

            {/* Children count */}
            {hasChildren && (
              <Badge variant="secondary" className="text-xs">
                {cat.children!.length} sub
              </Badge>
            )}

            {/* Sort buttons */}
            <div className="flex items-center gap-0.5">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveCategory(cat.id, 'up')}>
                <ArrowUp className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveCategory(cat.id, 'down')}>
                <ArrowDown className="h-3 w-3" />
              </Button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-0.5">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openNew(cat.id)} title="Add subcategory">
                <Plus className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(cat)}>
                <Edit className="h-3.5 w-3.5" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Category</AlertDialogTitle>
                    <AlertDialogDescription>Delete "{cat.name}"? This cannot be undone.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteCategory(cat.id)} className="bg-destructive text-destructive-foreground">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {/* Children */}
          {hasChildren && isExpanded && renderCategoryTree(cat.children!, depth + 1)}
        </div>
      );
    });
  };

  return (
    <AdminLayout title="Categories" description="Organize your product catalog with nested categories">
      <Card className="border border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Layers className="h-5 w-5" />
            Category Tree ({flatCategories.length} categories)
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (expandedIds.size > 0) setExpandedIds(new Set());
                else setExpandedIds(new Set(flatCategories.filter(c => flatCategories.some(ch => ch.parent_id === c.id)).map(c => c.id)));
              }}
            >
              {expandedIds.size > 0 ? 'Collapse All' : 'Expand All'}
            </Button>
            <Button onClick={() => openNew()} size="sm" className="gap-1">
              <Plus className="h-4 w-4" /> Add Category
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Layers className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No categories yet. Add your first category.</p>
            </div>
          ) : (
            <div>{renderCategoryTree(categories)}</div>
          )}
        </CardContent>
      </Card>

      {/* Category Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={e => {
                  const name = e.target.value;
                  setForm(f => ({ ...f, name, slug: editCategory ? f.slug : generateSlug(name) }));
                }}
                placeholder="Electronics"
              />
            </div>
            <div>
              <Label>Slug *</Label>
              <Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="electronics" />
            </div>
            <div>
              <Label>Parent Category</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={form.parent_id}
                onChange={e => setForm(f => ({ ...f, parent_id: e.target.value }))}
              >
                <option value="">None (Top Level)</option>
                {flatCategories
                  .filter(c => c.id !== editCategory?.id)
                  .map(c => (
                    <option key={c.id} value={c.id}>
                      {c.parent_id ? '  ↳ ' : ''}{c.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Icon (emoji)</Label>
                <Input value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} placeholder="📱" />
              </div>
              <div>
                <Label>Image URL</Label>
                <Input value={form.image} onChange={e => setForm(f => ({ ...f, image: e.target.value }))} placeholder="https://..." />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editCategory ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminCategories;
