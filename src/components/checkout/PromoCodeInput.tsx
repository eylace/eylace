import { useState } from 'react';
import { Tag, X, Loader2, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';

interface PromoCodeInputProps {
  onApply: (discount: number, code: string, couponId: string) => void;
  onRemove: () => void;
  appliedCode: string | null;
  discount: number;
}

export const PromoCodeInput = ({ onApply, onRemove, appliedCode, discount }: PromoCodeInputProps) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { getSubtotal } = useCart();

  const handleApply = async () => {
    if (!code.trim()) return;
    setLoading(true);

    try {
      const { data: coupon, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code.toUpperCase().trim())
        .eq('is_active', true)
        .single();

      if (error || !coupon) {
        toast.error('Invalid promo code');
        setLoading(false);
        return;
      }

      const c = coupon as any;

      // Check expiry
      if (c.expires_at && new Date(c.expires_at) < new Date()) {
        toast.error('This promo code has expired');
        setLoading(false);
        return;
      }

      // Check usage limit
      if (c.usage_limit && c.used_count >= c.usage_limit) {
        toast.error('This promo code has reached its usage limit');
        setLoading(false);
        return;
      }

      // Check min order amount
      const subtotal = getSubtotal();
      if (c.min_order_amount && subtotal < c.min_order_amount) {
        toast.error(`Minimum order amount is $${c.min_order_amount.toFixed(2)}`);
        setLoading(false);
        return;
      }

      // Check if user already used this coupon
      if (user) {
        const { data: usage } = await supabase
          .from('coupon_usage')
          .select('id')
          .eq('coupon_id', c.id)
          .eq('user_id', user.id)
          .limit(1);

        if (usage && usage.length > 0) {
          toast.error('You have already used this promo code');
          setLoading(false);
          return;
        }
      }

      // Calculate discount
      let discountAmount: number;
      if (c.discount_type === 'percentage') {
        discountAmount = subtotal * (c.discount_value / 100);
        if (c.max_discount && discountAmount > c.max_discount) {
          discountAmount = c.max_discount;
        }
      } else {
        discountAmount = c.discount_value;
      }

      discountAmount = Math.min(discountAmount, subtotal);
      onApply(discountAmount, c.code, c.id);
      toast.success(`Promo code applied! You save $${discountAmount.toFixed(2)}`);
    } catch {
      toast.error('Error validating promo code');
    } finally {
      setLoading(false);
    }
  };

  if (appliedCode) {
    return (
      <div className="flex items-center justify-between p-3 bg-success/10 border border-success/20 rounded-lg">
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-success" />
          <span className="text-sm font-medium text-success">
            {appliedCode} — ${discount.toFixed(2)} off
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={onRemove} className="h-7 w-7 p-0">
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Enter promo code"
          className="pl-9"
          onKeyDown={(e) => e.key === 'Enter' && handleApply()}
        />
      </div>
      <Button variant="outline" onClick={handleApply} disabled={loading || !code.trim()}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
      </Button>
    </div>
  );
};
