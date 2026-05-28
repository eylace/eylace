import { useMemo, useState, useEffect } from 'react';
import { Printer, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { printInvoiceInline } from '@/lib/invoiceGenerator';

const PAGE_SIZE = 10;

interface POSReceiptModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  order: any | null;
}

export function POSReceiptModal({ open, onOpenChange, order }: POSReceiptModalProps) {
  const [page, setPage] = useState(0);
  useEffect(() => { if (open) setPage(0); }, [open, order?.id]);

  const items = Array.isArray(order?.items) ? order.items : [];
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const pageItems = useMemo(
    () => items.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [items, page],
  );

  if (!order) return null;

  const sa = order.shipping_address || {};
  const customer = [sa.first_name, sa.last_name].filter(Boolean).join(' ') || 'Walk-in';
  const phone = sa.phone || order.guest_phone || '';
  const created = order.created_at ? new Date(order.created_at) : new Date();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 max-h-[90vh] flex flex-col">
        <DialogHeader className="px-5 py-3 border-b">
          <DialogTitle className="flex items-center justify-between gap-2 text-base">
            <span>Receipt #{order.order_number}</span>
            <Badge variant="secondary" className="text-[10px]">
              {(order.payment_method || 'n/a').toString().toUpperCase()}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 px-5 py-4">
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wide">Customer</p>
                <p className="font-medium">{customer}</p>
                {phone && <p className="text-xs text-muted-foreground">{phone}</p>}
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wide">Date</p>
                <p className="font-medium">
                  {created.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {created.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                </p>
              </div>
            </div>

            <Separator />

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wide">
                  Items ({items.length})
                </p>
                {totalPages > 1 && (
                  <div className="flex items-center gap-1 text-xs">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      disabled={page === 0}
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </Button>
                    <span className="text-muted-foreground">
                      Page {page + 1} / {totalPages}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      disabled={page >= totalPages - 1}
                      onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="rounded-md border divide-y">
                {pageItems.map((it: any, i: number) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 text-xs">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{it.product_name}</p>
                      <p className="text-muted-foreground">
                        ৳{Number(it.price).toFixed(2)} × {it.quantity}
                      </p>
                    </div>
                    <span className="font-semibold tabular-nums ml-2">
                      ৳{(Number(it.price) * Number(it.quantity)).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-1 text-xs">
              <Row label="Subtotal" value={Number(order.subtotal) || 0} />
              {Number(order.discount) > 0 && (
                <Row label="Discount" value={-Number(order.discount)} negative />
              )}
              {Number(order.shipping) > 0 && (
                <Row label="Shipping" value={Number(order.shipping)} />
              )}
              {Number(order.tax) > 0 && (
                <Row label="Tax" value={Number(order.tax)} />
              )}
              <Separator className="my-1" />
              <div className="flex justify-between font-bold text-base">
                <span>Total</span>
                <span className="text-accent">৳{Number(order.total).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="px-5 py-3 border-t">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button size="sm" onClick={() => printInvoiceInline(order)}>
            <Printer className="h-3.5 w-3.5 mr-1" /> Print Receipt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value, negative }: { label: string; value: number; negative?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={negative ? 'text-destructive' : ''}>
        {negative && value !== 0 ? '-' : ''}৳{Math.abs(value).toFixed(2)}
      </span>
    </div>
  );
}