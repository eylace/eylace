import { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import {
  Package, Plus, Search, Edit, Trash2, Eye, Loader2,
  Image as ImageIcon, Star, MoreVertical, Filter, ArrowUpDown,
  Copy, RefreshCw,
} from 'lucide-react';
import { AdminProductFormModal } from '@/components/admin/ProductFormModal';
import { ProductImportExportModal } from '@/components/admin/ProductImportExportModal';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useLanguage } from '@/contexts/LanguageContext';

type SortField = 'name' | 'price' | 'stock' | 'created_at' | 'sold_count' | 'rating';
type SortDir = 'asc' | 'desc';
type TabKey = 'all' | 'inhouse' | 'seller' | 'digital' | 'physical' | 'inactive';

const AdminProducts = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const topScrollRef = useRef<HTMLDivElement>(null);
  const [scrollWidth, setScrollWidth] = useState(0);

  useLayoutEffect(() => {
    const el = tableScrollRef.current;
    if (!el) return;
    const update = () => setScrollWidth(el.scrollWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild as Element);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  });
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [sellers, setSellers] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [tab, setTab] = useState<TabKey>('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterBrand, setFilterBrand] = useState('all');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState('');
  const [importExportOpen, setImportExportOpen] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    setLoadError(null);

    const { data: authData } = await supabase.auth.getSession();
    if (!authData.session?.user) {
      setProducts([]);
      setLoadError('Admin session is not ready. Please sign in again.');
      setLoading(false);
      return;
    }

    const [prodRes, catRes, sellerRes, brandRes] = await Promise.all([
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('categories').select('id, name').order('name'),
      supabase.from('sellers').select('id, name').order('name'),
      supabase.from('brands').select('id, name').order('name'),
    ]);
    if (!prodRes.error && prodRes.data) {
      const categoryMap = new Map((catRes.data || []).map((c: any) => [c.id, c]));
      const sellerMap = new Map((sellerRes.data || []).map((s: any) => [s.id, s]));
      const brandMap = new Map((brandRes.data || []).map((b: any) => [b.id, b]));
      setProducts(prodRes.data.map((p: any) => ({
        ...p,
        categories: categoryMap.get(p.category_id) || null,
        sellers: sellerMap.get(p.seller_id) || null,
        brands: brandMap.get(p.brand_id) || null,
      })));
    }
    if (prodRes.error) setLoadError(prodRes.error.message);
    if (!catRes.error && catRes.data) setCategories(catRes.data);
    if (!sellerRes.error && sellerRes.data) setSellers(sellerRes.data);
    if (!brandRes.error && brandRes.data) setBrands(brandRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const toggleActive = async (id: string, current: boolean) => {
    const { error } = await supabase.from('products').update({ is_active: !current }).eq('id', id);
    if (!error) { toast.success(`Product ${!current ? 'published' : 'unpublished'}`); fetchAll(); }
    else toast.error(error.message || 'Failed to update product');
  };

  const toggleFlashSale = async (id: string, current: boolean) => {
    const { error } = await supabase.from('products').update({ is_flash_sale: !current }).eq('id', id);
    if (!error) { toast.success(`Today's deal ${!current ? 'enabled' : 'disabled'}`); fetchAll(); }
    else toast.error(error.message || "Failed to update today's deal");
  };

  const toggleFeatured = async (id: string, current: boolean) => {
    const { error } = await supabase.from('products').update({ is_prime: !current }).eq('id', id);
    if (!error) { toast.success(`Featured ${!current ? 'enabled' : 'disabled'}`); fetchAll(); }
    else toast.error(error.message || 'Failed to update featured status');
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) { toast.success('Product deleted'); fetchAll(); }
    else toast.error('Failed to delete');
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selected.size === 0) return;
    const ids = Array.from(selected);
    let error;
    if (bulkAction === 'activate') {
      ({ error } = await supabase.from('products').update({ is_active: true }).in('id', ids));
    } else if (bulkAction === 'deactivate') {
      ({ error } = await supabase.from('products').update({ is_active: false }).in('id', ids));
    } else if (bulkAction === 'delete') {
      ({ error } = await supabase.from('products').delete().in('id', ids));
    }
    if (!error) { toast.success(`Bulk action applied to ${ids.length} products`); setSelected(new Set()); setBulkAction(''); fetchAll(); }
    else toast.error('Bulk action failed');
  };

  const filtered = useMemo(() => {
    let list = products;

    // Tab filter
    if (tab === 'inhouse') list = list.filter(p => !p.seller_id);
    else if (tab === 'seller') list = list.filter(p => !!p.seller_id);
    else if (tab === 'digital') list = list.filter(p => p.is_digital);
    else if (tab === 'physical') list = list.filter(p => !p.is_digital);
    else if (tab === 'inactive') list = list.filter(p => !p.is_active);

    // Category filter
    if (filterCategory !== 'all') list = list.filter(p => p.category_id === filterCategory);
    // Brand filter
    if (filterBrand !== 'all') list = list.filter(p => p.brand_id === filterBrand);

    // Search
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        (p.brands?.name || '').toLowerCase().includes(q)
      );
    }

    // Sort
    list = [...list].sort((a, b) => {
      let va = a[sortField] ?? 0;
      let vb = b[sortField] ?? 0;
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [products, tab, filterCategory, filterBrand, search, sortField, sortDir]);

  const tabCounts = useMemo(() => ({
    all: products.length,
    inhouse: products.filter(p => !p.seller_id).length,
    seller: products.filter(p => !!p.seller_id).length,
    digital: products.filter(p => p.is_digital).length,
    physical: products.filter(p => !p.is_digital).length,
    inactive: products.filter(p => !p.is_active).length,
  }), [products]);

  const allSelected = filtered.length > 0 && filtered.every(p => selected.has(p.id));

  const toggleSelectAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(filtered.map(p => p.id)));
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const renderStars = (rating: number | null) => {
    const r = rating || 0;
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
          <Star key={i} className={`h-3.5 w-3.5 ${i <= r ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'}`} />
        ))}
      </div>
    );
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button onClick={() => handleSort(field)} className="flex items-center gap-1 hover:text-foreground transition-colors font-semibold text-xs uppercase tracking-wider">
      {children}
      <ArrowUpDown className={`h-3 w-3 ${sortField === field ? 'text-primary' : 'text-muted-foreground/40'}`} />
    </button>
  );

  return (
    <AdminLayout titleKey="admin.title.products" descriptionKey="admin.desc.products">
      {/* Top Tabs */}
      <Tabs value={tab} onValueChange={(v) => { setTab(v as TabKey); setSelected(new Set()); }} className="mb-4">
        <TabsList className="bg-muted/50 h-10 p-1 gap-0.5">
          <TabsTrigger value="all" className="text-xs px-4">All Products <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">{tabCounts.all}</Badge></TabsTrigger>
          <TabsTrigger value="inhouse" className="text-xs px-4">In-House <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">{tabCounts.inhouse}</Badge></TabsTrigger>
          <TabsTrigger value="seller" className="text-xs px-4">Seller Products <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">{tabCounts.seller}</Badge></TabsTrigger>
          <TabsTrigger value="digital" className="text-xs px-4">Digital <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">{tabCounts.digital}</Badge></TabsTrigger>
          <TabsTrigger value="physical" className="text-xs px-4">Physical <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">{tabCounts.physical}</Badge></TabsTrigger>
          <TabsTrigger value="inactive" className="text-xs px-4">Drafts <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">{tabCounts.inactive}</Badge></TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Top horizontal scrollbar (mirrors the table scroll) */}
      {!loading && !loadError && scrollWidth > 0 && (
        <div
          ref={topScrollRef}
          className="overflow-x-auto overflow-y-hidden mb-3 rounded border border-border bg-muted/20"
          onScroll={() => {
            if (tableScrollRef.current && topScrollRef.current) {
              tableScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
            }
          }}
        >
          <div style={{ width: scrollWidth, height: 1 }} />
        </div>
      )}

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 w-64 h-9 text-sm"
            />
          </div>

          {/* Bulk Action */}
          <Select value={bulkAction} onValueChange={setBulkAction}>
            <SelectTrigger className="w-[140px] h-9 text-xs">
              <SelectValue placeholder="Bulk Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="activate">Activate</SelectItem>
              <SelectItem value="deactivate">Deactivate</SelectItem>
              <SelectItem value="delete">Delete</SelectItem>
            </SelectContent>
          </Select>
          {bulkAction && selected.size > 0 && (
            <Button size="sm" variant="outline" className="h-9 text-xs" onClick={handleBulkAction}>
              Apply ({selected.size})
            </Button>
          )}

          {/* Filter */}
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[150px] h-9 text-xs">
              <Filter className="h-3 w-3 mr-1" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={filterBrand} onValueChange={setFilterBrand}>
            <SelectTrigger className="w-[130px] h-9 text-xs">
              <SelectValue placeholder="Brand" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Brands</SelectItem>
              {brands.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select value={`${sortField}-${sortDir}`} onValueChange={v => { const [f, d] = v.split('-'); setSortField(f as SortField); setSortDir(d as SortDir); }}>
            <SelectTrigger className="w-[140px] h-9 text-xs">
              <ArrowUpDown className="h-3 w-3 mr-1" />
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at-desc">Newest First</SelectItem>
              <SelectItem value="created_at-asc">Oldest First</SelectItem>
              <SelectItem value="name-asc">Name A-Z</SelectItem>
              <SelectItem value="name-desc">Name Z-A</SelectItem>
              <SelectItem value="price-asc">Price Low-High</SelectItem>
              <SelectItem value="price-desc">Price High-Low</SelectItem>
              <SelectItem value="stock-asc">Stock Low-High</SelectItem>
              <SelectItem value="stock-desc">Stock High-Low</SelectItem>
              <SelectItem value="rating-desc">Top Rated</SelectItem>
              <SelectItem value="sold_count-desc">Best Selling</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="gap-1.5 h-9 px-3" onClick={() => setImportExportOpen(true)}>
            <Upload className="h-4 w-4" /> Import / Export
          </Button>
          <Button size="sm" className="gap-1.5 h-9 px-4 bg-primary" onClick={() => navigate('/admin/products/add')}>
            <Plus className="h-4 w-4" /> Add New Product
          </Button>
        </div>
      </div>

      {/* Products Table */}
      <Card className="border border-border overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : loadError ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <Package className="h-12 w-12 text-muted-foreground/30" />
              <p className="font-medium text-foreground">Products could not load</p>
              <p className="max-w-md text-sm text-muted-foreground">{loadError}</p>
              <Button variant="outline" size="sm" onClick={fetchAll} className="gap-2">
                <RefreshCw className="h-4 w-4" /> Retry
              </Button>
            </div>
          ) : (
            <>
              <div
                ref={tableScrollRef}
                className="overflow-x-auto"
                onScroll={() => {
                  if (tableScrollRef.current && topScrollRef.current) {
                    topScrollRef.current.scrollLeft = tableScrollRef.current.scrollLeft;
                  }
                }}
              >
                <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="w-10">
                      <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} />
                    </TableHead>
                    <TableHead className="w-16 text-xs uppercase tracking-wider font-semibold">Thumb</TableHead>
                    <TableHead className="min-w-[200px]"><SortHeader field="name">Name / Brand</SortHeader></TableHead>
                    <TableHead className="min-w-[140px] text-xs uppercase tracking-wider font-semibold">Owner / Category</TableHead>
                    <TableHead className="min-w-[110px]"><SortHeader field="rating">Ratings</SortHeader></TableHead>
                    <TableHead className="min-w-[130px]"><SortHeader field="price">Price Details</SortHeader></TableHead>
                    <TableHead className="min-w-[100px]"><SortHeader field="sold_count">Info</SortHeader></TableHead>
                    <TableHead className="w-20 text-xs uppercase tracking-wider font-semibold text-center">Published</TableHead>
                    <TableHead className="w-20 text-xs uppercase tracking-wider font-semibold text-center">Featured</TableHead>
                    <TableHead className="w-24 text-xs uppercase tracking-wider font-semibold text-center">Today's Deal</TableHead>
                    <TableHead className="w-16 text-xs uppercase tracking-wider font-semibold text-center">Options</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((product) => {
                    const ownerType = product.seller_id ? 'Seller' : 'In-House';
                    const brandName = (product as any).brands?.name;
                    const categoryName = (product as any).categories?.name || 'Uncategorized';
                    const sellerName = (product as any).sellers?.name;

                    return (
                      <TableRow key={product.id} className={`${selected.has(product.id) ? 'bg-primary/5' : ''} hover:bg-muted/20 transition-colors`}>
                        {/* Checkbox */}
                        <TableCell>
                          <Checkbox checked={selected.has(product.id)} onCheckedChange={() => toggleSelect(product.id)} />
                        </TableCell>

                        {/* Thumbnail */}
                        <TableCell>
                          {product.images?.[0] ? (
                            <img src={product.images[0]} alt="" className="h-12 w-12 rounded-lg object-cover border border-border" />
                          ) : (
                            <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center border border-border">
                              <ImageIcon className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </TableCell>

                        {/* Name / Brand */}
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium text-sm leading-tight line-clamp-2 max-w-[240px]">{product.name}</p>
                            {brandName && (
                              <span className="text-xs font-medium text-primary">{brandName}</span>
                            )}
                          </div>
                        </TableCell>

                        {/* Owner / Category */}
                        <TableCell>
                          <div className="space-y-0.5">
                            <span className={`text-xs font-semibold ${product.seller_id ? 'text-blue-500' : 'text-emerald-500'}`}>
                              {ownerType}
                            </span>
                            {sellerName && <p className="text-[11px] text-muted-foreground">{sellerName}</p>}
                            <p className="text-xs text-muted-foreground">{categoryName}</p>
                          </div>
                        </TableCell>

                        {/* Ratings */}
                        <TableCell>
                          <div className="space-y-0.5">
                            {renderStars(product.rating)}
                            <p className="text-[11px] text-muted-foreground">
                              {product.rating?.toFixed(1) || '0.0'} out of 5.0
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {product.review_count || 0} reviews
                            </p>
                          </div>
                        </TableCell>

                        {/* Price Details */}
                        <TableCell>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1">
                              <span className="text-[11px] text-muted-foreground">Price</span>
                            </div>
                            <p className="font-semibold text-sm">৳{product.price.toLocaleString()}</p>
                            {product.discount > 0 && (
                              <p className="text-[11px]">
                                <span className="text-muted-foreground">Discount </span>
                                <span className="text-destructive font-medium">{product.discount}%</span>
                              </p>
                            )}
                            {product.original_price && (
                              <p className="text-[11px] text-muted-foreground line-through">৳{product.original_price.toLocaleString()}</p>
                            )}
                          </div>
                        </TableCell>

                        {/* Info */}
                        <TableCell>
                          <div className="space-y-0.5">
                            <p className="text-[11px] text-muted-foreground">Sales</p>
                            <p className="font-semibold text-sm">{product.sold_count || 0}</p>
                            <p className="text-[11px]">
                              <span className={`font-medium ${(product.stock || 0) > 10 ? 'text-emerald-500' : (product.stock || 0) > 0 ? 'text-amber-500' : 'text-destructive'}`}>
                                Stock: {product.stock || 0}
                              </span>
                            </p>
                          </div>
                        </TableCell>

                        {/* Published */}
                        <TableCell className="text-center">
                          <Switch
                            checked={!!product.is_active}
                            onCheckedChange={() => toggleActive(product.id, product.is_active)}
                            className="mx-auto"
                          />
                        </TableCell>

                        {/* Featured */}
                        <TableCell className="text-center">
                          <Switch
                            checked={!!product.is_prime}
                            onCheckedChange={() => toggleFeatured(product.id, product.is_prime)}
                            className="mx-auto"
                          />
                        </TableCell>

                        {/* Today's Deal */}
                        <TableCell className="text-center">
                          <Switch
                            checked={!!product.is_flash_sale}
                            onCheckedChange={() => toggleFlashSale(product.id, product.is_flash_sale)}
                            className="mx-auto"
                          />
                        </TableCell>

                        {/* Options */}
                        <TableCell className="text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem onClick={() => navigate(`/admin/products/edit/${product.id}`)}>
                                <Edit className="h-3.5 w-3.5 mr-2" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => window.open(`/product/${product.slug}`, '_blank')}>
                                <Eye className="h-3.5 w-3.5 mr-2" /> View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { navigator.clipboard.writeText(product.slug); toast.success('Slug copied'); }}>
                                <Copy className="h-3.5 w-3.5 mr-2" /> Copy Slug
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem onSelect={e => e.preventDefault()} className="text-destructive focus:text-destructive">
                                    <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Product</AlertDialogTitle>
                                    <AlertDialogDescription>Delete "{product.name}"? This cannot be undone.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteProduct(product.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-16">
                        <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-muted-foreground font-medium">No products found</p>
                        <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters or search</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Footer Stats */}
      {!loading && filtered.length > 0 && (
        <div className="flex items-center justify-between mt-3 px-1 text-xs text-muted-foreground">
          <span>Showing {filtered.length} of {products.length} products</span>
          {selected.size > 0 && <span className="font-medium text-primary">{selected.size} selected</span>}
        </div>
      )}

      <AdminProductFormModal open={formOpen} onOpenChange={setFormOpen} product={editProduct} onSaved={fetchAll} />
      <ProductImportExportModal open={importExportOpen} onOpenChange={setImportExportOpen} onImported={fetchAll} />
    </AdminLayout>
  );
};

export default AdminProducts;
