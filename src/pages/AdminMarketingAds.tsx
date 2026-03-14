import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Save, Loader2, Plus, Trash2, Edit, Eye, EyeOff, Image } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BannerAd {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string;
  placement: 'homepage' | 'sidebar' | 'category';
  isActive: boolean;
  startDate: string;
  endDate: string;
  sortOrder: number;
}

const AdminMarketingAds = () => {
  const [ads, setAds] = useState<BannerAd[]>([]);
  const [loading, setLoading] = useState(false);
  const [editAd, setEditAd] = useState<BannerAd | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [newAd, setNewAd] = useState<Omit<BannerAd, 'id' | 'sortOrder'>>({
    title: '', imageUrl: '', linkUrl: '', placement: 'homepage', isActive: true, startDate: '', endDate: '',
  });

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('system_settings').select('value').eq('key', 'marketing_ads_v1').maybeSingle();
      if (data?.value && Array.isArray(data.value)) setAds(data.value as any);
    };
    load();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    const { error } = await supabase.from('system_settings').upsert({
      key: 'marketing_ads_v1',
      value: ads as any,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'key' });
    if (error) toast.error('Failed to save ads');
    else toast.success('Ads saved successfully!');
    setLoading(false);
  };

  const addAd = () => {
    if (!newAd.title.trim()) return;
    setAds(prev => [...prev, { ...newAd, id: Date.now().toString(), sortOrder: prev.length }]);
    setNewAd({ title: '', imageUrl: '', linkUrl: '', placement: 'homepage', isActive: true, startDate: '', endDate: '' });
    setAddOpen(false);
    toast.success('Ad created');
  };

  const updateAd = () => {
    if (!editAd) return;
    setAds(prev => prev.map(a => a.id === editAd.id ? editAd : a));
    setEditAd(null);
    toast.success('Ad updated');
  };

  const removeAd = (id: string) => {
    setAds(prev => prev.filter(a => a.id !== id));
    toast.success('Ad removed');
  };

  const toggleActive = (id: string) => {
    setAds(prev => prev.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a));
  };

  const placementColors: Record<string, string> = {
    homepage: 'bg-primary/10 text-primary',
    sidebar: 'bg-accent/10 text-accent',
    category: 'bg-success/10 text-success',
  };

  const renderAdForm = (ad: typeof newAd, setAd: (fn: (p: typeof newAd) => typeof newAd) => void) => (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label>Ad Title</Label>
        <Input value={ad.title} onChange={e => setAd(p => ({ ...p, title: e.target.value }))} placeholder="Summer Sale Banner" />
      </div>
      <div className="space-y-2">
        <Label>Image URL</Label>
        <Input value={ad.imageUrl} onChange={e => setAd(p => ({ ...p, imageUrl: e.target.value }))} placeholder="https://..." />
        {ad.imageUrl && (
          <div className="rounded-lg overflow-hidden border border-border max-h-32">
            <img src={ad.imageUrl} alt="Preview" className="w-full h-32 object-cover" />
          </div>
        )}
      </div>
      <div className="space-y-2">
        <Label>Link URL</Label>
        <Input value={ad.linkUrl} onChange={e => setAd(p => ({ ...p, linkUrl: e.target.value }))} placeholder="/category/electronics or https://..." />
      </div>
      <div className="space-y-2">
        <Label>Placement</Label>
        <Select value={ad.placement} onValueChange={v => setAd(p => ({ ...p, placement: v as any }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="homepage">Homepage</SelectItem>
            <SelectItem value="sidebar">Sidebar</SelectItem>
            <SelectItem value="category">Category Page</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Start Date</Label>
          <Input type="date" value={ad.startDate} onChange={e => setAd(p => ({ ...p, startDate: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label>End Date</Label>
          <Input type="date" value={ad.endDate} onChange={e => setAd(p => ({ ...p, endDate: e.target.value }))} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={ad.isActive} onCheckedChange={v => setAd(p => ({ ...p, isActive: v }))} />
        <Label>Active</Label>
      </div>
    </div>
  );

  return (
    <AdminLayout title="Marketing Ads" description="Manage banner advertisements displayed on the storefront">
      <div className="space-y-4">
        <div className="flex justify-between">
          <Button onClick={() => setAddOpen(true)}><Plus className="h-4 w-4 mr-1" /> Create Ad</Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
            Save All
          </Button>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Banner Ads ({ads.length})</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Preview</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Placement</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ads.map(ad => (
                  <TableRow key={ad.id}>
                    <TableCell>
                      {ad.imageUrl ? (
                        <img src={ad.imageUrl} alt={ad.title} className="w-20 h-12 rounded object-cover border border-border" />
                      ) : (
                        <div className="w-20 h-12 rounded bg-muted flex items-center justify-center"><Image className="h-4 w-4 text-muted-foreground" /></div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{ad.title}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`text-xs ${placementColors[ad.placement] || ''}`}>
                        {ad.placement}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={ad.isActive ? 'default' : 'secondary'}>
                        {ad.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {ad.startDate || '—'} → {ad.endDate || '—'}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleActive(ad.id)}>
                        {ad.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditAd(ad)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeAd(ad.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {ads.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No ads yet. Click "Create Ad" to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Add Dialog */}
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Create Banner Ad</DialogTitle></DialogHeader>
            {renderAdForm(newAd, (fn) => setNewAd(fn as any))}
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button onClick={addAd}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={!!editAd} onOpenChange={() => setEditAd(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Edit Banner Ad</DialogTitle></DialogHeader>
            {editAd && renderAdForm(editAd, (fn) => setEditAd(fn(editAd as any) as any))}
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button onClick={updateAd}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminMarketingAds;
