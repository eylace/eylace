import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Users, Search, Loader2, Mail, Calendar } from 'lucide-react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';

const AdminCustomers = () => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetch = async () => {
      // Admin can't directly query all profiles due to RLS
      // Use edge function or show orders-based customer list
      const { data: ordersData } = await supabase.functions.invoke('admin-get-orders');
      const orders = ordersData?.orders || [];
      
      const customerMap: Record<string, any> = {};
      orders.forEach((o: any) => {
        if (!customerMap[o.user_id]) {
          customerMap[o.user_id] = {
            id: o.user_id,
            name: `${o.profile?.first_name || ''} ${o.profile?.last_name || ''}`.trim() || 'Unknown',
            email: o.profile?.email || 'N/A',
            totalOrders: 0,
            totalSpent: 0,
            lastOrder: o.created_at,
          };
        }
        customerMap[o.user_id].totalOrders++;
        customerMap[o.user_id].totalSpent += o.total || 0;
        if (new Date(o.created_at) > new Date(customerMap[o.user_id].lastOrder)) {
          customerMap[o.user_id].lastOrder = o.created_at;
        }
      });
      
      setProfiles(Object.values(customerMap).sort((a, b) => b.totalSpent - a.totalSpent));
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = profiles.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout title="Customers" description="View customer information and order history">
      <Card className="border border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-5 w-5" />
            Customers ({filtered.length})
          </CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-64" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Last Order</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{customer.email}</TableCell>
                    <TableCell><Badge variant="secondary">{customer.totalOrders}</Badge></TableCell>
                    <TableCell className="font-medium">${customer.totalSpent.toFixed(2)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(customer.lastOrder), 'MMM d, yyyy')}
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No customers found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminCustomers;
