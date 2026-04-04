import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { ArrowLeft, Phone, MapPin, User, ShieldCheck, Loader2, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { OrderSummary } from '@/components/checkout/OrderSummary';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
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
}

export const CheckoutExpress = ({ form, onSubmit, isProcessing, codFee, promoDiscount }: Props) => {
  const { t } = useLanguage();
  const { items } = useCart();
  const { register, formState: { errors }, setValue, getValues, handleSubmit } = form;

  const [deliveryZone, setDeliveryZone] = useState('inside_dhaka');
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<any>(null);

  // Set payment method to COD by default for express
  useState(() => {
    setValue('paymentMethod', 'cod');
    setValue('country', 'BD');
  });

  const handleOrderClick = async (data: any) => {
    // Validate phone
    const phone = data.phone?.trim();
    if (!phone) {
      toast.error('ফোন নম্বর দিন');
      return;
    }
    if (!data.firstName?.trim()) {
      toast.error('আপনার নাম দিন');
      return;
    }
    if (!data.address?.trim()) {
      toast.error('সম্পূর্ণ ঠিকানা দিন');
      return;
    }

    // Store form data and delivery zone
    data.city = deliveryZone === 'inside_dhaka' ? 'Dhaka' : data.city || '';
    data.state = deliveryZone === 'inside_dhaka' ? 'Dhaka' : data.state || '';
    setPendingFormData(data);

    // Send OTP
    setOtpDialogOpen(true);
    setOtpSending(true);
    setOtpSent(false);
    setOtpValue('');

    try {
      const formattedPhone = phone.startsWith('+') ? phone : `+88${phone.replace(/^0/, '')}`;
      const { error } = await supabase.functions.invoke('send-otp', {
        body: { phone: formattedPhone },
      });
      if (error) throw error;
      setOtpSent(true);
      toast.success('OTP পাঠানো হয়েছে');
    } catch (err: any) {
      console.error('OTP send error:', err);
      toast.error('OTP পাঠাতে ব্যর্থ। আবার চেষ্টা করুন।');
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpValue.length < 4) {
      toast.error('সম্পূর্ণ OTP দিন');
      return;
    }

    setOtpVerifying(true);
    try {
      const phone = pendingFormData.phone.trim();
      const formattedPhone = phone.startsWith('+') ? phone : `+88${phone.replace(/^0/, '')}`;

      const { data: verifyData, error } = await supabase.functions.invoke('verify-otp', {
        body: { phone: formattedPhone, code: otpValue },
      });

      if (error || !verifyData?.success) {
        toast.error(verifyData?.error || 'OTP ভেরিফিকেশন ব্যর্থ');
        setOtpVerifying(false);
        return;
      }

      // OTP verified — complete order
      setOtpDialogOpen(false);
      toast.success('ফোন নম্বর ভেরিফাইড ✓');
      onSubmit(pendingFormData);
    } catch (err: any) {
      console.error('OTP verify error:', err);
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
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/cart"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">অর্ডার করুন</h1>
            <p className="text-sm text-muted-foreground">দ্রুত অর্ডার সম্পন্ন করুন</p>
          </div>
        </div>

        {/* Order items preview */}
        <div className="bg-card border border-border rounded-xl p-4 mb-5">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
            <Package className="h-4 w-4" />
            আপনার পণ্য ({items.length}টি)
          </h3>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {items.map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <img src={item.product.images?.[0] || '/placeholder.svg'} alt="" className="h-10 w-10 rounded-lg object-cover border border-border" />
                <span className="flex-1 truncate text-foreground">{item.product.name}</span>
                <span className="text-muted-foreground">x{item.quantity}</span>
                <span className="font-semibold text-foreground">৳{(item.product.price * item.quantity).toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit(handleOrderClick)} className="space-y-5">
          {/* Customer Info */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              আপনার তথ্য
            </h2>

            <div className="space-y-2">
              <Label htmlFor="firstName">নাম / Name *</Label>
              <Input
                id="firstName"
                placeholder="আপনার পূর্ণ নাম লিখুন"
                {...register('firstName', { required: true })}
                className={errors.firstName ? 'border-destructive' : ''}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" />
                ফোন নম্বর / Phone *
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="01XXXXXXXXX"
                {...register('phone', { required: true })}
                className={errors.phone ? 'border-destructive' : ''}
              />
              <p className="text-xs text-muted-foreground">অর্ডার কনফার্ম করতে এই নম্বরে OTP পাঠানো হবে</p>
            </div>
          </div>

          {/* Address */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              ডেলিভারি ঠিকানা
            </h2>

            <div className="space-y-2">
              <Label htmlFor="address">সম্পূর্ণ ঠিকানা / Full Address *</Label>
              <Textarea
                id="address"
                placeholder="বাড়ি নং, রাস্তা, এলাকা, থানা..."
                rows={3}
                {...register('address', { required: true })}
                className={errors.address ? 'border-destructive' : ''}
              />
            </div>

            {/* Delivery Zone */}
            <div className="space-y-3">
              <Label>ডেলিভারি এলাকা *</Label>
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
                className="grid grid-cols-2 gap-3"
              >
                <Label
                  htmlFor="inside_dhaka"
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    deliveryZone === 'inside_dhaka'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/40'
                  }`}
                >
                  <RadioGroupItem value="inside_dhaka" id="inside_dhaka" />
                  <div>
                    <span className="font-medium text-foreground text-sm">ঢাকার ভিতরে</span>
                    <p className="text-xs text-muted-foreground">Inside Dhaka</p>
                  </div>
                </Label>

                <Label
                  htmlFor="outside_dhaka"
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    deliveryZone === 'outside_dhaka'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/40'
                  }`}
                >
                  <RadioGroupItem value="outside_dhaka" id="outside_dhaka" />
                  <div>
                    <span className="font-medium text-foreground text-sm">ঢাকার বাইরে</span>
                    <p className="text-xs text-muted-foreground">Outside Dhaka</p>
                  </div>
                </Label>
              </RadioGroup>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-card border border-border rounded-xl p-5">
            <OrderSummary codFee={codFee} promoDiscount={promoDiscount} />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            variant="buy-now"
            size="xl"
            className="w-full rounded-xl text-base"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <><Loader2 className="h-5 w-5 mr-2 animate-spin" />অর্ডার প্রসেস হচ্ছে...</>
            ) : (
              <><ShieldCheck className="h-5 w-5 mr-2" />অর্ডার কনফার্ম করুন</>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            অর্ডার কনফার্ম করতে আপনার ফোন নম্বর OTP দিয়ে ভেরিফাই করতে হবে
          </p>
        </form>
      </div>

      {/* OTP Verification Dialog */}
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
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>

                <Button
                  onClick={handleVerifyOtp}
                  disabled={otpVerifying || otpValue.length < 4}
                  className="w-full"
                  size="lg"
                >
                  {otpVerifying ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />ভেরিফাই হচ্ছে...</>
                  ) : (
                    'ভেরিফাই করুন'
                  )}
                </Button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={otpSending}
                  className="text-sm text-primary hover:underline disabled:opacity-50"
                >
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
