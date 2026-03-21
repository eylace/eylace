import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, EyeOff, Pencil, Trash2, Plus, Search, Star, Loader2 } from 'lucide-react';
import { ProductFormModal } from '@/components/seller/ProductFormModal';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { SellerProduct } from '@/hooks/useSellerData';

interface SellerProductsTabProps {
  products: SellerProduct[];
  isLoading: boolean;
  toggleProductActive: (id: string, active: boolean) => Promise<{ error: any }>;
  refetch: () => void;
  sellerId: string;
}

export const SellerProductsTab = ({ products, isLoading, toggleProductActive, refetch, sellerId }: SellerProductsTabProps) => {
  const [search, setSearch] = useState('');
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggleActive = async (productId: string, current: boolean) => {
    const { error } = await toggleProductActive(productId, !current);
    if (error) toast.error('Failed to update product');
    else toast.success(current ? 'Product deactivated' : 'Product activated');
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct({
      id: product.id, name: product.name, description: product.description || '',
      price: Number(product.price), original_price: product.original_price ? Number(product.original_price) : null,
      stock: product.stock ?? 0, category_id: product.category_id || null,
      is_active: product.is_active ?? true, images: product.images || [],
    });
    setProductModalOpen(true);
  };

  const handleDeleteProduct = async () => {
    if (!deletingProductId) return;
    setIsDeleting(true);
    const { error } = await supabase.from('products').delete().eq('id', deletingProductId);
    if (error) toast.error('Failed to delete product');
    else { toast.success('Product deleted'); refetch(); }
    setIsDeleting(false);
    setDeletingProductId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button onClick={() => { setEditingProduct(null); setProductModalOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Add Product
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">No products found</p>
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
                {filtered.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img src={product.images?.[0] || '/placeholder.svg'} alt={product.name} className="w-10 h-10 rounded object-cover" />
                        <span className="font-medium line-clamp-1 max-w-[200px]">{product.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{product.category?.name || '—'}</TableCell>
                    <TableCell>৳{Number(product.price).toFixed(0)}</TableCell>
                    <TableCell>
                      <span className={product.stock != null && product.stock < 10 ? 'text-destructive font-medium' : ''}>
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
                        <Button variant="ghost" size="sm" onClick={() => handleToggleActive(product.id, !!product.is_active)}>
                          {product.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEditProduct(product)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeletingProductId(product.id)} className="text-destructive hover:text-destructive">
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

      <ProductFormModal
        open={productModalOpen}
        onOpenChange={setProductModalOpen}
        sellerId={sellerId}
        product={editingProduct}
        onSuccess={refetch}
      />

      <AlertDialog open={!!deletingProductId} onOpenChange={(open) => !open && setDeletingProductId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. This will permanently delete the product.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProduct} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isDeleting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Deleting...</> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
