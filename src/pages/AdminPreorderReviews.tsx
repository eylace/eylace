import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, Star, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useAdminQuery } from '@/hooks/useAdminQuery';

export default function AdminPreorderReviews() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');

  const { data: reviews = [], isLoading, refetch: fetchData } = useAdminQuery(
    ['admin-preorder-reviews'],
    async () => {
      const { data } = await supabase
        .from('preorder_reviews')
        .select('*, preorder_products(products(name))')
        .order('created_at', { ascending: false });
      return data ?? [];
    }
  );

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('preorder_reviews').delete().eq('id', id);
    if (!error) { toast({ title: 'Review deleted' }); fetchData(); }
  };

  const filtered = (reviews as any[]).filter(r =>
    r.title?.toLowerCase().includes(search.toLowerCase()) ||
    r.content?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Preorder Product Reviews</h1>
          <p className="text-muted-foreground">{(reviews as any[]).length} reviews</p>
        </div>

        <Card>
          <CardHeader>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search reviews..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : filtered.length === 0 ? (
              <p className="text-center py-12 text-muted-foreground">No reviews found</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Content</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.preorder_products?.products?.name || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`h-3 w-3 ${i < r.rating ? 'fill-warning text-warning' : 'text-muted-foreground'}`} />
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{r.title}</TableCell>
                      <TableCell className="max-w-xs truncate">{r.content}</TableCell>
                      <TableCell>{format(new Date(r.created_at), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id)}>
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
