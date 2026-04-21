import { Package, ClipboardCheck, Clock, Truck, Navigation, CheckCircle, MapPin, Box, Send, XCircle, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/use-mobile';

interface TrackingEvent {
  id: string;
  status: string;
  location: string | null;
  description: string;
  created_at: string;
}

interface OrderTrackingTimelineProps {
  status: string;
  trackingNumber?: string | null;
  carrier?: string | null;
  estimatedDelivery?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  events?: TrackingEvent[];
}

const statusStepKeys = [
  { key: 'pending', icon: Package, translationKey: 'tracking.pending' },
  { key: 'confirmed', icon: ClipboardCheck, translationKey: 'tracking.confirmed' },
  { key: 'processing', icon: Clock, translationKey: 'tracking.processing' },
  { key: 'packaging', icon: Box, translationKey: 'tracking.packaging' },
  { key: 'ready_to_ship', icon: Package, translationKey: 'tracking.readyToShip' },
  { key: 'sent_to_courier', icon: Send, translationKey: 'tracking.sentToCourier' },
  { key: 'shipped', icon: Truck, translationKey: 'tracking.shipped' },
  { key: 'out_for_delivery', icon: Navigation, translationKey: 'tracking.outForDelivery' },
  { key: 'delivered', icon: CheckCircle, translationKey: 'tracking.delivered' },
];

const getStepIndex = (status: string) => {
  const map: Record<string, number> = {
    pending: 0,
    confirmed: 1,
    processing: 2,
    packaging: 3,
    ready_to_ship: 4,
    sent_to_courier: 5,
    shipped: 6,
    out_for_delivery: 7,
    delivered: 8,
    completed: 8,
    fulfilled: 8,
    cancelled: -1,
    failed: -1,
    returned: -2,
    refunded: -2,
  };
  return map[status] ?? 0;
};

export const OrderTrackingTimeline = ({
  status,
  trackingNumber,
  carrier,
  estimatedDelivery,
  deliveredAt,
  events = [],
}: OrderTrackingTimelineProps) => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const currentStepIndex = getStepIndex(status);
  const isCancelled = status === 'cancelled';

  return (
    <div className="space-y-6">
      {/* Tracking Info */}
      {trackingNumber && (
        <div className="bg-secondary/50 rounded-lg p-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">{t('tracking.carrier')}: </span>
              <span className="font-medium">{carrier || 'Standard Shipping'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">{t('tracking.trackingNumber')}: </span>
              <span className="font-medium font-mono">{trackingNumber}</span>
            </div>
            {estimatedDelivery && (
              <div>
                <span className="text-muted-foreground">{t('tracking.estDelivery')}: </span>
                <span className="font-medium">
                  {format(new Date(estimatedDelivery), 'MMM d, yyyy')}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Progress Steps */}
      {isMobile ? (
        /* Vertical timeline for mobile */
        <div className="relative pl-4">
          {statusStepKeys.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = !isCancelled && index <= currentStepIndex;
            const isCurrent = !isCancelled && index === currentStepIndex;
            const isLast = index === statusStepKeys.length - 1;

            return (
              <div key={step.key} className="flex items-start gap-3 relative">
                {/* Vertical line */}
                {!isLast && (
                  <div className="absolute left-5 top-10 w-0.5 h-8 z-0">
                    <div
                      className={cn(
                        'w-full h-full',
                        isCompleted && index < currentStepIndex ? 'bg-success' : 'bg-border'
                      )}
                    />
                  </div>
                )}
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center border-2 shrink-0 z-10',
                    isCompleted
                      ? 'bg-success border-success text-success-foreground'
                      : 'bg-secondary border-border text-muted-foreground',
                    isCurrent && 'ring-2 ring-success/30'
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <span
                  className={cn(
                    'text-sm pt-2.5',
                    isCompleted ? 'text-foreground font-medium' : 'text-muted-foreground'
                  )}
                >
                  {t(step.translationKey)}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        /* Horizontal timeline for desktop */
        <div className="relative">
          <div className="flex justify-between">
            {statusStepKeys.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = !isCancelled && index <= currentStepIndex;
              const isCurrent = !isCancelled && index === currentStepIndex;

              return (
                <div
                  key={step.key}
                  className={cn(
                    'flex flex-col items-center relative z-10',
                    index < statusStepKeys.length - 1 && 'flex-1'
                  )}
                >
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors',
                      isCompleted
                        ? 'bg-success border-success text-success-foreground'
                        : 'bg-secondary border-border text-muted-foreground',
                      isCurrent && 'ring-2 ring-success/30'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span
                    className={cn(
                      'text-xs mt-2 text-center max-w-[80px]',
                      isCompleted ? 'text-foreground font-medium' : 'text-muted-foreground'
                    )}
                  >
                    {t(step.translationKey)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Progress Line */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-border -z-0">
            <div
              className={cn(
                'h-full bg-success transition-all duration-500',
                isCancelled && 'bg-destructive'
              )}
              style={{
                width: isCancelled
                  ? '0%'
                  : `${(currentStepIndex / (statusStepKeys.length - 1)) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Cancelled Status */}
      {isCancelled && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-center">
          <p className="text-destructive font-medium">{t('tracking.orderCancelled')}</p>
        </div>
      )}

      {/* Tracking Events */}
      {events.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground">{t('tracking.trackingHistory')}</h4>
          <div className="space-y-3">
            {events.map((event, index) => (
              <div
                key={event.id}
                className={cn('flex gap-3 text-sm', index === 0 && 'font-medium')}
              >
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'w-2 h-2 rounded-full mt-1.5',
                      index === 0 ? 'bg-success' : 'bg-border'
                    )}
                  />
                  {index < events.length - 1 && (
                    <div className="w-0.5 flex-1 bg-border mt-1" />
                  )}
                </div>
                <div className="flex-1 pb-3">
                  <p className={index === 0 ? 'text-foreground' : 'text-muted-foreground'}>
                    {event.description}
                  </p>
                  <div className="flex gap-2 text-xs text-muted-foreground mt-0.5">
                    <span>{format(new Date(event.created_at), 'MMM d, yyyy h:mm a')}</span>
                    {event.location && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {event.location}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delivery Info */}
      {deliveredAt && (
        <div className="bg-success/10 border border-success/20 rounded-lg p-4">
          <p className="text-success font-medium flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            {t('tracking.deliveredOn')} {format(new Date(deliveredAt), 'MMMM d, yyyy')}
          </p>
        </div>
      )}
    </div>
  );
};
