import { useState, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { CreditCard, Banknote, Globe, Tag } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useWebsiteSetup } from '@/hooks/useWebsiteSetup';

import bkashLogo from '@/assets/payment/bkash-logo.png';
import nagadLogo from '@/assets/payment/nagad-logo.png';
import rocketLogo from '@/assets/payment/rocket-logo.png';
import upayLogo from '@/assets/payment/upay-logo.png';
import sslcommerzLogo from '@/assets/payment/sslcommerz-logo.png';
import aamarpayLogo from '@/assets/payment/aamarpay-logo.png';
import paypalLogo from '@/assets/payment/paypal-logo.png';
import stripeLogo from '@/assets/payment/stripe-logo.png';
import razorpayLogo from '@/assets/payment/razorpay-logo.png';
import paystackLogo from '@/assets/payment/paystack-logo.png';

const LOGO_MAP: Record<string, string> = {
  bkash: bkashLogo,
  nagad: nagadLogo,
  rocket: rocketLogo,
  upay: upayLogo,
  sslcommerz: sslcommerzLogo,
  aamarpay: aamarpayLogo,
  paypal: paypalLogo,
  stripe: stripeLogo,
  razorpay: razorpayLogo,
  paystack: paystackLogo,
};

interface PaymentMethodsProps {
  form: UseFormReturn<any>;
}

interface GatewayOption {
  id: string;
  name: string;
  description: string;
  logo?: string;
  fallbackIcon?: React.ElementType;
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
  const setup = useWebsiteSetup();

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
          logo: LOGO_MAP[g.gateway_key],
          fallbackIcon: ['cash', 'cod'].includes(g.gateway_key) ? Banknote : (!LOGO_MAP[g.gateway_key] ? Globe : undefined),
          needsCard: g.gateway_key === 'stripe' || g.gateway_key === 'authorizenet',
          needsRedirect: ['bkash', 'nagad', 'rocket', 'upay', 'paypal', 'sslcommerz', 'razorpay', 'paystack', 'aamarpay'].includes(g.gateway_key),
          isCOD: ['cash', 'cod'].includes(g.gateway_key),
        }));
        setGateways(options);
        setSelectedMethod(options[0]?.id || '');
        setValue('paymentMethod', options[0]?.id || '');
      } else {
        const fallback: GatewayOption[] = [
          { id: 'cod', name: 'Cash on Delivery (COD)', description: 'ডেলিভারির সময় পেমেন্ট করুন', fallbackIcon: Banknote, needsCard: false, needsRedirect: false, isCOD: true },
          { id: 'bkash', name: 'bKash', description: 'bKash মোবাইল ব্যাংকিং', logo: bkashLogo, needsCard: false, needsRedirect: true, isCOD: false },
          { id: 'nagad', name: 'Nagad', description: 'Nagad ডিজিটাল পেমেন্ট', logo: nagadLogo, needsCard: false, needsRedirect: true, isCOD: false },
          { id: 'rocket', name: 'Rocket', description: 'DBBL Rocket', logo: rocketLogo, needsCard: false, needsRedirect: true, isCOD: false },
          { id: 'card', name: 'Credit/Debit Card', description: t('payment.creditDebitDesc'), fallbackIcon: CreditCard, needsCard: true, needsRedirect: false, isCOD: false },
        ];
        setGateways(fallback);
        setSelectedMethod('cod');
        setValue('paymentMethod', 'cod');
      }
      setLoading(false);
    };
    fetchGateways();
  }, []);

  const getDefaultDesc = (key: string) => {
    const map: Record<string, string> = {
      stripe: 'Credit/Debit Card',
      paypal: 'PayPal Payment',
      bkash: 'bKash মোবাইল ব্যাংকিং',
      nagad: 'Nagad ডিজিটাল পেমেন্ট',
      rocket: 'DBBL Rocket',
      cash: 'ডেলিভারির সময় পেমেন্ট করুন',
      cod: 'ডেলিভারির সময় পেমেন্ট করুন',
      sslcommerz: 'SSLCommerz Payment',
      razorpay: 'Razorpay Payment',
      upay: 'Upay মোবাইল ব্যাংকিং',
      aamarpay: 'AamarPay Payment',
    };
    return map[key] || 'Online Payment';
  };

  if (loading) return <div className="animate-pulse h-40 bg-muted rounded-lg" />;

  const codGateways = gateways.filter(g => g.isCOD);
  const onlineGateways = gateways.filter(g => !g.isCOD);

  const handleSelect = (value: string) => {
    setSelectedMethod(value);
    setValue('paymentMethod', value);
  };

  const renderGateway = (method: GatewayOption) => (
    <div key={method.id}>
      <label htmlFor={method.id} className={cn(
        "flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all",
        selectedMethod === method.id ? "border-accent bg-accent/5" : "border-border hover:border-accent/50"
      )}>
        <RadioGroupItem value={method.id} id={method.id} />
        {method.logo ? (
          <img src={method.logo} alt={method.name} className="h-7 w-7 object-contain shrink-0 rounded" loading="lazy" />
        ) : method.fallbackIcon ? (
          <method.fallbackIcon className="h-5 w-5 text-muted-foreground shrink-0" />
        ) : (
          <Globe className="h-5 w-5 text-muted-foreground shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-foreground">{method.name}</p>
          <p className="text-xs text-muted-foreground truncate">{method.description}</p>
        </div>
      </label>
      {selectedMethod === method.id && method.needsCard && (
        <div className="mt-3 ml-10 space-y-3 p-3 bg-secondary/50 rounded-lg">
          <div className="space-y-1"><Label htmlFor="cardNumber" className="text-xs">{t('payment.cardNumber')} *</Label><Input id="cardNumber" placeholder="1234 5678 9012 3456" {...register('cardNumber', { required: selectedMethod === method.id })} className={cn("h-8 text-sm", errors.cardNumber && 'border-destructive')} /></div>
          <div className="space-y-1"><Label htmlFor="cardName" className="text-xs">{t('payment.nameOnCard')} *</Label><Input id="cardName" {...register('cardName', { required: selectedMethod === method.id })} className={cn("h-8 text-sm", errors.cardName && 'border-destructive')} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label htmlFor="cardExpiry" className="text-xs">{t('payment.expiryDate')} *</Label><Input id="cardExpiry" placeholder="MM/YY" {...register('cardExpiry', { required: selectedMethod === method.id })} className={cn("h-8 text-sm", errors.cardExpiry && 'border-destructive')} /></div>
            <div className="space-y-1"><Label htmlFor="cardCvv" className="text-xs">{t('payment.cvv')} *</Label><Input id="cardCvv" type="password" placeholder="123" maxLength={4} {...register('cardCvv', { required: selectedMethod === method.id })} className={cn("h-8 text-sm", errors.cardCvv && 'border-destructive')} /></div>
          </div>
        </div>
      )}
      {selectedMethod === method.id && method.needsRedirect && (
        <div className="mt-3 ml-10 p-3 bg-secondary/50 rounded-lg"><p className="text-xs text-muted-foreground">{t('payment.redirectMsg')}</p></div>
      )}
      {selectedMethod === method.id && method.isCOD && (
        <div className="mt-3 ml-10 p-3 bg-warning/10 border border-warning/30 rounded-lg"><p className="text-xs text-foreground">{t('payment.codNote')}</p></div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-foreground">{t('payment.title')}</h2>

      <RadioGroup value={selectedMethod} onValueChange={handleSelect} className="space-y-2">
        {/* COD Section */}
        {codGateways.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Banknote className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cash on Delivery</span>
            </div>
            {codGateways.map(renderGateway)}
          </div>
        )}

        {/* Offer Banner */}
        {setup.prepaymentOfferEnabled && onlineGateways.length > 0 && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-accent/10 border border-accent/30">
            <Tag className="h-4 w-4 text-accent shrink-0" />
            <p className="text-xs font-semibold text-accent">
              {setup.prepaymentOfferText || `পেমেন্ট করে অর্ডার করলেই ${setup.prepaymentOfferPercent}% ছাড়!`}
            </p>
          </div>
        )}

        {/* Online Payment Section */}
        {onlineGateways.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Online Payment</span>
            </div>
            {onlineGateways.map(renderGateway)}
          </div>
        )}
      </RadioGroup>
    </div>
  );
};
