import { useNavigate } from 'react-router-dom';
import { Truck, ShieldCheck, CalendarDays, FileWarning, TrendingUp, Phone, RefreshCw, Lock, Zap, Link2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';

export const DashboardFeatureCards = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const features = [
    { icon: Truck, label: t('admin.feature.oneClickCourier'), desc: t('admin.feature.oneClickCourierDesc'), route: '/admin/shipping-providers', color: 'text-primary', bg: 'bg-primary/10' },
    { icon: ShieldCheck, label: t('admin.feature.fraudCheck'), desc: t('admin.feature.fraudCheckDesc'), route: '/admin/fraud', color: 'text-destructive', bg: 'bg-destructive/10' },
    { icon: CalendarDays, label: t('admin.feature.dailyReport'), desc: t('admin.feature.dailyReportDesc'), route: '/admin/reports', color: 'text-[hsl(var(--success))]', bg: 'bg-[hsl(var(--success))]/10' },
    { icon: FileWarning, label: t('admin.feature.incompleteOrders'), desc: t('admin.feature.incompleteOrdersDesc'), route: '/admin/incomplete-orders', color: 'text-[hsl(var(--warning))]', bg: 'bg-[hsl(var(--warning))]/10' },
    { icon: TrendingUp, label: t('admin.feature.revenueDashboard'), desc: t('admin.feature.revenueDashboardDesc'), route: '/admin', color: 'text-accent', bg: 'bg-accent/10' },
    { icon: Phone, label: t('admin.feature.directCall'), desc: t('admin.feature.directCallDesc'), route: '/admin/orders', color: 'text-[hsl(var(--prime))]', bg: 'bg-[hsl(var(--prime))]/10' },
    { icon: RefreshCw, label: t('admin.feature.oneClickUpdate'), desc: t('admin.feature.oneClickUpdateDesc'), route: '/admin/orders', color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { icon: Lock, label: t('admin.feature.sourceProtection'), desc: t('admin.feature.sourceProtectionDesc'), route: '#', color: 'text-foreground', bg: 'bg-muted' },
    { icon: Zap, label: t('admin.feature.fastLoad'), desc: t('admin.feature.fastLoadDesc'), route: '#', color: 'text-[hsl(var(--rating))]', bg: 'bg-[hsl(var(--rating))]/10' },
    { icon: Link2, label: t('admin.feature.cleanUrl'), desc: t('admin.feature.cleanUrlDesc'), route: '#', color: 'text-[hsl(var(--success))]', bg: 'bg-[hsl(var(--success))]/10' },
  ];

  return (
    <Card className="border border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Zap className="h-5 w-5 text-[hsl(var(--rating))]" />
          {t('admin.powerFeatures')}
          <Badge variant="secondary" className="text-[10px]">{t('admin.allActive')}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {features.map((f) => (
            <div key={f.label} onClick={() => f.route !== '#' && navigate(f.route)} className={`relative rounded-xl border border-primary/20 bg-card p-3 transition-all hover:shadow-md hover:border-primary/40 ${f.route !== '#' ? 'cursor-pointer' : ''}`}>
              <div className={`h-8 w-8 rounded-lg ${f.bg} flex items-center justify-center mb-2`}><f.icon className={`h-4 w-4 ${f.color}`} /></div>
              <p className="text-xs font-semibold text-foreground">{f.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{f.desc}</p>
              <Badge variant="default" className="mt-1.5 text-[9px] px-1.5 py-0">{t('admin.active_badge')}</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
