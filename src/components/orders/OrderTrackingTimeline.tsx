import { Package, Truck, MapPin, CheckCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

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

const statusSteps = [
  { key: 'pending', label: 'Order Placed', icon: Package },
  { key: 'processing', label: 'Processing', icon: Clock },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle },
];

const getStepIndex = (status: string) => {
  switch (status) {
    case 'pending':
      return 0;
    case 'processing':
      return 1;
    case 'shipped':
      return 2;
    case 'delivered':
      return 3;
    case 'cancelled':
      return -1;
    default:
      return 0;
  }
};

export const OrderTrackingTimeline = ({
  status,
  trackingNumber,
  carrier,
  estimatedDelivery,
  shippedAt,
  deliveredAt,
  events = [],
}: OrderTrackingTimelineProps) => {
  const currentStepIndex = getStepIndex(status);
  const isCancelled = status === 'cancelled';

  return (
    <div className="space-y-6">
      {/* Tracking Info */}
      {trackingNumber && (
        <div className="bg-secondary/50 rounded-lg p-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Carrier: </span>
              <span className="font-medium">{carrier || 'Standard Shipping'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Tracking #: </span>
              <span className="font-medium font-mono">{trackingNumber}</span>
            </div>
            {estimatedDelivery && (
              <div>
                <span className="text-muted-foreground">Est. Delivery: </span>
                <span className="font-medium">
                  {format(new Date(estimatedDelivery), 'MMM d, yyyy')}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Progress Steps */}
      <div className="relative">
        <div className="flex justify-between">
          {statusSteps.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = !isCancelled && index <= currentStepIndex;
            const isCurrent = !isCancelled && index === currentStepIndex;

            return (
              <div
                key={step.key}
                className={cn(
                  'flex flex-col items-center relative z-10',
                  index < statusSteps.length - 1 && 'flex-1'
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
                    'text-xs mt-2 text-center',
                    isCompleted ? 'text-foreground font-medium' : 'text-muted-foreground'
                  )}
                >
                  {step.label}
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
              width: isCancelled ? '0%' : `${(currentStepIndex / (statusSteps.length - 1)) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Cancelled Status */}
      {isCancelled && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-center">
          <p className="text-destructive font-medium">Order Cancelled</p>
        </div>
      )}

      {/* Tracking Events */}
      {events.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground">Tracking History</h4>
          <div className="space-y-3">
            {events.map((event, index) => (
              <div
                key={event.id}
                className={cn(
                  'flex gap-3 text-sm',
                  index === 0 && 'font-medium'
                )}
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
                    <span>
                      {format(new Date(event.created_at), 'MMM d, yyyy h:mm a')}
                    </span>
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
            Delivered on {format(new Date(deliveredAt), 'MMMM d, yyyy')}
          </p>
        </div>
      )}
    </div>
  );
};
