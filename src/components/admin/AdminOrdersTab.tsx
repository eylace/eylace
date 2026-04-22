import { useState, useMemo, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import {
  Package, Truck, CheckCircle, Clock, Loader2, Send, ShieldAlert, Download,
  Printer, Search, FileText, CreditCard, MapPin, DollarSign, XCircle, Phone, MessageCircle,
  MoreVertical, Eye, ArrowUpDown, UserPlus, Edit, Trash2, Ban, Plus, RefreshCw, Globe,
} from 'lucide-react';
import { FraudDetectionModal } from '@/components/admin/FraudDetectionModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
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
import { EditOrderModal } from '@/components/admin/EditOrderModal';
import { CourierDispatchModal } from '@/components/admin/CourierDispatchModal';
import { CreateOrderModal } from '@/components/admin/CreateOrderModal';
import { CustomerContactBlock } from '@/components/orders/CustomerContactBlock';
import { OrderStatusLegend } from '@/components/orders/OrderStatusLegend';
import { AdminOrderStatusPanel } from '@/components/admin/AdminOrderStatusPanel';
import { formatRoleLabel } from '@/lib/roleLabels';
import { printSingleInvoice, printBulkInvoices, downloadSingleInvoice, downloadBulkInvoices } from '@/lib/invoiceGenerator';
import { computeFraudFromHistory, persistFraudCache, loadFraudCache, normalizePhone, type FraudResult } from '@/lib/fraudRisk';

interface CourierOption {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: Clock },
  processing: { label: 'Processing', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Package },
  packaging: { label: 'Packaging', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400', icon: Package },
  ready_to_ship: { label: 'Ready to Ship', color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400', icon: Package },
  sent_to_courier: { label: 'Sent To Courier', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400', icon: Truck },
  shipped: { label: 'Shipped', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: Truck },
  out_for_delivery: { label: 'Out for Delivery', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', icon: Truck },
  delivered: { label: 'Delivered', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400', icon: Truck },
  completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle },
  fulfilled: { label: 'Fulfilled', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle },
  returned: { label: 'Returned', color: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-400', icon: XCircle },
  refunded: { label: 'Refunded', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: XCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
  failed: { label: 'Failed', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400', icon: XCircle },
};

const statusSelectItemClassName = 'text-foreground focus:bg-muted focus:text-foreground data-[highlighted]:bg-muted data-[highlighted]:text-foreground';

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

// Expanded payment method mapping → consistent label + color across the panel
const PAYMENT_METHOD_MAP: Record<string, { label: string; cls: string }> = {
  cod:           { label: 'COD',          cls: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700/50' },
  cash:          { label: 'Cash',         cls: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700/50' },
  bkash:         { label: 'bKash',        cls: 'bg-pink-100 text-pink-700 border-pink-300 dark:bg-pink-900/30 dark:text-pink-400 dark:border-pink-700/50' },
  nagad:         { label: 'Nagad',        cls: 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-700/50' },
  rocket:        { label: 'Rocket',       cls: 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700/50' },
  upay:          { label: 'Upay',         cls: 'bg-cyan-100 text-cyan-700 border-cyan-300 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-700/50' },
  tap:           { label: 'Tap',          cls: 'bg-cyan-100 text-cyan-700 border-cyan-300 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-700/50' },
  sslcommerz:    { label: 'SSLCommerz',   cls: 'bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-700/50' },
  ssl:           { label: 'SSLCommerz',   cls: 'bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-700/50' },
  amarpay:       { label: 'aamarPay',     cls: 'bg-violet-100 text-violet-700 border-violet-300 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-700/50' },
  shurjopay:     { label: 'ShurjoPay',    cls: 'bg-teal-100 text-teal-700 border-teal-300 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-700/50' },
  portwallet:    { label: 'PortWallet',   cls: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-300 dark:bg-fuchsia-900/30 dark:text-fuchsia-400 dark:border-fuchsia-700/50' },
  stripe:        { label: 'Stripe',       cls: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700/50' },
  card:          { label: 'Card',         cls: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700/50' },
  paypal:        { label: 'PayPal',       cls: 'bg-sky-100 text-sky-700 border-sky-300 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-700/50' },
  razorpay:      { label: 'Razorpay',     cls: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700/50' },
  paystack:      { label: 'Paystack',     cls: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700/50' },
  bank:          { label: 'Bank Transfer',cls: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700/50' },
  wallet:        { label: 'Wallet',       cls: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-900/30 dark:text-slate-400 dark:border-slate-700/50' },
};
const resolvePaymentMethod = (method: string) => {
  const m = (method || '').toLowerCase().trim();
  if (!m) return { label: '—', cls: 'bg-muted text-muted-foreground border-border' };
  // Direct match
  if (PAYMENT_METHOD_MAP[m]) return PAYMENT_METHOD_MAP[m];
  // Fuzzy match on substring
  for (const key of Object.keys(PAYMENT_METHOD_MAP)) {
    if (m.includes(key)) return PAYMENT_METHOD_MAP[key];
  }
  return { label: method, cls: 'bg-muted text-muted-foreground border-border' };
};
const paymentMethodStyle = (method: string) => resolvePaymentMethod(method).cls;
const paymentMethodLabel = (method: string) => resolvePaymentMethod(method).label;

// =================== Fraud Risk Card (inline in Order Details modal) ===================
interface OrderFraudCardProps {
  order: any;
  result?: FraudResult;
  loading?: boolean;
  onRecheck: () => void;
}
const OrderFraudCard = ({ order, result, loading, onRecheck }: OrderFraudCardProps) => {
  const score = result?.risk_score ?? 0;
  const level = result?.risk_level ?? 'unknown';
  const successRate = Math.max(0, Math.min(100, 100 - score));
  const total = result?.total ?? 0;
  const success = result?.success ?? 0;
  const failed = result?.failed ?? 0;
  const pending = result?.pending ?? 0;
  const breakdown = result?.breakdown;
  const ringColor =
    level === 'high' || level === 'critical' ? 'hsl(var(--destructive))' :
    level === 'medium' ? '#f59e0b' :
    level === 'low' ? '#10b981' : 'hsl(var(--muted-foreground))';
  const badgeClass =
    level === 'high' || level === 'critical' ? 'bg-destructive/10 text-destructive border-destructive/30' :
    level === 'medium' ? 'bg-amber-500/10 text-amber-600 border-amber-500/30' :
    level === 'low' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' :
    'bg-muted text-muted-foreground';
  const ringBg = `conic-gradient(${ringColor} ${successRate * 3.6}deg, hsl(var(--muted)) 0deg)`;

  // REAL courier history pulled from the customer's order data
  const courierHistory = breakdown?.courier_history || [];

  return (
    <Card className="border border-border">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-primary" /> Fraud Risk
          </h3>
          <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs" onClick={onRecheck} disabled={loading}>
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Recheck
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Risk Level</span>
          <Badge variant="outline" className={cn('text-[10px] uppercase', badgeClass)}>
            {level === 'unknown' ? 'Pending' : `${level} risk`}
          </Badge>
        </div>

        {/* Success Ring */}
        <div className="flex items-center justify-center py-2">
          <div className="relative h-32 w-32 rounded-full" style={{ background: ringBg }}>
            <div className="absolute inset-2 rounded-full bg-card flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-foreground">{successRate.toFixed(1)}%</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Success</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-muted/40 p-2 text-center">
            <div className="text-[10px] text-muted-foreground">Total</div>
            <div className="text-base font-bold text-foreground">{total}</div>
          </div>
          <div className="rounded-lg bg-emerald-500/10 p-2 text-center">
            <div className="text-[10px] text-emerald-600">Success</div>
            <div className="text-base font-bold text-emerald-600">{success}</div>
          </div>
          <div className="rounded-lg bg-destructive/10 p-2 text-center">
            <div className="text-[10px] text-destructive">Failed</div>
            <div className="text-base font-bold text-destructive">{failed}</div>
          </div>
        </div>

        {/* === Fraud Breakdown — exact calculation transparency === */}
        {breakdown && (
          <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
            <h4 className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              Fraud Breakdown
            </h4>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
              <span className="text-muted-foreground">Delivered</span>
              <span className="text-right font-mono font-medium text-emerald-600">{breakdown.delivered ?? 0}</span>
              <span className="text-muted-foreground">Completed</span>
              <span className="text-right font-mono font-medium text-emerald-600">{breakdown.completed ?? 0}</span>
              <span className="text-muted-foreground">Fulfilled</span>
              <span className="text-right font-mono font-medium text-emerald-600">{breakdown.fulfilled ?? 0}</span>
              <span className="text-muted-foreground">Cancelled</span>
              <span className="text-right font-mono font-medium text-destructive">{breakdown.cancelled ?? 0}</span>
              <span className="text-muted-foreground">Failed</span>
              <span className="text-right font-mono font-medium text-destructive">{breakdown.failed ?? 0}</span>
              <span className="text-muted-foreground">Refunded</span>
              <span className="text-right font-mono font-medium text-destructive">{breakdown.refunded ?? 0}</span>
              <span className="text-muted-foreground">Pending</span>
              <span className="text-right font-mono font-medium text-amber-600">{pending}</span>
              <Separator className="col-span-2 my-1" />
              <span className="text-muted-foreground font-semibold">Risk Score</span>
              <span className="text-right font-mono font-bold text-foreground">{score}%</span>
            </div>
            <div className="rounded-md bg-card border border-border px-2 py-1.5 text-[10px] font-mono text-muted-foreground leading-relaxed">
              {breakdown.formula || '—'}
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">Success Rate</span>
            <span className="font-semibold text-foreground">{successRate.toFixed(1)}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${successRate}%`, backgroundColor: ringColor }} />
          </div>
        </div>

        {courierHistory.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground">Courier History</h4>
            {courierHistory.map((c) => (
              <div key={c.name} className="rounded-lg border border-border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck className="h-3.5 w-3.5 text-primary" />
                    <div>
                      <div className="text-sm font-medium">{c.name}</div>
                      <div className="text-[10px] text-muted-foreground">{c.parcels} parcels</div>
                    </div>
                  </div>
                  <Badge variant="outline" className={cn('text-[10px]', c.rate >= 75 ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' : c.rate >= 50 ? 'bg-amber-500/10 text-amber-600 border-amber-500/30' : 'bg-destructive/10 text-destructive border-destructive/30')}>
                    {c.rate}% rate
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div><div className="text-[10px] text-muted-foreground">Successful</div><div className="text-sm font-bold text-emerald-600">{c.success}</div></div>
                  <div><div className="text-[10px] text-muted-foreground">Failed</div><div className="text-sm font-bold text-destructive">{c.failed}</div></div>
                  <div><div className="text-[10px] text-muted-foreground">Rate</div><div className="text-sm font-bold text-primary">{c.rate}%</div></div>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${c.rate}%`, backgroundColor: ringColor }} />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>
            {breakdown?.computed_at
              ? `Cached: ${format(new Date(breakdown.computed_at), 'MMM d, yyyy HH:mm')}`
              : 'Not yet computed'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

// =================== Customer Block Card (inline in Order Details modal) ===================
interface OrderBlockCardProps {
  phone?: string;
  ip?: string;
}
const OrderBlockCard = ({ phone, ip }: OrderBlockCardProps) => {
  const [phoneBlocked, setPhoneBlocked] = useState(false);
  const [ipBlocked, setIpBlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      setLoading(true);
      const checks: Promise<any>[] = [];
      if (phone) checks.push((supabase as any).from('blocked_phones').select('id').eq('phone', phone).maybeSingle());
      else checks.push(Promise.resolve({ data: null }));
      if (ip) checks.push((supabase as any).from('blocked_ips').select('id').eq('ip_address', ip).maybeSingle());
      else checks.push(Promise.resolve({ data: null }));
      const [p, i] = await Promise.all(checks);
      if (!mounted) return;
      setPhoneBlocked(!!p?.data);
      setIpBlocked(!!i?.data);
      setLoading(false);
    };
    check();
    return () => { mounted = false; };
  }, [phone, ip]);

  const togglePhone = async (next: boolean) => {
    if (!phone) return;
    setBusy(true);
    if (next) {
      const { error } = await (supabase as any).from('blocked_phones').insert({ phone, reason: 'Blocked from order details' });
      if (error && error.code !== '23505') toast.error('Failed to block phone'); else { toast.success('Phone blocked'); setPhoneBlocked(true); }
    } else {
      const { error } = await (supabase as any).from('blocked_phones').delete().eq('phone', phone);
      if (error) toast.error('Failed to unblock phone'); else { toast.success('Phone unblocked'); setPhoneBlocked(false); }
    }
    setBusy(false);
  };

  const toggleIp = async (next: boolean) => {
    if (!ip) return;
    setBusy(true);
    if (next) {
      const { error } = await (supabase as any).from('blocked_ips').insert({ ip_address: ip, reason: 'Blocked from order details' });
      if (error && error.code !== '23505') toast.error('Failed to block IP'); else { toast.success('IP blocked'); setIpBlocked(true); }
    } else {
      const { error } = await (supabase as any).from('blocked_ips').delete().eq('ip_address', ip);
      if (error) toast.error('Failed to unblock IP'); else { toast.success('IP unblocked'); setIpBlocked(false); }
    }
    setBusy(false);
  };

  const blockBoth = async () => {
    if (phone && !phoneBlocked) await togglePhone(true);
    if (ip && !ipBlocked) await toggleIp(true);
  };

  return (
    <Card className="border border-border">
      <CardContent className="p-4 space-y-3">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Ban className="h-4 w-4 text-destructive" /> Customer Block
        </h3>

        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Block By Phone</div>
              <div className="text-sm font-medium font-mono">{phone || 'N/A'}</div>
            </div>
          </div>
          <Switch checked={phoneBlocked} onCheckedChange={togglePhone} disabled={!phone || loading || busy} />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Block By IP</div>
              <div className="text-sm font-medium font-mono">{ip || 'N/A'}</div>
            </div>
          </div>
          <Switch checked={ipBlocked} onCheckedChange={toggleIp} disabled={!ip || loading || busy} />
        </div>

        <Button
          variant="outline"
          className="w-full gap-2 border-destructive/30 text-destructive hover:bg-destructive/5"
          onClick={blockBoth}
          disabled={(!phone && !ip) || busy || (phoneBlocked && ipBlocked)}
        >
          <Ban className="h-4 w-4" /> Block Phone &amp; IP
        </Button>

        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Blocked customers cannot place new orders using their phone number or IP address.
        </p>
      </CardContent>
    </Card>
  );
};

export const AdminOrdersTab = () => {
  const { orders, isLoading, refetch, updateOrderStatus, deleteOrders } = useAdminOrders();
  const [createOrderOpen, setCreateOrderOpen] = useState(false);
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
  const [sortField, setSortField] = useState<'date' | 'total'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [editOrder, setEditOrder] = useState<any>(null);
  const [editStatus, setEditStatus] = useState('');
  const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [couriers, setCouriers] = useState<CourierOption[]>([]);
  const [detailPaymentStatus, setDetailPaymentStatus] = useState('unpaid');
  const [detailFulfillmentStatus, setDetailFulfillmentStatus] = useState('pending');
  const [fraudResults, setFraudResults] = useState<Record<string, FraudResult>>({});
  const [fraudChecking, setFraudChecking] = useState<Record<string, boolean>>({});
  const [fraudLevelFilter, setFraudLevelFilter] = useState<string>('all');
  const [fraudSort, setFraudSort] = useState<'none' | 'asc' | 'desc'>('none');
  const [recomputingAll, setRecomputingAll] = useState(false);
  const { t } = useLanguage();

  // Synced top horizontal scrollbar for orders table
  const topScrollRef = useRef<HTMLDivElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const [tableScrollWidth, setTableScrollWidth] = useState(0);

  useLayoutEffect(() => {
    const update = () => {
      if (tableScrollRef.current) setTableScrollWidth(tableScrollRef.current.scrollWidth);
    };
    update();
    window.addEventListener('resize', update);
    const ro = new ResizeObserver(update);
    if (tableScrollRef.current) ro.observe(tableScrollRef.current);
    return () => { window.removeEventListener('resize', update); ro.disconnect(); };
  }, []);

  const onTopScroll = () => {
    if (tableScrollRef.current && topScrollRef.current) tableScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
  };
  const onTableScroll = () => {
    if (tableScrollRef.current && topScrollRef.current) topScrollRef.current.scrollLeft = tableScrollRef.current.scrollLeft;
  };

  const handleBlockIp = async (ip: string) => {
    const { error } = await (supabase as any)
      .from('blocked_ips')
      .insert({ ip_address: ip, reason: 'Blocked from order panel' });
    if (error) {
      if (error.code === '23505') toast.info('This IP is already blocked');
      else toast.error('Failed to block IP');
    } else {
      toast.success(`IP ${ip} blocked successfully`);
    }
  };

  // Fetch enabled couriers from shipping_providers_config
  useEffect(() => {
    const fetchCouriers = async () => {
      const { data } = await supabase.from('system_settings').select('value').eq('key', 'shipping_providers_config').maybeSingle();
      if (data?.value && Array.isArray(data.value)) {
        const enabled = (data.value as any[])
          .filter((p: any) => p.enabled)
          .map((p: any) => ({ id: p.id, name: p.name, code: p.code, is_active: true }));
        setCouriers(enabled);
      }
    };
    fetchCouriers();
  }, []);

  // Sync detail modal status when opening
  useEffect(() => {
    if (detailOrder) {
      const isPaid = detailOrder.payment_method !== 'cod' || detailOrder.status === 'delivered';
      setDetailPaymentStatus(isPaid ? 'paid' : 'unpaid');
      setDetailFulfillmentStatus(detailOrder.status || 'pending');
    }
  }, [detailOrder]);

  // Stats
  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter(o => o.status === 'pending').length;
    const processing = orders.filter(o => o.status === 'processing').length;
    const sentToCourier = orders.filter(o => o.status === 'sent_to_courier').length;
    const delivered = orders.filter(o => o.status === 'delivered').length;
    const completed = orders.filter(o => o.status === 'completed' || o.status === 'fulfilled' || o.status === 'delivered').length;
    const cancelled = orders.filter(o => o.status === 'cancelled').length;
    const refunded = orders.filter(o => o.status === 'refunded').length;
    const totalSales = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + (o.total || 0), 0);
    return { total, pending, processing, sentToCourier, delivered, completed, cancelled, refunded, totalSales };
  }, [orders]);

  // Bulk send-to-courier dispatch
  const handleBulkSendToCourier = async (courierCode: string) => {
    if (selectedOrders.size === 0) return toast.error('Select orders first');
    setBulkUpdating(true);
    let success = 0, failed = 0;
    const failedReasons: string[] = [];
    for (const id of selectedOrders) {
      const order = orders.find(o => o.id === id);
      if (!order) { failed++; continue; }
      const sa = order.shipping_address || {};
      const name = `${sa.first_name || ''} ${sa.last_name || ''}`.trim() || 'Customer';
      const phone = sa.phone || order.guest_phone || order.profile?.phone || '';
      const address = sa.address || '';
      if (!phone || !address) { failed++; failedReasons.push(`#${order.order_number}: missing phone/address`); continue; }
      const itemDesc = (order.items || []).map((i: any) => i.product_name).slice(0, 3).join(', ') || 'Products';
      const itemCount = (order.items || []).reduce((s: number, i: any) => s + (i.quantity || 1), 0) || 1;
      try {
        const { data, error } = await supabase.functions.invoke('shipping-provider', {
          body: {
            action: 'create_order',
            provider: courierCode,
            payload: {
              order_id: order.order_number, order_number: order.order_number,
              recipient_name: name, customer_name: name,
              recipient_phone: phone, phone,
              recipient_address: address, address,
              city: sa.city || 'Dhaka', recipient_city: sa.city || undefined,
              recipient_zone: sa.state || undefined,
              amount_to_collect: order.payment_method === 'cod' ? Number(order.total) || 0 : 0,
              cod_amount: order.payment_method === 'cod' ? Number(order.total) || 0 : 0,
              item_description: itemDesc, item_quantity: itemCount, item_weight: 0.5,
              value: Number(order.total) || 0, total: order.total, subtotal: order.subtotal,
              payment_method: order.payment_method, note: `Order #${order.order_number}`,
            },
          },
        });
        if (error || (data && data.ok === false)) {
          failed++;
          failedReasons.push(`#${order.order_number}: ${error?.message || data?.error || 'failed'}`);
          continue;
        }
        const tracking = data?.consignment_id || data?.tracking_code || data?.data?.consignment_id || data?.data?.tracking_code || '';
        await updateOrderStatus(id, 'sent_to_courier', { carrier: courierCode, tracking_number: tracking || '' });
        success++;
      } catch (e: any) {
        failed++;
        failedReasons.push(`#${order.order_number}: ${e?.message || 'error'}`);
      }
    }
    if (success) toast.success(`${success} order(s) dispatched to ${courierCode.toUpperCase()}`);
    if (failed) toast.error(`${failed} failed${failedReasons.length ? ` — ${failedReasons.slice(0, 2).join('; ')}` : ''}`, { duration: 7000 });
    setSelectedOrders(new Set());
    setBulkUpdating(false);
  };

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
    // Fraud level filter
    if (fraudLevelFilter !== 'all') {
      result = result.filter(o => fraudResults[o.id]?.risk_level === fraudLevelFilter);
    }
    result = [...result].sort((a, b) => {
      // Fraud score sort wins when active
      if (fraudSort !== 'none') {
        const sa = fraudResults[a.id]?.risk_score ?? -1;
        const sb = fraudResults[b.id]?.risk_score ?? -1;
        return fraudSort === 'asc' ? sa - sb : sb - sa;
      }
      if (sortField === 'date') {
        const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        return sortDir === 'asc' ? diff : -diff;
      }
      return sortDir === 'asc' ? a.total - b.total : b.total - a.total;
    });
    return result;
  }, [orders, statusFilter, searchQuery, sortField, sortDir, fraudLevelFilter, fraudSort, fraudResults]);

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

  const handleDispatched = async (orderId: string, courierCode: string, trackingNumber: string) => {
    await updateOrderStatus(orderId, 'sent_to_courier', {
      carrier: courierCode,
      tracking_number: trackingNumber || '',
    });
  };

  const handleShipViaCourier = (order: any, courier: CourierOption) => {
    setDispatchProvider(courier.code);
    setCourierDispatchOrder(order);
  };

  // Deterministic phone-based fraud analysis with persistent DB cache.
  // Same phone => identical result. Cache-first: read from fraud_risk_cache, recompute only on demand.
  const runFraudCheck = useCallback(async (order: any, forceRecompute = false) => {
    if (!order?.id) return;
    const phone = normalizePhone(getOrderCustomerPhone(order));
    setFraudChecking(prev => ({ ...prev, [order.id]: true }));
    try {
      // Try cache first unless force-recompute
      if (phone && !forceRecompute) {
        const cache = await loadFraudCache([phone]);
        if (cache[phone]) {
          setFraudResults(prev => ({ ...prev, [order.id]: cache[phone] }));
          return;
        }
      }
      const history = orders.filter((o: any) => {
        const oPhone = normalizePhone(getOrderCustomerPhone(o));
        if (phone && oPhone) return oPhone === phone;
        if (order.user_id && o.user_id) return o.user_id === order.user_id;
        return o.id === order.id;
      });
      const result = computeFraudFromHistory(history);
      setFraudResults(prev => ({ ...prev, [order.id]: result }));
      if (phone) void persistFraudCache(phone, result);
    } finally {
      setFraudChecking(prev => { const n = { ...prev }; delete n[order.id]; return n; });
    }
  }, [orders]);

  // On orders load: bulk-restore fraud results from DB cache for all visible phones (one query, no per-row I/O)
  useEffect(() => {
    if (orders.length === 0) return;
    const phoneToOrderIds = new Map<string, string[]>();
    orders.forEach((o: any) => {
      const p = normalizePhone(getOrderCustomerPhone(o));
      if (!p) return;
      const arr = phoneToOrderIds.get(p) || [];
      arr.push(o.id);
      phoneToOrderIds.set(p, arr);
    });
    const phones = Array.from(phoneToOrderIds.keys());
    if (phones.length === 0) return;
    let cancelled = false;
    (async () => {
      const cache = await loadFraudCache(phones);
      if (cancelled) return;
      setFraudResults(prev => {
        const next = { ...prev };
        for (const [phone, ids] of phoneToOrderIds.entries()) {
          const cached = cache[phone];
          if (!cached) continue;
          for (const id of ids) if (!next[id]) next[id] = cached;
        }
        return next;
      });
    })();
    return () => { cancelled = true; };
  }, [orders]);

  // Bulk recompute fraud stats for currently-filtered orders (admin button)
  const handleRecomputeFiltered = useCallback(async () => {
    setRecomputingAll(true);
    const seenPhones = new Set<string>();
    let count = 0;
    for (const order of orders) {
      const phone = normalizePhone(getOrderCustomerPhone(order));
      if (phone && seenPhones.has(phone)) continue;
      if (phone) seenPhones.add(phone);
      await runFraudCheck(order, true);
      count++;
    }
    setRecomputingAll(false);
    toast.success(`Recomputed fraud risk for ${count} customer(s)`);
  }, [orders, runFraudCheck]);

  const handleDeleteOrder = async () => {
    const orderId = deleteOrderId;
    if (!orderId) return;

    setDeleting(true);

    try {
      const { error, deletedIds } = await deleteOrders([orderId]);
      if (error) throw error;

      setSelectedOrders((current) => new Set([...current].filter((id) => !deletedIds.includes(id))));
      setDetailOrder((current: any) => current && deletedIds.includes(current.id) ? null : current);
      setEditOrder((current: any) => current && deletedIds.includes(current.id) ? null : current);
      setInvoiceOrder((current: any) => current && deletedIds.includes(current.id) ? null : current);
      setCourierDispatchOrder((current: any) => current && deletedIds.includes(current.id) ? null : current);
      setFraudOrder((current: any) => current && deletedIds.includes(current.id) ? null : current);
      toast.success('Order deleted successfully');
      setDeleteOrderId(null);
    } catch (e: any) {
      toast.error('Delete failed: ' + (e.message || 'Unknown error'));
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDeleteOrders = async () => {
    if (selectedOrders.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedOrders.size} order(s)?`)) return;

    setBulkUpdating(true);

    try {
      const { error, deletedIds } = await deleteOrders(Array.from(selectedOrders));
      if (error) throw error;

      setSelectedOrders((current) => new Set([...current].filter((id) => !deletedIds.includes(id))));
      setDetailOrder((current: any) => current && deletedIds.includes(current.id) ? null : current);
      setEditOrder((current: any) => current && deletedIds.includes(current.id) ? null : current);
      setInvoiceOrder((current: any) => current && deletedIds.includes(current.id) ? null : current);
      setCourierDispatchOrder((current: any) => current && deletedIds.includes(current.id) ? null : current);
      setFraudOrder((current: any) => current && deletedIds.includes(current.id) ? null : current);
      toast.success(`${deletedIds.length} order(s) deleted successfully`);
    } catch (e: any) {
      toast.error('Bulk delete failed: ' + (e.message || 'Unknown error'));
    } finally {
      setBulkUpdating(false);
    }
  };

  const handleEditOrderSave = async (
    orderId: string,
    items: any[],
    customer: { name: string; phone: string; address: string; notes: string },
    discountVal: number,
    shippingVal: number
  ) => {
    // Delete old items and insert new ones
    await (supabase as any).from('order_items').delete().eq('order_id', orderId);
    const newItems = items.map(i => ({
      order_id: orderId,
      product_id: i.product_id,
      product_name: i.product_name,
      product_image: i.product_image,
      quantity: i.quantity,
      price: i.price,
    }));
    if (newItems.length > 0) {
      await (supabase as any).from('order_items').insert(newItems);
    }
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const total = subtotal - discountVal + shippingVal;
    const nameParts = customer.name.split(' ');
    const shippingAddress = {
      first_name: nameParts[0] || '',
      last_name: nameParts.slice(1).join(' ') || '',
      phone: customer.phone,
      address: customer.address,
    };
    await (supabase as any).from('orders').update({
      subtotal, discount: discountVal, shipping: shippingVal, total,
      shipping_address: shippingAddress,
      guest_phone: customer.phone,
    }).eq('id', orderId);
    // Refetch
    await updateOrderStatus(orderId, editOrder?.status || 'pending');
  };

  // Old printInvoice removed — now using invoiceGenerator module

  const toggleSort = (field: 'date' | 'total') => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

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

      {/* Status Pills + Bulk Action Bar (above filter) */}
      <Card className="mb-3 border border-border">
        <CardContent className="p-3">
          <div className="flex flex-wrap items-stretch gap-2 mb-3">
            {[
              { key: 'all', label: 'Orders', count: stats.total, color: 'text-foreground', bar: 'bg-foreground' },
              { key: 'pending', label: 'Pending', count: stats.pending, color: 'text-amber-600', bar: 'bg-amber-500' },
              { key: 'processing', label: 'Processing', count: stats.processing, color: 'text-blue-600', bar: 'bg-blue-500' },
              { key: 'sent_to_courier', label: 'Sent To Courier', count: stats.sentToCourier, color: 'text-teal-600', bar: 'bg-teal-500' },
              { key: 'delivered', label: 'Delivered', count: stats.delivered, color: 'text-cyan-600', bar: 'bg-cyan-500' },
              { key: 'completed', label: 'Completed', count: stats.completed, color: 'text-emerald-600', bar: 'bg-emerald-500' },
              { key: 'cancelled', label: 'Cancelled', count: stats.cancelled, color: 'text-red-600', bar: 'bg-red-500' },
              { key: 'refunded', label: 'Returned', count: stats.refunded, color: 'text-purple-600', bar: 'bg-purple-500' },
            ].map(s => (
              <button
                key={s.key}
                onClick={() => { setStatusFilter(s.key); setCurrentPage(1); setSelectedOrders(new Set()); }}
                className={cn(
                  'flex-1 min-w-[110px] px-3 py-2 rounded-md border transition-all text-left',
                  statusFilter === s.key
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                    : 'border-border bg-card hover:bg-muted/50'
                )}
              >
                <p className={cn('text-[11px] font-semibold uppercase tracking-wide', s.color)}>{s.label}</p>
                <p className="text-lg font-bold text-foreground leading-tight">{s.count}</p>
                <span className={cn('block h-0.5 w-full rounded-full mt-1', s.bar, statusFilter === s.key ? 'opacity-100' : 'opacity-30')} />
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
            <Button
              size="sm"
              variant="accent"
              className="gap-2 text-xs h-8"
              onClick={() => setCreateOrderOpen(true)}
            >
              <Plus className="h-3.5 w-3.5" /> Add Order
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  className="gap-2 text-xs h-8 bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={selectedOrders.size === 0 || bulkUpdating || couriers.length === 0}
                >
                  {bulkUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Truck className="h-3.5 w-3.5" />}
                  Send To Courier {selectedOrders.size > 0 ? `(${selectedOrders.size})` : ''}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52">
                {couriers.length === 0 ? (
                  <DropdownMenuItem disabled>No couriers configured</DropdownMenuItem>
                ) : (
                  couriers.map(c => (
                    <DropdownMenuItem key={c.id} onClick={() => handleBulkSendToCourier(c.code)}>
                      <Truck className="h-3.5 w-3.5 mr-2" /> Send via {c.name}
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <Select onValueChange={(v) => { if (selectedOrders.size > 0) handleBulkStatusUpdate(v); else toast.error('Select orders first'); }}>
              <SelectTrigger className="h-8 text-xs w-[140px]"><SelectValue placeholder="Select Status" /></SelectTrigger>
              <SelectContent>
                {Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
            {selectedOrders.size > 0 && (
              <span className="text-xs text-muted-foreground ml-auto">{selectedOrders.size} selected</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filter Section (compact) */}
      <Card className="mb-3 border border-border">
        <CardContent className="p-2.5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search (number, name, email, phone)" value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }} className="pl-9 h-8 text-xs" />
            </div>
            <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setCurrentPage(1); setSelectedOrders(new Set()); }}>
              <SelectTrigger className="w-full sm:w-[150px] h-8 text-xs"><SelectValue placeholder="All Statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <OrderStatusLegend triggerLabel="Status guide" />
            <Select value={fraudLevelFilter} onValueChange={v => { setFraudLevelFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-full sm:w-[140px] h-8 text-xs">
                <ShieldAlert className="h-3 w-3 mr-1" />
                <SelectValue placeholder="Fraud Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk Levels</SelectItem>
                <SelectItem value="low">Low Risk</SelectItem>
                <SelectItem value="medium">Medium Risk</SelectItem>
                <SelectItem value="high">High Risk</SelectItem>
                <SelectItem value="critical">Critical Risk</SelectItem>
              </SelectContent>
            </Select>
            <Select value={fraudSort} onValueChange={(v: any) => { setFraudSort(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-full sm:w-[140px] h-8 text-xs">
                <ArrowUpDown className="h-3 w-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sort: Default</SelectItem>
                <SelectItem value="desc">Risk: High → Low</SelectItem>
                <SelectItem value="asc">Risk: Low → High</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={handleRecomputeFiltered}
              disabled={recomputingAll}
              title="Recompute fraud risk for all orders using latest history"
            >
              {recomputingAll ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Recompute Fraud
            </Button>
            <div className="flex items-center gap-2">
              <Select value={String(perPage)} onValueChange={v => { setPerPage(Number(v)); setCurrentPage(1); }}>
                <SelectTrigger className="w-[64px] h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[10, 25, 50, 100].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => exportToCSV(
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
                <Download className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions Bar (selected) */}
      {selectedOrders.size > 0 && (
        <div className="mb-4 p-3 bg-accent/10 border border-accent/20 rounded-lg flex flex-wrap items-center gap-3">
          <Badge className="bg-accent text-accent-foreground text-xs px-3 py-1">{selectedOrders.size}</Badge>
          <span className="text-xs font-medium">order(s) selected</span>
          <div className="flex-1" />
          <Button
            variant="default" size="sm" className="gap-2 text-xs h-8"
            onClick={() => {
              const selected = orders.filter(o => selectedOrders.has(o.id));
              if (selected.length > 0) downloadBulkInvoices(selected);
            }}
          >
            <Download className="h-3.5 w-3.5" /> Download Invoices
          </Button>
          <Button
            variant="outline" size="sm" className="gap-2 text-xs h-8"
            onClick={() => {
              const selected = orders.filter(o => selectedOrders.has(o.id));
              if (selected.length > 0) printBulkInvoices(selected);
            }}
          >
            <Printer className="h-3.5 w-3.5" /> Print Invoices
          </Button>
          <Button
            variant="destructive" size="sm" className="gap-2 text-xs h-8"
            onClick={handleBulkDeleteOrders}
            disabled={bulkUpdating}
          >
            {bulkUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />} Delete Orders
          </Button>
          <Button variant="ghost" size="sm" className="text-xs h-8 gap-1" onClick={() => setSelectedOrders(new Set())}>
            <XCircle className="h-3.5 w-3.5" /> Clear
          </Button>
        </div>
      )}

      {/* Orders Table */}
      <Card className="border border-border">
        {/* Top horizontal scrollbar (synced) */}
        <div
          ref={topScrollRef}
          onScroll={onTopScroll}
          className="overflow-x-auto overflow-y-hidden border-b border-border"
          style={{ height: 14 }}
        >
          <div style={{ width: tableScrollWidth, height: 1 }} />
        </div>
        <div ref={tableScrollRef} onScroll={onTableScroll} className="overflow-x-auto">
          <Table data-testid="admin-orders-table" className="table-tight-spacing table-fixed">
            <colgroup>
              <col className="w-8" />
              <col className="w-[44px]" />
              <col className="w-[210px]" />
              <col className="w-[110px]" />
              <col className="hidden xl:table-column w-[120px]" />
              <col className="w-[110px]" />
              <col className="w-[200px]" />
              <col className="w-[120px]" />
              <col className="w-[80px]" />
              <col className="w-[120px]" />
              <col className="hidden xl:table-column w-[130px]" />
              <col className="hidden xl:table-column w-[80px]" />
              <col className="hidden xl:table-column w-[110px]" />
              <col className="w-[120px]" />
            </colgroup>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>
                  <Checkbox checked={paginatedOrders.length > 0 && selectedOrders.size === paginatedOrders.length} onCheckedChange={toggleSelectAll} />
                </TableHead>
                <TableHead className="font-bold text-foreground">Actions</TableHead>
                <TableHead className="font-bold text-foreground">Product</TableHead>
                <TableHead className="font-bold text-foreground">Order</TableHead>
                <TableHead className="font-bold text-foreground hidden xl:table-cell">Assigned To</TableHead>
                <TableHead className="font-bold text-foreground cursor-pointer select-none" onClick={() => toggleSort('date')}>
                  <span className="inline-flex items-center gap-1">Date <ArrowUpDown className="h-3 w-3" /></span>
                </TableHead>
                <TableHead className="font-bold text-foreground">Customer</TableHead>
                <TableHead className="font-bold text-foreground">IP</TableHead>
                <TableHead className="font-bold text-foreground">Payment</TableHead>
                <TableHead className="font-bold text-foreground">Status</TableHead>
                <TableHead className="font-bold text-foreground hidden xl:table-cell">Courier</TableHead>
                <TableHead className="font-bold text-foreground hidden xl:table-cell">Method</TableHead>
                <TableHead className="font-bold text-foreground hidden xl:table-cell">Fraud</TableHead>
                <TableHead className="font-bold text-foreground text-right pr-4 cursor-pointer select-none" onClick={() => toggleSort('total')}>
                  <span className="inline-flex items-center gap-1 justify-end w-full">Total <ArrowUpDown className="h-3 w-3" /></span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={`loading-${i}`}>
                    {Array.from({ length: 14 }).map((__, j) => (
                      <TableCell key={j}>
                        <div className="h-4 w-full max-w-[120px] rounded bg-muted animate-pulse" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : paginatedOrders.length === 0 ? (
                <TableRow>
                   <TableCell colSpan={14} className="text-center py-12 text-muted-foreground">
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
                        <DropdownMenuContent align="start" className="w-52">
                          <DropdownMenuItem onClick={() => toast.info('Re-assign feature coming soon')}>
                            <UserPlus className="h-4 w-4 mr-2" /> Re-Assign
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {couriers.length > 0 && (
                            <>
                              {couriers.map(c => (
                                <DropdownMenuItem key={c.id} onClick={() => handleShipViaCourier(order, c)}>
                                  <Truck className="h-4 w-4 mr-2" /> Ship via {c.name}
                                </DropdownMenuItem>
                              ))}
                              <DropdownMenuSeparator />
                            </>
                          )}
                          <DropdownMenuItem onClick={() => setDetailOrder(order)}>
                            <Eye className="h-4 w-4 mr-2" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setEditOrder(order); setEditStatus(order.status); }}>
                            <Edit className="h-4 w-4 mr-2" /> Edit Order
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => downloadSingleInvoice(order)}>
                            <Download className="h-4 w-4 mr-2" /> Download Invoice
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => printSingleInvoice(order)}>
                            <Printer className="h-4 w-4 mr-2" /> Print Invoice
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {order.customer_ip && (
                            <DropdownMenuItem onClick={() => handleBlockIp(order.customer_ip!)} className="text-amber-600 focus:text-amber-600">
                              <Ban className="h-4 w-4 mr-2" /> Block IP ({order.customer_ip})
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => setDeleteOrderId(order.id)} className="text-destructive focus:text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const firstItem = order.items?.[0];
                        const extraCount = (order.items?.length || 0) - 1;
                        return (
                          <div className="flex items-center gap-2 min-w-0">
                            {firstItem?.product_image ? (
                              <img src={firstItem.product_image} alt={firstItem.product_name} className="h-9 w-9 rounded object-cover shrink-0 border border-border" />
                            ) : (
                              <div className="h-9 w-9 rounded bg-muted flex items-center justify-center shrink-0 border border-border">
                                <Package className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-xs font-medium truncate max-w-[140px]">{firstItem?.product_name || '—'}</p>
                              {extraCount > 0 && <p className="text-[10px] text-muted-foreground">+{extraCount} more</p>}
                            </div>
                          </div>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      <button onClick={() => setDetailOrder(order)} className="text-primary hover:underline text-xs font-medium">
                        #{order.order_number}
                      </button>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      {order.assigned_role || order.assigned_user_name ? (
                        <div className="flex flex-col leading-tight">
                          <span className="text-[11px] font-semibold text-foreground whitespace-nowrap">
                            {formatRoleLabel(order.assigned_role)}
                          </span>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                            {order.assigned_user_name || '—'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col leading-tight whitespace-nowrap">
                        <span className="text-xs font-medium text-foreground">
                          {format(new Date(order.created_at), 'M/d/yyyy')}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {format(new Date(order.created_at), 'hh:mm a')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const phoneRaw = getOrderCustomerPhone(order);
                        const cleaned = phoneRaw.replace(/[^\d+]/g, '');
                        const wa = cleaned.startsWith('+') ? cleaned.slice(1) : cleaned.startsWith('88') ? cleaned : `88${cleaned}`;
                        return (
                          <div className="flex items-center gap-1.5 min-w-0">
                            <div className={cn('h-7 w-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0', getAvatarColor(customerName))}>
                              {getInitials(customerName)}
                            </div>
                            <div className="min-w-0 leading-tight">
                              <p className="text-xs font-medium truncate max-w-[140px]">{customerName}</p>
                              <p className="text-[10px] text-muted-foreground truncate max-w-[140px]">{customerEmail}</p>
                              {phoneRaw && (
                                <div className="flex items-center gap-1 mt-0.5">
                                  <span className="text-[10px] font-mono text-foreground">{phoneRaw}</span>
                                  <a
                                    href={`tel:${cleaned}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="inline-flex items-center justify-center h-4 w-4 rounded bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25"
                                    title="Call"
                                  >
                                    <Phone className="h-2.5 w-2.5" />
                                  </a>
                                  <a
                                    href={`https://wa.me/${wa}`}
                                    target="_blank"
                                    rel="noreferrer noopener"
                                    onClick={(e) => e.stopPropagation()}
                                    className="inline-flex items-center justify-center h-4 w-4 rounded bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25"
                                    title="WhatsApp"
                                  >
                                    <MessageCircle className="h-2.5 w-2.5" />
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      <span className="text-[11px] text-muted-foreground font-mono">{order.customer_ip || '—'}</span>
                    </TableCell>
                    <TableCell>
                      <span className={cn('text-xs font-medium inline-flex items-center gap-1', isPaid ? 'text-emerald-600' : 'text-orange-500')}>
                        <span className={cn('h-1.5 w-1.5 rounded-full', isPaid ? 'bg-emerald-500' : 'bg-orange-500')} />
                        {isPaid ? 'Paid' : 'Unpaid'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={order.status}
                        onValueChange={async (newStatus) => {
                          setUpdating(order.id);
                          const { error } = await updateOrderStatus(order.id, newStatus);
                          if (error) toast.error('Failed to update status');
                          else toast.success(`Status updated to ${(statusConfig[newStatus] || { label: newStatus }).label}`);
                          setUpdating(null);
                        }}
                        disabled={updating === order.id}
                      >
                        <SelectTrigger className="h-7 w-auto min-w-0 justify-start border-0 px-0 py-0 shadow-none focus:ring-0 gap-0 [&>svg]:hidden">
                          <Badge className={cn('text-[10px] px-2 py-0.5 font-medium whitespace-nowrap cursor-pointer', status.color)}>
                            {updating === order.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                            {status.label}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent className="min-w-[12rem]">
                          <SelectItem value="pending" className={statusSelectItemClassName}>Pending</SelectItem>
                          <SelectItem value="processing" className={statusSelectItemClassName}>Processing</SelectItem>
                          <SelectItem value="packaging" className={statusSelectItemClassName}>Packaging</SelectItem>
                          <SelectItem value="ready_to_ship" className={statusSelectItemClassName}>Ready to Ship</SelectItem>
                          <SelectItem value="sent_to_courier" className={statusSelectItemClassName}>Sent To Courier</SelectItem>
                          <SelectItem value="shipped" className={statusSelectItemClassName}>Shipped</SelectItem>
                          <SelectItem value="out_for_delivery" className={statusSelectItemClassName}>Out for Delivery</SelectItem>
                          <SelectItem value="delivered" className={statusSelectItemClassName}>Delivered</SelectItem>
                          <SelectItem value="completed" className={statusSelectItemClassName}>Completed</SelectItem>
                          <SelectItem value="fulfilled" className={statusSelectItemClassName}>Fulfilled</SelectItem>
                          <SelectItem value="returned" className={statusSelectItemClassName}>Returned</SelectItem>
                          <SelectItem value="refunded" className={statusSelectItemClassName}>Refunded</SelectItem>
                          <SelectItem value="cancelled" className={statusSelectItemClassName}>Cancelled</SelectItem>
                          <SelectItem value="failed" className={statusSelectItemClassName}>Failed</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          {order.carrier ? (
                            <button
                              type="button"
                              className="inline-flex w-fit items-center gap-1.5 h-8 px-2.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold whitespace-nowrap shadow-sm transition-colors"
                            >
                              <Truck className="h-3.5 w-3.5" />
                              {(couriers.find(c => c.code === order.carrier)?.name) || order.carrier.toUpperCase()}
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="inline-flex w-fit items-center gap-1.5 h-8 px-2.5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold whitespace-nowrap shadow-sm transition-colors"
                            >
                              <Truck className="h-3.5 w-3.5" />
                              Send to Courier
                            </button>
                          )}
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-48">
                          {couriers.length === 0 ? (
                            <DropdownMenuItem disabled>No couriers configured</DropdownMenuItem>
                          ) : (
                            couriers.map(c => (
                              <DropdownMenuItem key={c.id} onClick={() => handleShipViaCourier(order, c)}>
                                <Truck className="h-3.5 w-3.5 mr-2" />
                                {order.carrier === c.code ? `Re-send via ${c.name}` : `Send via ${c.name}`}
                              </DropdownMenuItem>
                            ))
                          )}
                          {order.tracking_number && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem disabled className="text-[10px] font-mono">
                                #{order.tracking_number}
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      <div className="flex items-center gap-1">
                        <Badge
                          variant="outline"
                          className={cn(
                            'gap-1 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide border',
                            paymentMethodStyle(order.payment_method)
                          )}
                        >
                          <CreditCard className="h-3 w-3" />
                          {order.payment_method || '—'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      <div className="flex items-center justify-end gap-2 min-w-[150px]">
                        {fraudChecking[order.id] ? (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Checking
                          </span>
                        ) : fraudResults[order.id] ? (
                          <>
                            <Badge
                              variant="outline"
                              className="text-[10px] font-semibold whitespace-nowrap"
                            >
                              <ShieldAlert className="mr-1 h-3 w-3" />
                              {`${fraudResults[order.id].risk_level.toUpperCase()} ${fraudResults[order.id].risk_score}%`}
                            </Badge>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-[11px] font-medium"
                              onClick={() => setFraudOrder(order)}
                            >
                              Details
                            </Button>
                          </>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-[11px] font-medium"
                            onClick={() => {
                              runFraudCheck(order);
                              setFraudOrder(order);
                            }}
                          >
                            Check
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-4">
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
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0">
          {detailOrder && (() => {
            const o = detailOrder;
            const addr = normalizeShippingAddress(o.shipping_address);
            const cName = getOrderCustomerName(o);
            const cEmail = getOrderCustomerEmail(o);
            const cPhone = getOrderCustomerPhone(o);
            const st = statusConfig[o.status] || statusConfig.pending;
            const isPaidOrder = o.payment_method !== 'cod' || o.status === 'delivered';

            return (
              <div>
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-border">
                  <h2 className="text-lg font-bold text-foreground">Order #{o.order_number}</h2>
                  <div className="flex items-center gap-2">
                    <Button size="sm" className="gap-2" onClick={() => { setDetailOrder(null); setEditOrder(o); setEditStatus(o.status); }}>
                      <Edit className="h-4 w-4" /> Edit Order
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => { setDetailOrder(null); downloadSingleInvoice(o); }}>
                      <FileText className="h-4 w-4" /> Invoice
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => { setDetailOrder(null); printSingleInvoice(o); }}>
                      <Printer className="h-4 w-4" /> Print
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
                  {/* Left: Order Items */}
                  <div className="lg:col-span-2 p-5">
                    <Card className="border border-border">
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-sm mb-4">Order Items</h3>
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead className="text-xs font-semibold uppercase">Product</TableHead>
                              <TableHead className="text-xs font-semibold uppercase text-center">Price</TableHead>
                              <TableHead className="text-xs font-semibold uppercase text-center">Qty</TableHead>
                              <TableHead className="text-xs font-semibold uppercase text-right">Total</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {o.items?.map((item: any) => (
                              <TableRow key={item.id}>
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    {item.product_image && (
                                      <img src={item.product_image} alt="" className="w-12 h-12 rounded-lg object-cover border border-border" />
                                    )}
                                    <span className="text-sm font-medium">{item.product_name}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center text-sm">৳{Number(item.price).toLocaleString()}</TableCell>
                                <TableCell className="text-center text-sm">{item.quantity}</TableCell>
                                <TableCell className="text-right text-sm font-medium">৳{(item.quantity * item.price).toLocaleString()}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        <div className="mt-4 space-y-2 border-t border-border pt-4">
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>Subtotal:</span>
                            <span>৳{o.subtotal?.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>Shipping:</span>
                            <span>৳{o.shipping?.toLocaleString() || 0}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Discount:</span>
                            <span className={o.discount > 0 ? 'text-destructive' : 'text-muted-foreground'}>
                              {o.discount > 0 ? `-৳${o.discount.toLocaleString()}` : `৳0`}
                            </span>
                          </div>
                          <Separator />
                          <div className="flex justify-between text-base font-bold">
                            <span>Total:</span>
                            <span>৳{o.total.toLocaleString()}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Right: Order Status + Customer Details */}
                  <div className="p-5 space-y-4 border-l border-border">
                    {/* Order Status Section */}
                    <Card className="border border-border">
                      <CardContent className="p-4 space-y-4">
                        <h3 className="font-semibold text-sm">Order Status</h3>

                        {/* Payment Status */}
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Payment Status</Label>
                          <Select
                            value={detailPaymentStatus}
                            onValueChange={setDetailPaymentStatus}
                          >
                            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unpaid">Unpaid</SelectItem>
                              <SelectItem value="paid">Paid</SelectItem>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="failed">Failed</SelectItem>
                              <SelectItem value="refunded">Refunded</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Fulfillment Status w/ reason */}
                        <AdminOrderStatusPanel
                          orderId={o.id}
                          currentStatus={o.status}
                          carrier={o.carrier}
                          trackingNumber={o.tracking_number}
                          onUpdate={async (id, status, extras) => updateOrderStatus(id, status, extras)}
                        />
                      </CardContent>
                    </Card>

                    {/* Customer Details */}
                    <Card className="border border-border">
                      <CardContent className="p-4 space-y-3">
                        <h3 className="font-semibold text-sm">Customer Details</h3>
                        <div className="flex items-start gap-3">
                          <div className={cn('h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0', getAvatarColor(cName))}>
                            {getInitials(cName)}
                          </div>
                          <div className="text-sm space-y-0.5">
                            <p className="font-medium">{cName}</p>
                            {o.user_id && <p className="text-xs text-muted-foreground">Order No: {o.order_number}</p>}
                            {isGuestLikeOrder(o) && <p className="text-xs text-muted-foreground">Guest Order</p>}
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <h4 className="text-xs font-semibold text-muted-foreground mb-1">Contact Info</h4>
                          <p className="text-sm">Email: {cEmail}</p>
                          {cPhone && <CustomerContactBlock phone={cPhone} className="!py-2" />}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Shipping Address */}
                    <Card className="border border-border">
                      <CardContent className="p-4 space-y-2">
                        <h3 className="font-semibold text-sm">Shipping Address</h3>
                        <div className="text-sm text-muted-foreground space-y-0.5">
                          <p>{[addr.address, addr.apartment].filter(Boolean).join(', ') || 'N/A'}</p>
                          <p>{[addr.city, addr.state, addr.zip_code].filter(Boolean).join(' ')}</p>
                          <p>{addr.country || 'BD'}</p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Fraud Risk */}
                    <OrderFraudCard
                      order={o}
                      result={fraudResults[o.id]}
                      loading={fraudChecking[o.id]}
                      onRecheck={() => {
                        setFraudResults(prev => { const next = { ...prev }; delete next[o.id]; return next; });
                        runFraudCheck(o);
                      }}
                    />

                    {/* Customer Block */}
                    <OrderBlockCard phone={cPhone} ip={o.customer_ip} />
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
          {invoiceOrder && (
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <div><p className="font-semibold">{getOrderCustomerName(invoiceOrder)}</p><p className="text-muted-foreground">{getOrderCustomerEmail(invoiceOrder)}</p></div>
                <div className="text-right"><p className="font-semibold">Invoice #{invoiceOrder.order_number}</p><p className="text-muted-foreground">{format(new Date(invoiceOrder.created_at), 'PPP')}</p></div>
              </div>
              <div className="flex gap-3">
                <Button className="flex-1 gap-2" onClick={() => { downloadSingleInvoice(invoiceOrder); setInvoiceOrder(null); }}>
                  <Download className="h-4 w-4" /> Download Invoice
                </Button>
                <Button variant="outline" className="flex-1 gap-2" onClick={() => { printSingleInvoice(invoiceOrder); setInvoiceOrder(null); }}>
                  <Printer className="h-4 w-4" /> Print Invoice
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Courier Dispatch Modal — auto-fills order data and one-click sends to selected courier */}
      <CourierDispatchModal
        open={!!courierDispatchOrder}
        order={courierDispatchOrder}
        providerCode={dispatchProvider}
        onClose={() => setCourierDispatchOrder(null)}
        onDispatched={handleDispatched}
      />

      {/* Create Order Modal */}
      <CreateOrderModal
        open={createOrderOpen}
        onClose={() => setCreateOrderOpen(false)}
        onCreated={() => refetch()}
      />


      <EditOrderModal
        order={editOrder}
        open={!!editOrder}
        onClose={() => setEditOrder(null)}
        onViewDetails={() => { const o = editOrder; setEditOrder(null); setDetailOrder(o); }}
        onSave={handleEditOrderSave}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteOrderId} onOpenChange={open => !open && setDeleteOrderId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Order</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete this order? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteOrder} disabled={deleting} className="bg-destructive text-destructive-foreground gap-2">
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />} Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
