import { Link } from 'react-router-dom';
import { Trash2, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QuantitySelector } from '@/components/products/QuantitySelector';
import { CartItem as CartItemType } from '@/types';
import { useCart } from '@/contexts/CartContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface CartItemProps {
  item: CartItemType;
}

export const CartItemComponent = ({ item }: CartItemProps) => {
  const { updateQuantity, removeItem } = useCart();
  const { formatPrice } = useCurrency();
  const { t } = useLanguage();
  const { product, quantity, selectedVariations } = item;
  const hasDiscount = product.discount && product.discount > 0;
  const savings = product.originalPrice ? (product.originalPrice - product.price) * quantity : 0;

  return (
    <div className="flex gap-4 p-4 bg-card border border-border rounded-lg">
      <Link to={`/product/${product.slug}`} className="shrink-0">
        <div className="w-24 h-24 md:w-32 md:h-32 bg-secondary rounded-lg overflow-hidden">
          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
        </div>
      </Link>
      <div className="flex-1 min-w-0">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
          <div className="space-y-1">
            <Link to={`/product/${product.slug}`} className="font-medium text-foreground hover:text-accent transition-colors line-clamp-2">{product.name}</Link>
            {product.seller?.name && (<p className="text-sm text-muted-foreground">{t('cartItem.soldBy')} {product.seller.name}</p>)}
            {selectedVariations && Object.keys(selectedVariations).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-1">{Object.entries(selectedVariations).map(([key, value]) => (<Badge key={key} variant="secondary" className="text-xs">{key}: {value}</Badge>))}</div>
            )}
            <div className="flex flex-wrap gap-2 mt-2">
              {product.isPrime && (<Badge className="badge-prime text-xs">Prime</Badge>)}
              {product.isFreeShipping && (<Badge variant="secondary" className="bg-success/10 text-success border-success/20 text-xs">{t('cartItem.freeShipping')}</Badge>)}
              {product.stock <= 5 && product.stock > 0 && (<Badge variant="destructive" className="text-xs">{t('cartItem.onlyLeft')} {product.stock} {t('cartItem.left')}</Badge>)}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="flex items-baseline gap-2 md:justify-end">
              <span className="text-lg font-bold text-foreground">{formatPrice(product.price * quantity)}</span>
              {hasDiscount && product.originalPrice && (<span className="text-sm text-muted-foreground line-through">{formatPrice(product.originalPrice * quantity)}</span>)}
            </div>
            {hasDiscount && (<Badge className="badge-flash text-xs mt-1">{product.discount}% OFF</Badge>)}
            {savings > 0 && (<p className="text-xs text-success mt-1">{t('cartItem.youSave')} {formatPrice(savings)}</p>)}
          </div>
        </div>
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <QuantitySelector value={quantity} onChange={(newQty) => updateQuantity(product.id, newQty, selectedVariations)} max={product.stock || 99} size="sm" />
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-accent"><Heart className="h-4 w-4 mr-1" /><span className="hidden sm:inline">{t('cartItem.save')}</span></Button>
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => removeItem(product.id, selectedVariations)}><Trash2 className="h-4 w-4 mr-1" /><span className="hidden sm:inline">{t('cartItem.remove')}</span></Button>
          </div>
        </div>
      </div>
    </div>
  );
};
