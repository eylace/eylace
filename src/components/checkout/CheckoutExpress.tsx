import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { ArrowLeft, Phone, MapPin, User, ShieldCheck, Loader2, Minus, Plus, Trash2 } from 'lucide-react';
import { PaymentMethods } from '@/components/checkout/PaymentMethods';
import { Link } from 'react-router-dom';
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
import { useCart } from '@/contexts/CartContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Props {
  form: UseFormReturn<any>;
  onSubmit: (data: any) => void;
  isProcessing: boolean;
  codFee: number;
  promoDiscount: number;
  appliedCode: string | null;
  onApplyPromo: (d: number, c: string, cid: string) => void;
  onRemovePromo: () => void;
  customization?: any;
}

export const CheckoutExpress = ({ form, onSubmit, isProcessing, codFee, promoDiscount, customization = {} }: Props) => {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const { items, updateQuantity, removeItem, getSubtotal, getShipping, getTotal } = useCart();
  const { register, formState: { errors }, setValue, handleSubmit } = form;

  const [deliveryZone, setDeliveryZone] = useState('inside_dhaka');
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<any>(null);

  const deliveryCharge = deliveryZone === 'inside_dhaka' ? 80 : 150;
  const subtotal = getSubtotal();
  const total = subtotal + deliveryCharge - promoDiscount;

  useState(() => {
    setValue('paymentMethod', 'cod');
    setValue('country', 'BD');
  });

  const handleOrderClick = async (data: any) => {
    const phone = data.phone?.trim();
    if (!phone) { toast.error('ফোন নম্বর দিন'); return; }
    if (!data.firstName?.trim()) { toast.error('আপনার নাম দিন'); return; }
    if (!data.address?.trim()) { toast.error('সম্পূর্ণ ঠিকানা দিন'); return; }

    data.city = deliveryZone === 'inside_dhaka' ? 'Dhaka' : data.city || '';
    data.state = deliveryZone === 'inside_dhaka' ? 'Dhaka' : data.state || '';
    setPendingFormData(data);

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
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-base font-semibold text-foreground">আপনার নাম</Label>
                <Input
                  id="firstName"
                  placeholder="আপনার পূর্ণ নাম লিখুন"
                  {...register('firstName', { required: true })}
                  className={`h-12 text-base ${errors.firstName ? 'border-destructive' : ''}`}
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-base font-semibold text-foreground">আপনার মোবাইল নাম্বার</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="01XXXXXXXXX"
                  {...register('phone', { required: true })}
                  className={`h-12 text-base ${errors.phone ? 'border-destructive' : ''}`}
                />
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="address" className="text-base font-semibold text-foreground">আপনার সম্পূর্ণ ঠিকানা</Label>
                <Textarea
                  id="address"
                  placeholder="বাড়ি নং, রাস্তা, এলাকা, থানা..."
                  rows={3}
                  {...register('address', { required: true })}
                  className={`text-base ${errors.address ? 'border-destructive' : ''}`}
                />
              </div>

              {/* Delivery Zone */}
              <div className="space-y-3">
                <Label className="text-base font-semibold text-foreground">ডেলিভারি এলাকা নির্বাচন করুন</Label>
                <RadioGroup
                  value={deliveryZone}
                  onValueChange={(val) => {
                    setDeliveryZone(val);
                    if (val === 'inside_dhaka') {
                      setValue('city', 'Dhaka');
                      setValue('state', 'Dhaka');
                    } else {
                      setValue('city', '');
                      setValue('state', '');
                    }
                  }}
                  className="grid grid-cols-2 gap-4"
                >
                  <Label
                    htmlFor="inside_dhaka"
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      deliveryZone === 'inside_dhaka'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <RadioGroupItem value="inside_dhaka" id="inside_dhaka" className="sr-only" />
                    <span className="font-semibold text-foreground">ঢাকার ভিতর</span>
                    <span className="px-6 py-2 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                      {formatPrice(80)}
                    </span>
                  </Label>

                  <Label
                    htmlFor="outside_dhaka"
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      deliveryZone === 'outside_dhaka'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <RadioGroupItem value="outside_dhaka" id="outside_dhaka" className="sr-only" />
                    <span className="font-semibold text-foreground">ঢাকার বাহির</span>
                    <span className="px-6 py-2 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                      {formatPrice(150)}
                    </span>
                  </Label>
                </RadioGroup>
              </div>

              {/* Payment Method */}
              <PaymentMethods form={form} />

              {/* Submit */}
              <Button
                type="submit"
                size="xl"
                className="w-full rounded-xl text-base bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <><Loader2 className="h-5 w-5 mr-2 animate-spin" />অর্ডার প্রসেস হচ্ছে...</>
                ) : (
                  <><ShieldCheck className="h-5 w-5 mr-2" />অর্ডার কনফার্ম করুন</>
                )}
              </Button>
            </form>
          </div>
        </div>

        {/* RIGHT — Order Details */}
        <div className="lg:col-span-2">
          <div className="bg-card border border-border rounded-xl p-5 lg:sticky lg:top-24">
            <h2 className="text-lg font-bold text-foreground mb-4">অর্ডার ডিটেইলস</h2>

            {/* Product Table */}
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="grid grid-cols-[60px_1fr_80px_60px_80px_30px] gap-1 items-center bg-secondary/50 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">
                <span>Image</span>
                <span>Product</span>
                <span className="text-right">Price</span>
                <span className="text-center">Qty</span>
                <span className="text-right">Total</span>
                <span></span>
              </div>
              <div className="divide-y divide-border">
                {items.map((item, idx) => (
                  <div key={`${item.product.id}-${idx}`} className="grid grid-cols-[60px_1fr_80px_60px_80px_30px] gap-1 items-center px-3 py-3">
                    <img
                      src={item.product.images?.[0] || '/placeholder.svg'}
                      alt={item.product.name}
                      className="w-12 h-12 rounded-lg object-cover border border-border"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground line-clamp-2 leading-tight">{item.product.name}</p>
                      {item.selectedVariations && Object.entries(item.selectedVariations).map(([k, v]) => (
                        <Badge key={k} variant="secondary" className="text-[10px] mt-1 mr-1">{k}: {v}</Badge>
                      ))}
                    </div>
                    <span className="text-sm font-semibold text-foreground text-right">৳{item.product.price.toLocaleString()}</span>
                    <div className="flex items-center justify-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                        className="h-6 w-6 rounded border border-border flex items-center justify-center hover:bg-secondary"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="h-6 w-6 rounded border border-border flex items-center justify-center hover:bg-secondary"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <span className="text-sm font-bold text-foreground text-right">৳{(item.product.price * item.quantity).toLocaleString()}</span>
                    <button
                      type="button"
                      onClick={() => removeItem(item.product.id)}
                      className="h-6 w-6 rounded-full bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive/20"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="mt-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground font-semibold">Subtotal:</span>
                <span className="font-semibold text-foreground">৳{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground font-semibold">Delivery Charge:</span>
                <span className="font-semibold text-foreground">৳{deliveryCharge}</span>
              </div>
              {promoDiscount > 0 && (
                <div className="flex justify-between text-sm text-success">
                  <span className="font-semibold">Discount:</span>
                  <span className="font-semibold">-৳{promoDiscount}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between">
                <span className="text-lg font-bold text-foreground">Total:</span>
                <span className="text-xl font-bold text-foreground">৳{total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* OTP Dialog */}
      <Dialog open={otpDialogOpen} onOpenChange={setOtpDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary" />
              ফোন নম্বর ভেরিফাই করুন
            </DialogTitle>
            <DialogDescription>
              আপনার ফোন নম্বর <strong className="text-foreground">{pendingFormData?.phone}</strong>-এ একটি OTP পাঠানো হয়েছে।
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-6 py-4">
            {otpSending && !otpSent ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                OTP পাঠানো হচ্ছে...
              </div>
            ) : (
              <>
                <InputOTP maxLength={6} value={otpValue} onChange={setOtpValue}>
                  <InputOTPGroup>
                    {[0,1,2,3,4,5].map(i => <InputOTPSlot key={i} index={i} />)}
                  </InputOTPGroup>
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
    </div>
  );
};
