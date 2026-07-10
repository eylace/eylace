import { useState, useEffect, useMemo } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { CreditCard, Banknote, Globe, Tag, Truck, CheckCircle2, Percent } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useWebsiteSetup } from '@/hooks/useWebsiteSetup';
import { useCurrency } from '@/contexts/CurrencyContext';
import { AdvanceCourierChargeModal, AdvanceGatewayOption } from '@/components/checkout/AdvanceCourierChargeModal';

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
  courierAmount?: number;
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

export const PaymentMethods = ({ form, courierAmount = 0 }: PaymentMethodsProps) => {
  const [gateways, setGateways] = useState<GatewayOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [advanceModalOpen, setAdvanceModalOpen] = useState(false);
  const [topChoice, setTopChoice] = useState<'cod' | 'online'>('cod');
  const [onlineGatewayId, setOnlineGatewayId] = useState<string>('');
  const { setValue } = form;
  const { t } = useLanguage();
  const setup = useWebsiteSetup();
  const { formatPrice } = useCurrency();
  const advancePaidRef: string | undefined = form.watch('advanceCourierPaymentRef');
  const advancePaidAmount: number | undefined = form.watch('advanceCourierAmount');

  useEffect(() => {
    const fetchGateways = async () => {
      const { data } = await supabase
        .from('payment_gateways_public')
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
      } else {
        const fallback: GatewayOption[] = [
          { id: 'cod', name: 'Cash on Delivery (COD)', description: 'ডেলিভারির সময় পেমেন্ট করুন', fallbackIcon: Banknote, needsCard: false, needsRedirect: false, isCOD: true },
          { id: 'bkash', name: 'bKash', description: 'bKash মোবাইল ব্যাংকিং', logo: bkashLogo, needsCard: false, needsRedirect: true, isCOD: false },
          { id: 'nagad', name: 'Nagad', description: 'Nagad ডিজিটাল পেমেন্ট', logo: nagadLogo, needsCard: false, needsRedirect: true, isCOD: false },
          { id: 'rocket', name: 'Rocket', description: 'DBBL Rocket', logo: rocketLogo, needsCard: false, needsRedirect: true, isCOD: false },
        ];
        setGateways(fallback);
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

  const onlineGateways = useMemo(
    () => gateways.filter(g => !g.isCOD && !g.needsCard),
    [gateways],
  );

  // Keep form's paymentMethod in sync with top-level choice + online gateway selection.
  useEffect(() => {
    if (topChoice === 'cod') {
      setValue('paymentMethod', 'cod', { shouldDirty: true });
      // clear stale card fields
      setValue('cardNumber', '');
      setValue('cardName', '');
      setValue('cardExpiry', '');
      setValue('cardCvv', '');
    } else {
      const first = onlineGatewayId || onlineGateways[0]?.id || '';
      if (!onlineGatewayId && first) setOnlineGatewayId(first);
      setValue('paymentMethod', first, { shouldDirty: true });
      // clear any advance-courier state if user switches away from COD
      setValue('advanceCourierPaymentRef', '');
      setValue('advanceCourierAmount', 0);
      setValue('advanceCourierGateway', '');
    }
  }, [topChoice, onlineGatewayId, onlineGateways, setValue]);

  const offerPct = Number(setup.prepaymentOfferPercent) || 0;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-foreground">{t('payment.title')}</h2>

      <RadioGroup
        value={topChoice}
        onValueChange={(v) => setTopChoice(v as 'cod' | 'online')}
        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
      >
        {/* COD top-level */}
        <label
          htmlFor="top-cod"
          className={cn(
            'flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all',
            topChoice === 'cod' ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/50',
          )}
        >
          <RadioGroupItem value="cod" id="top-cod" className="mt-1" />
          <Banknote className="h-6 w-6 text-accent shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="font-semibold text-sm text-foreground">Cash on Delivery</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              ডেলিভারির সময় পণ্যের মূল্য পরিশোধ করুন। ডেলিভারি চার্জ অগ্রিম দিতে হবে।
            </p>
          </div>
        </label>

        {/* Online top-level */}
        <label
          htmlFor="top-online"
          className={cn(
            'relative flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all',
            topChoice === 'online' ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/50',
          )}
        >
          <RadioGroupItem value="online" id="top-online" className="mt-1" />
          <CreditCard className="h-6 w-6 text-accent shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="font-semibold text-sm text-foreground">Online Payment</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              bKash, Nagad ও অন্যান্য অনলাইন পেমেন্টে সম্পূর্ণ পরিশোধ করুন।
            </p>
            {setup.prepaymentOfferEnabled && offerPct > 0 && (
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-accent text-accent-foreground px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                <Percent className="h-3 w-3" /> {offerPct}% OFF
              </span>
            )}
          </div>
        </label>
      </RadioGroup>

      {/* COD panel: advance courier charge */}
      {topChoice === 'cod' && (
        <div className="p-4 rounded-lg border-2 border-accent/30 bg-accent/5 space-y-3">
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-accent shrink-0" />
            <span className="text-sm font-semibold text-foreground">
              {t('payment.advanceCourierTitle') || 'Pay Courier Charge in Advance'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            COD অর্ডার নিশ্চিত করতে ডেলিভারি চার্জ অনলাইনে পরিশোধ করতে হবে। পণ্যের মূল্য পরে ডেলিভারিম্যানকে দেবেন।
          </p>
          {advancePaidRef ? (
            <div className="flex items-center gap-2 text-xs text-success">
              <CheckCircle2 className="h-4 w-4" />
              <span>
                {(t('payment.courierPrepaid') || 'Courier charge prepaid online')}
                {' '}({formatPrice(Number(advancePaidAmount) || courierAmount)})
              </span>
            </div>
          ) : (
            <Button
              type="button"
              size="sm"
              className="w-full"
              onClick={() => setAdvanceModalOpen(true)}
              disabled={courierAmount <= 0 || onlineGateways.length === 0}
            >
              {courierAmount > 0
                ? `${t('payment.payCourierBtn') || 'Pay Courier Charge'} — ${formatPrice(courierAmount)}`
                : (t('payment.payCourierBtn') || 'Pay Courier Charge')}
            </Button>
          )}
        </div>
      )}

      {/* Online panel: gateway sub-selection + discount info */}
      {topChoice === 'online' && (
        <div className="p-4 rounded-lg border-2 border-accent/30 bg-accent/5 space-y-3">
          {setup.prepaymentOfferEnabled && offerPct > 0 && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-accent/10 border border-accent/30">
              <Tag className="h-4 w-4 text-accent shrink-0" />
              <p className="text-xs font-semibold text-accent">
                {setup.prepaymentOfferText || `অনলাইনে পেমেন্ট করলে ${offerPct}% ছাড় স্বয়ংক্রিয়ভাবে প্রয়োগ হবে।`}
              </p>
            </div>
          )}

          {onlineGateways.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">
              No online payment methods are enabled right now.
            </p>
          ) : (
            <RadioGroup
              value={onlineGatewayId}
              onValueChange={setOnlineGatewayId}
              className="space-y-2"
            >
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Select payment method
              </p>
              {onlineGateways.map((g) => (
                <label
                  key={g.id}
                  htmlFor={`og-${g.id}`}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all bg-background',
                    onlineGatewayId === g.id ? 'border-accent' : 'border-border hover:border-accent/50',
                  )}
                >
                  <RadioGroupItem value={g.id} id={`og-${g.id}`} />
                  {g.logo ? (
                    <img src={g.logo} alt={g.name} className="h-7 w-7 object-contain shrink-0 rounded" loading="lazy" />
                  ) : (
                    <Globe className="h-5 w-5 text-muted-foreground shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground">{g.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{g.description}</p>
                  </div>
                </label>
              ))}
              <p className="text-xs text-muted-foreground pt-1">
                {t('payment.redirectMsg') || 'You will be redirected to the payment gateway to complete your payment.'}
              </p>
            </RadioGroup>
          )}
        </div>
      )}

      <AdvanceCourierChargeModal
        open={advanceModalOpen}
        onClose={() => setAdvanceModalOpen(false)}
        amount={courierAmount}
        gateways={onlineGateways.map<AdvanceGatewayOption>((g) => ({ id: g.id, name: g.name, logo: g.logo }))}
        onConfirmed={(ref, gatewayId) => {
          setValue('advanceCourierPaymentRef', ref, { shouldDirty: true });
          setValue('advanceCourierAmount', courierAmount, { shouldDirty: true });
          setValue('advanceCourierGateway', gatewayId, { shouldDirty: true });
        }}
      />
    </div>
  );
};
