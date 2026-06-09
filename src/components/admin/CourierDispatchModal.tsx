import { useState, useEffect, useMemo, useCallback } from 'react';
import { Loader2, Send, Truck, Package, History, CheckCircle2, XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const PROVIDER_LABELS: Record<string, string> = {
  pathao: 'Pathao',
  redx: 'RedX',
  steadfast: 'Steadfast',
  carrybee: 'Carrybee',
  shiprocket: 'Shiprocket',
};

const normalizeAddress = (sa: any = {}) => ({
  first_name: sa?.first_name || sa?.firstName || '',
  last_name: sa?.last_name || sa?.lastName || '',
  email: sa?.email || '',
  phone: sa?.phone || '',
  address: sa?.address || '',
  apartment: sa?.apartment || '',
  city: sa?.city || '',
  state: sa?.state || '',
  zip_code: sa?.zip_code || sa?.zipCode || '',
  country: sa?.country || '',
});

interface CourierDispatchModalProps {
  open: boolean;
  order: any | null;
  providerCode: string;
  onClose: () => void;
  onDispatched?: (orderId: string, providerCode: string, trackingNumber: string) => void | Promise<void>;
}

export const CourierDispatchModal = ({
  open, order, providerCode, onClose, onDispatched,
}: CourierDispatchModalProps) => {
  const providerName = PROVIDER_LABELS[providerCode] || providerCode;

  // Pre-fill helpers
  const prefill = useMemo(() => {
    if (!order) return null;
    const addr = normalizeAddress(order.shipping_address);
    const name = [order?.profile?.first_name || addr.first_name, order?.profile?.last_name || addr.last_name]
      .filter(Boolean).join(' ').trim() || 'Guest';
    const phone = order?.profile?.phone || order?.guest_phone || addr.phone || '';
    const fullAddress = [addr.address, addr.apartment].filter(Boolean).join(', ');
    const itemCount = order.items?.reduce((s: number, i: any) => s + (i.quantity || 0), 0) || 1;
    const isCod = order.payment_method === 'cod';
    return {
      name, phone, address: fullAddress,
      city: addr.city, state: addr.state, zip: addr.zip_code,
      cod: isCod ? Number(order.total || 0) : 0,
      total: Number(order.total || 0),
      itemCount,
      itemDesc: order.items?.map((i: any) => `${i.product_name} x${i.quantity}`).join(', ') || 'Products',
    };
  }, [order]);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [zone, setZone] = useState('');
  const [area, setArea] = useState('');
  const [codAmount, setCodAmount] = useState('0');
  const [weight, setWeight] = useState('0.5');
  const [declaredValue, setDeclaredValue] = useState('0');
  const [instruction, setInstruction] = useState('');
  const [sending, setSending] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<any>(null);

  const loadLogs = useCallback(async () => {
    if (!order?.id) return;
    setLogsLoading(true);
    const { data } = await supabase
      .from('courier_dispatch_log')
      .select('id, provider, success, tracking_number, error_message, retry_count, duration_ms, created_at, response_payload')
      .eq('order_id', order.id)
      .order('created_at', { ascending: false })
      .limit(10);
    setLogs(data || []);
    setLogsLoading(false);
  }, [order?.id]);

  // Reset / prefill when modal opens
  useEffect(() => {
    if (!open || !prefill) return;
    setName(prefill.name);
    setPhone(prefill.phone);
    setAddress(prefill.address);
    setCity(prefill.city);
    setZone('');
    setArea('');
    setCodAmount(String(prefill.cod));
    setWeight('0.5');
    setDeclaredValue(String(prefill.total));
    setInstruction(`Order #${order?.order_number}`);
    setLastResponse(null);
    void loadLogs();
  }, [open, prefill, order?.order_number, loadLogs]);

  // Realtime: live tracking-event updates for this order.
  // courier_dispatch_log is admin-only and refreshed manually via loadLogs()
  // after each dispatch action — no realtime channel is opened on it.
  useEffect(() => {
    if (!open || !order?.id) return;
    const ch = supabase
      .channel(`courier-tracking-${order.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'order_tracking_events',
        filter: `order_id=eq.${order.id}`,
      }, (payload) => {
        const ev: any = payload.new;
        toast.info(`Timeline: ${ev?.status}`, { description: ev?.description || undefined });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [open, order?.id]);

  const handleSend = async () => {
    if (!order) return;
    if (!name.trim() || !phone.trim() || !address.trim()) {
      toast.error('Customer name, phone and address are required');
      return;
    }
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('shipping-provider', {
        body: {
          action: 'create_order',
          provider: providerCode,
          payload: {
            order_uuid: order.id,
            order_id: order.order_number,
            order_number: order.order_number,
            recipient_name: name,
            customer_name: name,
            recipient_phone: phone,
            phone,
            recipient_address: address,
            address,
            city: city || 'Dhaka',
            recipient_city: city || undefined,
            recipient_zone: zone || undefined,
            recipient_area: area || undefined,
            amount_to_collect: Number(codAmount) || 0,
            cod_amount: Number(codAmount) || 0,
            item_description: prefill?.itemDesc || 'Products',
            item_quantity: prefill?.itemCount || 1,
            item_weight: Number(weight) || 0.5,
            value: Number(declaredValue) || prefill?.total || 0,
            total: prefill?.total || 0,
            subtotal: order.subtotal,
            payment_method: order.payment_method,
            note: instruction,
          },
        },
      });
      if (error) throw new Error(error.message || 'Edge function call failed');
      setLastResponse(data);
      if (data && data.ok === false) {
        throw new Error(`${data.error || 'Unknown error'}${data.stage ? ` (stage: ${data.stage})` : ''}`);
      }

      const tracking =
        data?.consignment_id ||
        data?.tracking_code ||
        data?.data?.consignment_id ||
        data?.data?.tracking_code ||
        '';
      // Persist carrier + tracking BEFORE closing so the badge shows up immediately
      await onDispatched?.(order.id, providerCode, tracking);

      const sandboxNote = data?.sandbox ? data?.note : '';
      const dupNote = data?.duplicate ? ' (duplicate — already dispatched)' : '';
      toast.success(
        `Sent to ${providerName}${dupNote}${tracking ? ` — Tracking: ${tracking}` : ''}`,
        { duration: sandboxNote ? 12000 : 4000, description: sandboxNote || undefined }
      );
      await loadLogs();
      // keep modal open briefly to show log; auto-close after 1.5s if user doesn't interact
      setTimeout(() => onClose(), 1500);
    } catch (e: any) {
      console.error('[CourierDispatch]', e);
      toast.error(`Failed to send to ${providerName}: ${e?.message || 'Unknown error'}`, { duration: 10000 });
      await loadLogs();
    } finally {
      setSending(false);
    }
  };

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Truck className="h-5 w-5 text-primary" />
            Place {providerName} Order
          </DialogTitle>
          <p className="text-sm text-muted-foreground">Order: {order.order_number}</p>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Order Summary */}
          <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
            <Package className="h-5 w-5 text-muted-foreground shrink-0" />
            <div className="flex-1 text-xs">
              <span className="font-medium">{prefill?.itemCount} item(s)</span>
              <span className="text-muted-foreground"> · ৳{prefill?.total.toLocaleString()}</span>
            </div>
            <Badge variant="outline" className="text-[10px] uppercase">{order.payment_method}</Badge>
          </div>

          {/* Customer Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Customer Name <span className="text-destructive">*</span></Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Customer Phone <span className="text-destructive">*</span></Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01XXXXXXXXX" />
            </div>
          </div>

          {/* Pathao-specific city/zone/area */}
          {providerCode === 'pathao' ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">City <span className="text-destructive">*</span></Label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City ID or name" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Zone <span className="text-destructive">*</span></Label>
                <Input value={zone} onChange={(e) => setZone(e.target.value)} placeholder="Zone ID" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Area</Label>
                <Input value={area} onChange={(e) => setArea(e.target.value)} placeholder="Area ID" />
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label className="text-xs">City / Delivery Area</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
          )}

          {/* COD */}
          <div className="space-y-1.5">
            <Label className="text-xs">Cash Collection Amount (COD) <span className="text-destructive">*</span></Label>
            <Input type="number" value={codAmount} onChange={(e) => setCodAmount(e.target.value)} />
          </div>

          {/* Address */}
          <div className="space-y-1.5">
            <Label className="text-xs">Customer Address <span className="text-destructive">*</span></Label>
            <Textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={3} />
          </div>

          {/* Weight + Declared Value */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Parcel Weight (kg)</Label>
              <Input type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Declared Value (৳) <span className="text-destructive">*</span></Label>
              <Input type="number" value={declaredValue} onChange={(e) => setDeclaredValue(e.target.value)} />
            </div>
          </div>

          {/* Instruction */}
          <div className="space-y-1.5">
            <Label className="text-xs">Instruction</Label>
            <Textarea value={instruction} onChange={(e) => setInstruction(e.target.value)} rows={2} placeholder="Leave at reception" />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button onClick={handleSend} disabled={sending} className="flex-1 gap-2">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {sending ? 'Sending...' : `Send to ${providerName}`}
            </Button>
            <Button variant="outline" onClick={onClose} disabled={sending}>Cancel</Button>
          </div>

          {/* Dispatch History */}
          <div className="pt-3 border-t">
            <div className="flex items-center gap-2 mb-2">
              <History className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Dispatch History</span>
              {logsLoading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
            </div>
            {logs.length === 0 && !logsLoading ? (
              <p className="text-xs text-muted-foreground">No previous dispatch attempts.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {logs.map((l) => (
                  <div key={l.id} className="text-xs p-2 rounded border bg-muted/20 flex items-start gap-2">
                    {l.success
                      ? <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                      : <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium uppercase">{l.provider}</span>
                        <span className="text-muted-foreground">{new Date(l.created_at).toLocaleString()}</span>
                        {l.retry_count > 0 && <Badge variant="outline" className="h-4 text-[10px]">retry x{l.retry_count}</Badge>}
                        {l.duration_ms != null && <span className="text-muted-foreground">{l.duration_ms}ms</span>}
                      </div>
                      {l.tracking_number && <div className="font-mono text-[11px] mt-0.5">📦 {l.tracking_number}</div>}
                      {l.error_message && <div className="text-destructive mt-0.5 break-words">{l.error_message}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
