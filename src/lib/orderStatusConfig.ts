import { Clock, Package, Box, Send, Truck, Navigation, CheckCircle, XCircle, RotateCcw, RefreshCcw, type LucideIcon } from 'lucide-react';

export type OrderStatusKey =
  | 'pending'
  | 'processing'
  | 'packaging'
  | 'ready_to_ship'
  | 'sent_to_courier'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'completed'
  | 'fulfilled'
  | 'cancelled'
  | 'failed'
  | 'returned'
  | 'refunded';

export interface OrderStatusMeta {
  key: OrderStatusKey;
  label: string;
  description: string;
  badgeClass: string;
  dotClass: string;
  icon: LucideIcon;
  /** Workflow step (0..N). Terminal/exception states: -1 cancel/fail, -2 returned/refunded */
  step: number;
  group: 'flow' | 'success' | 'exception';
}

export const ORDER_STATUS_META: Record<OrderStatusKey, OrderStatusMeta> = {
  pending: {
    key: 'pending',
    label: 'Pending',
    description: 'Order placed and awaiting confirmation by the seller.',
    badgeClass: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700/50',
    dotClass: 'bg-amber-500',
    icon: Clock,
    step: 0,
    group: 'flow',
  },
  processing: {
    key: 'processing',
    label: 'Processing',
    description: 'Seller has confirmed and is preparing the order.',
    badgeClass: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700/50',
    dotClass: 'bg-blue-500',
    icon: Package,
    step: 1,
    group: 'flow',
  },
  packaging: {
    key: 'packaging',
    label: 'Packaging',
    description: 'Items are being packed and labeled for shipment.',
    badgeClass: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-700/50',
    dotClass: 'bg-indigo-500',
    icon: Box,
    step: 2,
    group: 'flow',
  },
  ready_to_ship: {
    key: 'ready_to_ship',
    label: 'Ready to Ship',
    description: 'Package is ready and waiting for courier pickup.',
    badgeClass: 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-700/50',
    dotClass: 'bg-sky-500',
    icon: Package,
    step: 3,
    group: 'flow',
  },
  sent_to_courier: {
    key: 'sent_to_courier',
    label: 'Sent To Courier',
    description: 'Handed over to the courier service for delivery.',
    badgeClass: 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-700/50',
    dotClass: 'bg-teal-500',
    icon: Send,
    step: 4,
    group: 'flow',
  },
  shipped: {
    key: 'shipped',
    label: 'Shipped',
    description: 'In transit toward the destination delivery hub.',
    badgeClass: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700/50',
    dotClass: 'bg-purple-500',
    icon: Truck,
    step: 5,
    group: 'flow',
  },
  out_for_delivery: {
    key: 'out_for_delivery',
    label: 'Out for Delivery',
    description: 'Delivery agent is on the way with your package.',
    badgeClass: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-700/50',
    dotClass: 'bg-orange-500',
    icon: Navigation,
    step: 6,
    group: 'flow',
  },
  delivered: {
    key: 'delivered',
    label: 'Delivered',
    description: 'Package successfully delivered to the customer.',
    badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700/50',
    dotClass: 'bg-emerald-500',
    icon: CheckCircle,
    step: 7,
    group: 'success',
  },
  completed: {
    key: 'completed',
    label: 'Completed',
    description: 'Order completed — no further actions required.',
    badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700/50',
    dotClass: 'bg-emerald-600',
    icon: CheckCircle,
    step: 7,
    group: 'success',
  },
  fulfilled: {
    key: 'fulfilled',
    label: 'Fulfilled',
    description: 'Order fully fulfilled and closed.',
    badgeClass: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700/50',
    dotClass: 'bg-green-600',
    icon: CheckCircle,
    step: 7,
    group: 'success',
  },
  cancelled: {
    key: 'cancelled',
    label: 'Cancelled',
    description: 'Order was cancelled before delivery.',
    badgeClass: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700/50',
    dotClass: 'bg-red-500',
    icon: XCircle,
    step: -1,
    group: 'exception',
  },
  failed: {
    key: 'failed',
    label: 'Failed',
    description: 'Delivery attempt failed (e.g., undeliverable, payment failure).',
    badgeClass: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-700/50',
    dotClass: 'bg-rose-500',
    icon: XCircle,
    step: -1,
    group: 'exception',
  },
  returned: {
    key: 'returned',
    label: 'Returned',
    description: 'Customer returned the order to the seller.',
    badgeClass: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-900/30 dark:text-fuchsia-400 dark:border-fuchsia-700/50',
    dotClass: 'bg-fuchsia-500',
    icon: RotateCcw,
    step: -2,
    group: 'exception',
  },
  refunded: {
    key: 'refunded',
    label: 'Refunded',
    description: 'Refund processed and credited to the customer.',
    badgeClass: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700/50',
    dotClass: 'bg-purple-600',
    icon: RefreshCcw,
    step: -2,
    group: 'exception',
  },
};

export const ORDER_STATUS_FLOW: OrderStatusKey[] = [
  'pending',
  'processing',
  'packaging',
  'ready_to_ship',
  'sent_to_courier',
  'shipped',
  'out_for_delivery',
  'delivered',
];

export const ORDER_EXCEPTION_STATUSES: OrderStatusKey[] = ['cancelled', 'failed', 'returned', 'refunded'];

export const ALL_ORDER_STATUSES: OrderStatusKey[] = [
  ...ORDER_STATUS_FLOW,
  'completed',
  'fulfilled',
  ...ORDER_EXCEPTION_STATUSES,
];

export const getStatusMeta = (status: string | null | undefined): OrderStatusMeta => {
  const key = (status || 'pending') as OrderStatusKey;
  return ORDER_STATUS_META[key] || ORDER_STATUS_META.pending;
};

/** Customer-facing eligibility helper */
export interface OrderActionEligibility {
  canCancel: boolean;
  canReturn: boolean;
  message: string;
  tone: 'info' | 'warning' | 'destructive' | 'success';
}

export const getCustomerActionEligibility = (
  status: string,
  hasOpenReturn: boolean,
  hoursSinceDelivery?: number
): OrderActionEligibility => {
  const meta = getStatusMeta(status);
  if (status === 'pending') {
    return { canCancel: true, canReturn: false, tone: 'info', message: 'You can still cancel this order while it is pending.' };
  }
  if (status === 'processing' || status === 'packaging') {
    return { canCancel: true, canReturn: false, tone: 'warning', message: 'Cancellation is still possible — the order has not been handed to courier yet.' };
  }
  if (status === 'ready_to_ship' || status === 'sent_to_courier' || status === 'shipped' || status === 'out_for_delivery') {
    return { canCancel: false, canReturn: false, tone: 'warning', message: 'This order is already on the way. Please refuse delivery or contact support to cancel.' };
  }
  if (status === 'delivered' || status === 'completed' || status === 'fulfilled') {
    if (hasOpenReturn) {
      return { canCancel: false, canReturn: false, tone: 'info', message: 'A return request is already open for this order.' };
    }
    if (typeof hoursSinceDelivery === 'number' && hoursSinceDelivery > 24) {
      return { canCancel: false, canReturn: false, tone: 'warning', message: 'The 24-hour return window has passed for this order.' };
    }
    return { canCancel: false, canReturn: true, tone: 'success', message: 'You have 24 hours from delivery to request a return or refund.' };
  }
  if (status === 'cancelled') {
    return { canCancel: false, canReturn: false, tone: 'destructive', message: 'This order has been cancelled. Contact support if this was a mistake.' };
  }
  if (status === 'failed') {
    return { canCancel: false, canReturn: false, tone: 'destructive', message: 'Delivery failed. Please contact support to retry or refund.' };
  }
  if (status === 'returned') {
    return { canCancel: false, canReturn: false, tone: 'info', message: 'This order was returned. A refund will be processed shortly if eligible.' };
  }
  if (status === 'refunded') {
    return { canCancel: false, canReturn: false, tone: 'success', message: 'Your refund has been processed.' };
  }
  return { canCancel: false, canReturn: false, tone: 'info', message: meta.description };
};