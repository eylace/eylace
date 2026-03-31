import { useState, useEffect, forwardRef } from 'react';
import { Bell, Package, Truck, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  type: 'order_status' | 'tracking';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  orderId?: string;
  orderNumber?: string;
}

const getStatusMessage = (status: string) => {
  const messages: Record<string, string> = {
    pending: 'Your order has been placed successfully',
    processing: 'Your order is being processed',
    shipped: 'Your order has been shipped! 🚚',
    delivered: 'Your order has been delivered! ✅',
    cancelled: 'Your order has been cancelled',
  };
  return messages[status] || `Status changed to ${status}`;
};

const getIcon = (type: string, message: string) => {
  if (message.includes('delivered')) return <CheckCircle className="h-4 w-4 text-[hsl(var(--success))]" />;
  if (message.includes('shipped') || type === 'tracking') return <Truck className="h-4 w-4 text-primary" />;
  return <Package className="h-4 w-4 text-accent" />;
};

export const NotificationBell = forwardRef<HTMLDivElement>((_, ref) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchInitial = async () => {
      const { data: orders } = await supabase
        .from('orders')
        .select('id, order_number, status, updated_at')
        .order('updated_at', { ascending: false })
        .limit(5);

      if (orders) {
        const initial: Notification[] = orders.map((o) => ({
          id: `order-${o.id}`,
          type: 'order_status' as const,
          title: `Order #${o.order_number}`,
          message: `Status: ${o.status}`,
          timestamp: o.updated_at,
          read: true,
          orderId: o.id,
          orderNumber: o.order_number,
        }));
        setNotifications(initial);
      }
    };

    fetchInitial();

    const orderChannel = supabase
      .channel('order-updates')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const order = payload.new as any;
          const notification: Notification = {
            id: `order-update-${order.id}-${Date.now()}`,
            type: 'order_status',
            title: `Order #${order.order_number} Updated`,
            message: getStatusMessage(order.status),
            timestamp: new Date().toISOString(),
            read: false,
            orderId: order.id,
            orderNumber: order.order_number,
          };
          setNotifications((prev) => [notification, ...prev.slice(0, 19)]);
        }
      )
      .subscribe();

    const trackingChannel = supabase
      .channel('tracking-updates')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'order_tracking_events' },
        async (payload) => {
          const event = payload.new as any;
          const { data: order } = await supabase
            .from('orders')
            .select('order_number')
            .eq('id', event.order_id)
            .single();

          if (order) {
            const notification: Notification = {
              id: `tracking-${event.id}`,
              type: 'tracking',
              title: `Shipment Update - #${order.order_number}`,
              message: event.description,
              timestamp: event.created_at,
              read: false,
              orderNumber: order.order_number,
            };
            setNotifications((prev) => [notification, ...prev.slice(0, 19)]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(orderChannel);
      supabase.removeChannel(trackingChannel);
    };
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  if (!user) return null;

  return (
    <div ref={ref}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button className="relative hover:text-accent transition-colors">
            <Bell className="h-6 w-6" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-destructive text-destructive-foreground text-xs font-bold">
                {unreadCount}
              </Badge>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 p-0">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="font-semibold text-sm">Notifications</h3>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" className="text-xs h-7" onClick={markAllRead}>
                  Mark all read
                </Button>
              )}
              {notifications.length > 0 && (
                <Button variant="ghost" size="sm" className="text-xs h-7" onClick={clearAll}>
                  Clear
                </Button>
              )}
            </div>
          </div>
          <ScrollArea className="max-h-80">
            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={cn(
                      'flex items-start gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors',
                      !notif.read && 'bg-accent/5'
                    )}
                  >
                    <div className="mt-0.5">{getIcon(notif.type, notif.message)}</div>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm', !notif.read && 'font-semibold')}>{notif.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{notif.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notif.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                    {!notif.read && (
                      <div className="w-2 h-2 rounded-full bg-accent shrink-0 mt-2" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
});

NotificationBell.displayName = 'NotificationBell';
