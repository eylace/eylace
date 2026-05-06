import { UseFormReturn } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { ArrowLeft, Lock, Shield, Truck, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShippingForm } from '@/components/checkout/ShippingForm';
import { PaymentMethods } from '@/components/checkout/PaymentMethods';
import { OrderSummary } from '@/components/checkout/OrderSummary';
import { PromoCodeInput } from '@/components/checkout/PromoCodeInput';
import { useLanguage } from '@/contexts/LanguageContext';
import { Separator } from '@/components/ui/separator';
import { CartItem } from '@/types';

interface Props {
  form: UseFormReturn<any>;
  onSubmit: (data: any) => void;
  isProcessing: boolean;
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  isBuyNowMode: boolean;
  codFee: number;
  promoDiscount: number;
  onlinePaymentDiscount: number;
  appliedCode: string | null;
  onApplyPromo: (d: number, c: string, cid: string) => void;
  onRemovePromo: () => void;
  customization?: any;
}

export const CheckoutModern = ({ form, onSubmit, isProcessing, items, itemCount, subtotal, shipping, tax, total, isBuyNowMode, codFee, promoDiscount, onlinePaymentDiscount, appliedCode, onApplyPromo, onRemovePromo, customization = {} }: Props) => {
  const { t } = useLanguage();
  const cfg = customization;
  const btnStyle = (cfg.buttonBgColor || cfg.buttonTextColor) ? { backgroundColor: cfg.buttonBgColor || undefined, color: cfg.buttonTextColor || undefined } : undefined;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Top bar */}
      <div className="bg-card border-b border-border">
        <div className="container-main flex items-center justify-between py-4">
          {cfg.showBackButton !== false && (
            <Button variant="ghost" size="sm" asChild>
              <Link to="/cart"><ArrowLeft className="h-4 w-4 mr-2" />Back to Cart</Link>
            </Button>
          )}
          <h1 className="text-xl font-bold text-foreground">{cfg.headingText || 'Secure Checkout'}</h1>
          {cfg.showSSLBadge !== false && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Shield className="h-4 w-4 text-green-500" />
              SSL Encrypted
            </div>
          )}
        </div>
      </div>

      {/* Trust badges */}
      {cfg.showTrustBadges !== false && (
        <div className="container-main py-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Shield, title: cfg.trustBadge1Title || 'Secure Payment', desc: cfg.trustBadge1Desc || '100% Safe & Secure' },
              { icon: Truck, title: cfg.trustBadge2Title || 'Fast Delivery', desc: cfg.trustBadge2Desc || '2-5 Business Days' },
              { icon: RotateCcw, title: cfg.trustBadge3Title || 'Easy Returns', desc: cfg.trustBadge3Desc || '7 Days Return Policy' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 bg-card border border-border rounded-xl p-3" style={{ borderRadius: cfg.cardBorderRadius ? `${cfg.cardBorderRadius}px` : undefined }}>
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="container-main pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm" style={{ borderRadius: cfg.cardBorderRadius ? `${cfg.cardBorderRadius}px` : undefined }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">1</div>
                  <h2 className="text-lg font-bold text-foreground">Shipping Information</h2>
                </div>
                <ShippingForm form={form} />
              </div>

              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm" style={{ borderRadius: cfg.cardBorderRadius ? `${cfg.cardBorderRadius}px` : undefined }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">2</div>
                  <h2 className="text-lg font-bold text-foreground">Payment Method</h2>
                </div>
                <PaymentMethods form={form} courierAmount={shipping} />
              </div>
            </div>

            <div className="lg:col-span-5 space-y-4">
              <div className="lg:sticky lg:top-6 space-y-4">
                <OrderSummary items={items} itemCount={itemCount} subtotal={subtotal} shipping={shipping} tax={tax} total={total} codFee={codFee} promoDiscount={promoDiscount} onlinePaymentDiscount={onlinePaymentDiscount} showEditCart={!isBuyNowMode} />
                {cfg.showPromoCode !== false && (
                  <div className="bg-card border border-border rounded-2xl p-4" style={{ borderRadius: cfg.cardBorderRadius ? `${cfg.cardBorderRadius}px` : undefined }}>
                    <PromoCodeInput onApply={onApplyPromo} onRemove={onRemovePromo} appliedCode={appliedCode} discount={promoDiscount} />
                  </div>
                )}
                <Separator />
                <Button type="submit" variant="buy-now" size="xl" className="w-full rounded-xl" disabled={isProcessing} style={btnStyle}>
                  {isProcessing ? (
                    <><div className="h-5 w-5 border-2 border-accent-foreground border-t-transparent rounded-full animate-spin mr-2" />{cfg.processingText || t('checkout.processing')}</>
                  ) : (
                    <><Lock className="h-5 w-5 mr-2" />{cfg.buttonText || 'Place Order Securely'}</>
                  )}
                </Button>
                <p className="text-xs text-center text-muted-foreground">{cfg.termsText || t('checkout.termsAgree')}</p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
