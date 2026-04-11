import { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Shield, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CodOtpVerificationModalProps {
  open: boolean;
  onClose: () => void;
  onVerified: () => void;
  phone: string;
}

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

const formatPhone = (phone: string) => {
  const cleaned = phone.trim();
  if (cleaned.startsWith('+')) return cleaned;
  return `+88${cleaned.replace(/^0/, '')}`;
};

export const CodOtpVerificationModal = ({ open, onClose, onVerified, phone }: CodOtpVerificationModalProps) => {
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [resendTimer, setResendTimer] = useState(RESEND_COOLDOWN);
  const [otpSent, setOtpSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Send OTP on open
  useEffect(() => {
    if (open && !otpSent) {
      sendOtp();
    }
    if (!open) {
      setOtp(Array(OTP_LENGTH).fill(''));
      setOtpSent(false);
      setVerified(false);
      setResendTimer(RESEND_COOLDOWN);
    }
  }, [open]);

  // Countdown timer
  useEffect(() => {
    if (!otpSent || resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [otpSent, resendTimer]);

  const sendOtp = useCallback(async () => {
    if (!phone) { toast.error('ফোন নম্বর পাওয়া যায়নি'); return; }
    setIsSending(true);
    try {
      const formattedPhone = formatPhone(phone);
      const res = await supabase.functions.invoke('send-otp', { body: { phone: formattedPhone } });
      if (res.error || res.data?.error) {
        toast.error(res.data?.error || 'OTP পাঠানো যায়নি');
        setIsSending(false);
        return;
      }
      setOtpSent(true);
      setResendTimer(RESEND_COOLDOWN);
      toast.success('OTP পাঠানো হয়েছে!');
      setTimeout(() => inputRefs.current[0]?.focus(), 200);
    } catch {
      toast.error('OTP পাঠাতে সমস্যা হয়েছে');
    }
    setIsSending(false);
  }, [phone]);

  const handleResend = () => {
    if (resendTimer > 0) return;
    setOtp(Array(OTP_LENGTH).fill(''));
    sendOtp();
  };

  const handleInputChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    const newOtp = Array(OTP_LENGTH).fill('');
    pasted.split('').forEach((c, i) => { newOtp[i] = c; });
    setOtp(newOtp);
    const nextIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < OTP_LENGTH) {
      toast.error('সম্পূর্ণ OTP দিন');
      return;
    }
    setIsVerifying(true);
    try {
      const formattedPhone = formatPhone(phone);
      const res = await supabase.functions.invoke('verify-otp', {
        body: { phone: formattedPhone, code },
      });
      if (res.error || res.data?.error) {
        toast.error(res.data?.error || 'OTP যাচাই ব্যর্থ');
        setIsVerifying(false);
        return;
      }
      setVerified(true);
      toast.success('ফোন নম্বর যাচাই সফল!');
      setTimeout(() => onVerified(), 1200);
    } catch {
      toast.error('যাচাই করতে সমস্যা হয়েছে');
    }
    setIsVerifying(false);
  };

  const maskedPhone = phone
    ? phone.slice(0, -4).replace(/./g, '•') + phone.slice(-4)
    : '';

  const progressPercent = resendTimer > 0 ? ((RESEND_COOLDOWN - resendTimer) / RESEND_COOLDOWN) * 100 : 100;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-[420px] p-0 overflow-hidden border-0 rounded-2xl shadow-2xl bg-transparent">
        {/* Gradient Header */}
        <div className="relative bg-gradient-to-br from-accent via-accent/90 to-[hsl(var(--primary))] pt-8 pb-10 px-6 text-center">
          {/* Decorative circles */}
          <div className="absolute top-2 left-4 w-20 h-20 rounded-full bg-white/10 blur-xl" />
          <div className="absolute bottom-0 right-6 w-16 h-16 rounded-full bg-white/10 blur-lg" />

          <div className={cn(
            "mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4 transition-all duration-500",
            verified
              ? "bg-green-500 scale-110"
              : "bg-white/20 backdrop-blur-sm border-2 border-white/30"
          )}>
            {verified ? (
              <CheckCircle2 className="h-10 w-10 text-white animate-in zoom-in-50 duration-300" />
            ) : (
              <Shield className="h-10 w-10 text-white" />
            )}
          </div>

          <h2 className="text-2xl font-bold text-white mb-1">
            {verified ? 'যাচাই সফল! ✓' : 'মোবাইল ভেরিফিকেশন'}
          </h2>
          <p className="text-white/80 text-sm">
            {verified
              ? 'আপনার অর্ডার প্রক্রিয়া করা হচ্ছে...'
              : <>আপনার <span className="font-semibold text-white">{maskedPhone}</span> নম্বরে কোড পাঠানো হয়েছে।</>}
          </p>
        </div>

        {/* Body */}
        <div className="bg-card px-6 pb-6 pt-4 -mt-4 rounded-t-3xl relative z-10">
          {!verified && (
            <>
              {/* OTP Input Boxes */}
              <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleInputChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    className={cn(
                      "w-12 h-14 text-center text-xl font-bold rounded-xl border-2 transition-all duration-200 outline-none bg-background text-foreground",
                      digit
                        ? "border-accent shadow-[0_0_0_3px_hsl(var(--accent)/0.15)]"
                        : "border-border hover:border-accent/50",
                      "focus:border-accent focus:shadow-[0_0_0_3px_hsl(var(--accent)/0.25)]"
                    )}
                  />
                ))}
              </div>

              {/* Verify Button */}
              <Button
                onClick={handleVerify}
                disabled={isVerifying || otp.join('').length < OTP_LENGTH}
                className="w-full h-14 text-lg font-bold rounded-xl bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 text-accent-foreground shadow-lg shadow-accent/25 transition-all duration-200 hover:shadow-xl hover:shadow-accent/30 disabled:opacity-50"
              >
                {isVerifying ? (
                  <><Loader2 className="h-5 w-5 animate-spin mr-2" />যাচাই হচ্ছে...</>
                ) : (
                  <>যাচাই করুন (Verify)</>
                )}
              </Button>

              {/* Resend Section with Timer */}
              <div className="mt-5 text-center space-y-3">
                <div className="flex flex-col items-center gap-2">
                  {resendTimer > 0 ? (
                    <div className="relative">
                      <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                        <circle cx="28" cy="28" r="24" fill="none" strokeWidth="3" className="stroke-border" />
                        <circle
                          cx="28" cy="28" r="24" fill="none" strokeWidth="3"
                          className="stroke-accent transition-all duration-1000"
                          strokeDasharray={`${2 * Math.PI * 24}`}
                          strokeDashoffset={`${2 * Math.PI * 24 * (1 - progressPercent / 100)}`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-foreground">
                        {resendTimer}s
                      </span>
                    </div>
                  ) : null}

                  <p className="text-sm text-muted-foreground">
                    {resendTimer > 0
                      ? <><span className="font-medium text-accent">{resendTimer} সেকেন্ড</span> পরে আবার পাঠাতে পারবেন</>
                      : 'কোড পাননি?'}
                  </p>

                  <button
                    onClick={handleResend}
                    disabled={resendTimer > 0 || isSending}
                    className={cn(
                      "text-sm font-semibold transition-all duration-200 px-4 py-2 rounded-lg",
                      resendTimer > 0
                        ? "text-muted-foreground cursor-not-allowed opacity-50"
                        : "text-accent hover:bg-accent/10 hover:underline"
                    )}
                  >
                    {isSending ? 'পাঠানো হচ্ছে...' : 'আবার কোড পাঠান'}
                  </button>
                </div>
              </div>
            </>
          )}

          {verified && (
            <div className="flex flex-col items-center py-4">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-3 animate-in zoom-in-75 duration-500">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-lg font-semibold text-foreground">অর্ডার নিশ্চিত হচ্ছে...</p>
              <div className="mt-3 h-1 w-32 rounded-full bg-border overflow-hidden">
                <div className="h-full bg-accent rounded-full animate-pulse w-full" />
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
