import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, DollarSign, ShoppingCart, Package, Star } from 'lucide-react';
import type { SellerOrder, SellerProduct } from '@/hooks/useSellerData';

interface SellerAnalyticsProps {
  orders: SellerOrder[];
  products: SellerProduct[];
}

const CHART_COLORS = [
  'hsl(24, 100%, 50%)',   // accent orange
  'hsl(213, 50%, 23%)',   // primary navy
  'hsl(142, 76%, 36%)',   // success green
  'hsl(38, 92%, 50%)',    // warning yellow
  'hsl(0, 84%, 60%)',     // destructive red
  'hsl(215, 16%, 47%)',   // muted
];

export const SellerAnalytics = ({ orders, products }: SellerAnalyticsProps) => {
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
  const avgOrderValue = orders.length ? totalRevenue / orders.length : 0;

  // Revenue by month (last 6 months)
  const revenueByMonth = useMemo(() => {
    const months: Record<string, number> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      months[key] = 0;
    }
    orders.forEach((o) => {
      const d = new Date(o.created_at);
      const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      if (key in months) months[key] += Number(o.total);
    });
    return Object.entries(months).map(([month, revenue]) => ({ month, revenue: +revenue.toFixed(2) }));
  }, [orders]);

  // Orders by status
  const ordersByStatus = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach((o) => {
      counts[o.status] = (counts[o.status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [orders]);

  // Top products by revenue
  const topProducts = useMemo(() => {
    const productRevenue: Record<string, { name: string; revenue: number; qty: number }> = {};
    orders.forEach((o) => {
      o.items.forEach((item) => {
        if (!productRevenue[item.product_name]) {
          productRevenue[item.product_name] = { name: item.product_name, revenue: 0, qty: 0 };
        }
        productRevenue[item.product_name].revenue += Number(item.price) * item.quantity;
        productRevenue[item.product_name].qty += item.quantity;
      });
    });
    return Object.values(productRevenue)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [orders]);

  // Daily orders trend (last 30 days)
  const dailyOrders = useMemo(() => {
    const days: Record<string, number> = {};
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      days[d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })] = 0;
    }
    orders.forEach((o) => {
      const d = new Date(o.created_at);
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (key in days) days[key]++;
    });
    return Object.entries(days).map(([date, count]) => ({ date, count }));
  }, [orders]);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: `৳${totalRevenue.toFixed(2)}`, icon: DollarSign, change: '+12%' },
          { label: 'Total Orders', value: orders.length, icon: ShoppingCart, change: '+8%' },
          { label: 'Avg. Order Value', value: `৳${avgOrderValue.toFixed(2)}`, icon: TrendingUp, change: '+5%' },
          { label: 'Active Products', value: products.filter(p => p.is_active).length, icon: Package, change: null },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className="h-5 w-5 text-muted-foreground" />
                {stat.change && (
                  <Badge variant="outline" className="text-[hsl(var(--success))] border-[hsl(var(--success))]/30 text-xs">
                    {stat.change}
                  </Badge>
                )}
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(215, 16%, 47%)" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(215, 16%, 47%)" />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid hsl(214, 32%, 91%)' }}
                  formatter={(value: number) => [`৳${value.toFixed(2)}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="hsl(24, 100%, 50%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Order Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daily Orders (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={dailyOrders}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(215, 16%, 47%)" interval={4} />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(215, 16%, 47%)" allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid hsl(214, 32%, 91%)' }} />
                <Line type="monotone" dataKey="count" stroke="hsl(213, 50%, 23%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Order Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {ordersByStatus.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No orders yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={ordersByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {ordersByStatus.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Products by Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No sales data yet</p>
            ) : (
              <div className="space-y-4">
                {topProducts.map((product, i) => (
                  <div key={product.name} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-sm font-bold text-muted-foreground">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.qty} units sold</p>
                    </div>
                    <p className="text-sm font-semibold">৳{product.revenue.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
