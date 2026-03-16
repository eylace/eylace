import { useState, useMemo } from 'react';
import { format, subDays, startOfDay, parseISO } from 'date-fns';
import { Calendar, CheckCircle2, XCircle, Clock, TrendingUp, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface DailyReportProps {
  orders: any[];
}

export const DashboardDailyReport = ({ orders }: DailyReportProps) => {
  const { t } = useLanguage();
  const [daysToShow, setDaysToShow] = useState(7);

  const dailyData = useMemo(() => {
    return Array.from({ length: daysToShow }, (_, i) => {
      const date = subDays(new Date(), i);
      const dayStart = startOfDay(date);
      const dayOrders = orders.filter((o) => {
        const orderDate = startOfDay(new Date(o.created_at));
        return orderDate.getTime() === dayStart.getTime();
      });

      const confirmed = dayOrders.filter((o) => ['processing', 'shipped', 'delivered'].includes(o.status)).length;
      const cancelled = dayOrders.filter((o) => o.status === 'cancelled').length;
      const pending = dayOrders.filter((o) => o.status === 'pending').length;
      const revenue = dayOrders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);

      return {
        date: format(date, 'dd MMM yyyy'),
        dayName: format(date, 'EEEE'),
        total: dayOrders.length,
        confirmed,
        cancelled,
        pending,
        revenue,
      };
    });
  }, [orders, daysToShow]);

  return (
    <Card className="border border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            ডেইলি রিপোর্ট
          </CardTitle>
          <div className="flex gap-1">
            {[7, 14, 30].map((d) => (
              <Button
                key={d}
                variant={daysToShow === d ? 'default' : 'outline'}
                size="sm"
                className="text-xs h-7 px-2"
                onClick={() => setDaysToShow(d)}
              >
                {d} দিন
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">তারিখ</th>
                <th className="text-center px-3 py-2.5 font-medium text-muted-foreground">মোট অর্ডার</th>
                <th className="text-center px-3 py-2.5 font-medium text-muted-foreground">
                  <span className="flex items-center justify-center gap-1"><CheckCircle2 className="h-3 w-3 text-[hsl(var(--success))]" /> কনফার্ম</span>
                </th>
                <th className="text-center px-3 py-2.5 font-medium text-muted-foreground">
                  <span className="flex items-center justify-center gap-1"><Clock className="h-3 w-3 text-[hsl(var(--warning))]" /> পেন্ডিং</span>
                </th>
                <th className="text-center px-3 py-2.5 font-medium text-muted-foreground">
                  <span className="flex items-center justify-center gap-1"><XCircle className="h-3 w-3 text-destructive" /> ক্যানসেল</span>
                </th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">রেভিনিউ</th>
              </tr>
            </thead>
            <tbody>
              {dailyData.map((day, idx) => (
                <tr key={day.date} className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${idx === 0 ? 'bg-primary/5' : ''}`}>
                  <td className="px-4 py-2.5">
                    <div>
                      <p className="font-medium text-foreground">{day.date}</p>
                      <p className="text-xs text-muted-foreground">{day.dayName}</p>
                    </div>
                  </td>
                  <td className="text-center px-3 py-2.5">
                    <Badge variant="secondary" className="text-xs">{day.total}</Badge>
                  </td>
                  <td className="text-center px-3 py-2.5">
                    <span className="text-[hsl(var(--success))] font-semibold">{day.confirmed}</span>
                  </td>
                  <td className="text-center px-3 py-2.5">
                    <span className="text-[hsl(var(--warning))] font-semibold">{day.pending}</span>
                  </td>
                  <td className="text-center px-3 py-2.5">
                    <span className="text-destructive font-semibold">{day.cancelled}</span>
                  </td>
                  <td className="text-right px-4 py-2.5 font-bold text-accent">
                    ৳{day.revenue.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
