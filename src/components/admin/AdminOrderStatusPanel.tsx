import { useEffect, useState } from 'react';
import { CheckCircle, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { ALL_ORDER_STATUSES, ORDER_STATUS_META, getStatusMeta } from '@/lib/orderStatusConfig';
import { OrderStatusLegend } from '@/components/orders/OrderStatusLegend';
import { toast } from 'sonner';

interface AdminOrderStatusPanelProps {
  orderId: string;
  currentStatus: string;
  trackingNumber?: string | null;
  carrier?: string | null;
  onUpdate: (
    orderId: string,
    status: string,
    extras: { reason?: string; carrier?: string; tracking_number?: string }
  ) => Promise<{ error: any }>;
  className?: string;
}

/**
 * Admin-side panel that lets administrators change an order status and
 * automatically captures a transition reason (which is appended to the
 * order tracking event by the edge function).
 */
export const AdminOrderStatusPanel = ({
  orderId,
  currentStatus,
  trackingNumber,
  carrier,
  onUpdate,
  className,
}: AdminOrderStatusPanelProps) => {
  const [nextStatus, setNextStatus] = useState(currentStatus);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { setNextStatus(currentStatus); setReason(''); }, [currentStatus, orderId]);

  const fromMeta = getStatusMeta(currentStatus);
  const toMeta = getStatusMeta(nextStatus);
  const isExceptionTransition = toMeta.group === 'exception' && fromMeta.key !== toMeta.key;
  const reasonRequired = isExceptionTransition;
  const noChange = currentStatus === nextStatus;

  const handleApply = async () => {
    if (noChange) { toast.error('Pick a different status to update.'); return; }
    if (reasonRequired && reason.trim().length < 3) {
      toast.error('A short reason is required for cancel/return/refund/failed transitions.');
      return;
    }
    setSubmitting(true);
    const { error } = await onUpdate(orderId, nextStatus, {
      reason: reason.trim() || undefined,
      carrier: carrier || undefined,
      tracking_number: trackingNumber || undefined,
    });
    setSubmitting(false);
    if (error) toast.error('Failed to update status');
    else {
      toast.success(`Status updated to ${toMeta.label}`);
      setReason('');
    }
  };

  return (
    <div className={cn('rounded-lg border border-border bg-card p-4 space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" /> Update order status
        </h3>
        <OrderStatusLegend triggerLabel="Legend" />
      </div>

      {/* Transition preview */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-md border border-dashed border-border p-2.5 bg-muted/30">
        <div className="text-center">
          <div className="text-[10px] uppercase text-muted-foreground">Current</div>
          <Badge variant="outline" className={cn('mt-1 text-[11px]', fromMeta.badgeClass)}>{fromMeta.label}</Badge>
        </div>
        <div className="text-muted-foreground">→</div>
        <div className="text-center">
          <div className="text-[10px] uppercase text-muted-foreground">Next</div>
          <Badge variant="outline" className={cn('mt-1 text-[11px]', toMeta.badgeClass)}>{toMeta.label}</Badge>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">New status</Label>
        <Select value={nextStatus} onValueChange={setNextStatus}>
          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            {ALL_ORDER_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{ORDER_STATUS_META[s].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[11px] text-muted-foreground">{toMeta.description}</p>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground flex items-center justify-between">
          <span>Transition reason {reasonRequired && <span className="text-destructive">*</span>}</span>
          <span className="text-[10px] text-muted-foreground/70">Recorded in order history</span>
        </Label>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={
            reasonRequired
              ? 'Required: explain why this status changed (customer request, payment failure, damage, etc.)'
              : 'Optional: short note explaining this update'
          }
          rows={2}
          className="text-xs resize-none"
        />
      </div>

      <Button
        type="button"
        className="w-full gap-2"
        onClick={handleApply}
        disabled={submitting || noChange || (reasonRequired && reason.trim().length < 3)}
      >
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
        Apply status change
      </Button>
    </div>
  );
};