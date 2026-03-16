import { useNavigate } from 'react-router-dom';
import {
  Truck, ShieldCheck, CalendarDays, FileWarning, TrendingUp,
  Phone, RefreshCw, Lock, Zap, Link2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const features = [
  {
    icon: Truck,
    label: 'One-Click Courier',
    desc: 'এক ক্লিকে পার্সেল বুকিং এবং কুরিয়ার ট্র্যাকিং',
    route: '/admin/shipping-providers',
    color: 'text-primary',
    bg: 'bg-primary/10',
    active: true,
  },
  {
    icon: ShieldCheck,
    label: 'Fraud Check',
    desc: 'অর্ডার কনফার্মের আগে কাস্টমার ভেরিফিকেশন',
    route: '/admin/fraud',
    color: 'text-destructive',
    bg: 'bg-destructive/10',
    active: true,
  },
  {
    icon: CalendarDays,
    label: 'Daily Report',
    desc: 'তারিখ বাই তারিখ অর্ডার ও রেভিনিউ রিপোর্ট',
    route: '/admin/reports',
    color: 'text-[hsl(var(--success))]',
    bg: 'bg-[hsl(var(--success))]/10',
    active: true,
  },
  {
    icon: FileWarning,
    label: 'Incomplete Orders',
    desc: 'ইনকমপ্লিট অর্ডার থেকে সেল ক্লোজ করুন',
    route: '/admin/incomplete-orders',
    color: 'text-[hsl(var(--warning))]',
    bg: 'bg-[hsl(var(--warning))]/10',
    active: true,
  },
  {
    icon: TrendingUp,
    label: 'Revenue Dashboard',
    desc: 'রিয়েল-টাইম সেলস ও নেট প্রফিট অটো হিসাব',
    route: '/admin',
    color: 'text-accent',
    bg: 'bg-accent/10',
    active: true,
  },
  {
    icon: Phone,
    label: 'Direct Call & Invoice',
    desc: 'কাস্টমারকে কল ও ইনভয়েস জেনারেট',
    route: '/admin/orders',
    color: 'text-[hsl(var(--prime))]',
    bg: 'bg-[hsl(var(--prime))]/10',
    active: true,
  },
  {
    icon: RefreshCw,
    label: 'One-Click Update',
    desc: 'অর্ডার স্ট্যাটাস ও কাস্টমার তথ্য আপডেট',
    route: '/admin/orders',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
    active: true,
  },
  {
    icon: Lock,
    label: 'Source Protection',
    desc: 'রাইট-ক্লিক, F12 ও সোর্স কোড সুরক্ষিত',
    route: '#',
    color: 'text-foreground',
    bg: 'bg-muted',
    active: true,
  },
  {
    icon: Zap,
    label: 'Fast Load Speed',
    desc: 'Lazy loading ও অপটিমাইজড পারফরম্যান্স',
    route: '#',
    color: 'text-[hsl(var(--rating))]',
    bg: 'bg-[hsl(var(--rating))]/10',
    active: true,
  },
  {
    icon: Link2,
    label: 'Clean URL & Redirect',
    desc: 'অর্ডারের পর স্মার্ট কাউন্টডাউন রিডাইরেক্ট',
    route: '#',
    color: 'text-[hsl(var(--success))]',
    bg: 'bg-[hsl(var(--success))]/10',
    active: true,
  },
];

export const DashboardFeatureCards = () => {
  const navigate = useNavigate();

  return (
    <Card className="border border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Zap className="h-5 w-5 text-[hsl(var(--rating))]" />
          পাওয়ার ফিচারস
          <Badge variant="secondary" className="text-[10px]">All Active</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {features.map((f) => (
            <div
              key={f.label}
              onClick={() => f.route !== '#' && navigate(f.route)}
              className={`relative rounded-xl border border-primary/20 bg-card p-3 transition-all hover:shadow-md hover:border-primary/40 ${
                f.route !== '#' ? 'cursor-pointer' : ''
              }`}
            >
              <div className={`h-8 w-8 rounded-lg ${f.bg} flex items-center justify-center mb-2`}>
                <f.icon className={`h-4 w-4 ${f.color}`} />
              </div>
              <p className="text-xs font-semibold text-foreground">{f.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{f.desc}</p>
              <Badge variant="default" className="mt-1.5 text-[9px] px-1.5 py-0">
                সক্রিয়
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
