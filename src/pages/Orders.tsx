import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, ChevronRight, ShoppingBag, Loader2, Phone, MessageCircle, RotateCcw, XCircle, AlertTriangle } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { OrderTrackingTimeline } from '@/components/orders/OrderTrackingTimeline';
import { ReturnRequestModal } from '@/components/orders/ReturnRequestModal';
import { toast } from 'sonner';

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_image: string | null;
  price: number;
  quantity: number;
  variations: Json | null;
}

interface TrackingEvent {
  id: string;
  status: string;
  location: string | null;
  description: string;
  created_at: string;
}

interface ReturnRequest {
  id: string;
  order_item_id: string | null;
  reason: string;
  status: string;
  refund_amount: number;
  refund_method: string;
  created_at: string;
  resolved_at: string | null;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  payment_method: string;
  shipping_address: Json | null;
  tracking_number: string | null;
  carrier: string | null;
  estimated_delivery: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  created_at: string;
  order_items: OrderItem[];
  tracking_events: TrackingEvent[];
  return_requests: ReturnRequest[];
}

const statusColors: Record<string, string> = {
  pending: 'bg-warning/10 text-warning border-warning/20',
  confirmed: 'bg-accent/10 text-accent border-accent/20',
  processing: 'bg-primary/10 text-primary border-primary/20',
  shipped: 'bg-prime/10 text-prime border-prime/20',
  out_for_delivery: 'bg-primary/10 text-primary border-primary/20',
  delivered: 'bg-success/10 text-success border-success/20',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
};

const Orders = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [returnModal, setReturnModal] = useState<{ orderId: string; orderNumber: string; items: OrderItem[] } | null>(null);
  const [cancellingOrder, setCancellingOrder] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (user) {
      fetchOrders();
    }
  }, [user, authLoading, navigate]);

  const fetchOrders = async () => {
    setLoading(true);
    const { data: ordersData, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });

    if (error) {
      setLoading(false);
      return;
    }

    const ordersWithDetails = await Promise.all(
      (ordersData || []).map(async (order) => {
        const [itemsResult, eventsResult, returnsResult] = await Promise.all([
          supabase
            .from('order_items')
            .select('*')
            .eq('order_id', order.id),
          supabase
            .from('order_tracking_events')
            .select('*')
            .eq('order_id', order.id)
            .order('created_at', { ascending: false }),
          supabase
            .from('return_requests' as any)
            .select('*')
            .eq('order_id', order.id)
            .order('created_at', { ascending: false }),
        ]);
        
        return {
          ...order,
          order_items: itemsResult.data || [],
          tracking_events: eventsResult.data || [],
          return_requests: (returnsResult.data || []) as unknown as ReturnRequest[],
        };
      })
    );

    setOrders(ordersWithDetails);
    setLoading(false);
  };

  const handleCancelOrder = async (orderId: string) => {
    setCancellingOrder(orderId);
    const { data, error } = await supabase.rpc('user_cancel_order', { _order_id: orderId });
    setCancellingOrder(null);
    if (error || !data) {
      toast.error('Failed to cancel order. Only pending orders can be cancelled.');
      return;
    }
    toast.success('Order cancelled successfully');
    fetchOrders();
  };

  const getReturnStatusColor = (status: string) => {
    const map: Record<string, string> = {
      pending: 'bg-warning/10 text-warning border-warning/20',
      approved: 'bg-success/10 text-success border-success/20',
      rejected: 'bg-destructive/10 text-destructive border-destructive/20',
      refunded: 'bg-primary/10 text-primary border-primary/20',
      picked_up: 'bg-accent/10 text-accent border-accent/20',
    };
    return map[status] || map.pending;
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="container-main py-12 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Layout>
      <div className="container-main py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold">{t('orders.myOrders')}</h1>
              <p className="text-muted-foreground mt-1">
                {t('orders.trackManage')}
              </p>
            </div>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-xl border border-border">
              <div className="w-20 h-20 mx-auto bg-secondary rounded-full flex items-center justify-center mb-4">
                <ShoppingBag className="h-10 w-10 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold mb-2">{t('orders.noOrders')}</h2>
              <p className="text-muted-foreground mb-6">
                {t('orders.startShoppingDesc')}
              </p>
              <Link to="/">
                <Button variant="accent">{t('orders.startShopping')}</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-card rounded-xl border border-border overflow-hidden"
                >
                  {/* Order Header */}
                  <button
                    onClick={() =>
                      setExpandedOrder(
                        expandedOrder === order.id ? null : order.id
                      )
                    }
                    className="w-full p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold">
                          Order #{order.order_number}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(order.created_at), 'MMM d, yyyy')} ·{' '}
                          {order.order_items.length} {order.order_items.length !== 1 ? t('common.items') : t('common.item')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge
                        variant="outline"
                        className={cn(
                          'capitalize',
                          statusColors[order.status] || statusColors.pending
                        )}
                      >
                        {order.status}
                      </Badge>
                      <span className="font-semibold">
                        ৳{order.total.toFixed(2)}
                      </span>
                      <ChevronRight
                        className={cn(
                          'h-5 w-5 text-muted-foreground transition-transform',
                          expandedOrder === order.id && 'rotate-90'
                        )}
                      />
                    </div>
                  </button>

                  {/* Expanded Content */}
                  {expandedOrder === order.id && (
                    <div className="border-t border-border">
                      {/* Tracking Timeline - Always visible */}
                      {order.status !== 'cancelled' && (
                        <div className="p-4 border-b border-border bg-secondary/30">
                          <OrderTrackingTimeline
                            status={order.status}
                            trackingNumber={order.tracking_number}
                            carrier={order.carrier}
                            estimatedDelivery={order.estimated_delivery}
                            shippedAt={order.shipped_at}
                            deliveredAt={order.delivered_at}
                            events={order.tracking_events}
                          />
                        </div>
                      )}

                      {order.status === 'cancelled' && (
                        <div className="p-4 border-b border-border bg-destructive/5">
                          <OrderTrackingTimeline
                            status={order.status}
                            events={order.tracking_events}
                          />
                        </div>
                      )}

                      {/* Order Items */}
                      <div className="p-4 space-y-3">
                        {order.order_items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-4"
                          >
                            <div className="w-16 h-16 bg-secondary rounded-lg overflow-hidden shrink-0">
                              <img
                                src={item.product_image || '/placeholder.svg'}
                                alt={item.product_name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">
                                {item.product_name}
                              </p>
                              {item.variations && (
                                <p className="text-sm text-muted-foreground">
                                  {Object.entries(item.variations as Record<string, string>)
                                    .map(([key, val]) => `${key}: ${val}`)
                                    .join(' · ')}
                                </p>
                              )}
                              <p className="text-sm text-muted-foreground">
                                {t('orders.qty')} {item.quantity}
                              </p>
                            </div>
                            <p className="font-medium">
                              ৳{(item.price * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Return Requests Status with Progress Timeline */}
                      {order.return_requests.length > 0 && (
                        <>
                          <Separator />
                          <div className="p-4 space-y-3">
                            <h4 className="text-sm font-medium flex items-center gap-2">
                              <RotateCcw className="h-4 w-4" /> Return Requests
                            </h4>
                            {order.return_requests.map((ret) => {
                              const returnedItem = order.order_items.find(i => i.id === ret.order_item_id);
                              const steps = [
                                { key: 'pending', label: 'Requested' },
                                { key: 'approved', label: 'Approved' },
                                { key: 'refunded', label: 'Refunded' },
                              ];
                              const isRejected = ret.status === 'rejected';
                              const currentStepIdx = isRejected ? 1 : steps.findIndex(s => s.key === ret.status);
                              return (
                                <div key={ret.id} className="p-3 bg-secondary/50 rounded-lg space-y-3">
                                  <div className="flex items-center gap-3">
                                    {returnedItem && (
                                      <div className="w-10 h-10 bg-secondary rounded overflow-hidden shrink-0">
                                        <img src={returnedItem.product_image || '/placeholder.svg'} alt="" className="w-full h-full object-cover" />
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate">{returnedItem?.product_name || 'Item'}</p>
                                      <p className="text-xs text-muted-foreground">{ret.reason}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <p className="text-xs font-medium text-success">৳{Number(ret.refund_amount).toFixed(2)}</p>
                                    </div>
                                  </div>
                                  {/* Progress Timeline */}
                                  <div className="flex items-center gap-1">
                                    {isRejected ? (
                                      <>
                                        <div className="flex flex-col items-center flex-1">
                                          <div className="w-6 h-6 rounded-full bg-success text-success-foreground flex items-center justify-center text-xs">✓</div>
                                          <span className="text-[10px] text-muted-foreground mt-1">Requested</span>
                                        </div>
                                        <div className="h-0.5 flex-1 bg-destructive/50" />
                                        <div className="flex flex-col items-center flex-1">
                                          <div className="w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs">✕</div>
                                          <span className="text-[10px] text-destructive font-medium mt-1">Rejected</span>
                                        </div>
                                      </>
                                    ) : (
                                      steps.map((step, idx) => (
                                        <div key={step.key} className="contents">
                                          {idx > 0 && (
                                            <div className={cn('h-0.5 flex-1', idx <= currentStepIdx ? 'bg-success' : 'bg-border')} />
                                          )}
                                          <div className="flex flex-col items-center flex-1">
                                            <div className={cn(
                                              'w-6 h-6 rounded-full flex items-center justify-center text-xs',
                                              idx < currentStepIdx ? 'bg-success text-success-foreground' :
                                              idx === currentStepIdx ? 'bg-accent text-accent-foreground ring-2 ring-accent/30' :
                                              'bg-muted text-muted-foreground'
                                            )}>
                                              {idx < currentStepIdx ? '✓' : idx + 1}
                                            </div>
                                            <span className={cn('text-[10px] mt-1', idx === currentStepIdx ? 'text-accent font-medium' : 'text-muted-foreground')}>{step.label}</span>
                                          </div>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                  {ret.resolved_at && (
                                    <p className="text-[10px] text-muted-foreground text-right">
                                      Resolved: {format(new Date(ret.resolved_at), 'MMM d, yyyy')}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}

                      <Separator />

                      {/* Action Buttons */}
                      <div className="p-4 flex flex-wrap gap-2 border-b border-border">
                        {order.status === 'pending' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive border-destructive/30 hover:bg-destructive/10"
                            onClick={(e) => { e.stopPropagation(); handleCancelOrder(order.id); }}
                            disabled={cancellingOrder === order.id}
                          >
                            {cancellingOrder === order.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                            ) : (
                              <XCircle className="h-3.5 w-3.5 mr-1.5" />
                            )}
                            Cancel Order
                          </Button>
                        )}
                        {order.status === 'delivered' && (() => {
                          const returnedItemIds = new Set(order.return_requests.map(r => r.order_item_id));
                          const unreturned = order.order_items.filter(i => !returnedItemIds.has(i.id));
                          if (unreturned.length === 0) return null;
                          return (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-accent border-accent/30 hover:bg-accent/10"
                              onClick={(e) => {
                                e.stopPropagation();
                                setReturnModal({
                                  orderId: order.id,
                                  orderNumber: order.order_number,
                                  items: unreturned,
                                });
                              }}
                            >
                              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                              Request Return
                            </Button>
                          );
                        })()}
                      </div>

                      {/* Contact & Order Summary */}
                      <div className="p-4 bg-secondary/30">
                        {/* Contact Buttons */}
                        {order.shipping_address && typeof order.shipping_address === 'object' && (order.shipping_address as any).phone && (
                          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
                            <span className="text-sm text-muted-foreground">📞 {(order.shipping_address as any).phone}</span>
                            <a
                              href={`tel:${(order.shipping_address as any).phone}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-500/10 text-green-600 hover:bg-green-500/20 rounded-md transition-colors"
                              onClick={e => e.stopPropagation()}
                            >
                              <Phone className="h-3.5 w-3.5" /> Call Now
                            </a>
                            <a
                              href={`https://wa.me/${((order.shipping_address as any).phone || '').replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 rounded-md transition-colors"
                              onClick={e => e.stopPropagation()}
                            >
                              <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                            </a>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 text-sm max-w-xs ml-auto">
                          <span className="text-muted-foreground">{t('orders.subtotal')}</span>
                          <span className="text-right">৳{order.subtotal.toFixed(2)}</span>
                          
                          <span className="text-muted-foreground">{t('orders.shipping')}</span>
                          <span className="text-right">
                            {order.shipping === 0 ? t('orders.free') : `৳${order.shipping.toFixed(2)}`}
                          </span>
                          
                          <span className="text-muted-foreground">{t('orders.tax')}</span>
                          <span className="text-right">৳{order.tax.toFixed(2)}</span>
                          
                          {order.discount > 0 && (
                            <>
                              <span className="text-muted-foreground">{t('orders.discount')}</span>
                              <span className="text-right text-success">
                                -৳{order.discount.toFixed(2)}
                              </span>
                            </>
                          )}
                          
                          <Separator className="col-span-2" />
                          
                          <span className="font-semibold">{t('orders.total')}</span>
                          <span className="text-right font-bold text-lg">
                            ৳{order.total.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Return Request Modal */}
      {returnModal && user && (
        <ReturnRequestModal
          open={!!returnModal}
          onClose={() => setReturnModal(null)}
          orderId={returnModal.orderId}
          orderNumber={returnModal.orderNumber}
          orderItems={returnModal.items}
          userId={user.id}
          onSuccess={fetchOrders}
        />
      )}
    </Layout>
  );
};

export default Orders;
