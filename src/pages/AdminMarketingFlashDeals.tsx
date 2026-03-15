import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Zap, Plus, Trash2, Clock, Loader2, Edit2, Package, Search, X, ImageIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface FlashDeal {
  id: string;
  title: string;
  discount: number;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  products: number;
}

interface DealProduct {
  id: string;
  flash_deal_id: string;
  product_id: string;
  deal_price: number | null;
  deal_discount: number | null;
  created_at: string;
  product?: {
    id: string;
    name: string;
    price: number;
    images: string[] | null;
    stock: number | null;
  };
}

interface ProductOption {
  id: string;
  name: string;
  price: number;
  images: string[] | null;
  stock: number | null;
}

const toLocalDatetime = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
};

const AdminMarketingFlashDeals = () => {
  const [deals, setDeals] = useState<FlashDeal[]>([]);
  const [loading, setLoading] = useState(true);

  // Create / Edit modal
  const [formOpen, setFormOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<FlashDeal | null>(null);
  const [form, setForm] = useState({ title: '', discount: 20, startDate: '', endDate: '', isActive: true });

  // Product management modal
  const [prodModalOpen, setProdModalOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<FlashDeal | null>(null);
  const [dealProducts, setDealProducts] = useState<DealProduct[]>([]);
  const [prodLoading, setProdLoading] = useState(false);

  // Product search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ProductOption[]>([]);
  const [searching, setSearching] = useState(false);

  // Add product form
  const [addPrice, setAddPrice] = useState('');
  const [addDiscount, setAddDiscount] = useState('');

  const fetchDeals = async () => {
    const { data, error } = await supabase.from('flash_deals').select('*').order('created_at', { ascending: false });
    if (error) { toast.error('Failed to load flash deals'); console.error(error); }
    else setDeals(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchDeals(); }, []);

  // ---- DEAL CRUD ----
  const openCreate = () => {
    setEditingDeal(null);
    setForm({ title: '', discount: 20, startDate: '', endDate: '', isActive: true });
    setFormOpen(true);
  };

  const openEdit = (d: FlashDeal) => {
    setEditingDeal(d);
    setForm({
      title: d.title,
      discount: d.discount,
      startDate: toLocalDatetime(d.start_date),
      endDate: toLocalDatetime(d.end_date),
      isActive: d.is_active,
    });
    setFormOpen(true);
  };

  const handleSaveDeal = async () => {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    const payload = {
      title: form.title,
      discount: form.discount,
      start_date: form.startDate ? new Date(form.startDate).toISOString() : null,
      end_date: form.endDate ? new Date(form.endDate).toISOString() : null,
      is_active: form.isActive,
    };

    if (editingDeal) {
      const { error } = await supabase.from('flash_deals').update(payload).eq('id', editingDeal.id);
      if (error) { toast.error('Failed to update'); console.error(error); return; }
      // sync product flash_sale_ends if end_date changed
      if (form.endDate && form.endDate !== toLocalDatetime(editingDeal.end_date)) {
        await supabase
          .from('flash_deal_products' as any)
          .select('product_id')
          .eq('flash_deal_id', editingDeal.id)
          .then(async ({ data: prods }) => {
            if (prods && prods.length > 0) {
              const ids = prods.map((p: any) => p.product_id);
              await supabase.from('products').update({ flash_sale_ends: payload.end_date }).in('id', ids);
            }
          });
      }
      toast.success('Flash deal updated');
    } else {
      const { error } = await supabase.from('flash_deals').insert(payload);
      if (error) { toast.error('Failed to create'); console.error(error); return; }
      toast.success('Flash deal created');
    }
    setFormOpen(false);
    fetchDeals();
  };

  const toggleActive = async (d: FlashDeal) => {
    const { error } = await supabase.from('flash_deals').update({ is_active: !d.is_active }).eq('id', d.id);
    if (error) { toast.error('Failed to update'); return; }
    toast.success('Status updated');
    fetchDeals();
  };

  const deleteDeal = async (id: string) => {
    // First reset products linked to this deal
    const { data: linked } = await supabase.from('flash_deal_products' as any).select('product_id').eq('flash_deal_id', id);
    if (linked && linked.length > 0) {
      const ids = linked.map((p: any) => p.product_id);
      await supabase.from('products').update({ is_flash_sale: false, flash_sale_ends: null }).in('id', ids);
    }
    const { error } = await supabase.from('flash_deals').delete().eq('id', id);
    if (error) { toast.error('Failed to delete'); return; }
    toast.success('Flash deal deleted');
    fetchDeals();
  };

  // ---- PRODUCT MANAGEMENT ----
  const openProductModal = async (d: FlashDeal) => {
    setSelectedDeal(d);
    setProdModalOpen(true);
    setProdLoading(true);
    setSearchQuery('');
    setSearchResults([]);
    setAddPrice('');
    setAddDiscount('');
    await fetchDealProducts(d.id);
  };

  const fetchDealProducts = async (dealId: string) => {
    setProdLoading(true);
    const { data, error } = await supabase
      .from('flash_deal_products' as any)
      .select('*')
      .eq('flash_deal_id', dealId)
      .order('created_at', { ascending: false });

    if (error) { console.error(error); setProdLoading(false); return; }

    // Fetch product details
    const productIds = (data || []).map((d: any) => d.product_id);
    let productsMap: Record<string, ProductOption> = {};
    if (productIds.length > 0) {
      const { data: prods } = await supabase.from('products').select('id, name, price, images, stock').in('id', productIds);
      if (prods) {
        prods.forEach((p: any) => { productsMap[p.id] = p; });
      }
    }

    const enriched = (data || []).map((dp: any) => ({
      ...dp,
      product: productsMap[dp.product_id] || { id: dp.product_id, name: 'Unknown', price: 0, images: null, stock: null },
    }));

    setDealProducts(enriched);
    setProdLoading(false);
  };

  const searchProducts = useCallback(async (q: string) => {
    if (!q.trim()) { setSearchResults([]); return; }
    setSearching(true);
    const { data, error } = await supabase
      .from('products')
      .select('id, name, price, images, stock')
      .ilike('name', `%${q}%`)
      .limit(10);
    if (!error && data) setSearchResults(data as ProductOption[]);
    setSearching(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => { searchProducts(searchQuery); }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchProducts]);

  const addProductToDeal = async (product: ProductOption) => {
    if (!selectedDeal) return;
    // Check if already added
    if (dealProducts.some(dp => dp.product_id === product.id)) {
      toast.error('Product already in this deal');
      return;
    }

    const { error } = await supabase.from('flash_deal_products' as any).insert({
      flash_deal_id: selectedDeal.id,
      product_id: product.id,
      deal_price: addPrice ? Number(addPrice) : null,
      deal_discount: addDiscount ? Number(addDiscount) : null,
    });
    if (error) { toast.error('Failed to add product'); console.error(error); return; }

    // Update product flags
    await supabase.from('products').update({
      is_flash_sale: true,
      flash_sale_ends: selectedDeal.end_date,
    }).eq('id', product.id);

    // Update deal product count
    const newCount = dealProducts.length + 1;
    await supabase.from('flash_deals').update({ products: newCount }).eq('id', selectedDeal.id);

    toast.success(`${product.name} added`);
    setAddPrice('');
    setAddDiscount('');
    setSearchQuery('');
    setSearchResults([]);
    await fetchDealProducts(selectedDeal.id);
    fetchDeals();
  };

  const removeProductFromDeal = async (dp: DealProduct) => {
    if (!selectedDeal) return;
    const { error } = await supabase.from('flash_deal_products' as any).delete().eq('id', dp.id);
    if (error) { toast.error('Failed to remove'); console.error(error); return; }

    // Reset product flags
    await supabase.from('products').update({
      is_flash_sale: false,
      flash_sale_ends: null,
    }).eq('id', dp.product_id);

    // Update count
    const newCount = Math.max(0, dealProducts.length - 1);
    await supabase.from('flash_deals').update({ products: newCount }).eq('id', selectedDeal.id);

    toast.success('Product removed');
    await fetchDealProducts(selectedDeal.id);
    fetchDeals();
  };

  const formatDateTime = (iso: string | null) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
  };

  const getDealStatus = (d: FlashDeal) => {
    if (!d.is_active) return { label: 'Inactive', variant: 'outline' as const };
    if (!d.end_date) return { label: 'Active', variant: 'default' as const };
    const now = new Date();
    const end = new Date(d.end_date);
    const start = d.start_date ? new Date(d.start_date) : null;
    if (start && now < start) return { label: 'Scheduled', variant: 'secondary' as const };
    if (now > end) return { label: 'Expired', variant: 'destructive' as const };
    return { label: 'Live', variant: 'default' as const };
  };

  return (
    <AdminLayout titleKey="admin.marketing.flashDeals" descriptionKey="admin.marketing.flashDeals">
      <Card className="border border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-5 w-5 text-accent" /> Flash Deals ({deals.length})
          </CardTitle>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" /> New Flash Deal
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">No flash deals yet</TableCell>
                  </TableRow>
                ) : deals.map(d => {
                  const status = getDealStatus(d);
                  return (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.title}</TableCell>
                      <TableCell><Badge variant="secondary">{d.discount}% OFF</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDateTime(d.start_date)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDateTime(d.end_date)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          <Package className="h-3 w-3" /> {d.products}
                        </Badge>
                      </TableCell>
                      <TableCell><Badge variant={status.variant}>{status.label}</Badge></TableCell>
                      <TableCell><Switch checked={d.is_active} onCheckedChange={() => toggleActive(d)} /></TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Manage Products" onClick={() => openProductModal(d)}>
                            <Package className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit" onClick={() => openEdit(d)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" title="Delete" onClick={() => deleteDeal(d.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Deal Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingDeal ? 'Edit Flash Deal' : 'Create Flash Deal'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Weekend Flash Sale" />
            </div>
            <div className="space-y-2">
              <Label>Discount %</Label>
              <Input type="number" value={form.discount} onChange={e => setForm(p => ({ ...p, discount: Number(e.target.value) }))} min={1} max={100} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date & Time</Label>
                <Input type="datetime-local" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>End Date & Time</Label>
                <Input type="datetime-local" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.isActive} onCheckedChange={v => setForm(p => ({ ...p, isActive: v }))} />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleSaveDeal}>{editingDeal ? 'Save Changes' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Management Dialog */}
      <Dialog open={prodModalOpen} onOpenChange={setProdModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Manage Products — {selectedDeal?.title}
            </DialogTitle>
          </DialogHeader>

          {selectedDeal && (
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary">{selectedDeal.discount}% OFF</Badge>
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatDateTime(selectedDeal.start_date)} → {formatDateTime(selectedDeal.end_date)}</span>
            </div>
          )}

          {/* Search & Add */}
          <div className="space-y-3 border rounded-lg p-3 bg-muted/30">
            <Label className="text-sm font-semibold">Add Product</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search products by name..."
                className="pl-9"
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(''); setSearchResults([]); }} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Deal Price (optional)</Label>
                <Input type="number" value={addPrice} onChange={e => setAddPrice(e.target.value)} placeholder="Override price" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Deal Discount % (optional)</Label>
                <Input type="number" value={addDiscount} onChange={e => setAddDiscount(e.target.value)} placeholder="Override discount" />
              </div>
            </div>

            {/* Search Results */}
            {searching && <div className="flex justify-center py-2"><Loader2 className="h-4 w-4 animate-spin" /></div>}
            {searchResults.length > 0 && (
              <div className="border rounded-md divide-y max-h-48 overflow-y-auto bg-background">
                {searchResults.map(p => {
                  const alreadyAdded = dealProducts.some(dp => dp.product_id === p.id);
                  return (
                    <div key={p.id} className="flex items-center gap-3 p-2 hover:bg-muted/50">
                      <div className="h-10 w-10 rounded bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                        {p.images && p.images[0] ? (
                          <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground">৳{p.price} · Stock: {p.stock ?? '∞'}</p>
                      </div>
                      <Button
                        size="sm"
                        variant={alreadyAdded ? 'outline' : 'accent'}
                        disabled={alreadyAdded}
                        onClick={() => addProductToDeal(p)}
                        className="shrink-0"
                      >
                        {alreadyAdded ? 'Added' : 'Add'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Current Products */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Products in Deal ({dealProducts.length})</Label>
            {prodLoading ? (
              <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin" /></div>
            ) : dealProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No products added yet</p>
            ) : (
              <div className="border rounded-md divide-y max-h-64 overflow-y-auto">
                {dealProducts.map(dp => (
                  <div key={dp.id} className="flex items-center gap-3 p-2">
                    <div className="h-10 w-10 rounded bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                      {dp.product?.images && dp.product.images[0] ? (
                        <img src={dp.product.images[0]} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{dp.product?.name}</p>
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        <span>Original: ৳{dp.product?.price}</span>
                        {dp.deal_price && <span className="text-accent font-medium">Deal: ৳{dp.deal_price}</span>}
                        {dp.deal_discount && <span className="text-accent font-medium">{dp.deal_discount}% OFF</span>}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={() => removeProductFromDeal(dp)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminMarketingFlashDeals;
