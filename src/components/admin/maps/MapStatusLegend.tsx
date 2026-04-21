import { cn } from '@/lib/utils';
import { getDistrictStatusLegend, type DistrictMapLabels, type DistrictStatusKey } from '@/lib/districtMapping';

interface MapStatusLegendProps {
  labels: DistrictMapLabels;
  stats?: {
    pending: number;
    processing: number;
    packaging: number;
    readyToShip: number;
    inCourier: number;
    delivered: number;
    cancelled: number;
    failed: number;
  };
  className?: string;
}

const getCount = (key: DistrictStatusKey, stats?: MapStatusLegendProps['stats']) => {
  if (!stats) return null;
  return stats[key];
};

export const MapStatusLegend = ({ labels, stats, className }: MapStatusLegendProps) => {
  const legendItems = getDistrictStatusLegend(labels);

  return (
    <div className={cn('rounded-md border border-border bg-muted/20 p-3', className)}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{labels.statusLegend}</h3>
          <p className="text-xs text-muted-foreground">{labels.statusLegendHint}</p>
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        {legendItems.map((item) => {
          const count = getCount(item.key, stats);

          return (
            <div key={item.key} className="rounded-md border border-border bg-background/80 px-3 py-2">
              <div className="flex items-center gap-2">
                <span className={cn('h-2.5 w-2.5 rounded-full', item.dotClass)} />
                <span className="text-xs font-semibold text-foreground">{item.label}</span>
                {typeof count === 'number' && (
                  <span className="ml-auto text-[11px] font-semibold text-primary">{count}</span>
                )}
              </div>
              <p className="mt-1 text-[11px] leading-4 text-muted-foreground">{item.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};