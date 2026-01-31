import { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'default' | 'lg';
}

export const QuantitySelector = ({ 
  value, 
  onChange, 
  min = 1, 
  max = 99,
  size = 'default'
}: QuantitySelectorProps) => {
  const handleDecrease = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleIncrease = () => {
    if (value < max) {
      onChange(value + 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10);
    if (!isNaN(newValue) && newValue >= min && newValue <= max) {
      onChange(newValue);
    }
  };

  const sizeClasses = {
    sm: 'h-8',
    default: 'h-10',
    lg: 'h-12',
  };

  const buttonSizeClasses = {
    sm: 'w-8 h-8',
    default: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex items-center">
      <Button
        variant="outline"
        size="icon"
        onClick={handleDecrease}
        disabled={value <= min}
        className={cn(
          "rounded-r-none border-r-0",
          buttonSizeClasses[size]
        )}
      >
        <Minus className="h-4 w-4" />
      </Button>
      <Input
        type="number"
        value={value}
        onChange={handleInputChange}
        min={min}
        max={max}
        className={cn(
          "w-16 rounded-none text-center border-x-0 focus-visible:ring-0 focus-visible:ring-offset-0",
          sizeClasses[size]
        )}
      />
      <Button
        variant="outline"
        size="icon"
        onClick={handleIncrease}
        disabled={value >= max}
        className={cn(
          "rounded-l-none border-l-0",
          buttonSizeClasses[size]
        )}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
};
