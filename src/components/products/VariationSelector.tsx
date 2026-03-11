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
    'black': '#1a1a1a',
    'White': '#ffffff',
    'white': '#ffffff',
    'Navy': '#1e3a5f',
    'navy': '#1e3a5f',
    'Red': '#dc2626',
    'red': '#dc2626',
    'Blue': '#2563eb',
    'blue': '#2563eb',
    'Green': '#16a34a',
    'green': '#16a34a',
    'Pink': '#ec4899',
    'pink': '#ec4899',
    'Gray': '#6b7280',
    'gray': '#6b7280',
    'Grey': '#6b7280',
    'grey': '#6b7280',
    'Brown': '#92400e',
    'brown': '#92400e',
    'Beige': '#d4c4a8',
    'beige': '#d4c4a8',
    'Yellow': '#eab308',
    'yellow': '#eab308',
    'Orange': '#f97316',
    'orange': '#f97316',
    'Purple': '#9333ea',
    'purple': '#9333ea',
    'Maroon': '#7f1d1d',
    'maroon': '#7f1d1d',
  };

  const colorVariation = variations.find(v => v.type === 'color');
  const sizeVariation = variations.find(v => v.type === 'size');
  const otherVariations = variations.filter(v => v.type !== 'color' && v.type !== 'size');

  // Get sizes available for selected color
  const sizesByColor = sizeVariation ? (sizeVariation as any)._sizesByColor : null;
  const selectedColor = selectedVariations['Color'];
  const availableSizes = sizesByColor && selectedColor 
    ? (sizesByColor[selectedColor] || []) 
    : sizeVariation?.options.map(o => o.value) || [];

  return (
    <div className="space-y-5">
      {/* Color Selection */}
      {colorVariation && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-foreground">Color</h3>
            {selectedColor && (
              <span className="text-sm text-muted-foreground">: {selectedColor}</span>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            {colorVariation.options.map((option) => {
              const isSelected = selectedColor === option.value;
              const bgColor = colorMap[option.value] || '#e5e7eb';
              const isLight = ['White', 'white', 'Beige', 'beige', 'Yellow', 'yellow'].includes(option.value);

              return (
                <button
                  key={option.id}
                  onClick={() => handleSelect('Color', option.value)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all",
                    isSelected 
                      ? "border-accent bg-accent/5 shadow-sm" 
                      : "border-border hover:border-foreground/30"
                  )}
                  title={option.value}
                >
                  <span
                    className={cn(
                      "w-6 h-6 rounded-full border",
                      isLight ? "border-border" : "border-transparent"
                    )}
                    style={{ backgroundColor: bgColor }}
                  />
                  <span className={cn(
                    "text-sm font-medium",
                    isSelected ? "text-accent" : "text-foreground"
                  )}>
                    {option.value}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Size Selection - shows below color */}
      {sizeVariation && availableSizes.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-foreground">Size</h3>
              {selectedVariations['Size'] && (
                <span className="text-sm text-muted-foreground">: {selectedVariations['Size']}</span>
              )}
            </div>
            <button className="text-sm text-accent hover:underline">
              Size Guide
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {availableSizes.map((size: string, i: number) => {
              const isSelected = selectedVariations['Size'] === size;
              return (
                <button
                  key={`size-${i}`}
                  onClick={() => handleSelect('Size', size)}
                  className={cn(
                    "px-4 py-2 min-w-[48px] rounded-lg border-2 font-medium text-sm transition-all",
                    isSelected 
                      ? "border-accent bg-accent/10 text-accent" 
                      : "border-border hover:border-foreground/30 text-foreground"
                  )}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Other variations (style, custom, etc.) */}
      {otherVariations.map((variation) => (
        <div key={variation.id} className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-foreground">{variation.name}</h3>
            {selectedVariations[variation.name] && (
              <span className="text-sm text-muted-foreground">: {selectedVariations[variation.name]}</span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {variation.options.map((option) => {
              const isSelected = selectedVariations[variation.name] === option.value;
              const isOutOfStock = option.stock === 0;
              return (
                <button
                  key={option.id}
                  onClick={() => !isOutOfStock && handleSelect(variation.name, option.value)}
                  disabled={isOutOfStock}
                  className={cn(
                    "px-4 py-2 min-w-[48px] rounded-lg border-2 font-medium text-sm transition-all",
                    isSelected 
                      ? "border-accent bg-accent/10 text-accent" 
                      : "border-border hover:border-foreground/30 text-foreground",
                    isOutOfStock && "opacity-40 cursor-not-allowed line-through"
                  )}
                >
                  {option.value}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
