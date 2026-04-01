import { useState } from 'react';
import { ReturnReceipt } from './ReturnReceipt';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { RotateCcw, Package, Loader2, CheckCircle, Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_image: string | null;
  price: number;
  quantity: number;
  variations: Json | null;
}

interface ReturnRequestModalProps {
  open: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber: string;
  orderItems: OrderItem[];
  userId: string;
  onSuccess: () => void;
}

const returnReasons = [
  'Product not as described',
  'Damaged or defective product',
  'Wrong item received',
  'Size/fit issue',
  'Quality not satisfactory',
  'Changed my mind',
  'Better price available',
  'Other',
];

const refundMethods = [
  { value: 'original', label: 'Original Payment Method' },
  { value: 'store_credit', label: 'Store Credit (Instant)' },
  { value: 'bkash', label: 'bKash' },
  { value: 'nagad', label: 'Nagad' },
];

export const ReturnRequestModal = ({
  open,
  onClose,
  orderId,
  orderNumber,
  orderItems,
  userId,
  onSuccess,
}: ReturnRequestModalProps) => {
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [refundMethod, setRefundMethod] = useState('original');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [returnTrackingNumber, setReturnTrackingNumber] = useState('');

  const selectedOrderItem = orderItems.find((i) => i.id === selectedItem);
  const refundAmount = selectedOrderItem
    ? selectedOrderItem.price * selectedOrderItem.quantity
    : 0;

  const handleSubmit = async () => {
    if (!selectedItem || !reason) {
      toast.error('Please select an item and reason');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.from('return_requests').insert({
      order_id: orderId,
      user_id: userId,
      order_item_id: selectedItem,
      reason,
      description: description || null,
      refund_method: refundMethod,
      refund_amount: refundAmount,
      status: 'pending',
    }).select('return_tracking_number').single();

    setLoading(false);

    if (error) {
      toast.error('Failed to submit return request');
      return;
    }

    setReturnTrackingNumber((data as any)?.return_tracking_number || '');
    setSubmitted(true);
    toast.success('Return request submitted successfully!');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-accent" />
            Return Request — #{orderNumber}
          </DialogTitle>
        </DialogHeader>

        {submitted ? (
          <div className="text-center py-6 space-y-4">
            <CheckCircle className="h-16 w-16 text-success mx-auto" />
            <h3 className="text-lg font-semibold">Request Submitted!</h3>
            {returnTrackingNumber && (
              <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Return Tracking Number</p>
                <div className="flex items-center justify-center gap-2">
                  <code className="text-lg font-bold text-accent">{returnTrackingNumber}</code>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { navigator.clipboard.writeText(returnTrackingNumber); toast.success('Copied!'); }}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              We'll review your return request and get back to you within 24-48 hours.
            </p>
            <div className="flex gap-2 justify-center">
              {returnTrackingNumber && (
                <ReturnReceipt
                  trackingNumber={returnTrackingNumber}
                  orderNumber={orderNumber}
                  productName={selectedOrderItem?.product_name}
                  productImage={selectedOrderItem?.product_image || undefined}
                  quantity={selectedOrderItem?.quantity}
                  price={selectedOrderItem?.price}
                  reason={reason}
                  description={description}
                  refundMethod={refundMethod}
                  refundAmount={refundAmount}
                  status="pending"
                  createdAt={new Date().toISOString()}
                />
              )}
              <Button size="sm" onClick={() => { onSuccess(); onClose(); setSubmitted(false); setSelectedItem(''); setReason(''); setDescription(''); setRefundMethod('original'); setReturnTrackingNumber(''); }}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Select Item */}
            <div className="space-y-2">
              <Label className="font-medium">Select Item to Return</Label>
              <div className="space-y-2">
                {orderItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedItem(item.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                      selectedItem === item.id
                        ? 'border-accent bg-accent/5'
                        : 'border-border hover:bg-secondary/50'
                    }`}
                  >
                    <div className="w-12 h-12 bg-secondary rounded-md overflow-hidden shrink-0">
                      <img
                        src={item.product_image || '/placeholder.svg'}
                        alt={item.product_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.product_name}</p>
                      <p className="text-xs text-muted-foreground">
                        Qty: {item.quantity} · ৳{(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                    {selectedItem === item.id && (
                      <CheckCircle className="h-5 w-5 text-accent shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label className="font-medium">Reason for Return</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {returnReasons.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="font-medium">Additional Details (Optional)</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue in detail..."
                rows={3}
              />
            </div>

            {/* Refund Method */}
            <div className="space-y-2">
              <Label className="font-medium">Preferred Refund Method</Label>
              <RadioGroup value={refundMethod} onValueChange={setRefundMethod} className="space-y-2">
                {refundMethods.map((m) => (
                  <div key={m.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={m.value} id={m.value} />
                    <Label htmlFor={m.value} className="cursor-pointer text-sm">
                      {m.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Refund Summary */}
            {selectedItem && (
              <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
                <h4 className="text-sm font-medium">Refund Summary</h4>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Refund Amount</span>
                  <span className="font-semibold text-success">৳{refundAmount.toFixed(2)}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Refund will be processed within 3-7 business days after approval.
                </p>
              </div>
            )}

            {/* Submit */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!selectedItem || !reason || loading}
                className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RotateCcw className="h-4 w-4 mr-2" />
                )}
                Submit Return
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
