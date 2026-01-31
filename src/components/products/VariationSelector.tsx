import { useState } from 'react';
import { ProductVariation } from '@/types';
import { cn } from '@/lib/utils';

interface VariationSelectorProps {
  variations: ProductVariation[];
  onSelect: (selections: Record<string, string>) => void;
  selectedVariations: Record<string, string>;
}

export const VariationSelector = ({ 
  variations, 
  onSelect, 
  selectedVariations 
}: VariationSelectorProps) => {
  
  const handleSelect = (variationName: string, optionValue: string) => {
    const newSelections = {
      ...selectedVariations,
      [variationName]: optionValue,
    };
    onSelect(newSelections);
  };

  const colorMap: Record<string, string> = {
    'Black': '#1a1a1a',
    'White': '#ffffff',
    'Navy': '#1e3a5f',
    'Red': '#dc2626',
    'Blue': '#2563eb',
    'Green': '#16a34a',
    'Pink': '#ec4899',
    'Gray': '#6b7280',
    'Brown': '#92400e',
    'Beige': '#d4c4a8',
  };

  return (
    <div className="space-y-6">
      {variations.map((variation) => (
        <div key={variation.id} className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-foreground">
              {variation.name}
              {selectedVariations[variation.name] && (
                <span className="text-muted-foreground font-normal ml-2">
                  : {selectedVariations[variation.name]}
                </span>
              )}
            </h3>
            {variation.type === 'size' && (
              <button className="text-sm text-accent hover:underline">
                Size Guide
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {variation.options.map((option) => {
              const isSelected = selectedVariations[variation.name] === option.value;
              const isOutOfStock = option.stock === 0;

              if (variation.type === 'color') {
                const bgColor = colorMap[option.value] || '#e5e7eb';
                return (
                  <button
                    key={option.id}
                    onClick={() => !isOutOfStock && handleSelect(variation.name, option.value)}
                    disabled={isOutOfStock}
                    className={cn(
                      "relative w-10 h-10 rounded-full border-2 transition-all",
                      isSelected 
                        ? "border-accent ring-2 ring-accent ring-offset-2" 
                        : "border-border hover:border-foreground/50",
                      isOutOfStock && "opacity-40 cursor-not-allowed"
                    )}
                    style={{ backgroundColor: bgColor }}
                    title={option.value}
                  >
                    {isOutOfStock && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className="w-full h-0.5 bg-foreground/60 rotate-45 absolute" />
                      </span>
                    )}
                  </button>
                );
              }

              return (
                <button
                  key={option.id}
                  onClick={() => !isOutOfStock && handleSelect(variation.name, option.value)}
                  disabled={isOutOfStock}
                  className={cn(
                    "px-4 py-2 min-w-[48px] rounded-lg border-2 font-medium text-sm transition-all",
                    isSelected 
                      ? "border-accent bg-accent/10 text-accent" 
                      : "border-border hover:border-foreground/50 text-foreground",
                    isOutOfStock && "opacity-40 cursor-not-allowed line-through"
                  )}
                >
                  {option.value}
                  {option.priceModifier && option.priceModifier !== 0 && (
                    <span className="text-xs text-muted-foreground ml-1">
                      {option.priceModifier > 0 ? '+' : ''}{option.priceModifier}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
