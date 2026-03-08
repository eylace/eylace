import { useState } from 'react';
import { 
  Package, 
  Truck, 
  CheckCircle, 
  Clock,
  ChevronDown,
  ChevronUp,
  Loader2,
  Send,
  ShieldAlert,
  Download,
} from 'lucide-react';
import { FraudDetectionModal } from '@/components/admin/FraudDetectionModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAdminOrders } from '@/hooks/useAdminData';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { exportToCSV } from '@/lib/csvExport';

const statusConfig: Record<string, { labelKey: string; color: string; icon: React.ElementType }> = {
  pending: { labelKey: 'admin.statusPending', color: 'bg-yellow-500/10 text-yellow-600', icon: Clock },
  processing: { labelKey: 'admin.statusProcessing', color: 'bg-blue-500/10 text-blue-600', icon: Package },
  shipped: { labelKey: 'admin.statusShipped', color: 'bg-purple-500/10 text-purple-600', icon: Truck },
  out_for_delivery: { labelKey: 'admin.statusOutForDelivery', color: 'bg-orange-500/10 text-orange-600', icon: Truck },
  delivered: { labelKey: 'admin.statusDelivered', color: 'bg-green-500/10 text-green-600', icon: CheckCircle },
  cancelled: { labelKey: 'admin.statusCancelled', color: 'bg-red-500/10 text-red-600', icon: Package },
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
  const { t } = useLanguage();

  const filteredOrders = statusFilter === 'all' ? orders : orders.filter(o => o.status === statusFilter);

  const toggleSelect = (id: string) => {
    setSelectedOrders(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedOrders.size === filteredOrders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(filteredOrders.map(o => o.id)));
    }
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedOrders.size === 0) return;
    setBulkUpdating(true);
    let successCount = 0;
    for (const orderId of selectedOrders) {
      const { error } = await updateOrderStatus(orderId, newStatus);
      if (!error) successCount++;
    }
    toast.success(`${successCount} ${t('admin.ordersUpdated' as any) || 'orders updated'}`);
    setSelectedOrders(new Set());
    setBulkUpdating(false);
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdating(orderId);
    const tracking = trackingInfo[orderId];
    const { error } = await updateOrderStatus(orderId, newStatus, tracking);
    if (error) {
      toast.error(t('admin.statusUpdateFailed' as any) || 'Failed to update order status');
    } else {
      toast.success(`Order status updated`);
    }
    setUpdating(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{t('admin.noOrdersFound' as any)}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {t('admin.allOrders' as any)} ({filteredOrders.length}{statusFilter !== 'all' ? `/${orders.length}` : ''})
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setSelectedOrders(new Set()); }}>
                <SelectTrigger className="w-[120px] md:w-[150px] h-8 text-[10px] md:text-xs">
                  <SelectValue placeholder={t('admin.filterByStatus' as any) || 'Filter'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('admin.allStatuses' as any) || 'All statuses'}</SelectItem>
                  <SelectItem value="pending">{t('admin.statusPending' as any)}</SelectItem>
                  <SelectItem value="processing">{t('admin.statusProcessing' as any)}</SelectItem>
                  <SelectItem value="shipped">{t('admin.statusShipped' as any)}</SelectItem>
                  <SelectItem value="out_for_delivery">{t('admin.statusOutForDelivery' as any)}</SelectItem>
                  <SelectItem value="delivered">{t('admin.statusDelivered' as any)}</SelectItem>
                  <SelectItem value="cancelled">{t('admin.statusCancelled' as any)}</SelectItem>
                </SelectContent>
              </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToCSV(
                orders.map(o => ({
                  order_number: o.order_number,
                  customer: `${o.profile?.first_name || ''} ${o.profile?.last_name || ''}`.trim(),
                  email: o.profile?.email || '',
                  status: o.status,
                  total: o.total?.toFixed(2),
                  carrier: o.carrier || '',
                  tracking: o.tracking_number || '',
                  date: format(new Date(o.created_at), 'yyyy-MM-dd'),
                })),
                [
                  { key: 'order_number', label: 'Order #' },
                  { key: 'customer', label: 'Customer' },
                  { key: 'email', label: 'Email' },
                  { key: 'status', label: 'Status' },
                  { key: 'total', label: 'Total' },
                  { key: 'carrier', label: 'Carrier' },
                  { key: 'tracking', label: 'Tracking #' },
                  { key: 'date', label: 'Date' },
                ],
                'orders'
              )}
            >
              <Download className="h-4 w-4 mr-1" />
              CSV
            </Button>
            </div>
          </div>
        </CardHeader>

        {/* Bulk Actions Bar */}
        {selectedOrders.size > 0 && (
          <div className="mx-2 md:mx-4 mb-3 p-2 md:p-3 bg-accent/10 border border-accent/20 rounded-lg flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
            <span className="text-xs md:text-sm font-medium text-foreground">
              {selectedOrders.size} {t('admin.selected' as any) || 'selected'}
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <Select onValueChange={handleBulkStatusUpdate} disabled={bulkUpdating}>
                <SelectTrigger className="w-[140px] md:w-[180px] h-8 text-[10px] md:text-xs">
                  <SelectValue placeholder={t('admin.bulkChangeStatus' as any) || 'Change status...'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">{t('admin.statusPending' as any)}</SelectItem>
                  <SelectItem value="processing">{t('admin.statusProcessing' as any)}</SelectItem>
                  <SelectItem value="shipped">{t('admin.statusShipped' as any)}</SelectItem>
                  <SelectItem value="out_for_delivery">{t('admin.statusOutForDelivery' as any)}</SelectItem>
                  <SelectItem value="delivered">{t('admin.statusDelivered' as any)}</SelectItem>
                  <SelectItem value="cancelled">{t('admin.statusCancelled' as any)}</SelectItem>
                </SelectContent>
              </Select>
              {bulkUpdating && <Loader2 className="h-4 w-4 animate-spin text-accent" />}
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => setSelectedOrders(new Set())}>
                {t('admin.cancel' as any) || 'Cancel'}
              </Button>
            </div>
          </div>
        )}

        <CardContent>
          {/* Select All */}
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-border">
            <Checkbox
              checked={selectedOrders.size === filteredOrders.length && filteredOrders.length > 0}
              onCheckedChange={toggleSelectAll}
              className="h-4 w-4"
            />
            <span className="text-xs text-muted-foreground">
              {t('admin.selectAll' as any) || 'Select all'}
            </span>
          </div>

          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const status = statusConfig[order.status] || statusConfig.pending;
              const StatusIcon = status.icon;
              const isExpanded = expandedOrder === order.id;
              const isSelected = selectedOrders.has(order.id);

              return (
                <div key={order.id} className={cn("border rounded-lg overflow-hidden transition-colors", isSelected && "border-accent/50 bg-accent/5")}>
                  <div 
                    className="p-3 md:p-4 flex flex-col sm:flex-row sm:items-center justify-between cursor-pointer hover:bg-secondary/50 transition-colors gap-2"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelect(order.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-4 w-4 shrink-0"
                      />
                      <div className="min-w-0" onClick={() => setExpandedOrder(isExpanded ? null : order.id)}>
                        <p className="font-medium text-sm md:text-base">{t('admin.order' as any)} #{order.order_number}</p>
                        <p className="text-xs md:text-sm text-muted-foreground truncate">
                          {order.profile?.first_name} {order.profile?.last_name} • {order.profile?.email}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1.5 md:gap-4 flex-wrap" onClick={() => setExpandedOrder(isExpanded ? null : order.id)}>
                      <Badge className={cn('gap-1 text-[10px] md:text-xs px-1.5 md:px-2', status.color)}>
                        <StatusIcon className="h-3 w-3" />
                        <span className="hidden xs:inline">{t(status.labelKey as any)}</span>
                      </Badge>
                      <span className="font-bold text-xs md:text-sm">${order.total.toFixed(2)}</span>
                      <span className="text-[10px] md:text-xs text-muted-foreground hidden sm:inline">
                        {format(new Date(order.created_at), 'MMM d, yyyy')}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 md:h-8 md:w-8 text-destructive hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); setFraudOrder(order); }}
                        title={t('admin.fraudDetection' as any)}
                      >
                        <ShieldAlert className="h-3.5 w-3.5 md:h-4 md:w-4" />
                      </Button>
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-4 border-t bg-secondary/20">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold mb-3">{t('admin.orderItems' as any)}</h4>
                          <div className="space-y-2">
                            {order.items?.map((item) => (
                              <div key={item.id} className="flex items-center gap-3 p-2 bg-background rounded">
                                {item.product_image && (
                                  <img src={item.product_image} alt={item.product_name} className="w-12 h-12 rounded object-cover" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{item.product_name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {t('admin.qty' as any)}: {item.quantity} × ${item.price.toFixed(2)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <Label>{t('admin.updateStatus' as any)}</Label>
                            <Select
                              value={order.status}
                              onValueChange={(value) => handleStatusUpdate(order.id, value)}
                              disabled={updating === order.id}
                            >
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">{t('admin.statusPending' as any)}</SelectItem>
                                <SelectItem value="processing">{t('admin.statusProcessing' as any)}</SelectItem>
                                <SelectItem value="shipped">{t('admin.statusShipped' as any)}</SelectItem>
                                <SelectItem value="out_for_delivery">{t('admin.statusOutForDelivery' as any)}</SelectItem>
                                <SelectItem value="delivered">{t('admin.statusDelivered' as any)}</SelectItem>
                                <SelectItem value="cancelled">{t('admin.statusCancelled' as any)}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label>{t('admin.carrier' as any)}</Label>
                              <Input
                                placeholder="e.g., FedEx"
                                value={trackingInfo[order.id]?.carrier || order.carrier || ''}
                                onChange={(e) => setTrackingInfo(prev => ({
                                  ...prev,
                                  [order.id]: { ...prev[order.id], carrier: e.target.value }
                                }))}
                              />
                            </div>
                            <div>
                              <Label>{t('admin.trackingNumber' as any)}</Label>
                              <Input
                                placeholder="#"
                                value={trackingInfo[order.id]?.tracking_number || order.tracking_number || ''}
                                onChange={(e) => setTrackingInfo(prev => ({
                                  ...prev,
                                  [order.id]: { ...prev[order.id], tracking_number: e.target.value }
                                }))}
                              />
                            </div>
                          </div>

                          <Button 
                            className="w-full gap-2"
                            onClick={() => handleStatusUpdate(order.id, order.status)}
                            disabled={updating === order.id}
                          >
                            {updating === order.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                            {t('admin.updateTrackingInfo' as any)}
                          </Button>

                          {order.tracking_number && (
                            <p className="text-sm text-muted-foreground">
                              {t('admin.current' as any)}: {order.carrier} - {order.tracking_number}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      <FraudDetectionModal
        open={!!fraudOrder}
        onOpenChange={(open) => !open && setFraudOrder(null)}
        order={fraudOrder}
      />
    </>
  );
};
