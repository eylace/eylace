import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Save, Loader2, Plus, Trash2, Edit, Eye, EyeOff, Image as ImageIcon, Megaphone, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type PromotionType = 'banner' | 'sponsored_product' | 'popup' | 'video' | 'sidebar' | 'popunder' | 'native';
export type AdPlacement = 'homepage' | 'sidebar' | 'category' | 'product_page' | 'checkout' | 'global';

export interface AdCampaign {
  id: string;
  title: string;
  company: string;
  contactEmail: string;
  promotionType: PromotionType;
  imageUrl: string;
  videoUrl?: string;
  linkUrl: string;
  ctaText: string;
  description: string;
  placement: AdPlacement;
  budget: number;
  impressions: number;
  clicks: number;
  isActive: boolean;
  startDate: string;
  endDate: string;
  sortOrder: number;
}

const SETTINGS_KEY = 'ads_manager_v1';

const emptyCampaign: Omit<AdCampaign, 'id' | 'sortOrder' | 'impressions' | 'clicks'> = {
  title: '',
  company: '',
  contactEmail: '',
  promotionType: 'banner',
  imageUrl: '',
  videoUrl: '',
  linkUrl: '',
  ctaText: 'Shop Now',
  description: '',
  placement: 'homepage',
  budget: 0,
  isActive: true,
  startDate: '',
  endDate: '',
};

const promotionTypeLabels: Record<PromotionType, string> = {
  banner: 'Banner',
  sponsored_product: 'Sponsored Product',
  popup: 'Popup',
  video: 'Video Ad',
  sidebar: 'Sidebar',
  popunder: 'Pop-under',
  native: 'Native Ad',
};

const AdminAdsManager = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [editCampaign, setEditCampaign] = useState<AdCampaign | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [newCampaign, setNewCampaign] = useState(emptyCampaign);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('system_settings').select('value').eq('key', SETTINGS_KEY).maybeSingle();
      if (data?.value && Array.isArray(data.value)) setCampaigns(data.value as any);
    };
    load();
  }, []);

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setAddOpen(true);
      searchParams.delete('new');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleSave = async () => {
    setLoading(true);
    const { error } = await supabase.from('system_settings').upsert({
      key: SETTINGS_KEY,
      value: campaigns as any,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'key' });
    if (error) toast.error('Failed to save campaigns');
    else toast.success('Campaigns saved');
    setLoading(false);
  };

  const addCampaign = () => {
    if (!newCampaign.title.trim() || !newCampaign.company.trim()) {
      toast.error('Title and Company are required');
      return;
    }
    setCampaigns(prev => [...prev, {
      ...newCampaign,
      id: Date.now().toString(),
      sortOrder: prev.length,
      impressions: 0,
      clicks: 0,
    }]);
    setNewCampaign(emptyCampaign);
    setAddOpen(false);
    toast.success('Campaign created (remember to Save All)');
  };

  const updateCampaign = () => {
    if (!editCampaign) return;
    setCampaigns(prev => prev.map(c => c.id === editCampaign.id ? editCampaign : c));
    setEditCampaign(null);
    toast.success('Campaign updated (remember to Save All)');
  };

  const removeCampaign = (id: string) => {
    setCampaigns(prev => prev.filter(c => c.id !== id));
    toast.success('Removed');
  };

  const toggleActive = (id: string) => {
    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c));
  };

  const totalBudget = campaigns.reduce((s, c) => s + (Number(c.budget) || 0), 0);
  const totalImpressions = campaigns.reduce((s, c) => s + (c.impressions || 0), 0);
  const totalClicks = campaigns.reduce((s, c) => s + (c.clicks || 0), 0);
  const activeCount = campaigns.filter(c => c.isActive).length;

  const placementColors: Record<string, string> = {
    homepage: 'bg-primary/10 text-primary',
    sidebar: 'bg-accent/10 text-accent',
    category: 'bg-success/10 text-success',
    product_page: 'bg-warning/10 text-warning',
    checkout: 'bg-destructive/10 text-destructive',
    global: 'bg-muted text-muted-foreground',
  };

  const renderForm = (c: typeof newCampaign, set: (fn: (p: typeof newCampaign) => typeof newCampaign) => void) => (
    <div className="space-y-4 py-4 max-h-[65vh] overflow-y-auto px-1">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Campaign Title *</Label>
          <Input value={c.title} onChange={e => set(p => ({ ...p, title: e.target.value }))} placeholder="Summer Mega Sale" />
        </div>
        <div className="space-y-2">
          <Label>Company / Sponsor *</Label>
          <Input value={c.company} onChange={e => set(p => ({ ...p, company: e.target.value }))} placeholder="Acme Corp" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Contact Email</Label>
          <Input type="email" value={c.contactEmail} onChange={e => set(p => ({ ...p, contactEmail: e.target.value }))} placeholder="ads@acme.com" />
        </div>
        <div className="space-y-2">
          <Label>Budget (৳)</Label>
          <Input type="number" min="0" value={c.budget} onChange={e => set(p => ({ ...p, budget: Number(e.target.value) || 0 }))} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Promotion Type</Label>
          <Select value={c.promotionType} onValueChange={v => set(p => ({ ...p, promotionType: v as PromotionType }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(promotionTypeLabels).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Placement</Label>
          <Select value={c.placement} onValueChange={v => set(p => ({ ...p, placement: v as AdPlacement }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="homepage">Homepage</SelectItem>
              <SelectItem value="sidebar">Sidebar</SelectItem>
              <SelectItem value="category">Category Page</SelectItem>
              <SelectItem value="product_page">Product Page</SelectItem>
              <SelectItem value="checkout">Checkout</SelectItem>
              <SelectItem value="global">Global (all pages)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Image URL</Label>
        <Input value={c.imageUrl} onChange={e => set(p => ({ ...p, imageUrl: e.target.value }))} placeholder="https://..." />
        {c.imageUrl && (
          <div className="rounded-lg overflow-hidden border border-border max-h-32">
            <img src={c.imageUrl} alt="Preview" className="w-full h-32 object-cover" />
          </div>
        )}
      </div>
      {c.promotionType === 'video' && (
        <div className="space-y-2">
          <Label>Video URL</Label>
          <Input value={c.videoUrl} onChange={e => set(p => ({ ...p, videoUrl: e.target.value }))} placeholder="https://...mp4" />
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Destination Link</Label>
          <Input value={c.linkUrl} onChange={e => set(p => ({ ...p, linkUrl: e.target.value }))} placeholder="/category/electronics or https://..." />
        </div>
        <div className="space-y-2">
          <Label>CTA Button Text</Label>
          <Input value={c.ctaText} onChange={e => set(p => ({ ...p, ctaText: e.target.value }))} placeholder="Shop Now" />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea rows={3} value={c.description} onChange={e => set(p => ({ ...p, description: e.target.value }))} placeholder="Short description of the promotion" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Start Date</Label>
          <Input type="date" value={c.startDate} onChange={e => set(p => ({ ...p, startDate: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label>End Date</Label>
          <Input type="date" value={c.endDate} onChange={e => set(p => ({ ...p, endDate: e.target.value }))} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={c.isActive} onCheckedChange={v => set(p => ({ ...p, isActive: v }))} />
        <Label>Active</Label>
      </div>
    </div>
  );

  return (
    <AdminLayout title="Ads Manager" description="Manage paid promotions and advertising campaigns from companies">
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card><CardContent className="pt-4 pb-4"><div className="flex items-center gap-2"><Megaphone className="h-6 w-6 text-primary" /><div><p className="text-xs text-muted-foreground">Total Campaigns</p><p className="text-lg font-bold">{campaigns.length}</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-4 pb-4"><div className="flex items-center gap-2"><Eye className="h-6 w-6 text-success" /><div><p className="text-xs text-muted-foreground">Active</p><p className="text-lg font-bold">{activeCount}</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-4 pb-4"><div className="flex items-center gap-2"><Building2 className="h-6 w-6 text-accent" /><div><p className="text-xs text-muted-foreground">Total Budget</p><p className="text-lg font-bold">৳{totalBudget.toLocaleString()}</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-4 pb-4"><div className="flex items-center gap-2"><ImageIcon className="h-6 w-6 text-warning" /><div><p className="text-xs text-muted-foreground">Impr / Clicks</p><p className="text-lg font-bold">{totalImpressions} / {totalClicks}</p></div></div></CardContent></Card>
        </div>

        <div className="flex justify-between">
          <Button onClick={() => setAddOpen(true)}><Plus className="h-4 w-4 mr-1" /> New Campaign</Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
            Save All
          </Button>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Campaigns ({campaigns.length})</CardTitle></CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Preview</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Placement</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map(c => (
                  <TableRow key={c.id}>
                    <TableCell>
                      {c.imageUrl ? (
                        <img src={c.imageUrl} alt={c.title} className="w-20 h-12 rounded object-cover border border-border" />
                      ) : (
                        <div className="w-20 h-12 rounded bg-muted flex items-center justify-center"><ImageIcon className="h-4 w-4 text-muted-foreground" /></div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{c.title}</TableCell>
                    <TableCell className="text-sm">{c.company}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{promotionTypeLabels[c.promotionType]}</Badge></TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`text-xs ${placementColors[c.placement] || ''}`}>
                        {c.placement.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">৳{(c.budget || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={c.isActive ? 'default' : 'secondary'}>
                        {c.isActive ? 'Active' : 'Paused'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {c.startDate || '—'} → {c.endDate || '—'}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleActive(c.id)}>
                        {c.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditCampaign(c)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeCampaign(c.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {campaigns.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No campaigns yet. Click "New Campaign" to onboard a sponsor.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Create Ad Campaign</DialogTitle></DialogHeader>
            {renderForm(newCampaign, (fn) => setNewCampaign(fn as any))}
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button onClick={addCampaign}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!editCampaign} onOpenChange={() => setEditCampaign(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Edit Campaign</DialogTitle></DialogHeader>
            {editCampaign && renderForm(editCampaign as any, (fn) => setEditCampaign(fn(editCampaign as any) as any))}
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button onClick={updateCampaign}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminAdsManager;