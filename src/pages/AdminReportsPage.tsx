import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { BarChart3, TrendingUp, DollarSign, ShoppingCart, Users, Download, Calendar, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, eachMonthOfInterval, subMonths } from 'date-fns';

const COLORS = ['hsl(var(--accent))', 'hsl(var(--primary))', 'hsl(var(--destructive))', 'hsl(var(--muted-foreground))'];

const AdminReportsPage = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30days');

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.functions.invoke('admin-get-orders');
    setOrders(data?.orders || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getFilteredOrders = () => {
    const now = new Date();
    let from: Date;
    switch (period) {
      case '7days': from = subDays(now, 7); break;
      case '30days': from = subDays(now, 30); break;
      case '90days': from = subDays(now, 90); break;
      case '12months': from = subMonths(now, 12); break;
      default: from = subDays(now, 30);
    }
    return orders.filter(o => new Date(o.created_at) >= from);
  };

  const filtered = getFilteredOrders();
  const totalRevenue = filtered.reduce((s, o) => s + (o.total || 0), 0);
  const totalOrders = filtered.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const uniqueCustomers = new Set(filtered.map(o => o.user_id)).size;

  // Daily revenue chart
  const dailyData = (() => {
    const days = period === '7days' ? 7 : period === '30days' ? 30 : 14;
    const now = new Date();
    return Array.from({ length: days }, (_, i) => {
      const date = subDays(now, days - 1 - i);
      const dayStr = format(date, 'MMM dd');
      const dayOrders = filtered.filter(o => format(new Date(o.created_at), 'MMM dd') === dayStr);
      return {
        date: dayStr,
        revenue: dayOrders.reduce((s, o) => s + (o.total || 0), 0),
        orders: dayOrders.length,
      };
    });
  })();

  // Status distribution
  const statusData = (() => {
    const counts: Record<string, number> = {};
    filtered.forEach(o => { counts[o.status] = (counts[o.status] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  })();

  // Payment method distribution
  const paymentData = (() => {
    const counts: Record<string, number> = {};
    filtered.forEach(o => { counts[o.payment_method || 'Unknown'] = (counts[o.payment_method || 'Unknown'] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  })();

  // Top customers
  const topCustomers = (() => {
    const map: Record<string, { name: string; email: string; total: number; orders: number }> = {};
    filtered.forEach(o => {
      const id = o.user_id;
      if (!map[id]) {
        map[id] = {
          name: `${o.profile?.first_name || ''} ${o.profile?.last_name || ''}`.trim() || 'Unknown',
          email: o.profile?.email || '',
          total: 0, orders: 0,
        };
      }
      map[id].total += o.total || 0;
      map[id].orders++;
    });
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 5);
  })();

  const exportCSV = () => {
    const headers = 'Order Number,Date,Customer,Status,Total\n';
    const rows = filtered.map(o =>
      `${o.order_number},${format(new Date(o.created_at), 'yyyy-MM-dd')},${o.profile?.email || 'N/A'},${o.status},${o.total}`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `report-${period}.csv`; a.click();
  };

  return (
    <AdminLayout title="Reports & Analytics" description="Comprehensive sales and performance reports">
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>
      ) : (
        <div className="space-y-6">
          {/* Controls */}
          <div className="flex items-center justify-between">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="90days">Last 90 Days</SelectItem>
                <SelectItem value="12months">Last 12 Months</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download className="h-4 w-4 mr-1" /> Export CSV
            </Button>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Revenue', value: `$${totalRevenue.toFixed(2)}`, icon: DollarSign, color: 'text-green-500' },
              { label: 'Total Orders', value: totalOrders, icon: ShoppingCart, color: 'text-accent' },
              { label: 'Avg Order Value', value: `$${avgOrderValue.toFixed(2)}`, icon: TrendingUp, color: 'text-orange-500' },
              { label: 'Unique Customers', value: uniqueCustomers, icon: Users, color: 'text-blue-500' },
            ].map(kpi => (
              <Card key={kpi.label} className="border border-border">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg bg-muted flex items-center justify-center ${kpi.color}`}>
                    <kpi.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{kpi.label}</p>
                    <p className="text-xl font-bold text-foreground">{kpi.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Revenue Chart */}
          <Card className="border border-border">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Revenue Over Time</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                  <Line type="monotone" dataKey="revenue" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Orders Chart + Status Pie */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border border-border">
              <CardHeader><CardTitle className="text-base">Orders per Day</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                    <Bar dataKey="orders" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardHeader><CardTitle className="text-base">Order Status Distribution</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Top Customers */}
          <Card className="border border-border">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="h-5 w-5" /> Top Customers</CardTitle></CardHeader>
            <CardContent className="p-0">
              <table className="w-full">
                <thead><tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="text-left p-3">Customer</th><th className="text-left p-3">Email</th><th className="text-left p-3">Orders</th><th className="text-left p-3">Total Spent</th>
                </tr></thead>
                <tbody>
                  {topCustomers.map((c, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="p-3 font-medium text-foreground">{c.name}</td>
                      <td className="p-3 text-sm text-muted-foreground">{c.email}</td>
                      <td className="p-3"><Badge variant="secondary">{c.orders}</Badge></td>
                      <td className="p-3 font-medium text-foreground">${c.total.toFixed(2)}</td>
                    </tr>
                  ))}
                  {topCustomers.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No data</td></tr>}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminReportsPage;
