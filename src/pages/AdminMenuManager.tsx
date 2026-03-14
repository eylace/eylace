import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Save, Loader2, Plus, Trash2, Edit, ChevronDown, ChevronRight, GripVertical } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { invalidateMenuCache, type MenuItem } from '@/hooks/useMenuConfig';
import { toast } from 'sonner';

const defaultMenu: MenuItem[] = [
  { id: '1', label: "Today's Deals", labelBn: 'আজকের ডিল', url: '/deals', type: 'link', isActive: true, sortOrder: 0, children: [] },
  { id: '2', label: 'Flash Sale', labelBn: 'ফ্ল্যাশ সেল', url: '/flash-sale', type: 'link', isActive: true, sortOrder: 1, children: [] },
  { id: '3', label: 'New Arrivals', labelBn: 'নতুন পণ্য', url: '/new-arrivals', type: 'link', isActive: true, sortOrder: 2, children: [] },
  { id: '4', label: 'Best Sellers', labelBn: 'বেস্ট সেলার', url: '/best-sellers', type: 'link', isActive: true, sortOrder: 3, children: [] },
  { id: '5', label: 'Sell on Eylace', labelBn: 'Eylace-এ বিক্রি করুন', url: '/sell', type: 'link', isActive: true, sortOrder: 4, children: [] },
  { id: '6', label: 'Help & Support', labelBn: 'সাহায্য ও সহায়তা', url: '/help', type: 'link', isActive: true, sortOrder: 5, children: [] },
];

const AdminMenuManager = () => {
  const [items, setItems] = useState<MenuItem[]>(defaultMenu);
  const [loading, setLoading] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [newItem, setNewItem] = useState<Omit<MenuItem, 'id' | 'sortOrder'>>({
    label: '', labelBn: '', url: '', type: 'link', isActive: true, children: [],
  });

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('system_settings').select('value').eq('key', 'menu_config_v1').maybeSingle();
      if (data?.value && Array.isArray(data.value)) {
        setItems(data.value as any);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    const sorted = [...items].sort((a, b) => a.sortOrder - b.sortOrder);
    const { error } = await supabase.from('system_settings').upsert({
      key: 'menu_config_v1',
      value: sorted as any,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'key' });
    if (error) toast.error('Failed to save menu');
    else {
      toast.success('Menu saved successfully!');
      invalidateMenuCache();
    }
    setLoading(false);
  };

  const addItem = () => {
    if (!newItem.label.trim()) return;
    const item: MenuItem = {
      ...newItem,
      id: Date.now().toString(),
      sortOrder: items.length,
    };
    setItems(prev => [...prev, item]);
    setNewItem({ label: '', labelBn: '', url: '', type: 'link', isActive: true, children: [] });
    setAddOpen(false);
    toast.success('Menu item added');
  };

  const updateItem = () => {
    if (!editItem) return;
    setItems(prev => prev.map(i => i.id === editItem.id ? editItem : i));
    setEditItem(null);
    toast.success('Menu item updated');
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    toast.success('Menu item removed');
  };

  const moveItem = (id: string, dir: -1 | 1) => {
    const idx = items.findIndex(i => i.id === id);
    if ((dir === -1 && idx === 0) || (dir === 1 && idx === items.length - 1)) return;
    const newItems = [...items];
    [newItems[idx], newItems[idx + dir]] = [newItems[idx + dir], newItems[idx]];
    newItems.forEach((item, i) => item.sortOrder = i);
    setItems(newItems);
  };

  const addSubItem = (parentId: string) => {
    const child: MenuItem = {
      id: Date.now().toString(),
      label: 'New Sub-item',
      labelBn: '',
      url: '/',
      type: 'link',
      isActive: true,
      sortOrder: 0,
      children: [],
    };
    setItems(prev => prev.map(i => i.id === parentId ? { ...i, children: [...i.children, child] } : i));
    setExpandedItems(prev => new Set([...prev, parentId]));
  };

  const removeSubItem = (parentId: string, childId: string) => {
    setItems(prev => prev.map(i => i.id === parentId ? { ...i, children: i.children.filter(c => c.id !== childId) } : i));
  };

  const updateSubItem = (parentId: string, childId: string, field: string, value: string) => {
    setItems(prev => prev.map(i => i.id === parentId ? {
      ...i, children: i.children.map(c => c.id === childId ? { ...c, [field]: value } : c)
    } : i));
  };

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const typeColors: Record<string, string> = {
    link: 'bg-primary/10 text-primary',
    dropdown: 'bg-accent/10 text-accent',
    mega: 'bg-success/10 text-success',
  };

  return (
    <AdminLayout title="Menu Manager" description="Configure frontend navigation menu items, dropdowns and mega menus">
      <div className="space-y-4">
        <div className="flex justify-between">
          <Button onClick={() => setAddOpen(true)}><Plus className="h-4 w-4 mr-1" /> Add Menu Item</Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
            Save Menu
          </Button>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Navigation Menu Items ({items.length})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {items.sort((a, b) => a.sortOrder - b.sortOrder).map((item) => (
              <div key={item.id} className="border border-border rounded-lg">
                <div className="flex items-center gap-3 p-3">
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{item.label}</span>
                      {item.labelBn && <span className="text-xs text-muted-foreground">({item.labelBn})</span>}
                      <Badge variant="secondary" className={`text-[10px] ${typeColors[item.type] || ''}`}>{item.type}</Badge>
                      {!item.isActive && <Badge variant="outline" className="text-[10px]">Hidden</Badge>}
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">{item.url}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {(item.type === 'dropdown' || item.type === 'mega') && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleExpand(item.id)}>
                        {expandedItems.has(item.id) ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveItem(item.id, -1)}>↑</Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveItem(item.id, 1)}>↓</Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditItem(item)}><Edit className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeItem(item.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>

                {expandedItems.has(item.id) && (item.type === 'dropdown' || item.type === 'mega') && (
                  <div className="border-t border-border px-3 pb-3 pt-2 space-y-2 bg-muted/30">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">Sub-items ({item.children.length})</span>
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => addSubItem(item.id)}>
                        <Plus className="h-3 w-3 mr-1" /> Add Sub-item
                      </Button>
                    </div>
                    {item.children.map(child => (
                      <div key={child.id} className="flex items-center gap-2 pl-4">
                        <Input className="h-8 text-xs" value={child.label} placeholder="Label"
                          onChange={e => updateSubItem(item.id, child.id, 'label', e.target.value)} />
                        <Input className="h-8 text-xs" value={child.labelBn} placeholder="Label (বাংলা)"
                          onChange={e => updateSubItem(item.id, child.id, 'labelBn', e.target.value)} />
                        <Input className="h-8 text-xs" value={child.url} placeholder="/url"
                          onChange={e => updateSubItem(item.id, child.id, 'url', e.target.value)} />
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive shrink-0"
                          onClick={() => removeSubItem(item.id, child.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {items.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">No menu items. Click "Add Menu Item" to get started.</div>
            )}
          </CardContent>
        </Card>

        {/* Add Dialog */}
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Menu Item</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Label (English)</Label>
                <Input value={newItem.label} onChange={e => setNewItem(p => ({ ...p, label: e.target.value }))} placeholder="Menu label" />
              </div>
              <div className="space-y-2">
                <Label>Label (বাংলা)</Label>
                <Input value={newItem.labelBn} onChange={e => setNewItem(p => ({ ...p, labelBn: e.target.value }))} placeholder="মেনু লেবেল" />
              </div>
              <div className="space-y-2">
                <Label>URL</Label>
                <Input value={newItem.url} onChange={e => setNewItem(p => ({ ...p, url: e.target.value }))} placeholder="/page-url" />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={newItem.type} onValueChange={v => setNewItem(p => ({ ...p, type: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="link">Link</SelectItem>
                    <SelectItem value="dropdown">Dropdown</SelectItem>
                    <SelectItem value="mega">Mega Menu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={newItem.isActive} onCheckedChange={v => setNewItem(p => ({ ...p, isActive: v }))} />
                <Label>Active</Label>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button onClick={addItem}>Add</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Edit Menu Item</DialogTitle></DialogHeader>
            {editItem && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Label (English)</Label>
                  <Input value={editItem.label} onChange={e => setEditItem(p => p ? { ...p, label: e.target.value } : null)} />
                </div>
                <div className="space-y-2">
                  <Label>Label (বাংলা)</Label>
                  <Input value={editItem.labelBn} onChange={e => setEditItem(p => p ? { ...p, labelBn: e.target.value } : null)} />
                </div>
                <div className="space-y-2">
                  <Label>URL</Label>
                  <Input value={editItem.url} onChange={e => setEditItem(p => p ? { ...p, url: e.target.value } : null)} />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={editItem.type} onValueChange={v => setEditItem(p => p ? { ...p, type: v as any } : null)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="link">Link</SelectItem>
                      <SelectItem value="dropdown">Dropdown</SelectItem>
                      <SelectItem value="mega">Mega Menu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={editItem.isActive} onCheckedChange={v => setEditItem(p => p ? { ...p, isActive: v } : null)} />
                  <Label>Active</Label>
                </div>
              </div>
            )}
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button onClick={updateItem}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminMenuManager;
