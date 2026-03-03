import { useState } from 'react';
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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CheckoutFormData {
  // Shipping
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
  // Payment
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [appliedCouponId, setAppliedCouponId] = useState<string | null>(null);

  const form = useForm<CheckoutFormData>({
    defaultValues: {
      country: 'US',
      paymentMethod: 'card',
      saveAddress: false,
    },
  });

  const paymentMethod = form.watch('paymentMethod');
  const codFee = paymentMethod === 'cod' ? 0.50 : 0;

  const onSubmit = async (data: CheckoutFormData) => {
    setIsProcessing(true);
    
    try {
      // Generate order number
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      // Calculate totals
      const subtotal = getSubtotal();
      const shipping = getShipping();
      const tax = getTax();
      const total = getTotal() + codFee - promoDiscount;

      // Save order to database if user is authenticated
      if (user) {
        const shippingAddress = {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          address: data.address,
          apartment: data.apartment,
          city: data.city,
          state: data.state,
          zipCode: data.zipCode,
          country: data.country,
        };

        // Create order
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .insert({
            user_id: user.id,
            order_number: orderNumber,
            status: 'pending',
            subtotal,
            shipping,
            tax,
            discount: promoDiscount,
            total,
            payment_method: data.paymentMethod,
            shipping_address: shippingAddress,
          })
          .select()
          .single();

        if (orderError) {
          console.error('Error creating order:', orderError);
          toast.error('Failed to create order. Please try again.');
          setIsProcessing(false);
          return;
        }

        // Create order items
        const orderItems = items.map(item => ({
          order_id: orderData.id,
          product_id: item.product.id,
          product_name: item.product.name,
          product_image: item.product.images[0] || null,
          price: item.product.price,
          quantity: item.quantity,
          variations: item.selectedVariations || null,
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) {
          console.error('Error creating order items:', itemsError);
        }

        // Record coupon usage
        if (appliedCouponId && orderData) {
          await supabase.from('coupon_usage').insert({
            coupon_id: appliedCouponId,
            user_id: user.id,
            order_id: orderData.id,
            discount_amount: promoDiscount,
          });
          // Increment used_count
          await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' }); // dummy - we'll update directly
          await supabase.from('coupons').update({ used_count: (await supabase.from('coupons').select('used_count').eq('id', appliedCouponId).single()).data?.used_count + 1 || 1 }).eq('id', appliedCouponId);
        }

        // Update user profile with shipping address if they opted to save it
        if (data.saveAddress) {
          await supabase
            .from('profiles')
            .update({
              first_name: data.firstName,
              last_name: data.lastName,
              phone: data.phone,
              address: data.address,
              apartment: data.apartment,
              city: data.city,
              state: data.state,
              zip_code: data.zipCode,
              country: data.country,
            })
            .eq('user_id', user.id);
        }
      }

      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      setOrderId(orderNumber);
      
      // Clear cart and show success
      clearCart();
      setOrderComplete(true);
      
      toast.success('Order placed successfully!', {
        description: `Order ID: ${orderNumber}`,
      });
    } catch (err) {
      console.error('Checkout error:', err);
      toast.error('An error occurred during checkout. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Redirect to cart if empty
  if (items.length === 0 && !orderComplete) {
    return (
      <Layout>
        <div className="container-main py-12">
          <div className="max-w-md mx-auto text-center space-y-6">
            <h1 className="text-2xl font-bold text-foreground">Your cart is empty</h1>
            <p className="text-muted-foreground">
              Add some items to your cart before checking out.
            </p>
            <Button variant="accent" size="lg" asChild>
              <Link to="/">Start Shopping</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  // Order Complete State
  if (orderComplete) {
    return (
      <Layout>
        <div className="container-main py-12">
          <div className="max-w-lg mx-auto text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-success/20 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-success" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Order Confirmed!</h1>
            <p className="text-muted-foreground">
              Thank you for your purchase. Your order has been placed successfully.
            </p>
            
            <div className="p-6 bg-card border border-border rounded-lg text-left space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order Number</span>
                <span className="font-mono font-bold text-foreground">{orderId}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estimated Delivery</span>
                <span className="font-medium text-foreground">3-5 Business Days</span>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              A confirmation email has been sent to your email address.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="outline" asChild>
                <Link to={`/orders/${orderId}`}>Track Order</Link>
              </Button>
              <Button variant="accent" asChild>
                <Link to="/">Continue Shopping</Link>
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-main py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-accent transition-colors">Home</Link>
          <ChevronRight className="h-4 w-4" />
          <Link to="/cart" className="hover:text-accent transition-colors">Cart</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">Checkout</span>
        </nav>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Checkout</h1>
          <Button variant="ghost" asChild>
            <Link to="/cart">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Cart
            </Link>
          </Button>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form Sections */}
            <div className="lg:col-span-2 space-y-8">
              {/* Shipping */}
              <div className="bg-card border border-border rounded-lg p-6">
                <ShippingForm form={form} />
              </div>

              {/* Payment */}
              <div className="bg-card border border-border rounded-lg p-6">
                <PaymentMethods form={form} />
              </div>

              {/* Place Order Button - Mobile */}
              <div className="lg:hidden">
                <Button
                  type="submit"
                  variant="buy-now"
                  size="xl"
                  className="w-full"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <div className="h-5 w-5 border-2 border-accent-foreground border-t-transparent rounded-full animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Lock className="h-5 w-5 mr-2" />
                      Place Order - ${(getTotal() + codFee).toFixed(2)}
                    </>
                  )}
                </Button>
                <p className="text-xs text-center text-muted-foreground mt-3">
                  By placing your order, you agree to our Terms of Service and Privacy Policy
                </p>
              </div>
            </div>

            {/* Order Summary */}
            <div className="space-y-4">
              <OrderSummary codFee={codFee} />
              
              {/* Place Order Button - Desktop */}
              <div className="hidden lg:block space-y-3">
                <Button
                  type="submit"
                  variant="buy-now"
                  size="xl"
                  className="w-full"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <div className="h-5 w-5 border-2 border-accent-foreground border-t-transparent rounded-full animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Lock className="h-5 w-5 mr-2" />
                      Place Order
                    </>
                  )}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  By placing your order, you agree to our Terms of Service and Privacy Policy
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default Checkout;
