import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Eye } from 'lucide-react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function AdminAffiliateUsers() {
  const [search, setSearch] = useState('');

  const { data: affiliates = [] } = useQuery({
    queryKey: ['admin-affiliate-users'],
    queryFn: async () => {
      const { data } = await supabase.from('affiliates').select('*').order('created_at', { ascending: false });
      return data || [];
    },
  });

  const filtered = affiliates.filter(a => !search || a.referral_code.toLowerCase().includes(search.toLowerCase()) || a.user_id.includes(search));

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Affiliate Users</h1>
        <Card>
          <CardHeader>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search affiliates..." className="pl-10" />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Referral Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Commission %</TableHead>
                  <TableHead>Clicks</TableHead>
                  <TableHead>Conversions</TableHead>
                  <TableHead>Earnings</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(a => (
                  <TableRow key={a.id}>
                    <TableCell className="font-mono font-medium">{a.referral_code}</TableCell>
                    <TableCell><Badge variant={a.status === 'active' ? 'default' : 'secondary'}>{a.status}</Badge></TableCell>
                    <TableCell>{a.commission_rate}%</TableCell>
                    <TableCell>{a.total_clicks || 0}</TableCell>
                    <TableCell>{a.total_conversions || 0}</TableCell>
                    <TableCell className="font-bold">৳{a.total_earnings || 0}</TableCell>
                    <TableCell className="text-sm">{new Date(a.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No affiliates found</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
