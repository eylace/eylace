import { Package, ClipboardCheck, Clock, Truck, Navigation, CheckCircle, MapPin, Box, Send, User, ShieldCheck, Truck as TruckIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Badge } from '@/components/ui/badge';
import { getStatusMeta } from '@/lib/orderStatusConfig';

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

  // Parse "by NAME · ROLE" suffix from event description and split out reason
  const parseActor = (description: string) => {
    const m = description.match(/\s*\(by\s+(.+?)\s*·\s*(.+?)\)\s*$/);
    if (!m) return { actor: null as null | { name: string; role: string }, base: description };
    return { actor: { name: m[1], role: m[2] }, base: description.replace(m[0], '').trim() };
  };
  const splitReason = (base: string) => {
    const m = base.match(/\s*—\s*Reason:\s*(.+)$/);
    if (!m) return { reason: null as string | null, headline: base };
    return { reason: m[1].trim(), headline: base.replace(m[0], '').trim() };
  };
  const roleIcon = (role?: string | null) => {
    const r = (role || '').toLowerCase();
    if (r.includes('seller') || r.includes('vendor')) return Package;
    if (r.includes('courier') || r.includes('delivery') || r.includes('shipping')) return TruckIcon;
    if (r.includes('admin') || r.includes('manager') || r.includes('moderator') || r.includes('support')) return ShieldCheck;
    return User;
  };

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

      {/* Detailed Tracking History (with actor + timestamps + reasons) */}
      {events.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm text-foreground">{t('tracking.trackingHistory')}</h4>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {events.length} update{events.length === 1 ? '' : 's'}
            </span>
          </div>
          <div className="rounded-lg border border-border bg-card p-3">
            <div className="space-y-3">
              {events.map((event, index) => {
                const meta = getStatusMeta(event.status);
                const { actor, base } = parseActor(event.description || '');
                const { reason, headline } = splitReason(base);
                const ActorIcon = roleIcon(actor?.role);
                return (
                  <div key={event.id} className="flex gap-3 text-sm">
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        'h-7 w-7 rounded-full flex items-center justify-center border',
                        index === 0 ? meta.badgeClass : 'bg-muted text-muted-foreground border-border'
                      )}>
                        <meta.icon className="h-3.5 w-3.5" />
                      </div>
                      {index < events.length - 1 && (
                        <div className="w-0.5 flex-1 bg-border mt-1" />
                      )}
                    </div>
                    <div className="flex-1 pb-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant="outline" className={cn('text-[10px] font-semibold', meta.badgeClass)}>
                          {meta.label}
                        </Badge>
                        {actor && (
                          <Badge variant="outline" className="text-[10px] gap-1 capitalize">
                            <ActorIcon className="h-2.5 w-2.5" /> {actor.role.replace(/_/g, ' ')}
                          </Badge>
                        )}
                      </div>
                      <p className={cn('mt-1', index === 0 ? 'text-foreground' : 'text-muted-foreground')}>
                        {headline || meta.description}
                      </p>
                      {reason && (
                        <p className="mt-1 text-xs italic text-muted-foreground">
                          “{reason}”
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground mt-1">
                        <span>{format(new Date(event.created_at), 'MMM d, yyyy h:mm a')}</span>
                        {actor && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" /> {actor.name}
                            </span>
                          </>
                        )}
                        {event.location && !actor && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {event.location}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
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
