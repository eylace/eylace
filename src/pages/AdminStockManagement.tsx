import { useState, useEffect, useMemo } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import {
  Package, Search, Loader2, Image as ImageIcon, AlertTriangle, XCircle,
  CheckCircle2, TrendingDown, Boxes, DollarSign, BarChart3
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';

interface StockProduct {
  id: string;
  name: string;
  slug: string;
  images: string[] | null;
  price: number;
  original_price: number | null;
  stock: number | null;
  sold_count: number;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
  category_id: string | null;
  brand_id: string | null;
  seller_id: string | null;
  categories?: { name: string } | null;
  brands?: { name: string } | null;
  sellers?: { name: string } | null;
}

const LOW_STOCK_THRESHOLD = 20;

const AdminStockManagement = () => {
  const [products, setProducts] = useState<StockProduct[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [stockTab, setStockTab] = useState<'all' | 'in_stock' | 'out_of_stock' | 'low_stock'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const fetchData = async () => {
    setLoading(true);
    const [prodRes, catRes, brandRes] = await Promise.all([
      supabase.from('products').select('*, categories(name), brands(name), sellers(name)').order('updated_at', { ascending: false }),
      supabase.from('categories').select('id, name').order('name'),
      supabase.from('brands').select('id, name').order('name'),
    ]);
    if (prodRes.data) setProducts(prodRes.data as any);
    if (catRes.data) setCategories(catRes.data);
    if (brandRes.data) setBrands(brandRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(() => {
    let list = products;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q));
    }
    if (categoryFilter !== 'all') list = list.filter(p => p.category_id === categoryFilter);
    if (brandFilter !== 'all') list = list.filter(p => p.brand_id === brandFilter);
    if (stockTab === 'in_stock') list = list.filter(p => (p.stock ?? 0) > LOW_STOCK_THRESHOLD);
    if (stockTab === 'out_of_stock') list = list.filter(p => (p.stock ?? 0) === 0);
    if (stockTab === 'low_stock') list = list.filter(p => (p.stock ?? 0) > 0 && (p.stock ?? 0) <= LOW_STOCK_THRESHOLD);
    return list;
  }, [products, search, categoryFilter, brandFilter, stockTab]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  useEffect(() => { setCurrentPage(1); }, [search, categoryFilter, brandFilter, stockTab, perPage]);

  // Summary stats
  const totalItems = products.length;
  const totalStock = products.reduce((sum, p) => sum + (p.stock ?? 0), 0);
  const lowStockCount = products.filter(p => (p.stock ?? 0) > 0 && (p.stock ?? 0) <= LOW_STOCK_THRESHOLD).length;
  const outOfStockCount = products.filter(p => (p.stock ?? 0) === 0).length;
  const totalCostValue = products.reduce((sum, p) => sum + (p.price * (p.stock ?? 0)), 0);
  const totalRetailValue = products.reduce((sum, p) => sum + ((p.original_price || p.price) * (p.stock ?? 0)), 0);

  const stockTabs = [
    { key: 'all' as const, label: 'All' },
    { key: 'in_stock' as const, label: 'In Stock' },
    { key: 'out_of_stock' as const, label: 'Out of Stock' },
    { key: 'low_stock' as const, label: 'Low Stock' },
  ];

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: 'OUT OF STOCK', variant: 'destructive' as const, color: 'text-destructive' };
    if (stock <= LOW_STOCK_THRESHOLD) return { label: 'LOW', variant: 'secondary' as const, color: 'text-orange-600 dark:text-orange-400' };
    return { label: 'IN STOCK', variant: 'default' as const, color: 'text-emerald-600 dark:text-emerald-400' };
  };

  return (
    <AdminLayout title="Stock Management" description="Monitor and manage product inventory">
      {/* Summary Cards Row 1 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-medium tracking-wide">Total Items</p>
                <p className="text-2xl font-bold text-foreground">{totalItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Boxes className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-medium tracking-wide">Total Stock</p>
                <p className="text-2xl font-bold text-foreground">{totalStock.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-medium tracking-wide">Low Stock</p>
                <p className="text-2xl font-bold text-foreground">{lowStockCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                <XCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-medium tracking-wide">Out of Stock</p>
                <p className="text-2xl font-bold text-foreground">{outOfStockCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards Row 2 - Values */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-6">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-medium tracking-wide">Total Stock Value (Cost)</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">৳{totalCostValue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0">
                <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-medium tracking-wide">Total Retail Value (Sell)</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">৳{totalRetailValue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Table */}
      <Card>
        <CardContent className="p-4 space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
            <div className="relative flex-1 min-w-0 w-full md:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search SKU or Name..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-44">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={brandFilter} onValueChange={setBrandFilter}>
              <SelectTrigger className="w-full md:w-44">
                <SelectValue placeholder="All Brands" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brands</SelectItem>
                {brands.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {/* Stock tabs */}
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              {stockTabs.map(tab => (
                <Button
                  key={tab.key}
                  variant={stockTab === tab.key ? 'default' : 'ghost'}
                  size="sm"
                  className="text-xs h-8 px-3"
                  onClick={() => setStockTab(tab.key)}
                >
                  {tab.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Per Page */}
          <div className="flex items-center gap-2">
            <Select value={String(perPage)} onValueChange={v => setPerPage(Number(v))}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 / Page</SelectItem>
                <SelectItem value="25">25 / Page</SelectItem>
                <SelectItem value="50">50 / Page</SelectItem>
                <SelectItem value="100">100 / Page</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[250px]">Product Details</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead className="text-right">Selling</TableHead>
                    <TableHead className="text-center">Stock</TableHead>
                    <TableHead className="text-right">Val (Cost)</TableHead>
                    <TableHead className="text-right">Val (Sell)</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Last Update</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((product) => {
                    const stock = product.stock ?? 0;
                    const status = getStockStatus(stock);
                    const costVal = product.price * stock;
                    const sellVal = (product.original_price || product.price) * stock;
                    const catName = (product as any).categories?.name;
                    const brandName = (product as any).brands?.name;
                    const sellerName = (product as any).sellers?.name;

                    return (
                      <TableRow key={product.id} className={stock === 0 ? 'bg-destructive/5' : stock <= LOW_STOCK_THRESHOLD ? 'bg-orange-500/5' : ''}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {product.images?.[0] ? (
                              <img src={product.images[0]} alt="" className="h-10 w-10 rounded-lg object-cover shrink-0 border border-border" />
                            ) : (
                              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate max-w-[200px]">{product.name}</p>
                              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                {catName && <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{catName}</span>}
                                {brandName && <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent">{brandName}</span>}
                                {sellerName && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">{sellerName}</span>}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium">৳{product.price.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-sm font-medium">৳{(product.original_price || product.price).toLocaleString()}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center">
                            <span className={`text-lg font-bold ${status.color}`}>{stock}</span>
                            <span className="text-[10px] text-muted-foreground">Min: 5</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-sm">৳{costVal.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-sm font-semibold text-emerald-600 dark:text-emerald-400">৳{sellVal.toLocaleString()}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={status.variant} className={`text-[10px] uppercase font-bold ${
                            status.label === 'IN STOCK' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30' :
                            status.label === 'LOW' ? 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30' :
                            'bg-destructive/15 text-destructive border-destructive/30'
                          }`}>
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(product.updated_at), 'dd MMM yyyy')}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {paginated.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                        No products found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground">
                rows per page: {perPage} &nbsp;&nbsp; {(currentPage - 1) * perPage + 1}-{Math.min(currentPage * perPage, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>&lt;</Button>
                <Button variant="ghost" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>&gt;</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminStockManagement;
