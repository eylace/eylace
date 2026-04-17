import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, MoreVertical, Truck } from 'lucide-react';
import { format } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { CourierDispatchModal } from '@/components/admin/CourierDispatchModal';
import { toast } from 'sonner';
import type { SellerOrder } from '@/hooks/useSellerData';

const statusColors: Record<string, string> = {
  pending: 'bg-[hsl(var(--warning))]/20 text-[hsl(var(--warning))]',
  processing: 'bg-accent/20 text-accent',
  shipped: 'bg-primary/20 text-primary',
  sent_to_courier: 'bg-primary/20 text-primary',
  delivered: 'bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]',
  cancelled: 'bg-destructive/20 text-destructive',
};

interface CourierOption { id: string; name: string; code: string }

interface SellerOrdersTabProps {
  orders: SellerOrder[];
  isLoading: boolean;
}

export const SellerOrdersTab = ({ orders, isLoading }: SellerOrdersTabProps) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [couriers, setCouriers] = useState<CourierOption[]>([]);
  const [dispatchOrder, setDispatchOrder] = useState<any>(null);
  const [dispatchProvider, setDispatchProvider] = useState('');

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('system_settings').select('value').eq('key', 'shipping_providers_config').maybeSingle();
      if (data?.value && Array.isArray(data.value)) {
        const enabled = (data.value as any[])
          .filter((p: any) => p.enabled)
          .map((p: any) => ({ id: p.id, name: p.name, code: p.code }));
        setCouriers(enabled);
      }
    };
    load();
  }, []);

  const statuses = ['all', ...new Set(orders.map(o => o.status))];

  const filtered = orders.filter(o => {
    const matchesSearch = o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      o.items.some(i => i.product_name.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleShipVia = async (order: SellerOrder, courier: CourierOption) => {
    // Fetch full order with shipping_address for prefill
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order.id)
      .maybeSingle();
    if (error || !data) {
      toast.error('Could not load order details');
      return;
    }
    setDispatchProvider(courier.code);
    setDispatchOrder({ ...data, items: order.items });
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search orders..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {statuses.map(s => (
            <Button key={s} variant={statusFilter === s ? 'default' : 'outline'} size="sm"
              onClick={() => setStatusFilter(s)} className="capitalize">
              {s}
            </Button>
          ))}
        </div>
      </div>

      {/* Order Cards */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading orders...</div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No orders found</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <Card key={order.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-52">
                        {couriers.length === 0 ? (
                          <DropdownMenuItem disabled>No couriers configured</DropdownMenuItem>
                        ) : (
                          couriers.map(c => (
                            <DropdownMenuItem key={c.id} onClick={() => handleShipVia(order, c)}>
                              <Truck className="h-4 w-4 mr-2" /> Ship via {c.name}
                            </DropdownMenuItem>
                          ))
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <span className="font-semibold">#{order.order_number}</span>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(order.created_at), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">৳{Number(order.total).toFixed(0)}</span>
                    <Badge className={statusColors[order.status] || 'bg-muted text-muted-foreground'}>
                      {order.status}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 text-sm">
                      <img src={item.product_image || '/placeholder.svg'} alt="" className="w-8 h-8 rounded object-cover" />
                      <span className="flex-1 truncate">{item.product_name}</span>
                      <span className="text-muted-foreground">×{item.quantity}</span>
                      <span className="font-medium">৳{Number(item.price).toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Courier Dispatch Modal */}
      <CourierDispatchModal
        open={!!dispatchOrder}
        order={dispatchOrder}
        providerCode={dispatchProvider}
        onClose={() => setDispatchOrder(null)}
      />
    </div>
  );
};
