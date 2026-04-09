import { Link } from 'react-router-dom';
import { ShoppingBag, Truck, Shield, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/contexts/CartContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState } from 'react';
import { toast } from 'sonner';

interface CartSummaryProps {
  showCheckoutButton?: boolean;
}

export const CartSummary = ({ showCheckoutButton = true }: CartSummaryProps) => {
  const { getSubtotal, getShipping, getTax, getTotal, getItemCount } = useCart();
  const { formatPrice } = useCurrency();
  const { t } = useLanguage();
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);

  const subtotal = getSubtotal();
  const shipping = getShipping();
  const tax = getTax();
  const total = getTotal();
  const itemCount = getItemCount();

  const handleApplyPromo = () => {
    if (!promoCode.trim()) { toast.error('Please enter a promo code'); return; }
    if (promoCode.toUpperCase() === 'SAVE10') {
      setAppliedPromo(promoCode.toUpperCase());
      toast.success('Promo code applied!');
    } else {
      toast.error('Invalid promo code');
    }
    setPromoCode('');
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-6 lg:sticky lg:top-24">
      <h2 className="text-lg font-bold text-foreground">{t('cartSummary.title')}</h2>
      <div className="space-y-2">
        <div className="flex gap-2">
          <Input placeholder={t('cartSummary.promoCode')} value={promoCode} onChange={(e) => setPromoCode(e.target.value)} className="flex-1" />
          <Button variant="outline" onClick={handleApplyPromo}>{t('cartSummary.apply')}</Button>
        </div>
        {appliedPromo && (
          <div className="flex items-center gap-2 text-sm text-success">
            <Tag className="h-4 w-4" /><span>{appliedPromo} {t('cartSummary.applied')}</span>
            <button className="text-muted-foreground hover:text-destructive ml-auto" onClick={() => setAppliedPromo(null)}>{t('cartSummary.remove')}</button>
          </div>
        )}
      </div>
      <Separator />
      <div className="space-y-3">
        <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t('cartSummary.subtotal')} ({itemCount} {itemCount === 1 ? t('common.item') : t('common.items')})</span><span className="font-medium text-foreground">{formatPrice(subtotal)}</span></div>
        <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t('cartSummary.shipping')}</span>{shipping === 0 ? <span className="font-medium text-success">{t('cartSummary.free')}</span> : <span className="font-medium text-foreground">{formatPrice(shipping)}</span>}</div>
        <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t('cartSummary.estimatedTax')}</span><span className="font-medium text-foreground">{formatPrice(tax)}</span></div>
        {appliedPromo && (<div className="flex justify-between text-sm text-success"><span>{t('cartSummary.promoDiscount')}</span><span>-{formatPrice(subtotal * 0.1)}</span></div>)}
        <Separator />
        <div className="flex justify-between"><span className="text-lg font-bold text-foreground">{t('cartSummary.total')}</span><span className="text-xl font-bold text-foreground">{formatPrice(appliedPromo ? total * 0.9 : total)}</span></div>
      </div>
      {showCheckoutButton && (<Button variant="buy-now" size="xl" className="w-full" asChild><Link to="/checkout?source=cart"><ShoppingBag className="h-5 w-5 mr-2" />{t('cartSummary.proceedToCheckout')}</Link></Button>)}
      <div className="space-y-3 pt-4 border-t border-border">
        <div className="flex items-center gap-3 text-sm text-muted-foreground"><Truck className="h-5 w-5 text-accent shrink-0" /><span>{t('cartSummary.freeShippingMsg')}</span></div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground"><Shield className="h-5 w-5 text-accent shrink-0" /><span>{t('cartSummary.secureCheckout')}</span></div>
      </div>
    </div>
  );
};
