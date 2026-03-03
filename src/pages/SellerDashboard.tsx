import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { SellerAnalytics } from '@/components/seller/SellerAnalytics';
import {
  Package,
  ShoppingCart,
  BarChart3,
  Loader2,
  ShieldAlert,
  Eye,
  EyeOff,
  Star,
  TrendingUp,
  DollarSign,
  BoxIcon,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import { useSellerCheck, useSellerProducts, useSellerOrders } from '@/hooks/useSellerData';
import { ProductFormModal } from '@/components/seller/ProductFormModal';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

const statusColors: Record<string, string> = {
  pending: 'bg-warning/20 text-warning',
  processing: 'bg-accent/20 text-accent',
  shipped: 'bg-primary/20 text-primary',
  delivered: 'bg-emerald-500/20 text-emerald-700',
  cancelled: 'bg-destructive/20 text-destructive',
};

const SellerDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { seller, isLoading: sellerLoading } = useSellerCheck();
  const { products, isLoading: productsLoading, toggleProductActive, refetch } = useSellerProducts(seller?.id);
  const { orders, isLoading: ordersLoading } = useSellerOrders(seller?.id);
  const [activeTab, setActiveTab] = useState('overview');
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  if (authLoading || sellerLoading) {
    return (
      <Layout>
        <div className="container-main py-12 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      </Layout>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  if (!seller) {
    return (
      <Layout>
        <div className="container-main py-12">
          <div className="max-w-md mx-auto text-center">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Seller Access Only</h1>
            <p className="text-muted-foreground">
              You don't have a seller account. Please contact support to register as a seller.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
  const totalOrders = orders.length;
  const activeProducts = products.filter(p => p.is_active).length;

  const handleToggleActive = async (productId: string, current: boolean) => {
    const { error } = await toggleProductActive(productId, !current);
    if (error) {
      toast.error('Failed to update product');
    } else {
      toast.success(current ? 'Product deactivated' : 'Product activated');
    }
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct({
      id: product.id,
      name: product.name,
      description: product.description || '',
      price: Number(product.price),
      original_price: product.original_price ? Number(product.original_price) : null,
      stock: product.stock ?? 0,
      category_id: product.category_id || null,
      is_active: product.is_active ?? true,
      images: product.images || [],
    });
    setProductModalOpen(true);
  };

  const handleDeleteProduct = async () => {
    if (!deletingProductId) return;
    setIsDeleting(true);
    const { error } = await supabase.from('products').delete().eq('id', deletingProductId);
    if (error) {
      toast.error('Failed to delete product');
    } else {
      toast.success('Product deleted');
      refetch();
    }
    setIsDeleting(false);
    setDeletingProductId(null);
  };

  return (
    <Layout>
      <div className="container-main py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Seller Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome, {seller.name}
              {seller.is_verified && (
                <Badge className="ml-2 bg-accent/20 text-accent">Verified</Badge>
              )}
            </p>
          </div>
          {seller.rating && (
            <div className="flex items-center gap-1 text-sm">
              <Star className="h-4 w-4 fill-accent text-accent" />
              <span className="font-medium">{seller.rating}</span>
          </div>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-2">
              <Package className="h-4 w-4" />
              Products
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              Orders
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <SellerAnalytics orders={orders} products={products} />
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Your Products ({products.length})</CardTitle>
                <Button onClick={() => { setEditingProduct(null); setProductModalOpen(true); }} className="gap-2">
                  <Plus className="h-4 w-4" /> Add Product
                </Button>
              </CardHeader>
              <CardContent>
                {productsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-accent" />
                  </div>
                ) : products.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No products yet</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <img
                                src={product.images?.[0] || '/placeholder.svg'}
                                alt={product.name}
                                className="w-10 h-10 rounded object-cover"
                              />
                              <span className="font-medium line-clamp-1">{product.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>{product.category?.name || '—'}</TableCell>
                          <TableCell>${Number(product.price).toFixed(2)}</TableCell>
                          <TableCell>
                            <span className={product.stock && product.stock < 10 ? 'text-destructive font-medium' : ''}>
                              {product.stock ?? 0}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-accent text-accent" />
                              {product.rating ?? 0}
                              <span className="text-xs text-muted-foreground">({product.review_count ?? 0})</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={product.is_active ? 'default' : 'secondary'}>
                              {product.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleActive(product.id, !!product.is_active)}
                              >
                                {product.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditProduct(product)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeletingProductId(product.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Orders for Your Products ({orders.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-accent" />
                  </div>
                ) : orders.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No orders yet</p>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="border border-border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <span className="font-medium">#{order.order_number}</span>
                            <span className="text-sm text-muted-foreground ml-3">
                              {format(new Date(order.created_at), 'MMM d, yyyy')}
                            </span>
                          </div>
                          <Badge className={statusColors[order.status] || 'bg-muted text-muted-foreground'}>
                            {order.status}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          {order.items.map((item) => (
                            <div key={item.id} className="flex items-center gap-3">
                              <img
                                src={item.product_image || '/placeholder.svg'}
                                alt={item.product_name}
                                className="w-8 h-8 rounded object-cover"
                              />
                              <span className="text-sm flex-1">{item.product_name}</span>
                              <span className="text-sm text-muted-foreground">x{item.quantity}</span>
                              <span className="text-sm font-medium">${Number(item.price).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <ProductFormModal
        open={productModalOpen}
        onOpenChange={setProductModalOpen}
        sellerId={seller.id}
        product={editingProduct}
        onSuccess={refetch}
      />

      <AlertDialog open={!!deletingProductId} onOpenChange={(open) => !open && setDeletingProductId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The product will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProduct} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isDeleting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Deleting...</> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default SellerDashboard;
