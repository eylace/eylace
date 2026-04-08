import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function AdminAffiliateReferrals() {
  const [search, setSearch] = useState('');

  const { data: conversions = [] } = useQuery({
    queryKey: ['admin-affiliate-referrals'],
    queryFn: async () => {
      const { data } = await supabase.from('affiliate_conversions').select('*, affiliates(referral_code)').order('created_at', { ascending: false });
      return data || [];
    },
  });

  const filtered = conversions.filter(c => !search || (c.affiliates as any)?.referral_code?.toLowerCase().includes(search.toLowerCase()));

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Referral Users</h1>
        <Card>
          <CardHeader>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search referrals..." className="pl-10" />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Referral Code</TableHead>
                  <TableHead>Order Total</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono">{(c.affiliates as any)?.referral_code || 'N/A'}</TableCell>
                    <TableCell>৳{c.order_total}</TableCell>
                    <TableCell className="font-bold text-green-600">৳{c.commission_amount}</TableCell>
                    <TableCell><Badge variant={c.status === 'approved' ? 'default' : 'secondary'}>{c.status}</Badge></TableCell>
                    <TableCell className="text-sm">{new Date(c.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No referrals found</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
