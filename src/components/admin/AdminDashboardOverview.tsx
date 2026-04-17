import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign, ShoppingCart, Users, Package, TrendingUp, TrendingDown,
  BarChart3, Star, Truck, Clock, Brain, Search, MessageCircle, FileText,
  Facebook, CheckCircle2, XCircle, Settings, Sparkles, Bot,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAISettings } from '@/hooks/useAISettings';
import { DashboardDailyReport } from './DashboardDailyReport';
import { DashboardFeatureCards } from './DashboardFeatureCards';
import { DashboardIncompleteOrders } from './DashboardIncompleteOrders';

interface DashboardStats {
  // Last 30 days
  totalRevenue30: number;
  totalSales30: number;
  totalProfit30: number;
  // All-time financial breakdown
  purchaseCostAll: number;
  soldCogsAll: number;
  courierExpenseAll: number;
  // Operational
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  pendingOrders: number;
  shippedOrders: number;
  avgOrderValue: number;
  totalReviews: number;
}

const COLORS = [
  'hsl(var(--accent))', 'hsl(var(--primary))', 'hsl(var(--success))',
  'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--prime))',
];

export const AdminDashboardOverview = () => {
  const navigate = useNavigate();
  const { settings: aiSettings, loading: aiLoading } = useAISettings();
  const { t } = useLanguage();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [orderStatusData, setOrderStatusData] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: ordersData } = await supabase.functions.invoke('admin-get-orders');
      const orders = ordersData?.orders || [];
      setAllOrders(orders);
      const { count: productCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
      const { count: reviewCount } = await supabase.from('product_reviews').select('*', { count: 'exact', head: true });

      // Fetch all products for purchase cost calculation
      const { data: productRows } = await supabase
        .from('products')
        .select('cost_per_item, stock')
        .limit(10000);
      const purchaseCostAll = (productRows || []).reduce(
        (sum: number, p: any) => sum + (Number(p.cost_per_item) || 0) * (Number(p.stock) || 0),
        0
      );

      // Date helpers
      const thirtyDaysAgo = subDays(new Date(), 30);
      const isLast30 = (o: any) => new Date(o.created_at) >= thirtyDaysAgo;

      const nonCancelled = orders.filter((o: any) => o.status !== 'cancelled');
      const deliveredOrders = orders.filter((o: any) => o.status === 'delivered');
      const deliveredLast30 = deliveredOrders.filter(isLast30);
      const nonCancelledLast30 = nonCancelled.filter(isLast30);

      // Last 30 days metrics
      const totalSales30 = nonCancelledLast30.reduce((sum: number, o: any) => sum + (o.total || 0), 0);
      const totalRevenue30 = deliveredLast30.reduce((sum: number, o: any) => sum + (o.total || 0), 0);
      let cost30 = 0;
      deliveredLast30.forEach((o: any) => {
        o.items?.forEach((item: any) => {
          cost30 += (Number(item.cost_per_item) || 0) * (Number(item.quantity) || 1);
        });
      });
      const totalProfit30 = totalRevenue30 - cost30;

      // All-time financial breakdown
      let soldCogsAll = 0;
      let courierExpenseAll = 0;
      deliveredOrders.forEach((o: any) => {
        courierExpenseAll += Number(o.shipping) || 0;
        o.items?.forEach((item: any) => {
          soldCogsAll += (Number(item.cost_per_item) || 0) * (Number(item.quantity) || 1);
        });
      });

      const pendingOrders = orders.filter((o: any) => o.status === 'pending').length;
      const shippedOrders = orders.filter((o: any) => o.status === 'shipped').length;
      const uniqueCustomers = new Set(orders.map((o: any) => o.user_id)).size;
      const totalSalesAll = nonCancelled.reduce((sum: number, o: any) => sum + (o.total || 0), 0);

      setStats({
        totalRevenue30, totalSales30, totalProfit30,
        purchaseCostAll, soldCogsAll, courierExpenseAll,
        totalOrders: orders.length,
        totalCustomers: uniqueCustomers,
        totalProducts: productCount || 0,
        pendingOrders, shippedOrders,
        avgOrderValue: orders.length > 0 ? totalSalesAll / orders.length : 0,
        totalReviews: reviewCount || 0,
      });

      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), 6 - i);
        const dayOrders = orders.filter((o: any) => {
          const orderDate = startOfDay(new Date(o.created_at));
          return orderDate.getTime() === startOfDay(date).getTime();
        });
        return { date: format(date, 'MMM dd'), revenue: dayOrders.reduce((sum: number, o: any) => sum + (o.total || 0), 0), orders: dayOrders.length };
      });
      setRevenueData(last7Days);

      const statusCounts: Record<string, number> = {};
      orders.forEach((o: any) => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });
      setOrderStatusData(Object.entries(statusCounts).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' '), value })));
      setRecentOrders(orders.slice(0, 8));

      const productSales: Record<string, { name: string; image: string; sales: number; revenue: number }> = {};
      orders.forEach((o: any) => {
        o.items?.forEach((item: any) => {
          if (!productSales[item.product_name]) productSales[item.product_name] = { name: item.product_name, image: item.product_image || '', sales: 0, revenue: 0 };
          productSales[item.product_name].sales += item.quantity;
          productSales[item.product_name].revenue += item.price * item.quantity;
        });
      });
      setTopProducts(Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally { setLoading(false); }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (<Card key={i}><CardContent className="p-6"><Skeleton className="h-4 w-24 mb-2" /><Skeleton className="h-8 w-32 mb-1" /><Skeleton className="h-3 w-20" /></CardContent></Card>))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
          <Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
        </div>
      </div>
    );
  }

  const fmt = (n: number) => `৳${(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const performanceCards = [
    { title: 'Total Profit (Last 30 Days)', value: fmt(stats?.totalProfit30 || 0), icon: TrendingUp, trend: 'Revenue − COGS', trendUp: (stats?.totalProfit30 || 0) >= 0, color: 'text-[hsl(var(--prime))]', bg: 'bg-[hsl(var(--prime))]/10' },
    { title: 'Total Revenue (Last 30 Days)', value: fmt(stats?.totalRevenue30 || 0), icon: DollarSign, trend: 'Delivered orders', trendUp: true, color: 'text-[hsl(var(--success))]', bg: 'bg-[hsl(var(--success))]/10' },
    { title: 'Total Sales (Last 30 Days)', value: fmt(stats?.totalSales30 || 0), icon: ShoppingCart, trend: 'Non-cancelled', trendUp: true, color: 'text-accent', bg: 'bg-accent/10' },
  ];

  const financeCards = [
    { title: 'Purchase Cost (All Time)', value: fmt(stats?.purchaseCostAll || 0), icon: Package, trend: 'Current inventory value', trendUp: true, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { title: 'Sold COGS (All Time)', value: fmt(stats?.soldCogsAll || 0), icon: TrendingDown, trend: 'Cost of goods sold', trendUp: false, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { title: 'Courier Expense (All Time)', value: fmt(stats?.courierExpenseAll || 0), icon: Truck, trend: 'Shipping costs', trendUp: false, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ];

  const operationalCards = [
    { title: t('admin.customers'), value: stats?.totalCustomers || 0, icon: Users, trend: 'Unique', trendUp: true, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { title: t('admin.products'), value: stats?.totalProducts || 0, icon: Package, trend: `${stats?.totalReviews || 0} reviews`, trendUp: true, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { title: t('admin.totalOrders'), value: stats?.totalOrders || 0, icon: ShoppingCart, trend: 'All time', trendUp: true, color: 'text-accent', bg: 'bg-accent/10' },
    { title: t('admin.pendingOrders'), value: stats?.pendingOrders || 0, icon: Clock, trend: 'Awaiting', trendUp: false, color: 'text-[hsl(var(--warning))]', bg: 'bg-[hsl(var(--warning))]/10' },
  ];

  const statusConfig: Record<string, string> = {
    pending: 'bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]',
    processing: 'bg-[hsl(var(--prime))]/10 text-[hsl(var(--prime))]',
    shipped: 'bg-purple-500/10 text-purple-600',
    delivered: 'bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]',
    cancelled: 'bg-destructive/10 text-destructive',
  };

  const renderStatCard = (stat: any) => (
    <Card key={stat.title} className="border border-border hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-muted-foreground font-medium">{stat.title}</span>
          <div className={`h-9 w-9 rounded-lg ${stat.bg} flex items-center justify-center`}><stat.icon className={`h-4 w-4 ${stat.color}`} /></div>
        </div>
        <div className="flex items-end justify-between">
          <p className="text-2xl font-bold text-foreground">{stat.value}</p>
          <div className={`flex items-center gap-0.5 text-xs font-medium ${stat.trendUp ? 'text-[hsl(var(--success))]' : 'text-destructive'}`}>
            {stat.trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}{stat.trend}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('admin.dashboardOverview')}</h1>
        <p className="text-muted-foreground text-sm">{t('admin.welcomeBack')}</p>
      </div>

      {/* Row 1 — Last 30 Days Performance */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Last 30 Days Performance</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {performanceCards.map(renderStatCard)}
        </div>
      </div>

      {/* Row 2 — All-Time Financial Breakdown */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">All-Time Financial Breakdown</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {financeCards.map(renderStatCard)}
        </div>
      </div>

      {/* Row 3 — Operational Metrics */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Operational Metrics</h2>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {operationalCards.map(renderStatCard)}
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border border-border"><CardContent className="p-4 flex items-center gap-3"><div className="h-10 w-10 rounded-full bg-[hsl(var(--warning))]/10 flex items-center justify-center"><Clock className="h-5 w-5 text-[hsl(var(--warning))]" /></div><div><p className="text-xl font-bold">{stats?.pendingOrders || 0}</p><p className="text-xs text-muted-foreground">{t('admin.pendingOrders')}</p></div></CardContent></Card>
        <Card className="border border-border"><CardContent className="p-4 flex items-center gap-3"><div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center"><Truck className="h-5 w-5 text-purple-600" /></div><div><p className="text-xl font-bold">{stats?.shippedOrders || 0}</p><p className="text-xs text-muted-foreground">{t('admin.inTransit')}</p></div></CardContent></Card>
        <Card className="border border-border"><CardContent className="p-4 flex items-center gap-3"><div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center"><DollarSign className="h-5 w-5 text-accent" /></div><div><p className="text-xl font-bold">৳{(stats?.avgOrderValue || 0).toFixed(0)}</p><p className="text-xs text-muted-foreground">{t('admin.avgOrderValue')}</p></div></CardContent></Card>
        <Card className="border border-border"><CardContent className="p-4 flex items-center gap-3"><div className="h-10 w-10 rounded-full bg-[hsl(var(--rating))]/10 flex items-center justify-center"><Star className="h-5 w-5 text-[hsl(var(--rating))]" /></div><div><p className="text-xl font-bold">{stats?.totalReviews || 0}</p><p className="text-xs text-muted-foreground">{t('admin.totalReviews')}</p></div></CardContent></Card>
      </div>

      {/* Power Features Section */}
      <DashboardFeatureCards />

      {/* AI Automation Section */}
      <Card className="border border-border bg-gradient-to-r from-primary/5 to-accent/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              AI Automation Center
              <Badge variant="secondary" className="text-[10px]">Smart</Badge>
            </CardTitle>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => navigate('/admin/ai-settings')}>
              <Settings className="h-3.5 w-3.5" /> সেটিংস
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { label: 'AI Search', desc: 'স্মার্ট সার্চ', icon: Search, enabled: aiSettings.ai_search_enabled, route: '/admin/ai-settings' },
              { label: 'AI Chat', desc: 'লাইভ চ্যাট বট', icon: Bot, enabled: aiSettings.ai_chat_enabled, route: '/admin/ai-settings' },
              { label: 'AI Writer', desc: 'ডেসক্রিপশন', icon: FileText, enabled: aiSettings.ai_description_enabled, route: '/admin/ai-settings' },
              { label: 'AI Analyzer', desc: 'সেলস রিপোর্ট', icon: BarChart3, enabled: aiSettings.ai_analyzer_enabled, route: '/admin/ai-analyzer' },
              { label: 'Messenger', desc: 'FB ইন্টিগ্রেশন', icon: Facebook, enabled: aiSettings.fb_messenger_enabled, route: '/admin/ai-settings' },
            ].map((item) => (
              <div
                key={item.label}
                onClick={() => navigate(item.route)}
                className={`relative cursor-pointer rounded-xl border p-3 transition-all hover:shadow-md ${
                  item.enabled ? 'border-primary/30 bg-card hover:border-primary/50' : 'border-border bg-card/50 hover:border-border'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${item.enabled ? 'bg-primary/10' : 'bg-muted'}`}>
                    <item.icon className={`h-4 w-4 ${item.enabled ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  {item.enabled ? <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(var(--success))] ml-auto" /> : <XCircle className="h-3.5 w-3.5 text-muted-foreground/50 ml-auto" />}
                </div>
                <p className="text-xs font-semibold">{item.label}</p>
                <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                <Badge variant={item.enabled ? 'default' : 'secondary'} className="mt-1.5 text-[9px] px-1.5 py-0">
                  {item.enabled ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border border-border">
          <CardHeader className="pb-2"><CardTitle className="text-base font-semibold flex items-center gap-2"><BarChart3 className="h-4 w-4 text-accent" />{t('admin.revenueOverview')}</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs><linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} /><stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} formatter={(value: number) => [`৳${value.toFixed(2)}`, 'Revenue']} />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(var(--accent))" strokeWidth={2} fill="url(#revenueGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">{t('admin.orderStatus')}</CardTitle></CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart><Pie data={orderStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>{orderStatusData.map((_, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}</Pie><Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} /></PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1.5 mt-2">
              {orderStatusData.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2"><div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} /><span className="text-muted-foreground">{item.name}</span></div>
                  <span className="font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Report */}
      <DashboardDailyReport orders={allOrders} />

      {/* Incomplete Orders + Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardIncompleteOrders />

        <Card className="border border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center justify-between">
              <span className="flex items-center gap-2"><ShoppingCart className="h-4 w-4 text-accent" />{t('admin.recentOrders')}</span>
              <Badge variant="secondary" className="text-xs">{recentOrders.length} {t('admin.orders').toLowerCase()}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex flex-col sm:flex-row sm:items-center justify-between px-3 md:px-6 py-3 hover:bg-muted/50 transition-colors gap-1 sm:gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">#{order.order_number}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {order.profile?.first_name} {order.profile?.last_name} • {format(new Date(order.created_at), 'MMM d, h:mm a')}
                      {order.shipping_address?.phone && (
                        <a href={`tel:${order.shipping_address.phone}`} className="ml-1 text-primary hover:underline">📞</a>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 md:gap-3">
                    <Badge className={`text-xs ${statusConfig[order.status] || ''}`}>{order.status}</Badge>
                    <span className="text-sm font-bold">৳{order.total?.toFixed(2)}</span>
                  </div>
                </div>
              ))}
              {recentOrders.length === 0 && (<div className="px-3 md:px-6 py-8 text-center text-muted-foreground text-sm">{t('admin.noOrders')}</div>)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      <Card className="border border-border">
        <CardHeader className="pb-3"><CardTitle className="text-base font-semibold flex items-center gap-2"><Package className="h-4 w-4 text-accent" />{t('admin.topSelling')}</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {topProducts.map((product, index) => (
              <div key={product.name} className="flex items-center gap-2 md:gap-3 px-3 md:px-6 py-3 hover:bg-muted/50 transition-colors">
                <div className="h-7 w-7 md:h-8 md:w-8 rounded-lg bg-muted flex items-center justify-center text-xs md:text-sm font-bold text-muted-foreground shrink-0">{index + 1}</div>
                {product.image && (<img src={product.image} alt={product.name} className="h-8 w-8 md:h-10 md:w-10 rounded-lg object-cover shrink-0" />)}
                <div className="flex-1 min-w-0"><p className="text-xs md:text-sm font-medium truncate">{product.name}</p><p className="text-xs text-muted-foreground">{product.sales} {t('admin.sold')}</p></div>
                <span className="text-xs md:text-sm font-bold text-accent shrink-0">৳{product.revenue.toFixed(2)}</span>
              </div>
            ))}
            {topProducts.length === 0 && (<div className="px-3 md:px-6 py-8 text-center text-muted-foreground text-sm">{t('admin.noData')}</div>)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
