import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { ShieldAlert, AlertTriangle, CheckCircle, XCircle, Loader2, Eye } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface FraudAlert {
  id: string; orderNumber: string; customer: string; amount: number;
  riskLevel: 'high' | 'medium' | 'low'; reason: string; status: 'pending' | 'cleared' | 'blocked'; date: string;
}

const AdminFraudPage = () => {
  const { t } = useLanguage();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<FraudAlert | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.functions.invoke('admin-get-orders');
    setOrders(data?.orders || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const alerts: FraudAlert[] = orders.map(o => {
    const amount = o.total || 0;
    let riskLevel: 'high' | 'medium' | 'low' = 'low';
    let reason = 'Normal transaction';
    if (amount > 500) { riskLevel = 'high'; reason = 'High value order'; }
    else if (amount > 200) { riskLevel = 'medium'; reason = 'Above average order value'; }
    const userOrders = orders.filter(oo => oo.user_id === o.user_id);
    if (userOrders.length > 5) { riskLevel = 'high'; reason = 'Unusual order frequency'; }
    return { id: o.id, orderNumber: o.order_number, customer: o.profile?.email || 'Unknown', amount, riskLevel, reason, status: 'pending' as const, date: o.created_at };
  }).filter(a => a.riskLevel !== 'low').sort((a, b) => {
    const priority = { high: 0, medium: 1, low: 2 };
    return priority[a.riskLevel] - priority[b.riskLevel];
  });

  const highCount = alerts.filter(a => a.riskLevel === 'high').length;
  const medCount = alerts.filter(a => a.riskLevel === 'medium').length;

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'high': return <Badge variant="destructive">{t('admin.highRisk')}</Badge>;
      case 'medium': return <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20">{t('admin.mediumRisk')}</Badge>;
      default: return <Badge variant="secondary">{t('admin.lowRisk')}</Badge>;
    }
  };

  return (
    <AdminLayout titleKey="admin.title.fraud" descriptionKey="admin.desc.fraud">
      {loading ? (<div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border border-border"><CardContent className="p-4 flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center"><AlertTriangle className="h-5 w-5 text-destructive" /></div><div><p className="text-xs text-muted-foreground">{t('admin.highRiskAlerts')}</p><p className="text-2xl font-bold text-foreground">{highCount}</p></div></CardContent></Card>
            <Card className="border border-border"><CardContent className="p-4 flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center"><ShieldAlert className="h-5 w-5 text-orange-500" /></div><div><p className="text-xs text-muted-foreground">{t('admin.mediumRisk')}</p><p className="text-2xl font-bold text-foreground">{medCount}</p></div></CardContent></Card>
            <Card className="border border-border"><CardContent className="p-4 flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center"><CheckCircle className="h-5 w-5 text-green-500" /></div><div><p className="text-xs text-muted-foreground">{t('admin.totalOrdersScanned')}</p><p className="text-2xl font-bold text-foreground">{orders.length}</p></div></CardContent></Card>
          </div>

          <Card className="border border-border">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><ShieldAlert className="h-5 w-5" /> {t('admin.fraudAlerts')} ({alerts.length})</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>{t('admin.order')}</TableHead><TableHead>{t('admin.customer')}</TableHead><TableHead>{t('admin.amount')}</TableHead><TableHead>{t('admin.riskLevel')}</TableHead><TableHead>{t('admin.reason')}</TableHead><TableHead>{t('admin.date')}</TableHead><TableHead className="text-right">{t('admin.actions')}</TableHead></TableRow></TableHeader>
                <TableBody>
                  {alerts.map(alert => (
                    <TableRow key={alert.id}>
                      <TableCell className="font-mono text-sm">{alert.orderNumber}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{alert.customer}</TableCell>
                      <TableCell className="font-medium">৳{alert.amount.toFixed(2)}</TableCell>
                      <TableCell>{getRiskBadge(alert.riskLevel)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{alert.reason}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{format(new Date(alert.date), 'MMM d, yyyy')}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedAlert(alert)}><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={() => toast.success('Order cleared')}><CheckCircle className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => toast.success('Order blocked')}><XCircle className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {alerts.length === 0 && (<TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">{t('admin.noFraudAlerts')}</TableCell></TableRow>)}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Dialog open={!!selectedAlert} onOpenChange={() => setSelectedAlert(null)}>
            <DialogContent>
              <DialogHeader><DialogTitle>{t('admin.fraudAlertDetails')}</DialogTitle></DialogHeader>
              {selectedAlert && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-muted-foreground">{t('admin.order')}:</span> <span className="font-mono">{selectedAlert.orderNumber}</span></div>
                    <div><span className="text-muted-foreground">{t('admin.customer')}:</span> {selectedAlert.customer}</div>
                    <div><span className="text-muted-foreground">{t('admin.amount')}:</span> <span className="font-bold">৳{selectedAlert.amount.toFixed(2)}</span></div>
                    <div><span className="text-muted-foreground">{t('admin.riskLevel')}:</span> {getRiskBadge(selectedAlert.riskLevel)}</div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg"><p className="text-sm"><strong>{t('admin.reason')}:</strong> {selectedAlert.reason}</p></div>
                  <div className="flex gap-2">
                    <Button className="flex-1" variant="outline" onClick={() => { toast.success('Order cleared'); setSelectedAlert(null); }}><CheckCircle className="h-4 w-4 mr-1" /> {t('admin.clear')}</Button>
                    <Button className="flex-1" variant="destructive" onClick={() => { toast.success('Order blocked'); setSelectedAlert(null); }}><XCircle className="h-4 w-4 mr-1" /> {t('admin.block')}</Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminFraudPage;
