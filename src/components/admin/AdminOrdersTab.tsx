import { useState, useMemo, useEffect } from 'react';
import {
  Package, Truck, CheckCircle, Clock, ChevronDown, Loader2, Send, ShieldAlert, Download,
  Printer, Search, FileText, CreditCard, MapPin, DollarSign, XCircle, Phone, MessageCircle,
  MoreVertical, Eye, ArrowUpDown, UserPlus, Edit, Trash2,
} from 'lucide-react';
import { FraudDetectionModal } from '@/components/admin/FraudDetectionModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAdminOrders } from '@/hooks/useAdminData';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { exportToCSV } from '@/lib/csvExport';
import { supabase } from '@/integrations/supabase/client';

interface CourierOption {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: Clock },
  processing: { label: 'Processing', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Package },
  shipped: { label: 'Shipped', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: Truck },
  out_for_delivery: { label: 'Out for Delivery', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', icon: Truck },
  delivered: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
  sent_to_courier: { label: 'Sent To Courier', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400', icon: Truck },
};

const normalizeShippingAddress = (shippingAddress: any = {}) => ({
  first_name: shippingAddress?.first_name || shippingAddress?.firstName || '',
  last_name: shippingAddress?.last_name || shippingAddress?.lastName || '',
  email: shippingAddress?.email || '',
  phone: shippingAddress?.phone || '',
  address: shippingAddress?.address || '',
  apartment: shippingAddress?.apartment || '',
  city: shippingAddress?.city || '',
  state: shippingAddress?.state || '',
  zip_code: shippingAddress?.zip_code || shippingAddress?.zipCode || '',
  country: shippingAddress?.country || '',
});

const isPhoneAliasEmail = (value: string | null | undefined) => typeof value === 'string' && /^phone_\d+@phone\.local$/i.test(value.trim());
const isGuestLikeOrder = (order: any) => !order?.user_id || isPhoneAliasEmail(order?.profile?.email);

const getOrderCustomerName = (order: any) => {
  const sa = normalizeShippingAddress(order?.shipping_address);
  const firstName = order?.profile?.first_name || sa.first_name || 'Guest';
  const lastName = order?.profile?.last_name || sa.last_name || '';
  return `${firstName} ${lastName}`.trim() || 'Guest';
};

const getOrderCustomerEmail = (order: any) => {
  const sa = normalizeShippingAddress(order?.shipping_address);
  const profileEmail = isPhoneAliasEmail(order?.profile?.email) ? null : order?.profile?.email;
  return profileEmail || order?.guest_email || sa.email || 'N/A';
};

const getOrderCustomerPhone = (order: any) => {
  const sa = normalizeShippingAddress(order?.shipping_address);
  return order?.profile?.phone || order?.guest_phone || sa.phone || '';
};

const getInitials = (name: string) => {
  const parts = name.split(' ').filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (parts[0]?.[0] || '?').toUpperCase();
};

const avatarColors = [
  'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-orange-500',
  'bg-pink-500', 'bg-teal-500', 'bg-indigo-500', 'bg-rose-500',
];

const getAvatarColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
};

export const AdminOrdersTab = () => {
  const { orders, isLoading, updateOrderStatus } = useAdminOrders();
  const [updating, setUpdating] = useState<string | null>(null);
  const [trackingInfo, setTrackingInfo] = useState<Record<string, { carrier: string; tracking_number: string }>>({});
  const [fraudOrder, setFraudOrder] = useState<any>(null);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [invoiceOrder, setInvoiceOrder] = useState<any>(null);
  const [detailOrder, setDetailOrder] = useState<any>(null);
  const [courierDispatchOrder, setCourierDispatchOrder] = useState<any>(null);
  const [dispatchProvider, setDispatchProvider] = useState('');
  const [dispatching, setDispatching] = useState(false);
  const [sortField, setSortField] = useState<'date' | 'total'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [editOrder, setEditOrder] = useState<any>(null);
  const [editStatus, setEditStatus] = useState('');
  const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [couriers, setCouriers] = useState<CourierOption[]>([]);
  const { t } = useLanguage();

  // Fetch active couriers
  useEffect(() => {
    const fetchCouriers = async () => {
      const { data } = await (supabase as any).from('couriers').select('id, name, code, is_active').eq('is_active', true).order('name');
      if (data) setCouriers(data);
    };
    fetchCouriers();
  }, []);

  // Stats
  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter(o => o.status === 'pending').length;
    const completed = orders.filter(o => o.status === 'delivered').length;
    const totalSales = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + (o.total || 0), 0);
    return { total, pending, completed, totalSales };
  }, [orders]);

  // Filter & sort
  const filteredOrders = useMemo(() => {
    let result = orders;
    if (statusFilter !== 'all') result = result.filter(o => o.status === statusFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(o =>
        o.order_number?.toLowerCase().includes(q) ||
        getOrderCustomerEmail(o).toLowerCase().includes(q) ||
        getOrderCustomerName(o).toLowerCase().includes(q) ||
        getOrderCustomerPhone(o).toLowerCase().includes(q)
      );
    }
    result = [...result].sort((a, b) => {
      if (sortField === 'date') {
        const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        return sortDir === 'asc' ? diff : -diff;
      }
      return sortDir === 'asc' ? a.total - b.total : b.total - a.total;
    });
    return result;
  }, [orders, statusFilter, searchQuery, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / perPage));
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * perPage, currentPage * perPage);

  const toggleSelect = (id: string) => {
    setSelectedOrders(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };
  const toggleSelectAll = () => {
    setSelectedOrders(selectedOrders.size === paginatedOrders.length ? new Set() : new Set(paginatedOrders.map(o => o.id)));
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

  const handleCourierDispatch = async () => {
    if (!courierDispatchOrder) return;
    setDispatching(true);
    try {
      const order = courierDispatchOrder;
      const addr = normalizeShippingAddress(order.shipping_address);
      const customerName = getOrderCustomerName(order);
      const customerPhone = getOrderCustomerPhone(order);
      const { data, error } = await supabase.functions.invoke('shipping-provider', {
        body: {
          action: 'create_order', provider: dispatchProvider,
          payload: {
            order_id: order.order_number, recipient_name: customerName,
            recipient_phone: customerPhone || '01700000000',
            recipient_address: `${addr.address || ''} ${addr.apartment || ''} ${addr.city || ''} ${addr.state || ''} ${addr.zip_code || ''}`.trim(),
            amount_to_collect: order.payment_method === 'cod' ? order.total : 0,
            item_description: order.items?.map((i: any) => `${i.product_name} x${i.quantity}`).join(', ') || 'Products',
            item_quantity: order.items?.reduce((s: number, i: any) => s + i.quantity, 0) || 1,
            item_weight: 0.5, note: `Order #${order.order_number}`,
          },
        },
      });
      if (error) throw error;
      if (data?.consignment_id || data?.tracking_code) {
        await updateOrderStatus(order.id, 'processing', { carrier: dispatchProvider, tracking_number: data.consignment_id || data.tracking_code || '' });
        toast.success(`Order dispatched! Tracking: ${data.consignment_id || data.tracking_code || 'pending'}`);
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
    const addr = normalizeShippingAddress(o.shipping_address);
    const customerName = getOrderCustomerName(o);
    const customerEmail = getOrderCustomerEmail(o);
    const esc = (s: unknown) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    win.document.write(`<!DOCTYPE html><html><head><title>Invoice #${esc(o.order_number)}</title>
    <style>body{font-family:Arial,sans-serif;padding:40px;max-width:800px;margin:0 auto}
    .header{display:flex;justify-content:space-between;border-bottom:2px solid #333;padding-bottom:20px;margin-bottom:20px}
    .title{font-size:28px;font-weight:bold}table{width:100%;border-collapse:collapse;margin:20px 0}
    th,td{padding:10px;text-align:left;border-bottom:1px solid #ddd}th{background:#f5f5f5;font-weight:600}
    .total-row{font-weight:bold;font-size:16px}.footer{margin-top:40px;text-align:center;color:#888;font-size:12px}</style></head>
    <body><div class="header"><div><div class="title">INVOICE</div><div>#${esc(o.order_number)}</div>
    <div>Date: ${format(new Date(o.created_at), 'MMM d, yyyy')}</div></div>
    <div style="text-align:right"><div><strong>Bill To:</strong></div><div>${esc(customerName)}</div><div>${esc(customerEmail)}</div>
    <div>${esc([addr.address, addr.apartment, addr.city, addr.state, addr.zip_code].filter(Boolean).join(', '))}</div></div></div>
    <table><thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead><tbody>
    ${(o.items || []).map((i: any) => `<tr><td>${esc(i.product_name)}</td><td>${esc(i.quantity)}</td><td>৳${Number(i.price || 0).toFixed(2)}</td><td>৳${(Number(i.price || 0) * Number(i.quantity || 0)).toFixed(2)}</td></tr>`).join('')}
    </tbody></table>
    <div style="text-align:right;margin-top:20px">
    <div>Subtotal: ৳${o.subtotal?.toFixed(2) || '0.00'}</div><div>Shipping: ৳${o.shipping?.toFixed(2) || '0.00'}</div>
    <div>Tax: ৳${o.tax?.toFixed(2) || '0.00'}</div>${o.discount > 0 ? `<div>Discount: -৳${o.discount.toFixed(2)}</div>` : ''}
    <div class="total-row" style="margin-top:10px;padding-top:10px;border-top:2px solid #333">Total: ৳${o.total.toFixed(2)}</div>
    </div><div class="footer">Thank you for your order!</div></body></html>`);
    win.document.close();
    win.print();
  };

  const toggleSort = (field: 'date' | 'total') => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>;

  return (
    <>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="border border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">৳{stats.totalSales.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total Sales</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
              <Package className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total Orders</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.completed}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Section */}
      <Card className="mb-6 border border-border">
        <CardContent className="p-4">
          <p className="text-sm font-semibold text-foreground mb-3">Filter</p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search (number, name, email, phone)" value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }} className="pl-9 h-9" />
            </div>
            <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setCurrentPage(1); setSelectedOrders(new Set()); }}>
              <SelectTrigger className="w-full sm:w-[160px] h-9"><SelectValue placeholder="All Statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Select value={String(perPage)} onValueChange={v => { setPerPage(Number(v)); setCurrentPage(1); }}>
                <SelectTrigger className="w-[70px] h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[10, 25, 50, 100].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => exportToCSV(
                orders.map(o => ({
                  order_number: o.order_number, customer: getOrderCustomerName(o),
                  email: getOrderCustomerEmail(o), status: o.status, total: o.total?.toFixed(2),
                  payment: o.payment_method, carrier: o.carrier || '', tracking: o.tracking_number || '',
                  date: format(new Date(o.created_at), 'yyyy-MM-dd'),
                })),
                [{ key: 'order_number', label: 'Order #' }, { key: 'customer', label: 'Customer' }, { key: 'email', label: 'Email' },
                { key: 'status', label: 'Status' }, { key: 'total', label: 'Total' }, { key: 'payment', label: 'Payment' },
                { key: 'carrier', label: 'Carrier' }, { key: 'tracking', label: 'Tracking' }, { key: 'date', label: 'Date' }], 'orders'
              )} title="Export CSV">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedOrders.size > 0 && (
        <div className="mb-4 p-3 bg-accent/10 border border-accent/20 rounded-lg flex flex-wrap items-center gap-3">
          <span className="text-xs font-medium">{selectedOrders.size} selected</span>
          <Select onValueChange={handleBulkStatusUpdate} disabled={bulkUpdating}>
            <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue placeholder="Change status..." /></SelectTrigger>
            <SelectContent>
              {Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
          {bulkUpdating && <Loader2 className="h-4 w-4 animate-spin text-accent" />}
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => setSelectedOrders(new Set())}>Cancel</Button>
        </div>
      )}

      {/* Orders Table */}
      <Card className="border border-border">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-10">
                  <Checkbox checked={paginatedOrders.length > 0 && selectedOrders.size === paginatedOrders.length} onCheckedChange={toggleSelectAll} />
                </TableHead>
                <TableHead className="w-10 text-xs">Actions</TableHead>
                <TableHead className="text-xs">Order</TableHead>
                <TableHead className="text-xs hidden xl:table-cell">Assigned To</TableHead>
                <TableHead className="text-xs cursor-pointer select-none" onClick={() => toggleSort('date')}>
                  <span className="inline-flex items-center gap-1">Date <ArrowUpDown className="h-3 w-3" /></span>
                </TableHead>
                <TableHead className="text-xs">Customers</TableHead>
                <TableHead className="text-xs hidden 2xl:table-cell">IP</TableHead>
                <TableHead className="text-xs">Payment</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs hidden lg:table-cell">Courier</TableHead>
                <TableHead className="text-xs hidden lg:table-cell">Method</TableHead>
                <TableHead className="text-xs hidden xl:table-cell">Fraud</TableHead>
                <TableHead className="text-xs text-right cursor-pointer select-none" onClick={() => toggleSort('total')}>
                  <span className="inline-flex items-center gap-1">Total <ArrowUpDown className="h-3 w-3" /></span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={13} className="text-center py-12 text-muted-foreground">
                    {searchQuery ? 'No orders match your search' : 'No orders found'}
                  </TableCell>
                </TableRow>
              ) : paginatedOrders.map(order => {
                const status = statusConfig[order.status] || statusConfig.pending;
                const customerName = getOrderCustomerName(order);
                const customerEmail = getOrderCustomerEmail(order);
                const isSelected = selectedOrders.has(order.id);
                const isPaid = order.payment_method !== 'cod' || order.status === 'delivered';

                return (
                  <TableRow key={order.id} className={cn("hover:bg-muted/30 transition-colors", isSelected && "bg-accent/5")}>
                    <TableCell>
                      <Checkbox checked={isSelected} onCheckedChange={() => toggleSelect(order.id)} />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-48">
                          <DropdownMenuItem onClick={() => setDetailOrder(order)}><Eye className="h-4 w-4 mr-2" /> View Details</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setInvoiceOrder(order)}><FileText className="h-4 w-4 mr-2" /> Invoice</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setCourierDispatchOrder(order)}><Truck className="h-4 w-4 mr-2" /> Send to Courier</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setFraudOrder(order)} className="text-destructive"><ShieldAlert className="h-4 w-4 mr-2" /> Fraud Check</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                    <TableCell>
                      <button onClick={() => setDetailOrder(order)} className="text-primary hover:underline text-xs font-medium">
                        #{order.order_number}
                      </button>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      <span className="text-xs text-muted-foreground">Unassigned</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(order.created_at), 'M/d/yyyy hh:mm a')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={cn('h-7 w-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0', getAvatarColor(customerName))}>
                          {getInitials(customerName)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate max-w-[120px]">{customerName}</p>
                          <p className="text-[10px] text-muted-foreground truncate max-w-[120px]">{customerEmail}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden 2xl:table-cell">
                      <span className="text-[11px] text-muted-foreground">—</span>
                    </TableCell>
                    <TableCell>
                      <span className={cn('text-xs font-medium inline-flex items-center gap-1', isPaid ? 'text-emerald-600' : 'text-orange-500')}>
                        <span className={cn('h-1.5 w-1.5 rounded-full', isPaid ? 'bg-emerald-500' : 'bg-orange-500')} />
                        {isPaid ? 'Paid' : 'Unpaid'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('text-[10px] px-2 py-0.5 font-medium whitespace-nowrap', status.color)}>
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="text-xs text-muted-foreground">{order.carrier || '—'}</span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex items-center gap-1">
                        <CreditCard className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs uppercase">{order.payment_method || '—'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      {isGuestLikeOrder(order) ? (
                        <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800">
                          New Customer (0%)
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-xs font-bold whitespace-nowrap">৳{Number(order.total).toLocaleString()}</span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-border flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Showing {(currentPage - 1) * perPage + 1}–{Math.min(currentPage * perPage, filteredOrders.length)} of {filteredOrders.length}
            </p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" className="h-7 text-xs" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Prev</Button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let page: number;
                if (totalPages <= 5) page = i + 1;
                else if (currentPage <= 3) page = i + 1;
                else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
                else page = currentPage - 2 + i;
                return (
                  <Button key={page} variant={currentPage === page ? 'default' : 'outline'} size="sm" className="h-7 w-7 text-xs p-0" onClick={() => setCurrentPage(page)}>
                    {page}
                  </Button>
                );
              })}
              <Button variant="outline" size="sm" className="h-7 text-xs" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </Card>

      {/* Order Detail Modal */}
      <Dialog open={!!detailOrder} onOpenChange={open => !open && setDetailOrder(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Package className="h-5 w-5" /> Order #{detailOrder?.order_number}</DialogTitle></DialogHeader>
          {detailOrder && (() => {
            const o = detailOrder;
            const addr = normalizeShippingAddress(o.shipping_address);
            const cName = getOrderCustomerName(o);
            const cEmail = getOrderCustomerEmail(o);
            const cPhone = getOrderCustomerPhone(o);
            const st = statusConfig[o.status] || statusConfig.pending;
            return (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <Badge className={cn('text-xs px-3 py-1', st.color)}>{st.label}</Badge>
                  {isGuestLikeOrder(o) && <Badge variant="outline">Guest</Badge>}
                  <span className="text-xs text-muted-foreground ml-auto">{format(new Date(o.created_at), 'PPpp')}</span>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Customer */}
                  <div>
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2"><MapPin className="h-4 w-4" /> Customer & Shipping</h4>
                    <div className="p-3 bg-muted/50 rounded-lg text-sm space-y-1">
                      <p className="font-medium">{cName}</p>
                      <p className="text-muted-foreground">{cEmail}</p>
                      <p className="text-muted-foreground">{addr.address || 'N/A'}</p>
                      {addr.apartment && <p className="text-muted-foreground">{addr.apartment}</p>}
                      <p className="text-muted-foreground">{[addr.city, addr.state, addr.zip_code].filter(Boolean).join(', ')}</p>
                      <p className="text-muted-foreground">{addr.country}</p>
                      {cPhone && (
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-muted-foreground">📞 {cPhone}</span>
                          <a href={`tel:${cPhone}`} className="text-xs px-2 py-0.5 bg-green-500/10 text-green-600 rounded"><Phone className="h-3 w-3 inline mr-1" />Call</a>
                          <a href={`https://wa.me/${cPhone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-0.5 bg-emerald-500/10 text-emerald-600 rounded"><MessageCircle className="h-3 w-3 inline mr-1" />WhatsApp</a>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Update Status */}
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm">Update Status</Label>
                      <Select value={o.status} onValueChange={v => handleStatusUpdate(o.id, v)} disabled={updating === o.id}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><Label className="text-xs">Carrier</Label>
                        <Input className="h-8 text-sm" placeholder="e.g., Steadfast" value={trackingInfo[o.id]?.carrier || o.carrier || ''} onChange={e => setTrackingInfo(p => ({ ...p, [o.id]: { ...p[o.id], carrier: e.target.value } }))} />
                      </div>
                      <div><Label className="text-xs">Tracking #</Label>
                        <Input className="h-8 text-sm" placeholder="#" value={trackingInfo[o.id]?.tracking_number || o.tracking_number || ''} onChange={e => setTrackingInfo(p => ({ ...p, [o.id]: { ...p[o.id], tracking_number: e.target.value } }))} />
                      </div>
                    </div>
                    <Button className="w-full gap-2" size="sm" onClick={() => handleStatusUpdate(o.id, o.status)} disabled={updating === o.id}>
                      {updating === o.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Save Tracking
                    </Button>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 text-xs gap-1" onClick={() => { setDetailOrder(null); setInvoiceOrder(o); }}><Printer className="h-3.5 w-3.5" /> Invoice</Button>
                      <Button variant="outline" size="sm" className="flex-1 text-xs gap-1" onClick={() => { setDetailOrder(null); setCourierDispatchOrder(o); }}><Truck className="h-3.5 w-3.5" /> Dispatch</Button>
                    </div>
                  </div>
                </div>
                {/* Items */}
                <div>
                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2"><Package className="h-4 w-4" /> Items</h4>
                  <Table>
                    <TableHeader><TableRow><TableHead>Item</TableHead><TableHead className="text-right">Qty</TableHead><TableHead className="text-right">Price</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {o.items?.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell className="flex items-center gap-2">{item.product_image && <img src={item.product_image} alt="" className="w-8 h-8 rounded object-cover" />}<span className="text-sm">{item.product_name}</span></TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">৳{Number(item.price).toFixed(2)}</TableCell>
                          <TableCell className="text-right font-medium">৳{(item.quantity * item.price).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="text-right space-y-1 text-sm mt-3">
                    <div>Subtotal: ৳{o.subtotal?.toFixed(2)}</div>
                    <div>Shipping: ৳{o.shipping?.toFixed(2)}</div>
                    <div>Tax: ৳{o.tax?.toFixed(2)}</div>
                    {o.discount > 0 && <div className="text-green-600">Discount: -৳{o.discount.toFixed(2)}</div>}
                    <Separator />
                    <div className="text-lg font-bold">Total: ৳{o.total.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Fraud Modal */}
      <FraudDetectionModal open={!!fraudOrder} onOpenChange={open => !open && setFraudOrder(null)} order={fraudOrder} />

      {/* Invoice Modal */}
      <Dialog open={!!invoiceOrder} onOpenChange={open => !open && setInvoiceOrder(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Invoice #{invoiceOrder?.order_number}</DialogTitle></DialogHeader>
          {invoiceOrder && (() => {
            const o = invoiceOrder;
            const addr = normalizeShippingAddress(o.shipping_address);
            const cName = getOrderCustomerName(o);
            const cEmail = getOrderCustomerEmail(o);
            const cPhone = getOrderCustomerPhone(o);
            return (
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <div><p className="font-semibold">{cName}</p><p className="text-muted-foreground">{cEmail}</p>{cPhone && <p className="text-muted-foreground">{cPhone}</p>}<p className="text-muted-foreground">{[addr.address, addr.apartment, addr.city, addr.state, addr.zip_code].filter(Boolean).join(', ') || 'N/A'}</p></div>
                  <div className="text-right"><p className="font-semibold">Invoice #{o.order_number}</p><p className="text-muted-foreground">{format(new Date(o.created_at), 'PPP')}</p><Badge className={statusConfig[o.status]?.color}>{o.status}</Badge></div>
                </div>
                <Table>
                  <TableHeader><TableRow><TableHead>Item</TableHead><TableHead className="text-right">Qty</TableHead><TableHead className="text-right">Price</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                  <TableBody>{o.items?.map((item: any) => (<TableRow key={item.id}><TableCell>{item.product_name}</TableCell><TableCell className="text-right">{item.quantity}</TableCell><TableCell className="text-right">৳{item.price.toFixed(2)}</TableCell><TableCell className="text-right">৳{(item.quantity * item.price).toFixed(2)}</TableCell></TableRow>))}</TableBody>
                </Table>
                <div className="text-right space-y-1 text-sm">
                  <div>Subtotal: ৳{o.subtotal?.toFixed(2)}</div><div>Shipping: ৳{o.shipping?.toFixed(2)}</div><div>Tax: ৳{o.tax?.toFixed(2)}</div>
                  {o.discount > 0 && <div className="text-green-600">Discount: -৳{o.discount.toFixed(2)}</div>}
                  <div className="text-lg font-bold border-t pt-2">Total: ৳{o.total.toFixed(2)}</div>
                </div>
                <Button onClick={printInvoice} className="w-full gap-2"><Printer className="h-4 w-4" /> Print Invoice</Button>
              </div>
            );
          })()}
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
                <div className="flex justify-between"><span className="text-muted-foreground">Customer</span><span>{getOrderCustomerName(courierDispatchOrder)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-bold">৳{courierDispatchOrder.total.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Payment</span><Badge variant="outline" className="text-xs">{courierDispatchOrder.payment_method?.toUpperCase()}</Badge></div>
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
