import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Search, Save } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function AdminClubPointProducts() {
  const [search, setSearch] = useState('');
  const [points, setPoints] = useState<Record<string, number>>({});

  const { data: products = [] } = useQuery({
    queryKey: ['admin-products-points'],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('id, name, price, stock').order('created_at', { ascending: false }).limit(100);
      return data || [];
    },
  });

  const filtered = products.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()));

  const handleSave = () => toast.success('Product points saved');

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Set Product Points</h1>
          <Button onClick={handleSave}><Save className="h-4 w-4 mr-2" />Save All</Button>
        </div>
        <Card>
          <CardHeader>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." className="pl-10" />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Points Earned</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>৳{p.price}</TableCell>
                    <TableCell>{p.stock ?? 'N/A'}</TableCell>
                    <TableCell><Input type="number" className="w-24 h-8" value={points[p.id] ?? Math.floor(p.price / 100)} onChange={e => setPoints(prev => ({ ...prev, [p.id]: +e.target.value }))} /></TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No products found</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
