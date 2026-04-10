import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { CheckCircle2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CheckoutClassic } from '@/components/checkout/CheckoutClassic';
import { CheckoutModern } from '@/components/checkout/CheckoutModern';
import { CheckoutMinimal } from '@/components/checkout/CheckoutMinimal';
import { CheckoutExpress } from '@/components/checkout/CheckoutExpress';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWebsiteSetup } from '@/hooks/useWebsiteSetup';
import { supabase } from '@/integrations/supabase/client';
import { CartItem } from '@/types';
import { clearBuyNowCheckout, getBuyNowCheckoutItems, setBuyNowCheckoutItems } from '@/lib/checkoutSession';
import { toast } from 'sonner';
import { CodOtpVerificationModal } from '@/components/checkout/CodOtpVerificationModal';

interface CheckoutFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  apartment?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  saveAddress: boolean;
  paymentMethod: string;
  deliveryZone?: string;
  shippingCharge?: number;
  cardNumber?: string;
  cardName?: string;
  cardExpiry?: string;
  cardCvv?: string;
}

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { items: cartItems, clearCart, updateQuantity, removeItem } = useCart();
  const { user } = useAuth();
  const { t } = useLanguage();
  const websiteSetup = useWebsiteSetup();
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [showCodOtp, setShowCodOtp] = useState(false);
  const [pendingCodData, setPendingCodData] = useState<CheckoutFormData | null>(null);
  const [appliedCouponId, setAppliedCouponId] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(15);
  const [buyNowItems, setBuyNowItems] = useState<CartItem[]>(() => getBuyNowCheckoutItems());

  // Session-based incomplete order tracking
  const sessionIdRef = useRef<string>(crypto.randomUUID());
  const incompleteIdRef = useRef<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const form = useForm<CheckoutFormData>({
    defaultValues: {
      country: 'BD',
      paymentMethod: 'card',
      saveAddress: false,
    },
  });

  const variantId = websiteSetup.selectedCheckout || 'classic';
  const paymentMethod = form.watch('paymentMethod');
  const watchedShippingCharge = form.watch('shippingCharge');
  const checkoutSource = useMemo(() => new URLSearchParams(location.search).get('source') ?? 'cart', [location.search]);
  const isBuyNowMode = checkoutSource === 'buy-now';
  const checkoutItems = isBuyNowMode ? buyNowItems : cartItems;

  useEffect(() => {
    if (isBuyNowMode) {
      setBuyNowItems(getBuyNowCheckoutItems());
      return;
    }

    clearBuyNowCheckout();
    setBuyNowItems([]);
  }, [isBuyNowMode]);

  const getVariationKey = useCallback((selectedVariations?: Record<string, string>) => {
    if (!selectedVariations) return '';

    return Object.entries(selectedVariations)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join('|');
  }, []);

  const persistBuyNowItems = useCallback((nextItems: CartItem[]) => {
    setBuyNowItems(nextItems);

    if (nextItems.length > 0) {
      setBuyNowCheckoutItems(nextItems);
      return;
    }

    clearBuyNowCheckout();
  }, []);

  const handleCheckoutQuantityChange = useCallback((productId: string, quantity: number, selectedVariations?: Record<string, string>) => {
    if (!isBuyNowMode) {
      updateQuantity(productId, quantity, selectedVariations);
      return;
    }

    if (quantity <= 0) {
      const variationKey = getVariationKey(selectedVariations);
      const nextItems = buyNowItems.filter((item) => !(item.product.id === productId && getVariationKey(item.selectedVariations) === variationKey));
      persistBuyNowItems(nextItems);
      return;
    }

    const variationKey = getVariationKey(selectedVariations);
    const nextItems = buyNowItems.map((item) => (
      item.product.id === productId && getVariationKey(item.selectedVariations) === variationKey
        ? { ...item, quantity }
        : item
    ));

    persistBuyNowItems(nextItems);
  }, [isBuyNowMode, updateQuantity, buyNowItems, getVariationKey, persistBuyNowItems]);

  const handleCheckoutItemRemove = useCallback((productId: string, selectedVariations?: Record<string, string>) => {
    if (!isBuyNowMode) {
      removeItem(productId, selectedVariations);
      return;
    }

    const variationKey = getVariationKey(selectedVariations);
    const nextItems = buyNowItems.filter((item) => !(item.product.id === productId && getVariationKey(item.selectedVariations) === variationKey));
    persistBuyNowItems(nextItems);
  }, [isBuyNowMode, removeItem, buyNowItems, getVariationKey, persistBuyNowItems]);

  const itemCount = useMemo(() => checkoutItems.reduce((total, item) => total + item.quantity, 0), [checkoutItems]);
  const subtotal = useMemo(() => checkoutItems.reduce((total, item) => total + item.product.price * item.quantity, 0), [checkoutItems]);
  const defaultShipping = useMemo(() => {
    if (subtotal >= 50 || checkoutItems.some((item) => item.product.isFreeShipping)) {
      return 0;
    }

    return 5.99;
  }, [subtotal, checkoutItems]);
  const taxAmount = useMemo(() => subtotal * 0.08, [subtotal]);

  const getCheckoutPricing = (selectedPaymentMethod: string, couponDiscount: number, shippingChargeOverride?: number) => {
    const normalizedPaymentMethod = (selectedPaymentMethod || '').toLowerCase();
    const isCashOnDelivery = normalizedPaymentMethod === 'cod' || normalizedPaymentMethod === 'cash';
    const expressShippingCharge = Number(shippingChargeOverride ?? watchedShippingCharge);
    const shipping = variantId === 'express' && Number.isFinite(expressShippingCharge)
      ? expressShippingCharge
      : defaultShipping;
    const tax = variantId === 'express' ? 0 : taxAmount;
    const codFee = isCashOnDelivery ? 0.5 : 0;
    const baseTotal = Math.max(0, subtotal + shipping + tax + codFee - couponDiscount);
    const onlinePaymentDiscount = !isCashOnDelivery && websiteSetup.prepaymentOfferEnabled
      ? Number(((baseTotal * (Number(websiteSetup.prepaymentOfferPercent) || 0)) / 100).toFixed(2))
      : 0;

    return {
      subtotal,
      shipping,
      tax,
      codFee,
      onlinePaymentDiscount,
      totalDiscount: couponDiscount + onlinePaymentDiscount,
      total: Math.max(0, Number((baseTotal - onlinePaymentDiscount).toFixed(2))),
    };
  };

  const pricing = getCheckoutPricing(paymentMethod, promoDiscount, watchedShippingCharge);
  const { codFee, onlinePaymentDiscount } = pricing;
  const customization = useMemo(() => {
    const defaults = {
      headingText: 'Checkout', buttonText: 'Place Order', processingText: 'Processing...',
      termsText: 'By placing this order, you agree to our Terms & Conditions',
      showPromoCode: true, showTrustBadges: true, showBreadcrumb: true, showBackButton: true, showSSLBadge: true,
      buttonBgColor: '', buttonTextColor: '', cardBorderRadius: '12',
      trustBadge1Title: 'Secure Payment', trustBadge1Desc: '100% Safe & Secure',
      trustBadge2Title: 'Fast Delivery', trustBadge2Desc: '2-5 Business Days',
      trustBadge3Title: 'Easy Returns', trustBadge3Desc: '7 Days Return Policy',
    };
    return { ...defaults, ...(websiteSetup.checkoutCustomization?.[variantId] || {}) };
  }, [websiteSetup.checkoutCustomization, variantId]);

  // Build enriched cart items with product_id, image, variation
  const buildEnrichedCartItems = useCallback(() => {
    return checkoutItems.map(i => ({
      product_id: i.product.id,
      name: i.product.name,
      qty: i.quantity,
      price: i.product.price,
      image: i.product.images?.[0] || null,
      variation: i.selectedVariations || null,
    }));
  }, [checkoutItems]);

  // Save or update incomplete order
  const saveIncompleteOrder = useCallback(async (data: Partial<CheckoutFormData>) => {
    if (!data.firstName && !data.phone && !data.email) return;

    const currentPricing = getCheckoutPricing(
      data.paymentMethod || form.getValues('paymentMethod') || paymentMethod,
      promoDiscount,
      data.shippingCharge ?? form.getValues('shippingCharge')
    );

    const payload = {
      session_id: sessionIdRef.current,
      user_id: user?.id || null,
      first_name: data.firstName || null,
      last_name: data.lastName || null,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null,
      city: data.city || null,
      state: data.state || null,
      zip_code: data.zipCode || null,
      country: data.country || null,
      cart_items: buildEnrichedCartItems(),
      cart_total: currentPricing.total,
      status: 'abandoned',
    };

    try {
      if (incompleteIdRef.current) {
        // Update existing record
        await (supabase.from('incomplete_orders') as any)
          .update({ ...payload, updated_at: new Date().toISOString() } as any)
          .eq('id', incompleteIdRef.current)
          .setHeader('x-session-id', sessionIdRef.current);
      } else {
        // Insert new record
        const { data: inserted } = await (supabase.from('incomplete_orders') as any)
          .insert(payload as any)
          .select('id')
          .single()
          .setHeader('x-session-id', sessionIdRef.current);
        if (inserted?.id) {
          incompleteIdRef.current = inserted.id;
        }
      }
    } catch (err) {
      console.error('Failed to save incomplete order:', err);
    }
  }, [user, buildEnrichedCartItems, form, paymentMethod, promoDiscount]);

  // Debounced form watcher — saves incomplete order 3s after last change
  useEffect(() => {
    const subscription = form.watch((data) => {
      if (data.firstName || data.phone || data.email) {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          saveIncompleteOrder(data as Partial<CheckoutFormData>);
        }, 3000);
      }
    });
    return () => {
      subscription.unsubscribe();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [form, saveIncompleteOrder]);

  // Save on page unload (beforeunload)
  useEffect(() => {
    const handleBeforeUnload = () => {
      const data = form.getValues();
      if (data.firstName || data.phone || data.email) {
        const currentPricing = getCheckoutPricing(data.paymentMethod, promoDiscount, data.shippingCharge);
        const payload = {
          session_id: sessionIdRef.current,
          user_id: user?.id || null,
          first_name: data.firstName || null,
          last_name: data.lastName || null,
          email: data.email || null,
          phone: data.phone || null,
          address: data.address || null,
          city: data.city || null,
          state: data.state || null,
          zip_code: data.zipCode || null,
          country: data.country || null,
          cart_items: buildEnrichedCartItems(),
          cart_total: currentPricing.total,
          status: 'abandoned',
        };

        // Use sendBeacon for reliable last-chance save
        const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/incomplete_orders`;
        const beaconHeaders = {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          'Prefer': 'return=minimal',
          'x-session-id': sessionIdRef.current,
        };

        if (incompleteIdRef.current) {
          // Can't PATCH with sendBeacon, just ensure we saved via debounce
        } else {
          // sendBeacon doesn't support custom headers via Blob, use fetch keepalive instead
          try {
            fetch(url, {
              method: 'POST',
              headers: beaconHeaders,
              body: JSON.stringify(payload),
              keepalive: true,
            });
          } catch {
            // Best effort
          }
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [form, user, buildEnrichedCartItems, promoDiscount]);

  // Cleanup incomplete order after successful purchase
  const cleanupIncompleteOrder = useCallback(async () => {
    try {
      if (incompleteIdRef.current) {
        await (supabase.from('incomplete_orders') as any)
          .delete()
          .eq('id', incompleteIdRef.current)
          .setHeader('x-session-id', sessionIdRef.current);
      }
      // Also clean up any other records for this user
      if (user?.id) {
        await (supabase.from('incomplete_orders') as any).delete().eq('user_id', user.id);
      }
    } catch (err) {
      console.error('Failed to cleanup incomplete order:', err);
    }
  }, [user]);

  useEffect(() => {
    if (!orderComplete) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [orderComplete, navigate]);

  const processOrder = async (data: CheckoutFormData) => {
    setIsProcessing(true);
    try {
      // Pre-checkout stock validation
      if (user) {
        const productIds = checkoutItems.map(i => i.product.id);
        const { data: stockData } = await supabase
          .from('products')
          .select('id, name, stock')
          .in('id', productIds);
        if (stockData) {
          for (const item of checkoutItems) {
            const dbItem = stockData.find(p => p.id === item.product.id);
            if (dbItem && (dbItem.stock ?? 0) < item.quantity) {
              toast.error(`"${dbItem.name}" has only ${dbItem.stock ?? 0} items in stock`);
              setIsProcessing(false);
              return;
            }
          }
        }
      }
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      const {
        subtotal,
        shipping,
        tax,
        total,
        totalDiscount,
      } = getCheckoutPricing(data.paymentMethod, promoDiscount, data.shippingCharge);
      let createdOrderId: string | null = null;

      if (user) {
        const shippingAddress = {
          firstName: data.firstName, lastName: data.lastName, email: data.email,
          phone: data.phone, address: data.address, apartment: data.apartment,
          city: data.city, state: data.state, zipCode: data.zipCode, country: data.country,
        };

        const { data: orderData, error: orderError } = await supabase
          .from('orders').insert({
            user_id: user.id, order_number: orderNumber, status: 'pending',
            subtotal, shipping, tax, discount: totalDiscount, total,
            payment_method: data.paymentMethod, shipping_address: shippingAddress,
          }).select().single();

        if (orderError) {
          toast.error('Failed to create order. Please try again.');
          setIsProcessing(false);
          return;
        }

        createdOrderId = orderData.id;

        const orderItems = checkoutItems.map(item => ({
          order_id: orderData.id, product_id: item.product.id, product_name: item.product.name,
          product_image: item.product.images[0] || null, price: item.product.price,
          quantity: item.quantity, variations: item.selectedVariations || null,
        }));
        await supabase.from('order_items').insert(orderItems);

        if (appliedCouponId && orderData) {
          await supabase.functions.invoke('apply-coupon', {
            body: { coupon_id: appliedCouponId, order_id: orderData.id, discount_amount: promoDiscount },
          });
        }

        if (data.saveAddress) {
          await supabase.from('profiles').update({
            first_name: data.firstName, last_name: data.lastName, phone: data.phone,
            address: data.address, apartment: data.apartment, city: data.city,
            state: data.state, zip_code: data.zipCode, country: data.country,
          }).eq('user_id', user.id);
        }
      }

      // Cleanup incomplete order for both guest and logged-in
      await cleanupIncompleteOrder();

      await new Promise(resolve => setTimeout(resolve, 1000));
      setOrderId(orderNumber);
      if (isBuyNowMode) {
        clearBuyNowCheckout();
        setBuyNowItems([]);
      } else {
        clearCart();
      }
      setOrderComplete(true);
      toast.success(t('checkout.orderSuccess'), { description: `Order ID: ${orderNumber}` });

      // Record affiliate conversion if referral code exists
      const storedRef = localStorage.getItem('affiliate_ref');
      if (storedRef && createdOrderId) {
        try {
          const refData = JSON.parse(storedRef);
          if (refData.code && refData.expiry > Date.now()) {
            fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/affiliate-manage?action=record-conversion`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
              body: JSON.stringify({ referral_code: refData.code, order_id: createdOrderId, order_total: total }),
            }).catch(() => {});
            localStorage.removeItem('affiliate_ref');
          }
        } catch {}
      }

      // Send auto confirmation email (non-blocking)
      if (user && createdOrderId) {
        supabase.functions.invoke('send-order-confirmation', {
          body: { order_id: createdOrderId },
        }).catch(err => console.error('Confirmation email error:', err));
      }
    } catch (err) {
      console.error('Checkout error:', err);
      toast.error('An error occurred during checkout. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (checkoutItems.length === 0 && !orderComplete) {
    return (
      <Layout>
        <div className="container-main py-12">
          <div className="max-w-md mx-auto text-center space-y-6">
            <h1 className="text-2xl font-bold text-foreground">{t('checkout.emptyCart')}</h1>
            <p className="text-muted-foreground">{t('checkout.emptyCartDesc')}</p>
            <Button variant="accent" size="lg" asChild><Link to="/">{t('checkout.startShopping')}</Link></Button>
          </div>
        </div>
      </Layout>
    );
  }

  if (orderComplete) {
    return (
      <Layout>
        <div className="container-main py-12">
          <div className="max-w-lg mx-auto text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-success/20 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-success" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">{t('checkout.orderConfirmed')}</h1>
            <p className="text-muted-foreground">{t('checkout.orderThankYou')}</p>
            <div className="p-6 bg-card border border-border rounded-lg text-left space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('checkout.orderNumber')}</span>
                <span className="font-mono font-bold text-foreground">{orderId}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('checkout.estimatedDelivery')}</span>
                <span className="font-medium text-foreground">{t('checkout.businessDays')}</span>
              </div>
            </div>
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
              <p className="text-sm text-muted-foreground">
                <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground font-bold text-lg mx-1">
                  {countdown}
                </span>
                {t('checkout.autoRedirect')}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">{t('checkout.confirmationEmail')}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="outline" asChild><Link to="/orders">{t('checkout.trackOrder')}</Link></Button>
              <Button variant="accent" asChild><Link to="/">{t('checkout.continueShopping')}</Link></Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const promoProps = {
    onApplyPromo: (d: number, c: string, cid: string) => { setPromoDiscount(d); setAppliedCode(c); setAppliedCouponId(cid); },
    onRemovePromo: () => { setPromoDiscount(0); setAppliedCode(null); setAppliedCouponId(null); },
  };

  const onSubmit = (data: CheckoutFormData) => {
    const pm = (data.paymentMethod || '').toLowerCase();
    if (pm === 'cod' || pm === 'cash') {
      if (!data.phone) {
        toast.error('COD অর্ডারের জন্য ফোন নম্বর দিন');
        return;
      }
      setPendingCodData(data);
      setShowCodOtp(true);
      return;
    }
    processOrder(data);
  };

  const handleCodOtpVerified = () => {
    setShowCodOtp(false);
    if (pendingCodData) {
      processOrder(pendingCodData);
      setPendingCodData(null);
    }
  };



  const layoutProps = {
    form, onSubmit, isProcessing, items: checkoutItems, itemCount, subtotal: pricing.subtotal, shipping: pricing.shipping, tax: pricing.tax, total: pricing.total, isBuyNowMode, onUpdateQuantity: handleCheckoutQuantityChange, onRemoveItem: handleCheckoutItemRemove, codFee, promoDiscount, onlinePaymentDiscount, appliedCode,
    customization,
    ...promoProps,
  };

  const renderCheckoutLayout = () => {
    switch (variantId) {
      case 'modern': return <CheckoutModern {...layoutProps} />;
      case 'minimal': return <CheckoutMinimal {...layoutProps} />;
      case 'express': return <CheckoutExpress {...layoutProps} />;
      case 'classic':
      default: return <CheckoutClassic {...layoutProps} />;
    }
  };

  return (
    <Layout>
      {renderCheckoutLayout()}
    </Layout>
  );
};

export default Checkout;
