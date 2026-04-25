import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useCurrency } from '@/contexts/CurrencyContext';

export const DashboardCourierExpenseWidget = () => {
  const { formatPrice } = useCurrency();
  const [data, setData] = useState({
    today: 0, week: 0, month: 0, deliveries: 0, avg: 0,
  });

  useEffect(() => {
    const from = new Date(); from.setDate(from.getDate() - 30);
    (supabase as any).rpc('courier_expense_summary', {
      _from: from.toISOString().slice(0, 10),
      _to: new Date().toISOString().slice(0, 10),
    }).then(({ data: rows }: any) => {
      const r = rows?.[0]; if (!r) return;
      setData({
        today: Number(r.today_expense || 0),
        week: Number(r.week_expense || 0),
        month: Number(r.month_expense || 0),
        deliveries: Number(r.delivery_count || 0),
        avg: Number(r.avg_per_delivery || 0),
      });
    });
  }, []);

  return (
    <Card className="border border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center justify-between">
          <span className="flex items-center gap-2"><Truck className="h-4 w-4 text-accent" />Courier Expenses</span>
          <Link to="/admin/courier-expenses" className="text-xs text-accent hover:underline">View all</Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-border p-3">
            <p className="text-[11px] text-muted-foreground">Today</p>
            <p className="text-base font-bold">{formatPrice(data.today)}</p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="text-[11px] text-muted-foreground">7 days</p>
            <p className="text-base font-bold">{formatPrice(data.week)}</p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="text-[11px] text-muted-foreground">Month</p>
            <p className="text-base font-bold">{formatPrice(data.month)}</p>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border">
          <span>{data.deliveries} deliveries (30 days)</span>
          <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" />Avg {formatPrice(data.avg)}</span>
        </div>
      </CardContent>
    </Card>
  );
};