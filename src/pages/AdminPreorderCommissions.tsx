import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminPreorderCommissions() {
  const { toast } = useToast();
  const [commissions, setCommissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('preorder_commissions')
      .select('*, sellers(name), preorder_orders(order_number)')
      .order('created_at', { ascending: false });
    setCommissions(data || []);
    setIsLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const markPaid = async (id: string) => {
    const { error } = await supabase.from('preorder_commissions').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', id);
    if (!error) { toast({ title: 'Commission marked as paid' }); fetchData(); }
  };

  const filtered = commissions.filter(c => filter === 'all' || c.status === filter);
  const totalPending = commissions.filter(c => c.status === 'pending').reduce((s, c) => s + Number(c.commission_amount), 0);
  const totalPaid = commissions.filter(c => c.status === 'paid').reduce((s, c) => s + Number(c.commission_amount), 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Preorder Commission History</h1>
          <p className="text-muted-foreground">Track seller commissions from preorders</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div><p className="text-sm text-muted-foreground">Pending Commissions</p><p className="text-2xl font-bold">৳{totalPending.toLocaleString()}</p></div>
              <DollarSign className="h-8 w-8 text-warning" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div><p className="text-sm text-muted-foreground">Total Paid</p><p className="text-2xl font-bold">৳{totalPaid.toLocaleString()}</p></div>
              <DollarSign className="h-8 w-8 text-success" />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Commissions</CardTitle>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : filtered.length === 0 ? (
              <p className="text-center py-12 text-muted-foreground">No commissions found</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Seller</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Paid At</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-sm">{c.preorder_orders?.order_number || '-'}</TableCell>
                      <TableCell>{c.sellers?.name || '-'}</TableCell>
                      <TableCell>{c.commission_rate}%</TableCell>
                      <TableCell className="font-semibold">৳{c.commission_amount}</TableCell>
                      <TableCell><Badge variant={c.status === 'paid' ? 'default' : 'secondary'}>{c.status}</Badge></TableCell>
                      <TableCell>{c.paid_at ? format(new Date(c.paid_at), 'MMM dd, yyyy') : '-'}</TableCell>
                      <TableCell>
                        {c.status === 'pending' && (
                          <Button size="sm" variant="outline" onClick={() => markPaid(c.id)}>Mark Paid</Button>
                        )}
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
