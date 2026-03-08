import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Package, Plus, Search, Edit, Trash2, Eye, EyeOff, Loader2, Image as ImageIcon } from 'lucide-react';
import { AdminProductFormModal } from '@/components/admin/ProductFormModal';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useLanguage } from '@/contexts/LanguageContext';

const AdminProducts = () => {
  const { t } = useLanguage();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('products').select('*, categories(name)').order('created_at', { ascending: false });
    if (!error && data) setProducts(data);
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, []);

  const toggleActive = async (id: string, current: boolean) => {
    const { error } = await supabase.from('products').update({ is_active: !current }).eq('id', id);
    if (!error) { toast.success(`Product ${!current ? 'activated' : 'deactivated'}`); fetchProducts(); }
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) { toast.success('Product deleted'); fetchProducts(); } else { toast.error('Failed to delete product'); }
  };

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.slug.toLowerCase().includes(search.toLowerCase()));

  return (
    <AdminLayout titleKey="admin.title.products" descriptionKey="admin.desc.products">
      <Card className="border border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base"><Package className="h-5 w-5" />{t('admin.allProducts')} ({filtered.length})</CardTitle>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder={t('admin.searchProducts')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 w-64" />
            </div>
            <Button size="sm" className="gap-1" onClick={() => { setEditProduct(null); setFormOpen(true); }}><Plus className="h-4 w-4" /> {t('admin.addProduct')}</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('admin.product')}</TableHead>
                  <TableHead>{t('admin.price')}</TableHead>
                  <TableHead>{t('admin.stock')}</TableHead>
                  <TableHead>{t('admin.category')}</TableHead>
                  <TableHead>{t('admin.status')}</TableHead>
                  <TableHead>{t('admin.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {product.images?.[0] ? (<img src={product.images[0]} alt={product.name} className="h-10 w-10 rounded-lg object-cover" />) : (<div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center"><ImageIcon className="h-4 w-4 text-muted-foreground" /></div>)}
                        <div><p className="font-medium text-sm truncate max-w-[200px]">{product.name}</p><p className="text-xs text-muted-foreground">{product.slug}</p></div>
                      </div>
                    </TableCell>
                    <TableCell><span className="font-medium">${product.price}</span>{product.original_price && (<span className="text-xs text-muted-foreground line-through ml-1">${product.original_price}</span>)}</TableCell>
                    <TableCell><Badge variant={product.stock > 10 ? 'secondary' : 'destructive'} className="text-xs">{product.stock || 0}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{(product as any).categories?.name || t('admin.uncategorized')}</TableCell>
                    <TableCell><Badge className={product.is_active ? 'bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]' : 'bg-muted text-muted-foreground'}>{product.is_active ? t('admin.active') : t('admin.inactive')}</Badge></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditProduct(product); setFormOpen(true); }}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleActive(product.id, product.is_active)}>{product.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>{t('admin.deleteProduct')}</AlertDialogTitle><AlertDialogDescription>{t('admin.deleteConfirm')} "{product.name}"? {t('admin.cannotUndo')}</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>{t('admin.cancel')}</AlertDialogCancel><AlertDialogAction onClick={() => deleteProduct(product.id)} className="bg-destructive text-destructive-foreground">{t('admin.delete')}</AlertDialogAction></AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (<TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">{t('admin.noProducts')}</TableCell></TableRow>)}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <AdminProductFormModal open={formOpen} onOpenChange={setFormOpen} product={editProduct} onSaved={fetchProducts} />
    </AdminLayout>
  );
};

export default AdminProducts;
