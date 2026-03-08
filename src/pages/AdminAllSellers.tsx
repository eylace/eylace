import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Loader2, Store, Search, Star, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Seller {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  rating: number | null;
  is_verified: boolean | null;
  user_id: string | null;
  created_at: string;
}

const AdminAllSellers = () => {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchSellers = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('sellers').select('*').order('created_at', { ascending: false });
    if (!error && data) setSellers(data);
    setIsLoading(false);
  }, []);

  useEffect(() => { fetchSellers(); }, [fetchSellers]);

  const toggleVerified = async (id: string, current: boolean | null) => {
    const { error } = await supabase.from('sellers').update({ is_verified: !current }).eq('id', id);
    if (!error) { toast.success('Updated'); fetchSellers(); } else toast.error('Failed');
  };

  const filtered = sellers.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <AdminLayout titleKey="admin.sellers.all" descriptionKey="admin.sellers.allDesc">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-lg flex items-center gap-2"><Store className="h-5 w-5" /> All Sellers ({sellers.length})</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search sellers..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No sellers found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{s.slug}</TableCell>
                    <TableCell><div className="flex items-center gap-1"><Star className="h-3.5 w-3.5 text-yellow-500" />{s.rating?.toFixed(1) || '0.0'}</div></TableCell>
                    <TableCell>
                      {s.is_verified ? <Badge className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle className="h-3 w-3 mr-1" />Verified</Badge> : <Badge variant="secondary"><XCircle className="h-3 w-3 mr-1" />Unverified</Badge>}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => toggleVerified(s.id, s.is_verified)}>
                        {s.is_verified ? 'Unverify' : 'Verify'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminAllSellers;
