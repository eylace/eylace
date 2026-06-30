import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { OptimizedImage } from '@/components/ui/OptimizedImage';

/**
 * Shared frame used everywhere a product feature image renders.
 * Enforces identical aspect ratio, background, border, radius, and padding
 * so cards across all sections look consistent.
 */
interface ProductImageFrameProps {
  src: string;
  alt: string;
  variant?: 'card' | 'detail';
  /** Enable subtle zoom on hover of a parent `.group` element. */
  hoverZoom?: boolean;
  /** Tailwind size utilities for fixed-size frames (e.g. list view). Defaults to aspect-square. */
  sizeClassName?: string;
  /** Tailwind padding utilities. Defaults to responsive p-2 sm:p-3. */
  paddingClassName?: string;
  className?: string;
  children?: ReactNode;
}

export function ProductImageFrame({
  src,
  alt,
  variant = 'card',
  hoverZoom = false,
  sizeClassName = 'aspect-square w-full',
  paddingClassName = 'p-2 sm:p-3',
  className,
  children,
}: ProductImageFrameProps) {
  return (
    <div
      className={cn(
        'relative bg-card rounded-lg overflow-hidden border border-border/60',
        sizeClassName,
        paddingClassName,
        className,
      )}
    >
      <OptimizedImage
        src={src}
        alt={alt}
        variant={variant}
        className={cn(
          'w-full h-full object-contain',
          hoverZoom && 'transition-transform duration-300 motion-safe:group-hover:scale-105',
        )}
      />
      {children}
    </div>
  );
}