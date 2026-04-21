import { useState } from 'react';
import { Info, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import {
  ALL_ORDER_STATUSES,
  ORDER_STATUS_META,
  type OrderStatusKey,
} from '@/lib/orderStatusConfig';

interface OrderStatusLegendProps {
  variant?: 'popover' | 'inline';
  counts?: Partial<Record<OrderStatusKey, number>>;
  filterable?: boolean;
  activeStatus?: string;
  onSelect?: (status: 'all' | OrderStatusKey) => void;
  className?: string;
  triggerLabel?: string;
}

/**
 * Reusable, accessible status legend.
 * - `popover` (default): compact button that opens a popover with explanations.
 * - `inline`: a full grid suitable for placing inside a card/sidebar.
 * Optional `counts` shows per-status totals; optional filterable mode allows
 * the legend to act as a quick status filter.
 */
export const OrderStatusLegend = ({
  variant = 'popover',
  counts,
  filterable = false,
  activeStatus,
  onSelect,
  className,
  triggerLabel = 'Status legend',
}: OrderStatusLegendProps) => {
  const [open, setOpen] = useState(false);

  const Body = (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground">Order status guide</h4>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {ALL_ORDER_STATUSES.length} statuses
        </span>
      </div>
      {filterable && (
        <button
          type="button"
          onClick={() => onSelect?.('all')}
          className={cn(
            'w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs border transition-colors',
            activeStatus === 'all' || !activeStatus
              ? 'bg-primary/10 border-primary/40 text-foreground'
              : 'border-border hover:bg-secondary/50 text-muted-foreground'
          )}
        >
          <span className="font-medium">All statuses</span>
          {counts && (
            <span className="font-mono">
              {Object.values(counts).reduce((sum, n) => sum + (n || 0), 0)}
            </span>
          )}
        </button>
      )}
      <div className="grid gap-1.5">
        {ALL_ORDER_STATUSES.map((key) => {
          const meta = ORDER_STATUS_META[key];
          const Icon = meta.icon;
          const count = counts?.[key];
          const isActive = activeStatus === key;
          const Wrapper: any = filterable ? 'button' : 'div';
          return (
            <Wrapper
              key={key}
              type={filterable ? 'button' : undefined}
              onClick={filterable ? () => onSelect?.(key) : undefined}
              className={cn(
                'flex items-start gap-2.5 rounded-md border p-2 text-left transition-colors',
                filterable ? 'cursor-pointer hover:bg-secondary/40' : 'cursor-default',
                isActive ? 'border-primary/50 bg-primary/5' : 'border-border bg-card'
              )}
            >
              <span
                className={cn(
                  'mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] shrink-0',
                  meta.badgeClass
                )}
              >
                <Icon className="h-3 w-3" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline" className={cn('text-[10px] font-semibold border', meta.badgeClass)}>
                    {meta.label}
                  </Badge>
                  {typeof count === 'number' && (
                    <span className="text-[11px] font-mono text-muted-foreground">{count}</span>
                  )}
                </div>
                <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{meta.description}</p>
              </div>
            </Wrapper>
          );
        })}
      </div>
    </div>
  );

  if (variant === 'inline') {
    return <div className={cn('rounded-lg border border-border bg-card p-3', className)}>{Body}</div>;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn('h-8 gap-1.5 text-xs font-medium', className)}
        >
          <Info className="h-3.5 w-3.5" />
          {triggerLabel}
          <ChevronDown className="h-3 w-3 opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 max-h-[70vh] overflow-y-auto p-3">
        {Body}
      </PopoverContent>
    </Popover>
  );
};

/** A single tooltip wrapper around any status badge/label */
export const StatusTooltip = ({ status, children }: { status: string; children: React.ReactNode }) => {
  const meta = ORDER_STATUS_META[(status || 'pending') as OrderStatusKey] || ORDER_STATUS_META.pending;
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">{children}</span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[260px] text-xs">
          <div className="font-semibold">{meta.label}</div>
          <div className="text-[11px] opacity-90">{meta.description}</div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};