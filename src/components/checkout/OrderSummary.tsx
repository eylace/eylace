import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, Edit2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/contexts/CartContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface OrderSummaryProps {
  promoDiscount?: number;
  codFee?: number;
  onlinePaymentDiscount?: number;
}

export const OrderSummary = ({ promoDiscount = 0, codFee = 0, onlinePaymentDiscount = 0 }: OrderSummaryProps) => {
  const { items, getSubtotal, getShipping, getTax, getTotal, getItemCount } = useCart();
  const { formatPrice } = useCurrency();
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(true);

  const subtotal = getSubtotal();
  const shipping = getShipping();
  const tax = getTax();
  const total = Math.max(0, getTotal() - promoDiscount - onlinePaymentDiscount + codFee);
  const itemCount = getItemCount();

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden lg:sticky lg:top-24">
      <button onClick={() => setIsExpanded(!isExpanded)} className="w-full flex items-center justify-between p-4 bg-secondary/50 lg:cursor-default">
        <span className="font-bold text-foreground">{t('orderSummary.title')} ({itemCount} {itemCount === 1 ? t('orderSummary.item') : t('orderSummary.items')})</span>
        <div className="flex items-center gap-2">
          <span className="font-bold text-foreground">{formatPrice(total)}</span>
          <span className="lg:hidden">{isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</span>
        </div>
      </button>
      <div className={cn("transition-all duration-300 lg:block", isExpanded ? "block" : "hidden")}>
        <div className="p-4 space-y-4 max-h-80 overflow-y-auto">
          {items.map((item, index) => (
            <div key={`${item.product.id}-${index}`} className="flex gap-3">
              <div className="relative shrink-0">
                <div className="w-16 h-16 bg-secondary rounded-md overflow-hidden"><img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" /></div>
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-accent text-accent-foreground text-xs font-bold rounded-full flex items-center justify-center">{item.quantity}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground line-clamp-2">{item.product.name}</p>
                {item.selectedVariations && Object.keys(item.selectedVariations).length > 0 && (<p className="text-xs text-muted-foreground mt-1">{Object.entries(item.selectedVariations).map(([k, v]) => `${k}: ${v}`).join(', ')}</p>)}
                <p className="text-sm font-medium text-foreground mt-1">{formatPrice(item.product.price * item.quantity)}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-border">
          <Button variant="ghost" size="sm" className="w-full text-accent" asChild><Link to="/cart"><Edit2 className="h-4 w-4 mr-2" />{t('orderSummary.editCart')}</Link></Button>
        </div>
        <Separator />
        <div className="p-4 space-y-3">
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t('orderSummary.subtotal')}</span><span className="text-foreground">{formatPrice(subtotal)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t('orderSummary.shipping')}</span>{shipping === 0 ? <span className="text-success font-medium">{t('orderSummary.free')}</span> : <span className="text-foreground">{formatPrice(shipping)}</span>}</div>
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t('orderSummary.tax')}</span><span className="text-foreground">{formatPrice(tax)}</span></div>
          {promoDiscount > 0 && (<div className="flex justify-between text-sm text-success"><span>{t('orderSummary.promoDiscount')}</span><span>-{formatPrice(promoDiscount)}</span></div>)}
          {onlinePaymentDiscount > 0 && (<div className="flex justify-between text-sm text-success"><span>{t('orderSummary.onlinePaymentDiscount')}</span><span>-{formatPrice(onlinePaymentDiscount)}</span></div>)}
          {codFee > 0 && (<div className="flex justify-between text-sm text-warning"><span>{t('orderSummary.codFee')}</span><span>+{formatPrice(codFee)}</span></div>)}
          <Separator />
          <div className="flex justify-between"><span className="text-lg font-bold text-foreground">{t('orderSummary.total')}</span><span className="text-xl font-bold text-foreground">{formatPrice(total)}</span></div>
        </div>
      </div>
    </div>
  );
};
