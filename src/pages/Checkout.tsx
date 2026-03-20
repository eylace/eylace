import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ChevronRight, ArrowLeft, Lock, CheckCircle2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ShippingForm } from '@/components/checkout/ShippingForm';
import { PaymentMethods } from '@/components/checkout/PaymentMethods';
import { OrderSummary } from '@/components/checkout/OrderSummary';
import { PromoCodeInput } from '@/components/checkout/PromoCodeInput';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  cardNumber?: string;
  cardName?: string;
  cardExpiry?: string;
  cardCvv?: string;
}

const Checkout = () => {
  const navigate = useNavigate();
  const { items, clearCart, getSubtotal, getShipping, getTax, getTotal } = useCart();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [appliedCouponId, setAppliedCouponId] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(15);

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

  const paymentMethod = form.watch('paymentMethod');
  const codFee = paymentMethod === 'cod' ? 0.50 : 0;

  // Build enriched cart items with product_id, image, variation
  const buildEnrichedCartItems = useCallback(() => {
    return items.map(i => ({
      product_id: i.product.id,
      name: i.product.name,
      qty: i.quantity,
      price: i.product.price,
      image: i.product.images?.[0] || null,
      variation: i.selectedVariations || null,
    }));
  }, [items]);

  // Save or update incomplete order
  const saveIncompleteOrder = useCallback(async (data: Partial<CheckoutFormData>) => {
    if (!data.firstName && !data.phone && !data.email) return;

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
      cart_total: getTotal(),
      status: 'abandoned',
    };

    try {
      if (incompleteIdRef.current) {
        // Update existing record
        await (supabase.from('incomplete_orders') as any)
          .update({ ...payload, updated_at: new Date().toISOString() } as any)
          .eq('id', incompleteIdRef.current);
      } else {
        // Insert new record
        const { data: inserted } = await (supabase.from('incomplete_orders') as any)
          .insert(payload as any)
          .select('id')
          .single();
        if (inserted?.id) {
          incompleteIdRef.current = inserted.id;
        }
      }
    } catch (err) {
      console.error('Failed to save incomplete order:', err);
    }
  }, [user, buildEnrichedCartItems, getTotal]);

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
          cart_total: getTotal(),
          status: 'abandoned',
        };

        // Use sendBeacon for reliable last-chance save
        const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/incomplete_orders`;
        const headers = {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          'Prefer': incompleteIdRef.current ? 'return=minimal' : 'return=minimal',
        };

        if (incompleteIdRef.current) {
          // Can't PATCH with sendBeacon, just ensure we saved via debounce
        } else {
          navigator.sendBeacon(
            url,
            new Blob([JSON.stringify(payload)], { type: 'application/json' })
          );
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [form, user, buildEnrichedCartItems, getTotal]);

  // Cleanup incomplete order after successful purchase
  const cleanupIncompleteOrder = useCallback(async () => {
    try {
      if (incompleteIdRef.current) {
        await (supabase.from('incomplete_orders') as any).delete().eq('id', incompleteIdRef.current);
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

  const onSubmit = async (data: CheckoutFormData) => {
    setIsProcessing(true);
    try {
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      const subtotal = getSubtotal();
      const shipping = getShipping();
      const tax = getTax();
      const total = getTotal() + codFee - promoDiscount;

      if (user) {
        const shippingAddress = {
          firstName: data.firstName, lastName: data.lastName, email: data.email,
          phone: data.phone, address: data.address, apartment: data.apartment,
          city: data.city, state: data.state, zipCode: data.zipCode, country: data.country,
        };

        const { data: orderData, error: orderError } = await supabase
          .from('orders').insert({
            user_id: user.id, order_number: orderNumber, status: 'pending',
            subtotal, shipping, tax, discount: promoDiscount, total,
            payment_method: data.paymentMethod, shipping_address: shippingAddress,
          }).select().single();

        if (orderError) {
          toast.error('Failed to create order. Please try again.');
          setIsProcessing(false);
          return;
        }

        const orderItems = items.map(item => ({
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
      clearCart();
      setOrderComplete(true);
      toast.success(t('checkout.orderSuccess'), { description: `Order ID: ${orderNumber}` });

      // Send auto confirmation email (non-blocking)
      if (user && orderData) {
        supabase.functions.invoke('send-order-confirmation', {
          body: { order_id: orderData.id },
        }).catch(err => console.error('Confirmation email error:', err));
      }
    } catch (err) {
      console.error('Checkout error:', err);
      toast.error('An error occurred during checkout. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0 && !orderComplete) {
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

  return (
    <Layout>
      <div className="container-main py-6">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-accent transition-colors">{t('checkout.home')}</Link>
          <ChevronRight className="h-4 w-4" />
          <Link to="/cart" className="hover:text-accent transition-colors">{t('checkout.cart')}</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{t('checkout.title')}</span>
        </nav>

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">{t('checkout.title')}</h1>
          <Button variant="ghost" asChild>
            <Link to="/cart"><ArrowLeft className="h-4 w-4 mr-2" />{t('checkout.backToCart')}</Link>
          </Button>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-card border border-border rounded-lg p-6"><ShippingForm form={form} /></div>
              <div className="bg-card border border-border rounded-lg p-6"><PaymentMethods form={form} /></div>
              <div className="lg:hidden">
                <Button type="submit" variant="buy-now" size="xl" className="w-full" disabled={isProcessing}>
                  {isProcessing ? (
                    <><div className="h-5 w-5 border-2 border-accent-foreground border-t-transparent rounded-full animate-spin mr-2" />{t('checkout.processing')}</>
                  ) : (
                    <><Lock className="h-5 w-5 mr-2" />{t('checkout.placeOrder')}</>
                  )}
                </Button>
                <p className="text-xs text-center text-muted-foreground mt-3">{t('checkout.termsAgree')}</p>
              </div>
            </div>
            <div className="space-y-4">
              <OrderSummary codFee={codFee} promoDiscount={promoDiscount} />
              <div className="bg-card border border-border rounded-lg p-4">
                <PromoCodeInput
                  onApply={(d, c, cid) => { setPromoDiscount(d); setAppliedCode(c); setAppliedCouponId(cid); }}
                  onRemove={() => { setPromoDiscount(0); setAppliedCode(null); setAppliedCouponId(null); }}
                  appliedCode={appliedCode}
                  discount={promoDiscount}
                />
              </div>
              <div className="hidden lg:block space-y-3">
                <Button type="submit" variant="buy-now" size="xl" className="w-full" disabled={isProcessing}>
                  {isProcessing ? (
                    <><div className="h-5 w-5 border-2 border-accent-foreground border-t-transparent rounded-full animate-spin mr-2" />{t('checkout.processing')}</>
                  ) : (
                    <><Lock className="h-5 w-5 mr-2" />{t('checkout.placeOrder')}</>
                  )}
                </Button>
                <p className="text-xs text-center text-muted-foreground">{t('checkout.termsAgree')}</p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default Checkout;
