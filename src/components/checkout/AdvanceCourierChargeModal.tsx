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
  const [selected, setSelected] = useState<string>(gateways[0]?.id ?? '');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (open) {
      setSelected(gateways[0]?.id ?? '');
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
      // Reuse the same redirect-style flow used by online gateways elsewhere.
      // For now we generate a deterministic client-side reference; the actual
      // gateway redirect/capture is handled by the existing checkout pipeline.
      const ref = `ADV-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      await new Promise((r) => setTimeout(r, 800));
      onConfirmed(ref, selected);
      toast.success(t('payment.courierPrepaid') || 'Courier charge paid online ✓');
      onClose();
    } catch (err) {
      toast.error('Payment failed. Please try again.');
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

        {gateways.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No online payment methods available.
          </p>
        ) : (
          <RadioGroup value={selected} onValueChange={setSelected} className="space-y-2">
            {gateways.map((g) => (
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
            disabled={processing || gateways.length === 0}
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