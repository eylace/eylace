import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Users, Clock, Globe, TrendingUp } from 'lucide-react';

const stats = [
  { label: 'Total Visitors (Today)', value: '2,458', icon: Eye, change: '+12%' },
  { label: 'Unique Visitors', value: '1,832', icon: Users, change: '+8%' },
  { label: 'Avg. Session Duration', value: '4m 32s', icon: Clock, change: '+5%' },
  { label: 'Bounce Rate', value: '34.2%', icon: TrendingUp, change: '-2%' },
];

const topPages = [
  { page: '/', visits: 1250, uniqueVisitors: 980 },
  { page: '/deals', visits: 856, uniqueVisitors: 720 },
  { page: '/flash-sale', visits: 642, uniqueVisitors: 530 },
  { page: '/category/electronics', visits: 428, uniqueVisitors: 350 },
  { page: '/product/wireless-headphones', visits: 312, uniqueVisitors: 280 },
];

const topCountries = [
  { country: 'Bangladesh', visitors: 1200, flag: '🇧🇩' },
  { country: 'United States', visitors: 450, flag: '🇺🇸' },
  { country: 'India', visitors: 320, flag: '🇮🇳' },
  { country: 'United Kingdom', visitors: 180, flag: '🇬🇧' },
  { country: 'Germany', visitors: 95, flag: '🇩🇪' },
];

const AdminMarketingVisitors = () => {
  return (
    <AdminLayout titleKey="admin.marketing.visitors" descriptionKey="admin.marketing.visitors">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(s => (
            <Card key={s.label} className="border border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <s.icon className="h-5 w-5 text-muted-foreground" />
                  <span className="text-xs text-green-600 font-medium">{s.change}</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border border-border">
            <CardHeader><CardTitle className="text-base">Top Pages</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topPages.map(p => (
                  <div key={p.page} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <span className="text-sm font-mono text-foreground">{p.page}</span>
                    <div className="text-right">
                      <span className="text-sm font-medium text-foreground">{p.visits}</span>
                      <span className="text-xs text-muted-foreground ml-2">({p.uniqueVisitors} unique)</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Globe className="h-4 w-4" /> Top Countries</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topCountries.map(c => (
                  <div key={c.country} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <span className="text-sm text-foreground">{c.flag} {c.country}</span>
                    <span className="text-sm font-medium text-foreground">{c.visitors.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminMarketingVisitors;
