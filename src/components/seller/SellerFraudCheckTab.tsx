import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import {
  Search, ShieldCheck, ShieldAlert, Package, CheckCircle, XCircle,
  Loader2, TrendingUp, AlertTriangle, Headphones, Database,
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';

interface CustomerReport {
  phone: string;
  totalParcels: number;
  successParcels: number;
  cancelledReturns: number;
  successRate: number;
  riskLevel: 'low' | 'medium' | 'high';
  orders: Array<{
    orderNumber: string;
    total: number;
    status: string;
    date: string;
    carrier: string | null;
  }>;
}

export const SellerFraudCheckTab = ({ sellerId }: { sellerId: string }) => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<CustomerReport | null>(null);
  const [searched, setSearched] = useState(false);

  const handleCheck = async () => {
    if (!phone.trim()) return;
    setLoading(true);
    setSearched(true);

    try {
      // Fetch orders via edge function for the seller
      const { data } = await supabase.functions.invoke('admin-get-orders');
      const allOrders = data?.orders || [];

      // Filter orders matching the phone number from shipping_address
      const matchedOrders = allOrders.filter((o: any) => {
        const addr = o.shipping_address as any;
        const orderPhone = addr?.phone || o.profile?.phone || '';
        return orderPhone.includes(phone.trim());
      });

      const total = matchedOrders.length;
      const success = matchedOrders.filter((o: any) => o.status === 'delivered').length;
      const cancelled = matchedOrders.filter((o: any) =>
        ['cancelled', 'returned'].includes(o.status)
      ).length;
      const rate = total > 0 ? Math.round((success / total) * 100) : 0;

      let riskLevel: 'low' | 'medium' | 'high' = 'low';
      if (total === 0) riskLevel = 'medium';
      else if (rate < 50) riskLevel = 'high';
      else if (rate < 75) riskLevel = 'medium';

      setReport({
        phone: phone.trim(),
        totalParcels: total,
        successParcels: success,
        cancelledReturns: cancelled,
        successRate: rate,
        riskLevel,
        orders: matchedOrders.map((o: any) => ({
          orderNumber: o.order_number,
          total: o.total || 0,
          status: o.status,
          date: o.created_at,
          carrier: o.carrier,
        })),
      });
    } catch {
      setReport(null);
    }
    setLoading(false);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-destructive';
      case 'medium': return 'text-[hsl(var(--warning))]';
      default: return 'text-[hsl(var(--success))]';
    }
  };

  const getRiskBg = (level: string) => {
    switch (level) {
      case 'high': return 'bg-destructive/10';
      case 'medium': return 'bg-[hsl(var(--warning))]/10';
      default: return 'bg-[hsl(var(--success))]/10';
    }
  };

  const getProgressColor = (rate: number) => {
    if (rate >= 75) return 'bg-[hsl(var(--success))]';
    if (rate >= 50) return 'bg-[hsl(var(--warning))]';
    return 'bg-destructive';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Database className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Courier Intelligence Hub</h2>
                <p className="text-xs text-muted-foreground">Supported Networks: Pathao, Steadfast, RedX, Paperfly</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1 text-primary font-medium">
                <ShieldCheck className="h-4 w-4" /> রিয়েল-টাইম ভেরিফিকেশন
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <Headphones className="h-4 w-4" /> 24/7 সাপোর্ট
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Risk Profile */}
        <Card className="border border-border">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wide">Customer Risk Profile</CardTitle>
            <p className="text-xs text-muted-foreground">Delivery Success Probability</p>
          </CardHeader>
          <CardContent className="flex flex-col items-center pb-6">
            {report ? (
              <>
                <div className="relative w-40 h-40 mb-4">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="hsl(var(--border))" strokeWidth="10" />
                    <circle
                      cx="60" cy="60" r="50" fill="none"
                      stroke={report.riskLevel === 'low' ? 'hsl(var(--success))' : report.riskLevel === 'medium' ? 'hsl(var(--warning))' : 'hsl(var(--destructive))'}
                      strokeWidth="10"
                      strokeDasharray={`${(report.successRate / 100) * 314} 314`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-3xl font-bold ${getRiskColor(report.riskLevel)}`}>{report.successRate}%</span>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Success Rate</span>
                  </div>
                </div>
                <Badge className={`${getRiskBg(report.riskLevel)} ${getRiskColor(report.riskLevel)} border-0`}>
                  {report.riskLevel === 'high' ? '⚠ হাই রিস্ক' : report.riskLevel === 'medium' ? '⚡ মিডিয়াম রিস্ক' : '✅ লো রিস্ক'}
                </Badge>
              </>
            ) : (
              <>
                <div className="relative w-40 h-40 mb-4">
                  <svg className="w-full h-full" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="hsl(var(--border))" strokeWidth="10" strokeDasharray="8 8" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-muted-foreground">--</span>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Success Rate</span>
                  </div>
                </div>
                <Badge variant="outline" className="text-muted-foreground">
                  <AlertTriangle className="h-3 w-3 mr-1" /> অপেক্ষা করুন
                </Badge>
                <p className="text-xs text-muted-foreground mt-3 text-center">ডাটা দেখতে ডানপাশের ফর্মটি ব্যবহার করুন।</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Right: Search & Report */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search */}
          <Card className="border border-border">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="কাস্টমারের মোবাইল নাম্বার লিখুন (017xxxxxxxx)"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="pl-10 h-12 text-base border-2 border-primary/30 focus:border-primary"
                    onKeyDown={e => e.key === 'Enter' && handleCheck()}
                  />
                </div>
                <Button
                  onClick={handleCheck}
                  disabled={loading || !phone.trim()}
                  className="h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'চেক করুন'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          {searched && (
            <div>
              <h3 className="text-lg font-bold text-foreground mb-3">Report Analysis</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border border-border">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">মোট পার্সেল</p>
                      <p className="text-3xl font-bold text-foreground">{report?.totalParcels ?? 0}</p>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="border border-border">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">সফল পার্সেল</p>
                      <p className="text-3xl font-bold text-foreground">{report?.successParcels ?? 0}</p>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-[hsl(var(--success))]/10 flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-[hsl(var(--success))]" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="border border-border">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">বাতিল/রিটার্ন</p>
                      <p className="text-3xl font-bold text-foreground">{report?.cancelledReturns ?? 0}</p>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                      <XCircle className="h-5 w-5 text-destructive" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Courier breakdown table */}
          {report && report.orders.length > 0 && (
            <Card className="border border-border">
              <CardHeader>
                <CardTitle className="text-sm">কুরিয়ার নেটওয়ার্ক ব্রেকডাউন</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>কুরিয়ার নেটওয়ার্ক</TableHead>
                      <TableHead>মোট অর্ডার</TableHead>
                      <TableHead>সাকসেস</TableHead>
                      <TableHead>রিটার্ন</TableHead>
                      <TableHead>সাকসেস রেট</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      const courierMap: Record<string, { total: number; success: number; returned: number }> = {};
                      report.orders.forEach(o => {
                        const c = o.carrier || 'Unknown';
                        if (!courierMap[c]) courierMap[c] = { total: 0, success: 0, returned: 0 };
                        courierMap[c].total++;
                        if (o.status === 'delivered') courierMap[c].success++;
                        if (['cancelled', 'returned'].includes(o.status)) courierMap[c].returned++;
                      });
                      return Object.entries(courierMap).map(([name, stats]) => {
                        const rate = stats.total > 0 ? Math.round((stats.success / stats.total) * 100) : 0;
                        return (
                          <TableRow key={name}>
                            <TableCell className="font-medium">{name}</TableCell>
                            <TableCell>{stats.total}</TableCell>
                            <TableCell className="text-[hsl(var(--success))]">{stats.success}</TableCell>
                            <TableCell className="text-destructive">{stats.returned}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${getProgressColor(rate)}`} style={{ width: `${rate}%` }} />
                                </div>
                                <span className="text-xs font-medium">{rate}%</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      });
                    })()}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {searched && report && report.orders.length === 0 && (
            <Card className="border border-border">
              <CardContent className="py-12 text-center">
                <ShieldAlert className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="text-muted-foreground">এই নম্বরে কোনো অর্ডার পাওয়া যায়নি।</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
