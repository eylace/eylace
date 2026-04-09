import { UseFormReturn } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { ChevronRight, ArrowLeft, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShippingForm } from '@/components/checkout/ShippingForm';
import { PaymentMethods } from '@/components/checkout/PaymentMethods';
import { OrderSummary } from '@/components/checkout/OrderSummary';
import { PromoCodeInput } from '@/components/checkout/PromoCodeInput';
import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
  form: UseFormReturn<any>;
  onSubmit: (data: any) => void;
  isProcessing: boolean;
  codFee: number;
  promoDiscount: number;
  onlinePaymentDiscount: number;
  appliedCode: string | null;
  onApplyPromo: (d: number, c: string, cid: string) => void;
  onRemovePromo: () => void;
  customization?: any;
}

export const CheckoutClassic = ({ form, onSubmit, isProcessing, codFee, promoDiscount, onlinePaymentDiscount, appliedCode, onApplyPromo, onRemovePromo, customization = {} }: Props) => {
  const { t } = useLanguage();
  const c = customization;
  const btnStyle = (c.buttonBgColor || c.buttonTextColor) ? { backgroundColor: c.buttonBgColor || undefined, color: c.buttonTextColor || undefined } : undefined;

  return (
    <div className="container-main py-6">
      {c.showBreadcrumb !== false && (
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-accent transition-colors">{t('checkout.home')}</Link>
          <ChevronRight className="h-4 w-4" />
          <Link to="/cart" className="hover:text-accent transition-colors">{t('checkout.cart')}</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{c.headingText || t('checkout.title')}</span>
        </nav>
      )}

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">{c.headingText || t('checkout.title')}</h1>
        {c.showBackButton !== false && (
          <Button variant="ghost" asChild>
            <Link to="/cart"><ArrowLeft className="h-4 w-4 mr-2" />{t('checkout.backToCart')}</Link>
          </Button>
        )}
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-card border border-border rounded-lg p-6" style={{ borderRadius: c.cardBorderRadius ? `${c.cardBorderRadius}px` : undefined }}><ShippingForm form={form} /></div>
            <div className="bg-card border border-border rounded-lg p-6" style={{ borderRadius: c.cardBorderRadius ? `${c.cardBorderRadius}px` : undefined }}><PaymentMethods form={form} /></div>
            <div className="lg:hidden">
              <Button type="submit" variant="buy-now" size="xl" className="w-full" disabled={isProcessing} style={btnStyle}>
                {isProcessing ? (
                  <><div className="h-5 w-5 border-2 border-accent-foreground border-t-transparent rounded-full animate-spin mr-2" />{c.processingText || t('checkout.processing')}</>
                ) : (
                  <><Lock className="h-5 w-5 mr-2" />{c.buttonText || t('checkout.placeOrder')}</>
                )}
              </Button>
            </div>
          </div>
          <div className="space-y-4">
            <OrderSummary codFee={codFee} promoDiscount={promoDiscount} onlinePaymentDiscount={onlinePaymentDiscount} />
            {c.showPromoCode !== false && (
              <div className="bg-card border border-border rounded-lg p-4" style={{ borderRadius: c.cardBorderRadius ? `${c.cardBorderRadius}px` : undefined }}>
                <PromoCodeInput onApply={onApplyPromo} onRemove={onRemovePromo} appliedCode={appliedCode} discount={promoDiscount} />
              </div>
            )}
            <div className="hidden lg:block space-y-3">
              <Button type="submit" variant="buy-now" size="xl" className="w-full" disabled={isProcessing} style={btnStyle}>
                {isProcessing ? (
                  <><div className="h-5 w-5 border-2 border-accent-foreground border-t-transparent rounded-full animate-spin mr-2" />{c.processingText || t('checkout.processing')}</>
                ) : (
                  <><Lock className="h-5 w-5 mr-2" />{c.buttonText || t('checkout.placeOrder')}</>
                )}
              </Button>
              <p className="text-xs text-center text-muted-foreground">{c.termsText || t('checkout.termsAgree')}</p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
