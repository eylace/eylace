import { useState, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { CreditCard, Wallet, Banknote, Building2, Smartphone, Globe, ShieldCheck } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface PaymentMethodsProps {
  form: UseFormReturn<any>;
}

const ICON_MAP: Record<string, React.ElementType> = {
  stripe: CreditCard,
  paypal: Wallet,
  sslcommerz: ShieldCheck,
  razorpay: CreditCard,
  paystack: CreditCard,
  bkash: Smartphone,
  nagad: Smartphone,
  rocket: Building2,
  upay: Smartphone,
  cash: Banknote,
  aamarpay: CreditCard,
};

interface GatewayOption {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  needsCard: boolean;
  needsRedirect: boolean;
  isCOD: boolean;
}

export const PaymentMethods = ({ form }: PaymentMethodsProps) => {
  const [selectedMethod, setSelectedMethod] = useState('');
  const [gateways, setGateways] = useState<GatewayOption[]>([]);
  const [loading, setLoading] = useState(true);
  const { register, formState: { errors }, setValue } = form;
  const { t } = useLanguage();

  useEffect(() => {
    const fetchGateways = async () => {
      const { data } = await supabase
        .from('payment_gateways')
        .select('gateway_key, display_name, settings')
        .eq('is_enabled', true)
        .order('sort_order');

      if (data && data.length > 0) {
        const options: GatewayOption[] = data.map(g => ({
          id: g.gateway_key,
          name: g.display_name,
          description: (g.settings as any)?.description || getDefaultDesc(g.gateway_key),
          icon: ICON_MAP[g.gateway_key] || Globe,
          needsCard: g.gateway_key === 'stripe' || g.gateway_key === 'authorizenet',
          needsRedirect: ['bkash', 'nagad', 'rocket', 'upay', 'paypal', 'sslcommerz', 'razorpay', 'paystack', 'aamarpay'].includes(g.gateway_key),
          isCOD: g.gateway_key === 'cash',
        }));
        setGateways(options);
        setSelectedMethod(options[0]?.id || '');
        setValue('paymentMethod', options[0]?.id || '');
      } else {
        // Fallback defaults
        const fallback: GatewayOption[] = [
          { id: 'card', name: t('payment.creditDebit'), description: t('payment.creditDebitDesc'), icon: CreditCard, needsCard: true, needsRedirect: false, isCOD: false },
          { id: 'bkash', name: 'bKash', description: t('payment.mobileBanking'), icon: Smartphone, needsCard: false, needsRedirect: true, isCOD: false },
          { id: 'nagad', name: 'Nagad', description: t('payment.digitalPayment'), icon: Smartphone, needsCard: false, needsRedirect: true, isCOD: false },
          { id: 'rocket', name: 'Rocket', description: t('payment.dblMobile'), icon: Building2, needsCard: false, needsRedirect: true, isCOD: false },
          { id: 'cod', name: t('payment.cod'), description: t('payment.codDesc'), icon: Banknote, needsCard: false, needsRedirect: false, isCOD: true },
        ];
        setGateways(fallback);
        setSelectedMethod('card');
        setValue('paymentMethod', 'card');
      }
      setLoading(false);
    };
    fetchGateways();
  }, []);

  const getDefaultDesc = (key: string) => {
    const map: Record<string, string> = {
      stripe: 'Credit/Debit Card',
      paypal: 'PayPal Payment',
      bkash: 'bKash Mobile Banking',
      nagad: 'Nagad Digital Payment',
      rocket: 'Rocket DBBL Mobile',
      cash: 'Pay on Delivery',
      sslcommerz: 'SSLCommerz Payment',
      razorpay: 'Razorpay Payment',
      upay: 'Upay Mobile Banking',
      aamarpay: 'AamarPay Payment',
    };
    return map[key] || 'Online Payment';
  };

  if (loading) return <div className="animate-pulse h-40 bg-muted rounded-lg" />;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-foreground">{t('payment.title')}</h2>
      <RadioGroup value={selectedMethod} onValueChange={(value) => { setSelectedMethod(value); setValue('paymentMethod', value); }} className="space-y-3">
        {gateways.map((method) => (
          <div key={method.id}>
            <label htmlFor={method.id} className={cn("flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all", selectedMethod === method.id ? "border-accent bg-accent/5" : "border-border hover:border-accent/50")}>
              <RadioGroupItem value={method.id} id={method.id} />
              <method.icon className="h-6 w-6 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium text-foreground">{method.name}</p>
                <p className="text-sm text-muted-foreground">{method.description}</p>
              </div>
            </label>
            {selectedMethod === method.id && method.needsCard && (
              <div className="mt-4 ml-12 space-y-4 p-4 bg-secondary/50 rounded-lg">
                <div className="space-y-2"><Label htmlFor="cardNumber">{t('payment.cardNumber')} *</Label><Input id="cardNumber" placeholder="1234 5678 9012 3456" {...register('cardNumber', { required: selectedMethod === method.id })} className={errors.cardNumber ? 'border-destructive' : ''} /></div>
                <div className="space-y-2"><Label htmlFor="cardName">{t('payment.nameOnCard')} *</Label><Input id="cardName" {...register('cardName', { required: selectedMethod === method.id })} className={errors.cardName ? 'border-destructive' : ''} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label htmlFor="cardExpiry">{t('payment.expiryDate')} *</Label><Input id="cardExpiry" placeholder="MM/YY" {...register('cardExpiry', { required: selectedMethod === method.id })} className={errors.cardExpiry ? 'border-destructive' : ''} /></div>
                  <div className="space-y-2"><Label htmlFor="cardCvv">{t('payment.cvv')} *</Label><Input id="cardCvv" type="password" placeholder="123" maxLength={4} {...register('cardCvv', { required: selectedMethod === method.id })} className={errors.cardCvv ? 'border-destructive' : ''} /></div>
                </div>
              </div>
            )}
            {selectedMethod === method.id && method.needsRedirect && (
              <div className="mt-4 ml-12 p-4 bg-secondary/50 rounded-lg"><p className="text-sm text-muted-foreground">{t('payment.redirectMsg')}</p></div>
            )}
            {selectedMethod === method.id && method.isCOD && (
              <div className="mt-4 ml-12 p-4 bg-warning/10 border border-warning/30 rounded-lg"><p className="text-sm text-foreground">{t('payment.codNote')}</p></div>
            )}
          </div>
        ))}
      </RadioGroup>
    </div>
  );
};
