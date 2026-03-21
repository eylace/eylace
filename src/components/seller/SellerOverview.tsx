import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DollarSign, ShoppingCart, TrendingUp, Package, AlertTriangle,
  Clock, Plus, Eye,
} from 'lucide-react';
import type { SellerOrder, SellerProduct } from '@/hooks/useSellerData';

interface SellerOverviewProps {
  orders: SellerOrder[];
  products: SellerProduct[];
  onNavigate: (tab: string) => void;
}

export const SellerOverview = ({ orders, products, onNavigate }: SellerOverviewProps) => {
  const totalRevenue = orders.reduce((s, o) => s + Number(o.total), 0);
  const avgOrderValue = orders.length ? totalRevenue / orders.length : 0;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const lowStockProducts = products.filter(p => (p.stock ?? 0) < 10 && p.is_active);
  const activeProducts = products.filter(p => p.is_active).length;

  const kpis = [
    { label: 'Total Revenue', value: `৳${totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-accent' },
    { label: 'Total Orders', value: orders.length.toString(), icon: ShoppingCart, color: 'text-primary' },
    { label: 'Avg Order Value', value: `৳${avgOrderValue.toFixed(0)}`, icon: TrendingUp, color: 'text-[hsl(var(--success))]' },
    { label: 'Active Products', value: activeProducts.toString(), icon: Package, color: 'text-muted-foreground' },
    { label: 'Pending Orders', value: pendingOrders.toString(), icon: Clock, color: 'text-[hsl(var(--warning))]' },
    { label: 'Low Stock', value: lowStockProducts.length.toString(), icon: AlertTriangle, color: 'text-destructive' },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="pt-5 pb-4">
              <kpi.icon className={`h-5 w-5 mb-2 ${kpi.color}`} />
              <p className="text-2xl font-bold">{kpi.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button onClick={() => onNavigate('products')} className="gap-2">
            <Plus className="h-4 w-4" /> Add Product
          </Button>
          <Button variant="outline" onClick={() => onNavigate('orders')} className="gap-2">
            <Eye className="h-4 w-4" /> View Orders
          </Button>
          <Button variant="outline" onClick={() => onNavigate('analytics')} className="gap-2">
            <TrendingUp className="h-4 w-4" /> View Analytics
          </Button>
        </CardContent>
      </Card>

      {/* Low Stock Alerts */}
      {lowStockProducts.length > 0 && (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" /> Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockProducts.slice(0, 5).map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <span className="truncate">{p.name}</span>
                  <Badge variant="destructive">{p.stock ?? 0} left</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Orders</CardTitle>
          <Button variant="link" size="sm" onClick={() => onNavigate('orders')}>View All</Button>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-muted-foreground text-center py-6">No orders yet</p>
          ) : (
            <div className="space-y-3">
              {orders.slice(0, 5).map((order) => (
                <div key={order.id} className="flex items-center justify-between text-sm border-b border-border pb-2 last:border-0">
                  <div>
                    <span className="font-medium">#{order.order_number}</span>
                    <span className="text-muted-foreground ml-2">{order.items.length} items</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium">৳{Number(order.total).toFixed(0)}</span>
                    <Badge variant="outline" className="capitalize">{order.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
