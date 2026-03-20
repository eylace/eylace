import { useState, useMemo } from 'react';
import { 
  Package, Truck, CheckCircle, Clock, ChevronDown, ChevronUp, Loader2, Send, ShieldAlert, Download, 
  Printer, Search, FileText, CreditCard, MapPin, DollarSign, XCircle, Phone, MessageCircle,
} from 'lucide-react';
import { FraudDetectionModal } from '@/components/admin/FraudDetectionModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAdminOrders } from '@/hooks/useAdminData';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { exportToCSV } from '@/lib/csvExport';
import { supabase } from '@/integrations/supabase/client';

const statusConfig: Record<string, { labelKey: string; color: string; icon: React.ElementType }> = {
  pending: { labelKey: 'admin.statusPending', color: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400', icon: Clock },
  processing: { labelKey: 'admin.statusProcessing', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400', icon: Package },
  shipped: { labelKey: 'admin.statusShipped', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400', icon: Truck },
  out_for_delivery: { labelKey: 'admin.statusOutForDelivery', color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400', icon: Truck },
  delivered: { labelKey: 'admin.statusDelivered', color: 'bg-green-500/10 text-green-600 dark:text-green-400', icon: CheckCircle },
  cancelled: { labelKey: 'admin.statusCancelled', color: 'bg-red-500/10 text-red-600 dark:text-red-400', icon: XCircle },
};

export const AdminOrdersTab = () => {
  const { orders, isLoading, updateOrderStatus } = useAdminOrders();
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [trackingInfo, setTrackingInfo] = useState<Record<string, { carrier: string; tracking_number: string }>>({});
  const [fraudOrder, setFraudOrder] = useState<any>(null);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [invoiceOrder, setInvoiceOrder] = useState<any>(null);
  const [courierDispatchOrder, setCourierDispatchOrder] = useState<any>(null);
  const [dispatchProvider, setDispatchProvider] = useState('steadfast');
  const [dispatching, setDispatching] = useState(false);
  const { t } = useLanguage();

  // Stats
  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter(o => o.status === 'pending').length;
    const processing = orders.filter(o => o.status === 'processing').length;
    const shipped = orders.filter(o => o.status === 'shipped' || o.status === 'out_for_delivery').length;
    const delivered = orders.filter(o => o.status === 'delivered').length;
    const cancelled = orders.filter(o => o.status === 'cancelled').length;
    const totalRevenue = orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + (o.total || 0), 0);
    return { total, pending, processing, shipped, delivered, cancelled, totalRevenue };
  }, [orders]);

  // Filter
  const filteredOrders = useMemo(() => {
    let result = orders;
    if (statusFilter !== 'all') result = result.filter(o => o.status === statusFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(o =>
        o.order_number?.toLowerCase().includes(q) ||
        o.profile?.email?.toLowerCase().includes(q) ||
        o.profile?.first_name?.toLowerCase().includes(q) ||
        o.profile?.last_name?.toLowerCase().includes(q) ||
        o.tracking_number?.toLowerCase().includes(q)
      );
    }
    if (dateFilter !== 'all') {
      const now = new Date();
      const days = dateFilter === '7d' ? 7 : dateFilter === '30d' ? 30 : dateFilter === '90d' ? 90 : 0;
      if (days > 0) {
        const cutoff = new Date(now.getTime() - days * 86400000);
        result = result.filter(o => new Date(o.created_at) >= cutoff);
      }
    }
    return result;
  }, [orders, statusFilter, searchQuery, dateFilter]);

  const toggleSelect = (id: string) => {
    setSelectedOrders(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };
  const toggleSelectAll = () => {
    setSelectedOrders(selectedOrders.size === filteredOrders.length ? new Set() : new Set(filteredOrders.map(o => o.id)));
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedOrders.size === 0) return;
    setBulkUpdating(true);
    let s = 0;
    for (const id of selectedOrders) { const { error } = await updateOrderStatus(id, newStatus); if (!error) s++; }
    toast.success(`${s} orders updated`);
    setSelectedOrders(new Set());
    setBulkUpdating(false);
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdating(orderId);
    const tracking = trackingInfo[orderId];
    const { error } = await updateOrderStatus(orderId, newStatus, tracking);
    if (error) toast.error('Failed to update');
    else toast.success('Order updated');
    setUpdating(null);
  };

  // One-click courier dispatch
  const handleCourierDispatch = async () => {
    if (!courierDispatchOrder) return;
    setDispatching(true);
    try {
      const order = courierDispatchOrder;
      const addr = order.shipping_address || {};
      const { data, error } = await supabase.functions.invoke('shipping-provider', {
        body: {
          action: 'create_order',
          provider: dispatchProvider,
          payload: {
            order_id: order.order_number,
            recipient_name: `${order.profile?.first_name || ''} ${order.profile?.last_name || ''}`.trim() || 'Customer',
            recipient_phone: addr.phone || order.profile?.phone || '01700000000',
            recipient_address: `${addr.address || ''} ${addr.apartment || ''} ${addr.city || ''} ${addr.state || ''} ${addr.zip_code || ''}`.trim(),
            amount_to_collect: order.payment_method === 'cod' ? order.total : 0,
            item_description: order.items?.map((i: any) => `${i.product_name} x${i.quantity}`).join(', ') || 'Products',
            item_quantity: order.items?.reduce((s: number, i: any) => s + i.quantity, 0) || 1,
            item_weight: 0.5,
            note: `Order #${order.order_number}`,
          },
        },
      });
      if (error) throw error;
      if (data?.consignment_id || data?.tracking_code) {
        await updateOrderStatus(order.id, 'processing', {
          carrier: dispatchProvider,
          tracking_number: data.consignment_id || data.tracking_code || '',
        });
        toast.success(`Order dispatched to ${dispatchProvider}! Tracking: ${data.consignment_id || data.tracking_code || 'pending'}`);
      } else {
        toast.success('Order sent to courier successfully');
      }
      setCourierDispatchOrder(null);
    } catch (e: any) {
      toast.error('Dispatch failed: ' + (e.message || 'Unknown error'));
    }
    setDispatching(false);
  };

  const printInvoice = () => {
    const win = window.open('', '_blank');
    if (!win || !invoiceOrder) return;
    const o = invoiceOrder;
    const addr = o.shipping_address || {};
    win.document.write(`<!DOCTYPE html><html><head><title>Invoice #${o.order_number}</title>
    <style>body{font-family:Arial,sans-serif;padding:40px;max-width:800px;margin:0 auto}
    .header{display:flex;justify-content:space-between;border-bottom:2px solid #333;padding-bottom:20px;margin-bottom:20px}
    .title{font-size:28px;font-weight:bold}table{width:100%;border-collapse:collapse;margin:20px 0}
    th,td{padding:10px;text-align:left;border-bottom:1px solid #ddd}th{background:#f5f5f5;font-weight:600}
    .total-row{font-weight:bold;font-size:16px}.footer{margin-top:40px;text-align:center;color:#888;font-size:12px}</style></head>
    <body><div class="header"><div><div class="title">INVOICE</div><div>#${o.order_number}</div>
    <div>Date: ${format(new Date(o.created_at), 'MMM d, yyyy')}</div></div>
    <div style="text-align:right"><div><strong>Bill To:</strong></div>
    <div>${o.profile?.first_name || ''} ${o.profile?.last_name || ''}</div>
    <div>${o.profile?.email || ''}</div>
    <div>${addr.address || ''} ${addr.city || ''}</div></div></div>
    <table><thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead><tbody>
    ${(o.items || []).map((i: any) => `<tr><td>${i.product_name}</td><td>${i.quantity}</td><td>$${i.price.toFixed(2)}</td><td>$${(i.price * i.quantity).toFixed(2)}</td></tr>`).join('')}
    </tbody></table>
    <div style="text-align:right;margin-top:20px">
    <div>Subtotal: $${o.subtotal?.toFixed(2) || '0.00'}</div>
    <div>Shipping: $${o.shipping?.toFixed(2) || '0.00'}</div>
    <div>Tax: $${o.tax?.toFixed(2) || '0.00'}</div>
    ${o.discount > 0 ? `<div>Discount: -$${o.discount.toFixed(2)}</div>` : ''}
    <div class="total-row" style="margin-top:10px;padding-top:10px;border-top:2px solid #333">Total: $${o.total.toFixed(2)}</div>
    </div><div>Payment: ${o.payment_method?.toUpperCase()}</div>
    ${o.carrier ? `<div>Carrier: ${o.carrier} | Tracking: ${o.tracking_number || 'N/A'}</div>` : ''}
    <div class="footer">Thank you for your order!</div></body></html>`);
    win.document.close();
    win.print();
  };

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>;

  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mb-6">
        {[
          { label: 'Total', value: stats.total, icon: Package, color: 'text-primary' },
          { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-yellow-500' },
          { label: 'Processing', value: stats.processing, icon: Package, color: 'text-blue-500' },
          { label: 'Shipped', value: stats.shipped, icon: Truck, color: 'text-purple-500' },
          { label: 'Delivered', value: stats.delivered, icon: CheckCircle, color: 'text-green-500' },
          { label: 'Cancelled', value: stats.cancelled, icon: XCircle, color: 'text-red-500' },
          { label: 'Revenue', value: `$${stats.totalRevenue.toFixed(0)}`, icon: DollarSign, color: 'text-accent' },
        ].map((s, i) => (
          <Card key={i} className="border border-border">
            <CardContent className="p-3 flex items-center gap-2">
              <s.icon className={cn('h-4 w-4 shrink-0', s.color)} />
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground truncate">{s.label}</p>
                <p className="text-sm font-bold text-foreground">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-5 w-5" />
              All Orders ({filteredOrders.length}{statusFilter !== 'all' || searchQuery ? `/${orders.length}` : ''})
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Search orders..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-8 h-8 w-40 text-xs" />
              </div>
              <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setSelectedOrders(new Set()); }}>
                <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{t(v.labelKey as any)}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-[110px] h-8 text-xs"><SelectValue placeholder="Date" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => exportToCSV(
                orders.map(o => ({
                  order_number: o.order_number, customer: `${o.profile?.first_name || ''} ${o.profile?.last_name || ''}`.trim(),
                  email: o.profile?.email || '', status: o.status, total: o.total?.toFixed(2), carrier: o.carrier || '',
                  tracking: o.tracking_number || '', date: format(new Date(o.created_at), 'yyyy-MM-dd'),
                })),
                [{ key: 'order_number', label: 'Order #' }, { key: 'customer', label: 'Customer' }, { key: 'email', label: 'Email' },
                { key: 'status', label: 'Status' }, { key: 'total', label: 'Total' }, { key: 'carrier', label: 'Carrier' },
                { key: 'tracking', label: 'Tracking' }, { key: 'date', label: 'Date' }], 'orders'
              )}>
                <Download className="h-3.5 w-3.5 mr-1" /> Export
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Bulk Actions */}
        {selectedOrders.size > 0 && (
          <div className="mx-4 mb-3 p-3 bg-accent/10 border border-accent/20 rounded-lg flex flex-wrap items-center gap-3">
            <span className="text-xs font-medium">{selectedOrders.size} selected</span>
            <Select onValueChange={handleBulkStatusUpdate} disabled={bulkUpdating}>
              <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue placeholder="Change status..." /></SelectTrigger>
              <SelectContent>
                {Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{t(v.labelKey as any)}</SelectItem>)}
              </SelectContent>
            </Select>
            {bulkUpdating && <Loader2 className="h-4 w-4 animate-spin text-accent" />}
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => setSelectedOrders(new Set())}>Cancel</Button>
          </div>
        )}

        <CardContent>
          {/* Select All */}
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-border">
            <Checkbox checked={selectedOrders.size === filteredOrders.length && filteredOrders.length > 0} onCheckedChange={toggleSelectAll} className="h-4 w-4" />
            <span className="text-xs text-muted-foreground">Select all</span>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{searchQuery ? 'No orders match your search' : 'No orders found'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((order) => {
                const status = statusConfig[order.status] || statusConfig.pending;
                const StatusIcon = status.icon;
                const isExpanded = expandedOrder === order.id;
                const isSelected = selectedOrders.has(order.id);

                return (
                  <div key={order.id} className={cn("border rounded-lg overflow-hidden transition-all", isSelected && "border-accent/50 bg-accent/5")}>
                    <div className="p-3 md:p-4 flex flex-col sm:flex-row sm:items-center justify-between cursor-pointer hover:bg-secondary/50 transition-colors gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <Checkbox checked={isSelected} onCheckedChange={() => toggleSelect(order.id)} onClick={e => e.stopPropagation()} className="h-4 w-4 shrink-0" />
                        <div className="min-w-0" onClick={() => setExpandedOrder(isExpanded ? null : order.id)}>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm">#{order.order_number}</p>
                            <Badge className={cn('gap-1 text-[10px] px-1.5', status.color)}>
                              <StatusIcon className="h-3 w-3" />{t(status.labelKey as any)}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {order.profile?.first_name} {order.profile?.last_name} • {order.profile?.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap" onClick={() => setExpandedOrder(isExpanded ? null : order.id)}>
                        <span className="font-bold text-sm">${order.total.toFixed(2)}</span>
                        <span className="text-[10px] text-muted-foreground hidden sm:inline">{format(new Date(order.created_at), 'MMM d, yyyy')}</span>
                        <div className="flex items-center gap-0.5">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); setInvoiceOrder(order); }} title="Invoice">
                            <FileText className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); setCourierDispatchOrder(order); }} title="Send to Courier">
                            <Truck className="h-3.5 w-3.5 text-primary" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={e => { e.stopPropagation(); setFraudOrder(order); }} title="Fraud Check">
                            <ShieldAlert className="h-3.5 w-3.5" />
                          </Button>
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="p-4 border-t bg-secondary/20">
                        <div className="grid md:grid-cols-3 gap-6">
                          {/* Order Items */}
                          <div>
                            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2"><Package className="h-4 w-4" /> Items</h4>
                            <div className="space-y-2">
                              {order.items?.map((item: any) => (
                                <div key={item.id} className="flex items-center gap-3 p-2 bg-background rounded-lg">
                                  {item.product_image && <img src={item.product_image} alt="" className="w-10 h-10 rounded object-cover" />}
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">{item.product_name}</p>
                                    <p className="text-xs text-muted-foreground">{item.quantity} × ${item.price.toFixed(2)}</p>
                                  </div>
                                  <span className="text-sm font-semibold">${(item.quantity * item.price).toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                            {/* Order Summary */}
                            <div className="mt-3 p-3 bg-background rounded-lg space-y-1 text-sm">
                              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>${order.subtotal?.toFixed(2)}</span></div>
                              <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>${order.shipping?.toFixed(2)}</span></div>
                              <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>${order.tax?.toFixed(2)}</span></div>
                              {order.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-${order.discount.toFixed(2)}</span></div>}
                              <Separator />
                              <div className="flex justify-between font-bold"><span>Total</span><span>${order.total.toFixed(2)}</span></div>
                            </div>
                          </div>

                          {/* Shipping & Customer */}
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2"><MapPin className="h-4 w-4" /> Shipping Address</h4>
                              <div className="p-3 bg-background rounded-lg text-sm space-y-1">
                                <p className="font-medium">{order.profile?.first_name} {order.profile?.last_name}</p>
                                <p className="text-muted-foreground">{order.shipping_address?.address || 'N/A'}</p>
                                {order.shipping_address?.apartment && <p className="text-muted-foreground">{order.shipping_address.apartment}</p>}
                                <p className="text-muted-foreground">
                                  {order.shipping_address?.city}{order.shipping_address?.state ? `, ${order.shipping_address.state}` : ''} {order.shipping_address?.zip_code}
                                </p>
                                <p className="text-muted-foreground">{order.shipping_address?.country}</p>
                                {order.shipping_address?.phone && <p className="text-muted-foreground flex items-center gap-1">📞 {order.shipping_address.phone}</p>}
                              </div>
                            </div>
                            <div>
                              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2"><CreditCard className="h-4 w-4" /> Payment</h4>
                              <div className="p-3 bg-background rounded-lg text-sm">
                                <Badge variant="outline" className="text-xs">{order.payment_method?.toUpperCase()}</Badge>
                                <p className="text-xs text-muted-foreground mt-1">Placed: {format(new Date(order.created_at), 'PPpp')}</p>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="space-y-4">
                            <div>
                              <Label className="text-sm">Update Status</Label>
                              <Select value={order.status} onValueChange={v => handleStatusUpdate(order.id, v)} disabled={updating === order.id}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{t(v.labelKey as any)}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div><Label className="text-xs">Carrier</Label>
                                <Input className="h-8 text-sm" placeholder="e.g., Steadfast" value={trackingInfo[order.id]?.carrier || order.carrier || ''} onChange={e => setTrackingInfo(p => ({ ...p, [order.id]: { ...p[order.id], carrier: e.target.value } }))} />
                              </div>
                              <div><Label className="text-xs">Tracking #</Label>
                                <Input className="h-8 text-sm" placeholder="#" value={trackingInfo[order.id]?.tracking_number || order.tracking_number || ''} onChange={e => setTrackingInfo(p => ({ ...p, [order.id]: { ...p[order.id], tracking_number: e.target.value } }))} />
                              </div>
                            </div>
                            <Button className="w-full gap-2" size="sm" onClick={() => handleStatusUpdate(order.id, order.status)} disabled={updating === order.id}>
                              {updating === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                              Save Tracking
                            </Button>
                            {order.tracking_number && (
                              <div className="p-2 bg-background rounded text-xs text-muted-foreground flex items-center gap-2">
                                <Truck className="h-3.5 w-3.5" /> {order.carrier} — {order.tracking_number}
                              </div>
                            )}
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" className="flex-1 text-xs gap-1" onClick={() => { setInvoiceOrder(order); }}>
                                <Printer className="h-3.5 w-3.5" /> Invoice
                              </Button>
                              <Button variant="outline" size="sm" className="flex-1 text-xs gap-1" onClick={() => setCourierDispatchOrder(order)}>
                                <Truck className="h-3.5 w-3.5" /> Dispatch
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fraud Modal */}
      <FraudDetectionModal open={!!fraudOrder} onOpenChange={open => !open && setFraudOrder(null)} order={fraudOrder} />

      {/* Invoice Modal */}
      <Dialog open={!!invoiceOrder} onOpenChange={open => !open && setInvoiceOrder(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Invoice #{invoiceOrder?.order_number}</DialogTitle></DialogHeader>
          {invoiceOrder && (
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <div>
                  <p className="font-semibold">{invoiceOrder.profile?.first_name} {invoiceOrder.profile?.last_name}</p>
                  <p className="text-muted-foreground">{invoiceOrder.profile?.email}</p>
                  <p className="text-muted-foreground">{invoiceOrder.shipping_address?.address} {invoiceOrder.shipping_address?.city}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">Invoice #{invoiceOrder.order_number}</p>
                  <p className="text-muted-foreground">{format(new Date(invoiceOrder.created_at), 'PPP')}</p>
                  <Badge className={statusConfig[invoiceOrder.status]?.color}>{invoiceOrder.status}</Badge>
                </div>
              </div>
              <Table>
                <TableHeader><TableRow><TableHead>Item</TableHead><TableHead className="text-right">Qty</TableHead><TableHead className="text-right">Price</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                <TableBody>
                  {invoiceOrder.items?.map((item: any) => (
                    <TableRow key={item.id}><TableCell>{item.product_name}</TableCell><TableCell className="text-right">{item.quantity}</TableCell><TableCell className="text-right">${item.price.toFixed(2)}</TableCell><TableCell className="text-right">${(item.quantity * item.price).toFixed(2)}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="text-right space-y-1 text-sm">
                <div>Subtotal: ${invoiceOrder.subtotal?.toFixed(2)}</div>
                <div>Shipping: ${invoiceOrder.shipping?.toFixed(2)}</div>
                <div>Tax: ${invoiceOrder.tax?.toFixed(2)}</div>
                {invoiceOrder.discount > 0 && <div className="text-green-600">Discount: -${invoiceOrder.discount.toFixed(2)}</div>}
                <div className="text-lg font-bold border-t pt-2">Total: ${invoiceOrder.total.toFixed(2)}</div>
              </div>
              <Button onClick={printInvoice} className="w-full gap-2"><Printer className="h-4 w-4" /> Print Invoice</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Courier Dispatch Modal */}
      <Dialog open={!!courierDispatchOrder} onOpenChange={open => !open && setCourierDispatchOrder(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Truck className="h-5 w-5 text-primary" /> Dispatch to Courier</DialogTitle></DialogHeader>
          {courierDispatchOrder && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
                <div className="flex justify-between"><span className="text-muted-foreground">Order</span><span className="font-semibold">#{courierDispatchOrder.order_number}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Customer</span><span>{courierDispatchOrder.profile?.first_name} {courierDispatchOrder.profile?.last_name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-bold">${courierDispatchOrder.total.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Payment</span><Badge variant="outline" className="text-xs">{courierDispatchOrder.payment_method?.toUpperCase()}</Badge></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Items</span><span>{courierDispatchOrder.items?.length || 0} items</span></div>
              </div>
              <div className="space-y-2">
                <Label>Select Courier Provider</Label>
                <Select value={dispatchProvider} onValueChange={setDispatchProvider}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shiprocket">🚀 Shiprocket</SelectItem>
                    <SelectItem value="steadfast">📦 Steadfast</SelectItem>
                    <SelectItem value="pathao">🏍️ Pathao</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCourierDispatch} disabled={dispatching} className="w-full gap-2">
                {dispatching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send to {dispatchProvider.charAt(0).toUpperCase() + dispatchProvider.slice(1)}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
