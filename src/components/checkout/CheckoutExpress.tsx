import { useEffect, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Phone, ShieldCheck, Loader2, Minus, Plus, Trash2, Smartphone, CreditCard, CheckCircle2 } from 'lucide-react';
import { PaymentMethods } from '@/components/checkout/PaymentMethods';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CartItem } from '@/types';

interface Props {
  form: UseFormReturn<any>;
  onSubmit: (data: any) => void;
  isProcessing: boolean;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
  onUpdateQuantity: (productId: string, quantity: number, selectedVariations?: Record<string, string>) => void;
  onRemoveItem: (productId: string, selectedVariations?: Record<string, string>) => void;
  codFee: number;
  promoDiscount: number;
  onlinePaymentDiscount: number;
  appliedCode: string | null;
  onApplyPromo: (d: number, c: string, cid: string) => void;
  onRemovePromo: () => void;
  customization?: any;
}

const GATEWAY_INFO: Record<string, { label: string; color: string; merchant?: string }> = {
  bkash: { label: 'bKash', color: '#E2136E', merchant: '01XXXXXXXXX' },
  nagad: { label: 'Nagad', color: '#F6A21E', merchant: '01XXXXXXXXX' },
  rocket: { label: 'Rocket', color: '#8C3494', merchant: '01XXXXXXXXX' },
  upay: { label: 'Upay', color: '#00A651', merchant: '01XXXXXXXXX' },
  sslcommerz: { label: 'SSLCommerz', color: '#2B3990' },
  aamarpay: { label: 'AamarPay', color: '#1A73E8' },
  stripe: { label: 'Stripe', color: '#635BFF' },
  paypal: { label: 'PayPal', color: '#003087' },
  razorpay: { label: 'Razorpay', color: '#072654' },
  paystack: { label: 'Paystack', color: '#00C3F7' },
  card: { label: 'Credit/Debit Card', color: '#1a1a2e' },
};

const isCodMethod = (method: string) => ['cod', 'cash'].includes(method?.toLowerCase());
const isMobileBanking = (method: string) => ['bkash', 'nagad', 'rocket', 'upay'].includes(method?.toLowerCase());

export const CheckoutExpress = ({ form, onSubmit, isProcessing, items, subtotal, shipping, total, onUpdateQuantity, onRemoveItem, codFee, promoDiscount, onlinePaymentDiscount, customization = {} }: Props) => {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const { register, formState: { errors }, setValue, handleSubmit } = form;

  const [deliveryZone, setDeliveryZone] = useState('inside_dhaka');
  // OTP states
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<any>(null);
  // Payment gateway states
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [transactionId, setTransactionId] = useState('');

  const deliveryCharge = deliveryZone === 'inside_dhaka' ? 80 : 150;

  useEffect(() => {
    setValue('country', 'BD');
    setValue('deliveryZone', deliveryZone);
    setValue('shippingCharge', deliveryCharge);
  }, [deliveryCharge, deliveryZone, setValue]);

  const handleOrderClick = async (data: any) => {
    const phone = data.phone?.trim();
    if (!phone) { toast.error('ফোন নম্বর দিন'); return; }
    if (!data.firstName?.trim()) { toast.error('আপনার নাম দিন'); return; }
    if (!data.address?.trim()) { toast.error('সম্পূর্ণ ঠিকানা দিন'); return; }

    data.city = deliveryZone === 'inside_dhaka' ? 'Dhaka' : data.city || '';
    data.state = deliveryZone === 'inside_dhaka' ? 'Dhaka' : data.state || '';
    setPendingFormData(data);

    const paymentMethod = data.paymentMethod || form.getValues('paymentMethod') || '';

    if (isCodMethod(paymentMethod)) {
      // COD → OTP verification
      setOtpDialogOpen(true);
      setOtpSending(true);
      setOtpSent(false);
      setOtpValue('');
      try {
        const formattedPhone = phone.startsWith('+') ? phone : `+88${phone.replace(/^0/, '')}`;
        const { error } = await supabase.functions.invoke('send-otp', { body: { phone: formattedPhone } });
        if (error) throw error;
        setOtpSent(true);
        toast.success('OTP পাঠানো হয়েছে');
      } catch {
        toast.error('OTP পাঠাতে ব্যর্থ। আবার চেষ্টা করুন।');
      } finally {
        setOtpSending(false);
      }
    } else {
      // Online payment → Payment Gateway dialog
      setTransactionId('');
      setPaymentDialogOpen(true);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpValue.length < 4) { toast.error('সম্পূর্ণ OTP দিন'); return; }
    setOtpVerifying(true);
    try {
      const phone = pendingFormData.phone.trim();
      const formattedPhone = phone.startsWith('+') ? phone : `+88${phone.replace(/^0/, '')}`;
      const { data: verifyData, error } = await supabase.functions.invoke('verify-otp', {
        body: { phone: formattedPhone, code: otpValue },
      });
      if (error || !verifyData?.success) {
        toast.error(verifyData?.error || 'OTP ভেরিফিকেশন ব্যর্থ');
        return;
      }
      setOtpDialogOpen(false);
      toast.success('ফোন নম্বর ভেরিফাইড ✓');
      onSubmit(pendingFormData);
    } catch {
      toast.error('ভেরিফিকেশনে সমস্যা হয়েছে');
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    setOtpSending(true);
    try {
      const phone = pendingFormData.phone.trim();
      const formattedPhone = phone.startsWith('+') ? phone : `+88${phone.replace(/^0/, '')}`;
      await supabase.functions.invoke('send-otp', { body: { phone: formattedPhone } });
      toast.success('OTP আবার পাঠানো হয়েছে');
    } catch {
      toast.error('আবার পাঠাতে ব্যর্থ');
    } finally {
      setOtpSending(false);
    }
  };

  const handlePaymentConfirm = async () => {
    const method = pendingFormData?.paymentMethod || form.getValues('paymentMethod') || '';
    if (isMobileBanking(method) && !transactionId.trim()) {
      toast.error('ট্রানজেকশন আইডি দিন');
      return;
    }
    setPaymentProcessing(true);
    try {
      // Simulate payment processing delay
      await new Promise(r => setTimeout(r, 1500));
      const finalData = {
        ...pendingFormData,
        transactionId: transactionId.trim() || undefined,
      };
      setPaymentDialogOpen(false);
      toast.success('পেমেন্ট সফল হয়েছে ✓');
      onSubmit(finalData);
    } catch {
      toast.error('পেমেন্ট ব্যর্থ হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setPaymentProcessing(false);
    }
  };

  const selectedPaymentMethod = form.watch('paymentMethod') || '';
  const gwInfo = GATEWAY_INFO[selectedPaymentMethod] || { label: selectedPaymentMethod, color: '#333', merchant: '' };

  return (
    <div className="container-main py-6 md:py-10">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* LEFT — Form */}
        <div className="lg:col-span-3">
          <div className="bg-card border border-border rounded-xl p-6 md:p-8">
            <h1 className="text-lg md:text-xl font-bold text-foreground mb-1">
              অর্ডার কনফার্ম করতে আপনার নাম, ঠিকানা, মোবাইল নাম্বার লিখে অর্ডার কনফার্ম করুন বাটনে ক্লিক করুন
            </h1>
            <Separator className="my-5" />

            <form onSubmit={handleSubmit(handleOrderClick)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-base font-semibold text-foreground">আপনার নাম</Label>
                <Input id="firstName" placeholder="আপনার পূর্ণ নাম লিখুন" {...register('firstName', { required: true })} className={`h-12 text-base ${errors.firstName ? 'border-destructive' : ''}`} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-base font-semibold text-foreground">আপনার মোবাইল নাম্বার</Label>
                <Input id="phone" type="tel" placeholder="01XXXXXXXXX" {...register('phone', { required: true })} className={`h-12 text-base ${errors.phone ? 'border-destructive' : ''}`} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address" className="text-base font-semibold text-foreground">আপনার সম্পূর্ণ ঠিকানা</Label>
                <Textarea id="address" placeholder="বাড়ি নং, রাস্তা, এলাকা, থানা..." rows={3} {...register('address', { required: true })} className={`text-base ${errors.address ? 'border-destructive' : ''}`} />
              </div>

              {/* Delivery Zone */}
              <div className="space-y-3">
                <Label className="text-base font-semibold text-foreground">ডেলিভারি এলাকা নির্বাচন করুন</Label>
                <RadioGroup
                  value={deliveryZone}
                  onValueChange={(val) => {
                    setDeliveryZone(val);
                    setValue('deliveryZone', val);
                    setValue('shippingCharge', val === 'inside_dhaka' ? 80 : 150);
                    if (val === 'inside_dhaka') { setValue('city', 'Dhaka'); setValue('state', 'Dhaka'); }
                    else { setValue('city', ''); setValue('state', ''); }
                  }}
                  className="grid grid-cols-2 gap-4"
                >
                  <Label htmlFor="inside_dhaka" className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${deliveryZone === 'inside_dhaka' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}>
                    <RadioGroupItem value="inside_dhaka" id="inside_dhaka" className="sr-only" />
                    <span className="font-semibold text-foreground">ঢাকার ভিতর</span>
                    <span className="px-6 py-2 rounded-full bg-primary text-primary-foreground font-bold text-sm">{formatPrice(80)}</span>
                  </Label>
                  <Label htmlFor="outside_dhaka" className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${deliveryZone === 'outside_dhaka' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}>
                    <RadioGroupItem value="outside_dhaka" id="outside_dhaka" className="sr-only" />
                    <span className="font-semibold text-foreground">ঢাকার বাহির</span>
                    <span className="px-6 py-2 rounded-full bg-primary text-primary-foreground font-bold text-sm">{formatPrice(150)}</span>
                  </Label>
                </RadioGroup>
              </div>

              <PaymentMethods form={form} />

              <Button type="submit" size="xl" className="w-full rounded-xl text-base bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isProcessing}>
                {isProcessing ? (<><Loader2 className="h-5 w-5 mr-2 animate-spin" />অর্ডার প্রসেস হচ্ছে...</>) : (<><ShieldCheck className="h-5 w-5 mr-2" />অর্ডার কনফার্ম করুন</>)}
              </Button>
            </form>
          </div>
        </div>

        {/* RIGHT — Order Details */}
        <div className="lg:col-span-2">
          <div className="bg-card border border-border rounded-xl p-5 lg:sticky lg:top-24">
            <h2 className="text-lg font-bold text-foreground mb-4">অর্ডার ডিটেইলস</h2>
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="grid grid-cols-[60px_1fr_80px_60px_80px_30px] gap-1 items-center bg-secondary/50 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">
                <span>Image</span><span>Product</span><span className="text-right">Price</span><span className="text-center">Qty</span><span className="text-right">Total</span><span></span>
              </div>
              <div className="divide-y divide-border">
                {items.map((item, idx) => (
                  <div key={`${item.product.id}-${idx}`} className="grid grid-cols-[60px_1fr_80px_60px_80px_30px] gap-1 items-center px-3 py-3">
                    <img src={item.product.images?.[0] || '/placeholder.svg'} alt={item.product.name} className="w-12 h-12 rounded-lg object-cover border border-border" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground line-clamp-2 leading-tight">{item.product.name}</p>
                      {item.selectedVariations && Object.entries(item.selectedVariations).map(([k, v]) => (
                        <Badge key={k} variant="secondary" className="text-[10px] mt-1 mr-1">{k}: {v}</Badge>
                      ))}
                    </div>
                    <span className="text-sm font-semibold text-foreground text-right">৳{item.product.price.toLocaleString()}</span>
                    <div className="flex items-center justify-center gap-0.5">
                      <button type="button" onClick={() => onUpdateQuantity(item.product.id, Math.max(1, item.quantity - 1), item.selectedVariations)} className="h-6 w-6 rounded border border-border flex items-center justify-center hover:bg-secondary"><Minus className="h-3 w-3" /></button>
                      <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                      <button type="button" onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1, item.selectedVariations)} className="h-6 w-6 rounded border border-border flex items-center justify-center hover:bg-secondary"><Plus className="h-3 w-3" /></button>
                    </div>
                    <span className="text-sm font-bold text-foreground text-right">৳{(item.product.price * item.quantity).toLocaleString()}</span>
                    <button type="button" onClick={() => onRemoveItem(item.product.id, item.selectedVariations)} className="h-6 w-6 rounded-full bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive/20"><Trash2 className="h-3 w-3" /></button>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground font-semibold">Subtotal:</span><span className="font-semibold text-foreground">{formatPrice(subtotal)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground font-semibold">Delivery Charge:</span><span className="font-semibold text-foreground">{formatPrice(shipping)}</span></div>
              {promoDiscount > 0 && (<div className="flex justify-between text-sm text-success"><span className="font-semibold">Discount:</span><span className="font-semibold">-{formatPrice(promoDiscount)}</span></div>)}
              {onlinePaymentDiscount > 0 && (<div className="flex justify-between text-sm text-success"><span className="font-semibold">অনলাইন পেমেন্ট ছাড়:</span><span className="font-semibold">-{formatPrice(onlinePaymentDiscount)}</span></div>)}
              {codFee > 0 && (<div className="flex justify-between text-sm text-warning"><span className="font-semibold">COD Fee:</span><span className="font-semibold">+{formatPrice(codFee)}</span></div>)}
              <Separator />
              <div className="flex justify-between"><span className="text-lg font-bold text-foreground">Total:</span><span className="text-xl font-bold text-foreground">{formatPrice(total)}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* OTP Dialog — for COD orders */}
      <Dialog open={otpDialogOpen} onOpenChange={setOtpDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Phone className="h-5 w-5 text-primary" />ফোন নম্বর ভেরিফাই করুন</DialogTitle>
            <DialogDescription>আপনার ফোন নম্বর <strong className="text-foreground">{pendingFormData?.phone}</strong>-এ একটি OTP পাঠানো হয়েছে।</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-6 py-4">
            {otpSending && !otpSent ? (
              <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" />OTP পাঠানো হচ্ছে...</div>
            ) : (
              <>
                <InputOTP maxLength={6} value={otpValue} onChange={setOtpValue}>
                  <InputOTPGroup>{[0,1,2,3,4,5].map(i => <InputOTPSlot key={i} index={i} />)}</InputOTPGroup>
                </InputOTP>
                <Button onClick={handleVerifyOtp} disabled={otpVerifying || otpValue.length < 4} className="w-full" size="lg">
                  {otpVerifying ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />ভেরিফাই হচ্ছে...</> : 'ভেরিফাই করুন'}
                </Button>
                <button type="button" onClick={handleResendOtp} disabled={otpSending} className="text-sm text-primary hover:underline disabled:opacity-50">
                  {otpSending ? 'পাঠানো হচ্ছে...' : 'আবার OTP পাঠান'}
                </button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Gateway Dialog — for Online Payment orders */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isMobileBanking(selectedPaymentMethod) ? <Smartphone className="h-5 w-5" style={{ color: gwInfo.color }} /> : <CreditCard className="h-5 w-5" style={{ color: gwInfo.color }} />}
              <span>{gwInfo.label} পেমেন্ট</span>
            </DialogTitle>
            <DialogDescription>
              মোট পরিশোধযোগ্য: <strong className="text-foreground text-lg">{formatPrice(total)}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {isMobileBanking(selectedPaymentMethod) ? (
              <>
                {/* Mobile banking payment form */}
                <div className="p-4 rounded-xl border-2 border-border" style={{ borderColor: gwInfo.color + '40', backgroundColor: gwInfo.color + '08' }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: gwInfo.color }}>
                      {gwInfo.label[0]}
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{gwInfo.label} পেমেন্ট</p>
                      <p className="text-xs text-muted-foreground">Send Money / Payment</p>
                    </div>
                  </div>
                  <Separator className="my-3" />
                  <div className="space-y-2 text-sm">
                    <p className="text-muted-foreground">মার্চেন্ট নম্বর:</p>
                    <p className="font-bold text-foreground text-lg tracking-wider">{gwInfo.merchant}</p>
                    <p className="text-xs text-muted-foreground">উপরের নম্বরে <strong>{formatPrice(total)}</strong> টাকা Send Money করুন</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="txnId" className="text-sm font-semibold text-foreground">ট্রানজেকশন আইডি (TxnID) *</Label>
                  <Input
                    id="txnId"
                    placeholder="যেমন: 8K7F3G2H1J"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    className="h-12 text-base font-mono tracking-wider"
                  />
                  <p className="text-xs text-muted-foreground">Send Money করার পর প্রাপ্ত Transaction ID দিন</p>
                </div>
              </>
            ) : (
              <>
                {/* Card / other gateway payment form */}
                <div className="p-4 rounded-xl border-2 border-border" style={{ borderColor: gwInfo.color + '40', backgroundColor: gwInfo.color + '08' }}>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: gwInfo.color }}>
                      {gwInfo.label[0]}
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{gwInfo.label}</p>
                      <p className="text-xs text-muted-foreground">সুরক্ষিত অনলাইন পেমেন্ট</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-sm font-semibold">কার্ড নম্বর</Label>
                    <Input placeholder="1234 5678 9012 3456" className="h-11 font-mono" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm font-semibold">কার্ডে নাম</Label>
                    <Input placeholder="CARD HOLDER NAME" className="h-11" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-sm font-semibold">মেয়াদ</Label>
                      <Input placeholder="MM/YY" className="h-11 font-mono" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm font-semibold">CVV</Label>
                      <Input type="password" placeholder="123" maxLength={4} className="h-11 font-mono" />
                    </div>
                  </div>
                </div>
              </>
            )}

            <Button
              onClick={handlePaymentConfirm}
              disabled={paymentProcessing}
              className="w-full h-12 text-base rounded-xl"
              style={{ backgroundColor: gwInfo.color }}
            >
              {paymentProcessing ? (
                <><Loader2 className="h-5 w-5 mr-2 animate-spin" />পেমেন্ট প্রসেস হচ্ছে...</>
              ) : (
                <><CheckCircle2 className="h-5 w-5 mr-2" />পে করুন ও অর্ডার কনফার্ম করুন</>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" /> আপনার পেমেন্ট তথ্য সম্পূর্ণ সুরক্ষিত
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
