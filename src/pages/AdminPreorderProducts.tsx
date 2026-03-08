import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Search, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface PreorderProduct {
  id: string;
  product_id: string;
  preorder_price: number;
  advance_amount: number;
  advance_type: string;
  estimated_delivery: string | null;
  max_quantity: number;
  status: string;
  created_at: string;
  products?: { name: string; images: string[] | null } | null;
}

export default function AdminPreorderProducts() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [items, setItems] = useState<PreorderProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('preorder_products')
      .select('*, products(name, images)')
      .order('created_at', { ascending: false });

    if (!error) setItems(data || []);
    setIsLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleStatus = async (id: string, current: string) => {
    const newStatus = current === 'active' ? 'paused' : 'active';
    const { error } = await supabase.from('preorder_products').update({ status: newStatus }).eq('id', id);
    if (!error) {
      toast({ title: `Status changed to ${newStatus}` });
      fetchData();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('preorder_products').delete().eq('id', id);
    if (!error) {
      toast({ title: 'Preorder product deleted' });
      fetchData();
    } else {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const filtered = items.filter(i =>
    (i.products as any)?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const statusColor = (s: string) => {
    if (s === 'active') return 'default';
    if (s === 'paused') return 'secondary';
    return 'destructive';
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Preorder Products</h1>
            <p className="text-muted-foreground">{items.length} preorder products</p>
          </div>
          <Button onClick={() => navigate('/admin/preorder/add')}>
            <Plus className="h-4 w-4 mr-2" /> Add New
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : filtered.length === 0 ? (
              <p className="text-center py-12 text-muted-foreground">No preorder products found</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Advance</TableHead>
                    <TableHead>Max Qty</TableHead>
                    <TableHead>Est. Delivery</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{(item.products as any)?.name || 'Unknown'}</TableCell>
                      <TableCell>৳{item.preorder_price}</TableCell>
                      <TableCell>{item.advance_amount}{item.advance_type === 'percentage' ? '%' : '৳'}</TableCell>
                      <TableCell>{item.max_quantity}</TableCell>
                      <TableCell>{item.estimated_delivery ? format(new Date(item.estimated_delivery), 'MMM dd, yyyy') : '-'}</TableCell>
                      <TableCell>
                        <Badge variant={statusColor(item.status)} className="cursor-pointer" onClick={() => toggleStatus(item.id, item.status)}>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
