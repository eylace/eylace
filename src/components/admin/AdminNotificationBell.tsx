import { useState, useEffect, useCallback } from 'react';
import { Bell, ShoppingCart, AlertTriangle, DollarSign, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface AdminNotification {
  id: string;
  type: 'new_order' | 'order_cancelled' | 'low_stock' | 'new_review';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  meta?: Record<string, any>;
}

export const AdminNotificationBell = () => {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [open, setOpen] = useState(false);

  const addNotification = useCallback((notif: AdminNotification) => {
    setNotifications((prev) => [notif, ...prev.slice(0, 49)]);
    // Also show a toast
    toast(notif.title, { description: notif.message });
  }, []);

  useEffect(() => {
    // Subscribe to new orders (INSERT)
    const newOrderChannel = supabase
      .channel('admin-new-orders')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          const order = payload.new as any;
          addNotification({
            id: `new-order-${order.id}`,
            type: 'new_order',
            title: '🛒 New Order Received!',
            message: `Order #${order.order_number} — $${Number(order.total).toFixed(2)}`,
            timestamp: new Date().toISOString(),
            read: false,
            meta: { orderId: order.id, orderNumber: order.order_number },
          });
        }
      )
      .subscribe();

    // Subscribe to order status changes (UPDATE)
    const orderUpdateChannel = supabase
      .channel('admin-order-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          const order = payload.new as any;
          const oldOrder = payload.old as any;
          if (order.status !== oldOrder.status && order.status === 'cancelled') {
            addNotification({
              id: `cancelled-${order.id}-${Date.now()}`,
              type: 'order_cancelled',
              title: '⚠️ Order Cancelled',
              message: `Order #${order.order_number} has been cancelled`,
              timestamp: new Date().toISOString(),
              read: false,
              meta: { orderId: order.id },
            });
          }
        }
      )
      .subscribe();

    // Subscribe to new reviews
    const reviewChannel = supabase
      .channel('admin-new-reviews')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'product_reviews',
        },
        (payload) => {
          const review = payload.new as any;
          addNotification({
            id: `review-${review.id}`,
            type: 'new_review',
            title: '⭐ New Review',
            message: `${review.rating}-star review: "${review.title}"`,
            timestamp: new Date().toISOString(),
            read: false,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(newOrderChannel);
      supabase.removeChannel(orderUpdateChannel);
      supabase.removeChannel(reviewChannel);
    };
  }, [addNotification]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const getIcon = (type: AdminNotification['type']) => {
    switch (type) {
      case 'new_order':
        return <ShoppingCart className="h-4 w-4 text-[hsl(var(--success))]" />;
      case 'order_cancelled':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'new_review':
        return <DollarSign className="h-4 w-4 text-primary" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 bg-destructive text-destructive-foreground text-xs font-bold">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-semibold text-sm">Admin Notifications</h3>
          <div className="flex gap-1">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={markAllRead}>
                Mark all read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={clearAll}>
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
        <ScrollArea className="max-h-96">
          {notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Real-time alerts will appear here
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={cn(
                    'flex items-start gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors cursor-pointer',
                    !notif.read && 'bg-primary/5'
                  )}
                  onClick={() => {
                    setNotifications((prev) =>
                      prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
                    );
                  }}
                >
                  <div className="mt-0.5 shrink-0">{getIcon(notif.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm', !notif.read && 'font-semibold')}>{notif.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{notif.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notif.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                  {!notif.read && (
                    <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
