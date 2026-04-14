import { useState, useEffect, useMemo, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Search, ShoppingCart, Plus, Minus, Trash2, Loader2, ChevronLeft, ChevronRight, Eye, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditOrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_image: string | null;
  quantity: number;
  price: number;
}

interface ProductRow {
  id: string;
  name: string;
  price: number;
  original_price: number | null;
  discount: number | null;
  stock: number | null;
  images: string[] | null;
  category_id: string | null;
}

interface CategoryRow {
  id: string;
  name: string;
  parent_id: string | null;
}

interface EditOrderModalProps {
  order: any;
  open: boolean;
  onClose: () => void;
  onViewDetails: () => void;
  onSave: (orderId: string, items: EditOrderItem[], customer: { name: string; phone: string; address: string; notes: string }, discount: number, shipping: number) => Promise<void>;
}

const ITEMS_PER_PAGE = 12;

export const EditOrderModal = ({ order, open, onClose, onViewDetails, onSave }: EditOrderModalProps) => {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productSearch, setProductSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [subCategoryFilter, setSubCategoryFilter] = useState('all');
  const [productPage, setProductPage] = useState(1);
  const [saving, setSaving] = useState(false);

  // Order items state
  const [orderItems, setOrderItems] = useState<EditOrderItem[]>([]);

  // Customer details state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [discount, setDiscount] = useState(0);
  const [shipping, setShipping] = useState(0);

  // Initialize from order
  useEffect(() => {
    if (!order) return;
    const sa = order.shipping_address || {};
    const firstName = order.profile?.first_name || sa.first_name || sa.firstName || '';
    const lastName = order.profile?.last_name || sa.last_name || sa.lastName || '';
    setCustomerName(`${firstName} ${lastName}`.trim() || 'Guest');
    setCustomerPhone(order.profile?.phone || order.guest_phone || sa.phone || '');
    setCustomerAddress([sa.address, sa.apartment, sa.city, sa.state, sa.zip_code].filter(Boolean).join(', ') || '');
    setOrderNotes('');
    setDiscount(order.discount || 0);
    setShipping(order.shipping || 0);

    const items: EditOrderItem[] = (order.items || []).map((i: any) => ({
      id: i.id,
      product_id: i.product_id || i.id,
      product_name: i.product_name,
      product_image: i.product_image,
      quantity: i.quantity,
      price: Number(i.price),
    }));
    setOrderItems(items);
  }, [order]);

  // Fetch products + categories
  useEffect(() => {
    if (!open) return;
    const fetch = async () => {
      setLoadingProducts(true);
      const [{ data: prods }, { data: cats }] = await Promise.all([
        supabase.from('products').select('id, name, price, original_price, discount, stock, images, category_id').eq('is_active', true).order('name').limit(500),
        supabase.from('categories').select('id, name, parent_id').order('name'),
      ]);
      setProducts(prods || []);
      setCategories(cats || []);
      setLoadingProducts(false);
    };
    fetch();
  }, [open]);

  const parentCategories = useMemo(() => categories.filter(c => !c.parent_id), [categories]);
  const subCategories = useMemo(() => {
    if (categoryFilter === 'all') return [];
    return categories.filter(c => c.parent_id === categoryFilter);
  }, [categories, categoryFilter]);

  const filteredProducts = useMemo(() => {
    let result = products;
    if (categoryFilter !== 'all') {
      const catIds = new Set([categoryFilter, ...categories.filter(c => c.parent_id === categoryFilter).map(c => c.id)]);
      if (subCategoryFilter !== 'all') {
        result = result.filter(p => p.category_id === subCategoryFilter);
      } else {
        result = result.filter(p => p.category_id && catIds.has(p.category_id));
      }
    }
    if (productSearch.trim()) {
      const q = productSearch.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(q));
    }
    return result;
  }, [products, categoryFilter, subCategoryFilter, productSearch, categories]);

  const totalProductPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const paginatedProducts = filteredProducts.slice((productPage - 1) * ITEMS_PER_PAGE, productPage * ITEMS_PER_PAGE);

  useEffect(() => { setProductPage(1); }, [productSearch, categoryFilter, subCategoryFilter]);

  const addProduct = useCallback((product: ProductRow) => {
    setOrderItems(prev => {
      const existing = prev.find(i => i.product_id === product.id);
      if (existing) {
        return prev.map(i => i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, {
        id: `new-${Date.now()}`,
        product_id: product.id,
        product_name: product.name,
        product_image: product.images?.[0] || null,
        quantity: 1,
        price: product.price,
      }];
    });
  }, []);

  const updateQuantity = (productId: string, delta: number) => {
    setOrderItems(prev => prev.map(i => {
      if (i.product_id === productId) {
        const newQty = Math.max(1, i.quantity + delta);
        return { ...i, quantity: newQty };
      }
      return i;
    }));
  };

  const removeItem = (productId: string) => {
    setOrderItems(prev => prev.filter(i => i.product_id !== productId));
  };

  const subtotal = orderItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const grandTotal = subtotal - discount + shipping;

  const handleSave = async () => {
    if (orderItems.length === 0) {
      toast.error('Add at least one item');
      return;
    }
    setSaving(true);
    try {
      await onSave(order.id, orderItems, { name: customerName, phone: customerPhone, address: customerAddress, notes: orderNotes }, discount, shipping);
      toast.success('Order updated successfully');
      onClose();
    } catch (e: any) {
      toast.error('Failed: ' + (e.message || 'Unknown error'));
    }
    setSaving(false);
  };

  const getDiscountPercent = (p: ProductRow) => {
    if (p.discount && p.discount > 0) return `-${p.discount}%`;
    if (p.original_price && p.original_price > p.price) {
      return `-${Math.round(((p.original_price - p.price) / p.original_price) * 100)}%`;
    }
    return null;
  };

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-[95vw] xl:max-w-7xl max-h-[95vh] overflow-hidden p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30">
          <div>
            <h2 className="text-lg font-bold text-foreground">Edit Order</h2>
            <p className="text-xs text-muted-foreground">Order: {order.order_number}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 text-primary border-primary/30 hover:bg-primary/5" onClick={onViewDetails}>
              <Eye className="h-3.5 w-3.5" /> View Details
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={onClose}>
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Orders
            </Button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row overflow-hidden" style={{ height: 'calc(95vh - 60px)' }}>
          {/* LEFT: Product Selector */}
          <div className="flex-1 lg:w-[60%] overflow-y-auto p-4 space-y-4 border-r border-border">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Select Item</h3>
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => { setProductSearch(''); setCategoryFilter('all'); setSubCategoryFilter('all'); }}>
                Reset Filters
              </Button>
            </div>

            {/* Search + Category Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search products or SKU" value={productSearch} onChange={e => setProductSearch(e.target.value)} className="pl-9 h-9" />
              </div>
              <Select value={categoryFilter} onValueChange={v => { setCategoryFilter(v); setSubCategoryFilter('all'); }}>
                <SelectTrigger className="h-9"><SelectValue placeholder="All Categories" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {parentCategories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={subCategoryFilter} onValueChange={setSubCategoryFilter} disabled={subCategories.length === 0}>
                <SelectTrigger className="h-9"><SelectValue placeholder="All Subcategories" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subcategories</SelectItem>
                  {subCategories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Product Grid */}
            {loadingProducts ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : paginatedProducts.length === 0 ? (
              <p className="text-center py-12 text-muted-foreground text-sm">No products found</p>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {paginatedProducts.map(product => {
                    const discountLabel = getDiscountPercent(product);
                    const isInStock = product.stock === null || product.stock > 0;
                    return (
                      <Card key={product.id} className="border border-border overflow-hidden group hover:shadow-md transition-shadow">
                        <div className="relative aspect-square bg-muted/50 flex items-center justify-center">
                          {product.images?.[0] ? (
                            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-muted-foreground text-xs">—</div>
                          )}
                          {discountLabel && (
                            <Badge className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[10px] px-1.5 py-0.5">
                              {discountLabel}
                            </Badge>
                          )}
                          {isInStock && (
                            <Badge className="absolute top-1.5 left-1.5 bg-emerald-500/90 text-white text-[10px] px-1.5 py-0.5">
                              In Stock
                            </Badge>
                          )}
                        </div>
                        <CardContent className="p-2.5 space-y-1.5">
                          <p className="text-xs font-medium text-foreground line-clamp-2 leading-tight min-h-[2rem]">{product.name}</p>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-sm font-bold text-foreground">৳{product.price.toFixed(2)}</span>
                            {product.original_price && product.original_price > product.price && (
                              <span className="text-[10px] text-muted-foreground line-through">৳{product.original_price.toFixed(2)}</span>
                            )}
                          </div>
                          <Button
                            size="sm"
                            className="w-full h-7 text-xs gap-1 bg-primary hover:bg-primary/90"
                            onClick={() => addProduct(product)}
                            disabled={!isInStock}
                          >
                            <ShoppingCart className="h-3 w-3" /> Add
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-muted-foreground">
                    Showing {(productPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(productPage * ITEMS_PER_PAGE, filteredProducts.length)} of {filteredProducts.length} entries
                  </p>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-7 w-7" disabled={productPage <= 1} onClick={() => setProductPage(p => p - 1)}>
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </Button>
                    {Array.from({ length: Math.min(totalProductPages, 5) }, (_, i) => {
                      let page: number;
                      if (totalProductPages <= 5) page = i + 1;
                      else if (productPage <= 3) page = i + 1;
                      else if (productPage >= totalProductPages - 2) page = totalProductPages - 4 + i;
                      else page = productPage - 2 + i;
                      return (
                        <Button key={page} variant={productPage === page ? 'default' : 'outline'} size="icon" className="h-7 w-7 text-xs" onClick={() => setProductPage(page)}>
                          {page}
                        </Button>
                      );
                    })}
                    <Button variant="outline" size="icon" className="h-7 w-7" disabled={productPage >= totalProductPages} onClick={() => setProductPage(p => p + 1)}>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* RIGHT: Customer Details + Order Items */}
          <div className="lg:w-[40%] overflow-y-auto p-4 space-y-4 bg-muted/10">
            {/* Customer Details */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Customer Details</h3>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Name</Label>
                  <Input className="h-9 mt-1" value={customerName} onChange={e => setCustomerName(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Phone</Label>
                  <Input className="h-9 mt-1" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Address</Label>
                  <Textarea className="mt-1 min-h-[60px] resize-y" value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Order Notes</Label>
                  <Textarea className="mt-1 min-h-[50px] resize-y" placeholder="Optional notes" value={orderNotes} onChange={e => setOrderNotes(e.target.value)} />
                </div>
              </div>
            </div>

            <Separator />

            {/* Order Items */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground">Order Items</h3>
                <Badge variant="outline" className="text-xs">{orderItems.length} items</Badge>
              </div>

              {orderItems.length === 0 ? (
                <p className="text-center text-muted-foreground text-xs py-6">No items added yet</p>
              ) : (
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {orderItems.map(item => (
                    <div key={item.product_id} className="flex items-start gap-2 bg-background rounded-lg p-2 border border-border">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-medium text-foreground truncate">{item.product_name}</p>
                          <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0 text-destructive hover:text-destructive" onClick={() => removeItem(item.product_id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="flex items-center justify-between mt-1.5">
                          <div className="flex items-center gap-0.5">
                            <span className="text-[10px] text-muted-foreground mr-1">Unit: {item.price.toFixed(2)}</span>
                            <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.product_id, -1)}>
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-xs font-medium w-7 text-center">{item.quantity}</span>
                            <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.product_id, 1)}>
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <span className="text-sm font-bold text-foreground">৳{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Order Summary */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">৳{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Discount</span>
                <div className="flex items-center gap-1">
                  <span className="text-destructive">-৳</span>
                  <Input type="number" min={0} className="h-7 w-20 text-xs text-right" value={discount} onChange={e => setDiscount(Math.max(0, Number(e.target.value)))} />
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Shipping</span>
                <div className="flex items-center gap-1">
                  <span>৳</span>
                  <Input type="number" min={0} className="h-7 w-20 text-xs text-right" value={shipping} onChange={e => setShipping(Math.max(0, Number(e.target.value)))} />
                </div>
              </div>
              <Separator />
              <div className="flex justify-between text-base font-bold">
                <span>Grand Total</span>
                <span>৳{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-1">
              <Button className="w-full gap-2" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save Changes
              </Button>
              <Button variant="ghost" className="w-full text-xs text-muted-foreground" onClick={() => {
                if (!order) return;
                const items: EditOrderItem[] = (order.items || []).map((i: any) => ({
                  id: i.id, product_id: i.product_id || i.id, product_name: i.product_name,
                  product_image: i.product_image, quantity: i.quantity, price: Number(i.price),
                }));
                setOrderItems(items);
                setDiscount(order.discount || 0);
                setShipping(order.shipping || 0);
              }}>
                Reset Changes
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
