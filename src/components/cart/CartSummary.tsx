import { Link } from 'react-router-dom';
import { ShoppingBag, Truck, Shield, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/contexts/CartContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useState } from 'react';
import { toast } from 'sonner';

interface CartSummaryProps {
  showCheckoutButton?: boolean;
}

export const CartSummary = ({ showCheckoutButton = true }: CartSummaryProps) => {
  const { getSubtotal, getShipping, getTax, getTotal, getItemCount } = useCart();
  const { formatPrice } = useCurrency();
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);

  const subtotal = getSubtotal();
  const shipping = getShipping();
  const tax = getTax();
  const total = getTotal();
  const itemCount = getItemCount();

  const handleApplyPromo = () => {
    if (!promoCode.trim()) {
      toast.error('Please enter a promo code');
      return;
    }
    // Demo promo code
    if (promoCode.toUpperCase() === 'SAVE10') {
      setAppliedPromo(promoCode.toUpperCase());
      toast.success('Promo code applied!', {
        description: '10% discount applied to your order',
      });
    } else {
      toast.error('Invalid promo code');
    }
    setPromoCode('');
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-6 lg:sticky lg:top-24">
      <h2 className="text-lg font-bold text-foreground">Order Summary</h2>

      {/* Promo Code */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <Input
            placeholder="Promo code"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            className="flex-1"
          />
          <Button variant="outline" onClick={handleApplyPromo}>
            Apply
          </Button>
        </div>
        {appliedPromo && (
          <div className="flex items-center gap-2 text-sm text-success">
            <Tag className="h-4 w-4" />
            <span>{appliedPromo} applied</span>
            <button 
              className="text-muted-foreground hover:text-destructive ml-auto"
              onClick={() => setAppliedPromo(null)}
            >
              Remove
            </button>
          </div>
        )}
      </div>

      <Separator />

      {/* Price Breakdown */}
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})
          </span>
          <span className="font-medium text-foreground">{formatPrice(subtotal)}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Shipping</span>
          {shipping === 0 ? (
            <span className="font-medium text-success">FREE</span>
          ) : (
            <span className="font-medium text-foreground">${shipping.toFixed(2)}</span>
          )}
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Estimated Tax</span>
          <span className="font-medium text-foreground">${tax.toFixed(2)}</span>
        </div>

        {appliedPromo && (
          <div className="flex justify-between text-sm text-success">
            <span>Promo Discount</span>
            <span>-${(subtotal * 0.1).toFixed(2)}</span>
          </div>
        )}

        <Separator />

        <div className="flex justify-between">
          <span className="text-lg font-bold text-foreground">Total</span>
          <span className="text-xl font-bold text-foreground">
            ${(appliedPromo ? total * 0.9 : total).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Checkout Button */}
      {showCheckoutButton && (
        <Button 
          variant="buy-now" 
          size="xl" 
          className="w-full"
          asChild
        >
          <Link to="/checkout">
            <ShoppingBag className="h-5 w-5 mr-2" />
            Proceed to Checkout
          </Link>
        </Button>
      )}

      {/* Trust Signals */}
      <div className="space-y-3 pt-4 border-t border-border">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Truck className="h-5 w-5 text-accent shrink-0" />
          <span>Free shipping on orders over $50</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Shield className="h-5 w-5 text-accent shrink-0" />
          <span>Secure checkout with SSL encryption</span>
        </div>
      </div>
    </div>
  );
};
