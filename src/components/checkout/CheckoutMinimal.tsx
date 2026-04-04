import { UseFormReturn } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { ArrowLeft, Lock, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShippingForm } from '@/components/checkout/ShippingForm';
import { PaymentMethods } from '@/components/checkout/PaymentMethods';
import { OrderSummary } from '@/components/checkout/OrderSummary';
import { PromoCodeInput } from '@/components/checkout/PromoCodeInput';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface Props {
  form: UseFormReturn<any>;
  onSubmit: (data: any) => void;
  isProcessing: boolean;
  codFee: number;
  promoDiscount: number;
  appliedCode: string | null;
  onApplyPromo: (d: number, c: string, cid: string) => void;
  onRemovePromo: () => void;
  customization?: any;
}

export const CheckoutMinimal = ({ form, onSubmit, isProcessing, codFee, promoDiscount, appliedCode, onApplyPromo, onRemovePromo, customization = {} }: Props) => {
  const { t } = useLanguage();
  const cfg = customization;
  const btnStyle = (cfg.buttonBgColor || cfg.buttonTextColor) ? { backgroundColor: cfg.buttonBgColor || undefined, color: cfg.buttonTextColor || undefined } : undefined;
  const [shippingOpen, setShippingOpen] = useState(true);
  const [paymentOpen, setPaymentOpen] = useState(false);

  return (
    <div className="container-main py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/cart"><ArrowLeft className="h-4 w-4 mr-2" />Cart</Link>
          </Button>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Checkout</h1>
          <div className="w-16" />
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-2 mb-8">
          <div className="flex-1 h-1 rounded-full bg-primary" />
          <div className={`flex-1 h-1 rounded-full ${paymentOpen ? 'bg-primary' : 'bg-muted'}`} />
          <div className="flex-1 h-1 rounded-full bg-muted" />
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Accordion-style shipping */}
          <Collapsible open={shippingOpen} onOpenChange={setShippingOpen}>
            <CollapsibleTrigger asChild>
              <button type="button" className="w-full flex items-center justify-between bg-card border border-border rounded-xl p-5 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</span>
                  <span className="font-semibold text-foreground">Shipping Details</span>
                </div>
                {shippingOpen ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="bg-card border border-t-0 border-border rounded-b-xl p-6 -mt-2">
                <ShippingForm form={form} />
                <div className="mt-4 flex justify-end">
                  <Button type="button" variant="default" size="sm" onClick={() => { setShippingOpen(false); setPaymentOpen(true); }}>
                    Continue to Payment →
                  </Button>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Accordion-style payment */}
          <Collapsible open={paymentOpen} onOpenChange={setPaymentOpen}>
            <CollapsibleTrigger asChild>
              <button type="button" className="w-full flex items-center justify-between bg-card border border-border rounded-xl p-5 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</span>
                  <span className="font-semibold text-foreground">Payment Method</span>
                </div>
                {paymentOpen ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="bg-card border border-t-0 border-border rounded-b-xl p-6 -mt-2">
                <PaymentMethods form={form} />
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Order summary always visible */}
          <div className="mt-6">
            <OrderSummary codFee={codFee} promoDiscount={promoDiscount} />
          </div>

          <div className="bg-card border border-border rounded-xl p-4">
            <PromoCodeInput onApply={onApplyPromo} onRemove={onRemovePromo} appliedCode={appliedCode} discount={promoDiscount} />
          </div>

          <Button type="submit" variant="buy-now" size="xl" className="w-full rounded-xl" disabled={isProcessing}>
            {isProcessing ? (
              <><div className="h-5 w-5 border-2 border-accent-foreground border-t-transparent rounded-full animate-spin mr-2" />{t('checkout.processing')}</>
            ) : (
              <><Lock className="h-5 w-5 mr-2" />Complete Order</>
            )}
          </Button>
          <p className="text-xs text-center text-muted-foreground">{t('checkout.termsAgree')}</p>
        </form>
      </div>
    </div>
  );
};
