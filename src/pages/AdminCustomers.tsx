import { useState, useEffect, useMemo } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Users, Search, Loader2, ChevronLeft, ChevronRight, UserCheck, UserX, Crown } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';

type StatusFilter = 'all' | 'registered' | 'guest' | 'vip';

const PAGE_SIZE = 15;
const VIP_THRESHOLD = 500; // total spent threshold for VIP

interface CustomerRow {
  id: string;
  name: string;
  email: string;
  totalOrders: number;
  totalSpent: number;
  lastOrder: string;
  isGuest: boolean;
}

const AdminCustomers = () => {
  const { t } = useLanguage();
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: ordersData } = await supabase.functions.invoke('admin-get-orders');
      const orders = ordersData?.orders || [];
      const map: Record<string, CustomerRow> = {};
      orders.forEach((o: any) => {
        const key = o.user_id || `guest-${o.guest_email || o.id}`;
        if (!map[key]) {
          map[key] = {
            id: key,
            name: `${o.profile?.first_name || ''} ${o.profile?.last_name || ''}`.trim() || 'Guest',
            email: o.profile?.email || o.guest_email || 'N/A',
            totalOrders: 0,
            totalSpent: 0,
            lastOrder: o.created_at,
            isGuest: !o.user_id,
          };
        }
        map[key].totalOrders++;
        map[key].totalSpent += Number(o.total) || 0;
        if (new Date(o.created_at) > new Date(map[key].lastOrder)) {
          map[key].lastOrder = o.created_at;
        }
      });
      setCustomers(Object.values(map).sort((a, b) => b.totalSpent - a.totalSpent));
      setLoading(false);
    };
    fetchData();
  }, []);

  // Reset page on filter/search change
  useEffect(() => {
    setPage(1);
  }, [search, status]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return customers.filter((c) => {
      if (q && !c.name.toLowerCase().includes(q) && !c.email.toLowerCase().includes(q)) {
        return false;
      }
      if (status === 'registered' && c.isGuest) return false;
      if (status === 'guest' && !c.isGuest) return false;
      if (status === 'vip' && c.totalSpent < VIP_THRESHOLD) return false;
      return true;
    });
  }, [customers, search, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const counts = useMemo(() => ({
    all: customers.length,
    registered: customers.filter((c) => !c.isGuest).length,
    guest: customers.filter((c) => c.isGuest).length,
    vip: customers.filter((c) => c.totalSpent >= VIP_THRESHOLD).length,
  }), [customers]);

  return (
    <AdminLayout titleKey="admin.title.customers" descriptionKey="admin.desc.customers">
      <Card className="border border-border">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-5 w-5" />
            {t('admin.customers')} ({filtered.length})
          </CardTitle>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All ({counts.all})</SelectItem>
                <SelectItem value="registered">Registered ({counts.registered})</SelectItem>
                <SelectItem value="guest">Guest ({counts.guest})</SelectItem>
                <SelectItem value="vip">VIP ({counts.vip})</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('admin.searchCustomers')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-full sm:w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('admin.customer')}</TableHead>
                    <TableHead>{t('admin.email')}</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>{t('admin.orders')}</TableHead>
                    <TableHead>{t('admin.totalSpent')}</TableHead>
                    <TableHead>{t('admin.lastOrder')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageItems.map((customer) => {
                    const isVip = customer.totalSpent >= VIP_THRESHOLD;
                    return (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium">{customer.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{customer.email}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {customer.isGuest ? (
                              <Badge variant="outline" className="gap-1">
                                <UserX className="h-3 w-3" /> Guest
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="gap-1">
                                <UserCheck className="h-3 w-3" /> Registered
                              </Badge>
                            )}
                            {isVip && (
                              <Badge className="gap-1 bg-accent text-accent-foreground">
                                <Crown className="h-3 w-3" /> VIP
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{customer.totalOrders}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">${customer.totalSpent.toFixed(2)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(customer.lastOrder), 'MMM d, yyyy')}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {pageItems.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        {t('admin.noCustomers')}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {filtered.length > 0 && (
                <div className="flex items-center justify-between border-t px-4 py-3">
                  <p className="text-sm text-muted-foreground">
                    Page {page} of {totalPages} • {filtered.length} customers
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" /> Prev
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Next <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminCustomers;
