import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, CheckCircle, XCircle } from 'lucide-react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function AdminAffiliateWithdrawals() {
  const [search, setSearch] = useState('');

  const { data: payouts = [], refetch } = useQuery({
    queryKey: ['admin-affiliate-payouts'],
    queryFn: async () => {
      const { data } = await supabase.from('affiliate_payouts').select('*, affiliates(referral_code)').order('created_at', { ascending: false });
      return data || [];
    },
  });

  const filtered = payouts.filter(p => !search || (p.affiliates as any)?.referral_code?.toLowerCase().includes(search.toLowerCase()));

  const handleAction = async (id: string, status: string) => {
    const { error } = await supabase.from('affiliate_payouts').update({ status }).eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Payout ${status}`);
    refetch();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Affiliate Withdraw Requests</h1>
        <Card>
          <CardHeader>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="pl-10" />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Affiliate</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono">{(p.affiliates as any)?.referral_code || 'N/A'}</TableCell>
                    <TableCell className="font-bold">৳{p.amount}</TableCell>
                    <TableCell>{p.payment_method || 'N/A'}</TableCell>
                    <TableCell><Badge variant={p.status === 'paid' ? 'default' : p.status === 'rejected' ? 'destructive' : 'secondary'}>{p.status}</Badge></TableCell>
                    <TableCell className="text-sm">{new Date(p.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="space-x-1">
                      {p.status === 'pending' && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => handleAction(p.id, 'paid')}><CheckCircle className="h-3 w-3 mr-1" />Approve</Button>
                          <Button size="sm" variant="outline" className="text-destructive" onClick={() => handleAction(p.id, 'rejected')}><XCircle className="h-3 w-3 mr-1" />Reject</Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No requests found</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
