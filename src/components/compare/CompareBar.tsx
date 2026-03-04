import { X, GitCompareArrows } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCompare } from '@/contexts/CompareContext';
import { cn } from '@/lib/utils';

export const CompareBar = () => {
  const { items, removeItem, clearAll, setIsOpen } = useCompare();

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border shadow-lg animate-in slide-in-from-bottom-4">
      <div className="container-main py-3 flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground shrink-0">
          <GitCompareArrows className="h-5 w-5 text-accent" />
          Compare ({items.length}/4)
        </div>

        <div className="flex-1 flex gap-2 overflow-x-auto">
          {items.map(product => (
            <div key={product.id} className="relative flex items-center gap-2 bg-secondary rounded-lg px-3 py-1.5 shrink-0">
              <img src={product.images[0]} alt="" className="w-8 h-8 rounded object-cover" />
              <span className="text-xs font-medium max-w-[120px] truncate">{product.name}</span>
              <button onClick={() => removeItem(product.id)} className="text-muted-foreground hover:text-destructive">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2 shrink-0">
          <Button variant="ghost" size="sm" onClick={clearAll}>
            Clear
          </Button>
          <Button
            variant="accent"
            size="sm"
            disabled={items.length < 2}
            onClick={() => setIsOpen(true)}
            className="gap-1.5"
          >
            <GitCompareArrows className="h-4 w-4" />
            Compare Now
          </Button>
        </div>
      </div>
    </div>
  );
};
