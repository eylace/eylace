import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Truck, CheckCircle2, Loader2 } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export interface AdvanceGatewayOption {
  id: string;
  name: string;
  logo?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  amount: number;
  gateways: AdvanceGatewayOption[];
  onConfirmed: (paymentRef: string, gatewayId: string) => void;
}

export const AdvanceCourierChargeModal = ({ open, onClose, amount, gateways, onConfirmed }: Props) => {
  const { formatPrice } = useCurrency();
  const { t } = useLanguage();
  // Only bKash/Nagad supported for real flow; filter to those if present.
  const supported = gateways.filter((g) => ['bkash', 'nagad'].includes(g.id));
  const list = supported.length ? supported : gateways;
  const [selected, setSelected] = useState<string>(list[0]?.id ?? '');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (open) {
      setSelected(list[0]?.id ?? '');
      setProcessing(false);
    }
  }, [open, gateways]);

  const handlePay = async () => {
    if (!selected) {
      toast.error(t('payment.selectGateway') || 'Please select a payment method');
      return;
    }
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('courier-advance-initiate', {
        body: { gateway: selected, shipping: amount },
      });
      if (data?.available === false) {
        toast.info('অনলাইন অগ্রিম পেমেন্ট এখন চালু নেই — আপনি সরাসরি COD অর্ডার করতে পারবেন।');
        onClose();
        return;
      }
      if (error || !data?.txn_ref) throw new Error(error?.message || 'Failed to initiate');

      // Open gateway (or mock) redirect in a popup
      const popup = window.open(data.redirect_url, 'advance_pay', 'width=480,height=640');

      // Poll server for terminal status (works for guests too)
      const start = Date.now();
      const poll = async (): Promise<'success' | 'failed' | 'cancelled' | 'timeout'> => {
        while (Date.now() - start < 5 * 60 * 1000) {
          await new Promise((r) => setTimeout(r, 2000));
          const { data: st0 } = await supabase.functions.invoke('courier-advance-initiate', {
            body: { action: 'status', txn_ref: data.txn_ref },
          });
          const st = st0?.status;
          if (st === 'success' || st === 'failed' || st === 'cancelled') return st;
          if (popup && popup.closed && Date.now() - start > 5000) return 'cancelled';
        }
        return 'timeout';
      };
      const result = await poll();
      try { popup?.close(); } catch { /* noop */ }

      if (result === 'success') {
        onConfirmed(data.txn_ref, selected);
        toast.success(t('payment.courierPrepaid') || 'Courier charge paid online ✓');
        onClose();
      } else if (result === 'timeout') {
        toast.error('Timed out waiting for payment confirmation.');
      } else {
        toast.error(`Payment ${result}.`);
      }
    } catch (err) {
      toast.error((err as Error).message || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-accent" />
            {t('payment.advanceCourierTitle') || 'Pay Courier Charge in Advance'}
          </DialogTitle>
          <DialogDescription>
            {t('payment.advanceCourierDesc') || 'Pay only the courier delivery charge online now. The product amount will be collected on delivery.'}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg bg-secondary/50 p-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{t('payment.courierCharge') || 'Courier charge'}</span>
          <span className="text-xl font-bold text-foreground">{formatPrice(amount)}</span>
        </div>

        {list.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No online payment methods available.
          </p>
        ) : (
          <RadioGroup value={selected} onValueChange={setSelected} className="space-y-2">
            {list.map((g) => (
              <Label
                key={g.id}
                htmlFor={`adv-${g.id}`}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all',
                  selected === g.id ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/50'
                )}
              >
                <RadioGroupItem value={g.id} id={`adv-${g.id}`} />
                {g.logo && <img src={g.logo} alt={g.name} className="h-6 w-6 object-contain rounded" />}
                <span className="text-sm font-medium text-foreground">{g.name}</span>
              </Label>
            ))}
          </RadioGroup>
        )}

        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={processing}>
            {t('common.cancel') || 'Cancel'}
          </Button>
          <Button
            className="flex-1"
            onClick={handlePay}
            disabled={processing || list.length === 0}
          >
            {processing ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing…</>
            ) : (
              <><CheckCircle2 className="h-4 w-4 mr-2" /> {t('payment.payCourierBtn') || `Pay ${formatPrice(amount)}`}</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};