import { X, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SearchFilters as Filters } from '@/hooks/useProductSearch';
import { Category } from '@/types';
import { cn } from '@/lib/utils';

interface SearchFiltersProps {
  filters: Filters;
  updateFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  resetFilters: () => void;
  categories: Category[];
  priceRange: { min: number; max: number };
  onClose?: () => void;
  isMobile?: boolean;
}

export const SearchFiltersPanel = ({
  filters,
  updateFilter,
  resetFilters,
  categories,
  priceRange,
  onClose,
  isMobile = false,
}: SearchFiltersProps) => {
  const activeFiltersCount = [
    filters.category,
    filters.minPrice !== null,
    filters.maxPrice !== null,
    filters.rating !== null,
    filters.inStock,
    filters.freeShipping,
    filters.isPrime,
  ].filter(Boolean).length;

  const content = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">Filters</h3>
          {activeFiltersCount > 0 && (
            <p className="text-sm text-muted-foreground">
              {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''} applied
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeFiltersCount > 0 && (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Clear all
            </Button>
          )}
          {isMobile && onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      <Separator />

      {/* Categories */}
      <div>
        <h4 className="font-medium mb-3">Category</h4>
        <div className="space-y-2">
          <button
            onClick={() => updateFilter('category', null)}
            className={cn(
              'w-full text-left px-3 py-2 rounded-lg transition-colors text-sm',
              filters.category === null
                ? 'bg-accent text-accent-foreground'
                : 'hover:bg-secondary'
            )}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => updateFilter('category', cat.slug)}
              className={cn(
                'w-full text-left px-3 py-2 rounded-lg transition-colors text-sm flex items-center gap-2',
                filters.category === cat.slug
                  ? 'bg-accent text-accent-foreground'
                  : 'hover:bg-secondary'
              )}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Price Range */}
      <div>
        <h4 className="font-medium mb-3">Price Range</h4>
        <div className="px-2">
          <Slider
            value={[
              filters.minPrice ?? priceRange.min,
              filters.maxPrice ?? priceRange.max,
            ]}
            min={priceRange.min}
            max={priceRange.max}
            step={10}
            onValueChange={([min, max]) => {
              updateFilter('minPrice', min);
              updateFilter('maxPrice', max);
            }}
            className="mb-4"
          />
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">
              ${filters.minPrice ?? priceRange.min}
            </span>
            <span className="text-muted-foreground">to</span>
            <span className="font-medium">
              ${filters.maxPrice ?? priceRange.max}
            </span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Rating */}
      <div>
        <h4 className="font-medium mb-3">Rating</h4>
        <div className="space-y-2">
          {[4, 3, 2, 1].map((rating) => (
            <button
              key={rating}
              onClick={() =>
                updateFilter('rating', filters.rating === rating ? null : rating)
              }
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
                filters.rating === rating
                  ? 'bg-accent text-accent-foreground'
                  : 'hover:bg-secondary'
              )}
            >
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      'h-4 w-4',
                      i < rating
                        ? 'fill-rating text-rating'
                        : 'fill-muted text-muted'
                    )}
                  />
                ))}
              </div>
              <span className="text-sm">& Up</span>
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Checkboxes */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="inStock"
            checked={filters.inStock}
            onCheckedChange={(checked) => updateFilter('inStock', !!checked)}
          />
          <Label htmlFor="inStock" className="text-sm font-normal cursor-pointer">
            In Stock Only
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="freeShipping"
            checked={filters.freeShipping}
            onCheckedChange={(checked) => updateFilter('freeShipping', !!checked)}
          />
          <Label htmlFor="freeShipping" className="text-sm font-normal cursor-pointer">
            Free Shipping
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="isPrime"
            checked={filters.isPrime}
            onCheckedChange={(checked) => updateFilter('isPrime', !!checked)}
          />
          <Label htmlFor="isPrime" className="text-sm font-normal cursor-pointer">
            Prime Eligible
          </Label>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <ScrollArea className="h-[80vh] px-4 py-6">
        {content}
      </ScrollArea>
    );
  }

  return <div className="sticky top-24">{content}</div>;
};
