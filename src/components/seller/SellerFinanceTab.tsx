import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, Percent, Wallet } from 'lucide-react';
import type { SellerOrder } from '@/hooks/useSellerData';

interface SellerFinanceTabProps {
  orders: SellerOrder[];
}

export const SellerFinanceTab = ({ orders }: SellerFinanceTabProps) => {
  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((s, o) => s + Number(o.total), 0);
    const deliveredRevenue = orders.filter(o => o.status === 'delivered').reduce((s, o) => s + Number(o.total), 0);
    const commissionRate = 0.10; // 10% default
    const commission = deliveredRevenue * commissionRate;
    const netEarnings = deliveredRevenue - commission;
    return { totalRevenue, deliveredRevenue, commission, netEarnings, commissionRate };
  }, [orders]);

  const cards = [
    { label: 'Total Sales', value: `৳${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, desc: 'Lifetime gross sales' },
    { label: 'Settled Revenue', value: `৳${stats.deliveredRevenue.toLocaleString()}`, icon: TrendingUp, desc: 'From delivered orders' },
    { label: 'Commission', value: `৳${stats.commission.toLocaleString()}`, icon: Percent, desc: `${(stats.commissionRate * 100).toFixed(0)}% platform fee` },
    { label: 'Net Earnings', value: `৳${stats.netEarnings.toLocaleString()}`, icon: Wallet, desc: 'After commission' },
  ];

  // Monthly breakdown
  const monthly = useMemo(() => {
    const map: Record<string, { sales: number; commission: number; net: number }> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      map[key] = { sales: 0, commission: 0, net: 0 };
    }
    orders.filter(o => o.status === 'delivered').forEach(o => {
      const key = new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      if (map[key]) {
        const total = Number(o.total);
        map[key].sales += total;
        map[key].commission += total * 0.10;
        map[key].net += total * 0.90;
      }
    });
    return Object.entries(map).map(([month, data]) => ({ month, ...data }));
  }, [orders]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map(c => (
          <Card key={c.label}>
            <CardContent className="pt-5 pb-4">
              <c.icon className="h-5 w-5 mb-2 text-accent" />
              <p className="text-2xl font-bold">{c.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{c.label}</p>
              <p className="text-[10px] text-muted-foreground">{c.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Monthly Breakdown</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 font-medium text-muted-foreground">Month</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">Sales</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">Commission</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">Net</th>
                </tr>
              </thead>
              <tbody>
                {monthly.map(m => (
                  <tr key={m.month} className="border-b border-border last:border-0">
                    <td className="py-2">{m.month}</td>
                    <td className="text-right py-2">৳{m.sales.toFixed(0)}</td>
                    <td className="text-right py-2 text-destructive">-৳{m.commission.toFixed(0)}</td>
                    <td className="text-right py-2 font-medium">৳{m.net.toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
