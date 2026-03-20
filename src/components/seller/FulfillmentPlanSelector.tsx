import { CheckCircle, Package, Truck, Headphones, Warehouse, BarChart3, Shield } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type FulfillmentType = 'fbe' | 'fbm';

interface FulfillmentPlanSelectorProps {
  selected: FulfillmentType | null;
  onSelect: (type: FulfillmentType) => void;
  onContinue: () => void;
}

const plans = [
  {
    id: 'fbe' as FulfillmentType,
    name: 'FBE — Fulfilled by Eylace',
    tagline: 'Eylace সব ম্যানেজ করবে',
    badge: 'জনপ্রিয়',
    commission: '১৫–২০%',
    monthlyFee: '৳৯৯৯/মাস',
    description: 'আপনি শুধু প্রোডাক্ট পাঠান — শিপিং, স্টোরেজ, রিটার্ন সব Eylace সামলাবে।',
    features: [
      { icon: Warehouse, text: 'Eylace ওয়্যারহাউসে স্টোরেজ' },
      { icon: Truck, text: 'দ্রুত শিপিং ও ডেলিভারি' },
      { icon: Headphones, text: 'কাস্টমার সার্ভিস Eylace পরিচালিত' },
      { icon: Package, text: 'রিটার্ন ও রিফান্ড হ্যান্ডলিং' },
      { icon: Shield, text: 'Prime ব্যাজ যোগ্যতা' },
      { icon: BarChart3, text: 'অগ্রাধিকার সার্চ র‍্যাংকিং' },
    ],
    highlightColor: 'border-primary ring-2 ring-primary/20',
    bgAccent: 'bg-primary/5',
  },
  {
    id: 'fbm' as FulfillmentType,
    name: 'FBM — Fulfilled by Merchant',
    tagline: 'আপনি নিজে ম্যানেজ করবেন',
    badge: null,
    commission: '৫–১০%',
    monthlyFee: 'বিনামূল্যে',
    description: 'সম্পূর্ণ নিয়ন্ত্রণ আপনার — নিজের শিপিং, প্যাকেজিং ও কাস্টমার সার্ভিস।',
    features: [
      { icon: Package, text: 'নিজস্ব প্যাকেজিং ও ব্র্যান্ডিং' },
      { icon: Truck, text: 'নিজের পছন্দের কুরিয়ার ব্যবহার' },
      { icon: Headphones, text: 'সরাসরি কাস্টমার যোগাযোগ' },
      { icon: BarChart3, text: 'কম কমিশন রেট' },
      { icon: Shield, text: 'কোনো মাসিক ফি নেই' },
      { icon: Warehouse, text: 'নিজের ইনভেন্টরি ম্যানেজমেন্ট' },
    ],
    highlightColor: 'border-accent ring-2 ring-accent/20',
    bgAccent: 'bg-accent/5',
  },
];

export const FulfillmentPlanSelector = ({ selected, onSelect, onContinue }: FulfillmentPlanSelectorProps) => {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">আপনার সেলিং প্ল্যান বেছে নিন</h2>
        <p className="text-muted-foreground">আপনার ব্যবসার ধরন অনুযায়ী সেরা প্ল্যানটি নির্বাচন করুন</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {plans.map((plan) => {
          const isSelected = selected === plan.id;
          return (
            <Card
              key={plan.id}
              className={cn(
                'relative cursor-pointer transition-all duration-200 hover:shadow-lg',
                isSelected ? plan.highlightColor : 'border-border hover:border-muted-foreground/30'
              )}
              onClick={() => onSelect(plan.id)}
            >
              {plan.badge && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4">
                  {plan.badge}
                </Badge>
              )}
              <CardContent className="pt-8 pb-6 px-6">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{plan.tagline}</p>
                </div>

                <div className={cn('rounded-lg p-4 mb-6 text-center', plan.bgAccent)}>
                  <div className="text-sm text-muted-foreground">কমিশন</div>
                  <div className="text-2xl font-bold text-foreground">{plan.commission}</div>
                  <div className="text-sm text-muted-foreground mt-1">মাসিক ফি: <span className="font-semibold text-foreground">{plan.monthlyFee}</span></div>
                </div>

                <p className="text-sm text-muted-foreground mb-5">{plan.description}</p>

                <ul className="space-y-3">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <f.icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-sm text-foreground">{f.text}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 flex items-center justify-center">
                  <div className={cn(
                    'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors',
                    isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                  )}>
                    {isSelected && <CheckCircle className="h-4 w-4 text-primary-foreground" />}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="text-center">
        <Button size="lg" disabled={!selected} onClick={onContinue} className="min-w-[200px]">
          পরবর্তী ধাপে যান
        </Button>
      </div>
    </div>
  );
};
