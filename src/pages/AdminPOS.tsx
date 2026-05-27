import { useMemo, useState } from 'react';
import { Search, Plus, Minus, Trash2, ShoppingCart, Printer, X, ScanLine, UserPlus, Package } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAdminQuery } from '@/hooks/useAdminQuery';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface POSProduct {
  id: string;
  name: string;
  price: number;
  image: string | null;
  stock: number;
  category: string | null;
}

interface CartLine {
  product: POSProduct;
  qty: number;
}

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'bkash', label: 'bKash' },
  { value: 'nagad', label: 'Nagad' },
  { value: 'bank', label: 'Bank Transfer' },
];

export default function AdminPOS() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [discountPct, setDiscountPct] = useState<number>(0);
  const [taxPct, setTaxPct] = useState<number>(0);
  const [amountPaid, setAmountPaid] = useState<number>(0);

  const { data: products = [], isLoading } = useAdminQuery<POSProduct[]>(
    ['admin-pos-products'],
    async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, original_price, images, stock, category_id, categories(name)')
        .eq('is_active', true)
        .order('name', { ascending: true })
        .limit(500);
      if (error) throw error;
      return (data ?? []).map((p: any) => ({
        id: p.id,
        name: p.name,
        price: Number(p.price ?? 0),
        image: Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : null,
        stock: Number(p.stock ?? 0),
        category: p.categories?.name ?? null,
      }));
    },
  );

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => p.category && set.add(p.category));
    return Array.from(set).sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (category !== 'all' && p.category !== category) return false;
      if (!q) return true;
      return p.name.toLowerCase().includes(q);
    });
  }, [products, search, category]);

  const addToCart = (p: POSProduct) => {
    if (p.stock <= 0) {
      toast.error(`${p.name} is out of stock`);
      return;
    }
    setCart((prev) => {
      const found = prev.find((l) => l.product.id === p.id);
      if (found) {
        if (found.qty >= p.stock) {
          toast.error(`Only ${p.stock} in stock`);
          return prev;
        }
        return prev.map((l) =>
          l.product.id === p.id ? { ...l, qty: l.qty + 1 } : l,
        );
      }
      return [...prev, { product: p, qty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((l) =>
          l.product.id === id
            ? { ...l, qty: Math.max(0, Math.min(l.product.stock, l.qty + delta)) }
            : l,
        )
        .filter((l) => l.qty > 0),
    );
  };

  const removeLine = (id: string) =>
    setCart((prev) => prev.filter((l) => l.product.id !== id));

  const clearCart = () => {
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setDiscountPct(0);
    setTaxPct(0);
    setAmountPaid(0);
  };

  const subtotal = useMemo(
    () => cart.reduce((s, l) => s + l.product.price * l.qty, 0),
    [cart],
  );
  const discountAmt = (subtotal * (discountPct || 0)) / 100;
  const taxableBase = subtotal - discountAmt;
  const taxAmt = (taxableBase * (taxPct || 0)) / 100;
  const total = Math.max(0, taxableBase + taxAmt);
  const change = Math.max(0, (amountPaid || 0) - total);
  const due = Math.max(0, total - (amountPaid || 0));

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    if (paymentMethod === 'cash' && amountPaid < total) {
      toast.error('Amount paid is less than total');
      return;
    }
    toast.success(`Sale completed — ৳${total.toFixed(2)}`, {
      description: `${cart.length} item(s) · ${paymentMethod.toUpperCase()}`,
    });
    clearCart();
  };

  return (
    <AdminLayout title="POS — Point of Sale" description="Quick in-store sales and checkout">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Product picker */}
        <div className="lg:col-span-2 space-y-3">
          <Card>
            <CardContent className="p-3 flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products / scan barcode…"
                  className="pl-9 h-10"
                  autoFocus
                />
                <ScanLine className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full sm:w-48 h-10">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Package className="h-4 w-4" />
                Products
                <Badge variant="secondary" className="ml-auto text-[10px]">
                  {filteredProducts.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="h-28 rounded-md bg-muted animate-pulse" />
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  No products found
                </div>
              ) : (
                <ScrollArea className="h-[calc(100vh-280px)] pr-2">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {filteredProducts.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => addToCart(p)}
                        disabled={p.stock <= 0}
                        className={cn(
                          'group rounded-lg border bg-card text-left p-2 hover:border-accent hover:shadow-md transition-all',
                          p.stock <= 0 && 'opacity-50 cursor-not-allowed',
                        )}
                      >
                        <div className="aspect-square rounded-md bg-muted overflow-hidden mb-1.5">
                          {p.image ? (
                            <img
                              src={p.image}
                              alt={p.name}
                              loading="lazy"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                              <Package className="h-6 w-6" />
                            </div>
                          )}
                        </div>
                        <p className="text-[11px] font-medium line-clamp-2 leading-tight min-h-[28px]">
                          {p.name}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs font-bold text-accent">
                            ৳{p.price.toFixed(0)}
                          </span>
                          <Badge
                            variant={p.stock > 0 ? 'secondary' : 'destructive'}
                            className="text-[9px] px-1 py-0"
                          >
                            {p.stock > 0 ? `${p.stock} in` : 'Out'}
                          </Badge>
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Cart & checkout */}
        <div className="space-y-3">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Current Sale
                <Badge className="text-[10px]">{cart.length}</Badge>
              </CardTitle>
              {cart.length > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={clearCart}
                  className="h-7 text-xs text-destructive"
                >
                  <X className="h-3 w-3 mr-1" /> Clear
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-3 pt-0">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-xs">
                  Tap a product to add it to the sale
                </div>
              ) : (
                <ScrollArea className="max-h-72">
                  <div className="space-y-2">
                    {cart.map((l) => (
                      <div
                        key={l.product.id}
                        className="flex items-center gap-2 p-2 rounded-md border bg-card/50"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{l.product.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            ৳{l.product.price.toFixed(0)} × {l.qty}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-6 w-6"
                            onClick={() => updateQty(l.product.id, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-6 text-center text-xs font-semibold">
                            {l.qty}
                          </span>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-6 w-6"
                            onClick={() => updateQty(l.product.id, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-destructive"
                            onClick={() => removeLine(l.product.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="w-16 text-right text-xs font-bold">
                          ৳{(l.product.price * l.qty).toFixed(0)}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <UserPlus className="h-4 w-4" /> Customer (optional)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 grid grid-cols-2 gap-2">
              <Input
                placeholder="Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="h-9 text-xs"
              />
              <Input
                placeholder="Phone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="h-9 text-xs"
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px]">Discount %</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={discountPct}
                    onChange={(e) => setDiscountPct(Number(e.target.value) || 0)}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[10px]">Tax / VAT %</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={taxPct}
                    onChange={(e) => setTaxPct(Number(e.target.value) || 0)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <Separator />
              <div className="space-y-1 text-xs">
                <Row label="Subtotal" value={subtotal} />
                <Row label={`Discount (${discountPct || 0}%)`} value={-discountAmt} negative />
                <Row label={`Tax (${taxPct || 0}%)`} value={taxAmt} />
                <Separator className="my-1" />
                <div className="flex justify-between font-bold text-base">
                  <span>Total</span>
                  <span className="text-accent">৳{total.toFixed(2)}</span>
                </div>
              </div>

              <Separator />
              <div>
                <Label className="text-[10px]">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px]">Amount Paid</Label>
                <Input
                  type="number"
                  min={0}
                  value={amountPaid || ''}
                  onChange={(e) => setAmountPaid(Number(e.target.value) || 0)}
                  className="h-9 text-xs"
                  placeholder="0.00"
                />
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Change</span>
                <span className="font-semibold text-[hsl(var(--success))]">
                  ৳{change.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Due</span>
                <span
                  className={cn(
                    'font-semibold',
                    due > 0 ? 'text-destructive' : 'text-muted-foreground',
                  )}
                >
                  ৳{due.toFixed(2)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={cart.length === 0}
                  onClick={() => toast.info('Receipt printed (demo)')}
                >
                  <Printer className="h-3.5 w-3.5 mr-1" /> Print
                </Button>
                <Button
                  variant="accent"
                  size="sm"
                  disabled={cart.length === 0}
                  onClick={handleCheckout}
                >
                  Checkout
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}

function Row({
  label,
  value,
  negative,
}: {
  label: string;
  value: number;
  negative?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn(negative && 'text-destructive')}>
        {negative && value !== 0 ? '-' : ''}৳{Math.abs(value).toFixed(2)}
      </span>
    </div>
  );
}