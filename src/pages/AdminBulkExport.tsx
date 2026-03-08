import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Download, Loader2, Package } from 'lucide-react';
import { exportToCSV } from '@/lib/csvExport';

const AdminBulkExport = () => {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    const { data, error } = await supabase.from('products').select('*, categories(name), sellers(name)').order('created_at', { ascending: false });
    if (error) { toast.error('Export failed'); setExporting(false); return; }

    exportToCSV(
      (data || []).map((p: any) => ({
        name: p.name, slug: p.slug, description: p.description || '',
        price: p.price, original_price: p.original_price || '', discount: p.discount || 0,
        stock: p.stock || 0, category: p.categories?.name || '', seller: p.sellers?.name || '',
        is_active: p.is_active ? 'Yes' : 'No', is_digital: p.is_digital ? 'Yes' : 'No',
        is_flash_sale: p.is_flash_sale ? 'Yes' : 'No', is_free_shipping: p.is_free_shipping ? 'Yes' : 'No',
        images: (p.images || []).join('|'), created_at: p.created_at,
      })),
      [
        { key: 'name', label: 'Name' }, { key: 'slug', label: 'Slug' },
        { key: 'description', label: 'Description' }, { key: 'price', label: 'Price' },
        { key: 'original_price', label: 'Original Price' }, { key: 'discount', label: 'Discount %' },
        { key: 'stock', label: 'Stock' }, { key: 'category', label: 'Category' },
        { key: 'seller', label: 'Seller' }, { key: 'is_active', label: 'Active' },
        { key: 'is_digital', label: 'Digital' }, { key: 'is_flash_sale', label: 'Flash Sale' },
        { key: 'is_free_shipping', label: 'Free Shipping' }, { key: 'images', label: 'Images' },
        { key: 'created_at', label: 'Created At' },
      ],
      'products-export'
    );
    toast.success(`${data?.length || 0} products exported`);
    setExporting(false);
  };

  return (
    <AdminLayout title="Bulk Export" description="Export all products as CSV">
      <Card className="max-w-lg mx-auto">
        <CardHeader><CardTitle className="flex items-center gap-2"><Download className="h-5 w-5" />Bulk Export Products</CardTitle></CardHeader>
        <CardContent className="space-y-6 text-center">
          <Package className="h-16 w-16 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">Download all products as a CSV file including name, price, stock, category, seller, images, and all flags.</p>
          <Button onClick={handleExport} disabled={exporting} className="gap-2 w-full">
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {exporting ? 'Exporting...' : 'Export All Products'}
          </Button>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminBulkExport;
