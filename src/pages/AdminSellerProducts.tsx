import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Store, Search, Edit, Trash2, Eye, EyeOff, Loader2, Image as ImageIcon, RefreshCw } from 'lucide-react';
import { AdminProductFormModal } from '@/components/admin/ProductFormModal';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const AdminSellerProducts = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [sellers, setSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);

  const fetchProducts = async () => {
    setLoading(true);
    setLoadError(null);

    const { data: authData } = await supabase.auth.getSession();
    if (!authData.session?.user) {
      setProducts([]);
      setLoadError('Admin session is not ready. Please sign in again.');
      setLoading(false);
      return;
    }

    const [productRes, sellerRes] = await Promise.all([
      supabase.from('products').select('*').not('seller_id', 'is', null).order('created_at', { ascending: false }),
      supabase.from('sellers').select('id, name').order('name'),
    ]);

    if (!productRes.error && productRes.data) setProducts(productRes.data);
    if (!sellerRes.error && sellerRes.data) setSellers(sellerRes.data);
    if (productRes.error) setLoadError(productRes.error.message);
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, []);

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from('products').update({ is_active: !current }).eq('id', id);
    toast.success(`Product ${!current ? 'activated' : 'deactivated'}`);
    fetchProducts();
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) { toast.success('Product deleted'); fetchProducts(); }
  };

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <AdminLayout title="Seller Products" description="Products listed by sellers">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base"><Store className="h-5 w-5" />Seller Products ({filtered.length})</CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 w-48 md:w-64" />
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>
          ) : loadError ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <Store className="h-10 w-10 text-muted-foreground/30" />
              <p className="font-medium text-foreground">Seller products could not load</p>
              <p className="max-w-md text-sm text-muted-foreground">{loadError}</p>
              <Button variant="outline" size="sm" onClick={fetchProducts} className="gap-2">
                <RefreshCw className="h-4 w-4" /> Retry
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Seller</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {product.images?.[0] ? <img src={product.images[0]} alt="" className="h-10 w-10 rounded-lg object-cover" /> : <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center"><ImageIcon className="h-4 w-4 text-muted-foreground" /></div>}
                        <p className="font-medium text-sm truncate max-w-[200px]">{product.name}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{sellers.find((seller) => seller.id === product.seller_id)?.name || 'Unknown'}</TableCell>
                    <TableCell>৳{product.price}</TableCell>
                    <TableCell><Badge variant={product.stock > 10 ? 'secondary' : 'destructive'}>{product.stock || 0}</Badge></TableCell>
                    <TableCell><Badge variant={product.is_active ? 'default' : 'secondary'}>{product.is_active ? 'Active' : 'Inactive'}</Badge></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleActive(product.id, product.is_active)}>{product.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Delete Product</AlertDialogTitle><AlertDialogDescription>Delete "{product.name}"?</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteProduct(product.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No seller products found</TableCell></TableRow>}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <AdminProductFormModal open={formOpen} onOpenChange={setFormOpen} product={editProduct} onSaved={fetchProducts} />
    </AdminLayout>
  );
};

export default AdminSellerProducts;
