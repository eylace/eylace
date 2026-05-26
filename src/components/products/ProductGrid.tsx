import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Shared product grid wrapper used across every product listing
 * (Featured, Flash Sale, Deals, Trending, New Arrivals, Search,
 *  Category, Wishlist, Cart recommendations, Related products).
 *
 * - Mobile  : 2 columns
 * - md      : 3 columns
 * - lg      : 4 columns
 * - xl      : 5 columns
 * - gap     : 16px / 24px (md+)
 * - items-stretch ensures every card in a row has equal height,
 *   so ProductCard's `mt-auto` action row aligns to the bottom.
 */
interface ProductGridProps {
  children: ReactNode;
  className?: string;
  /** Cap the maximum columns at lg (4) for narrower content areas (e.g. Category with sidebar). */
  maxCols?: 4 | 5;
}

export const ProductGrid = ({ children, className, maxCols = 5 }: ProductGridProps) => {
  return (
    <div
      className={cn(
        'grid items-stretch gap-4 md:gap-6',
        'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
        maxCols === 5 && 'xl:grid-cols-5',
        className,
      )}
    >
      {children}
    </div>
  );
};
