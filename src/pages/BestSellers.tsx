import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { ProductCard } from '@/components/products/ProductCard';
import { useProducts } from '@/hooks/useProducts';
import { adaptDBProducts } from '@/lib/productAdapter';
import { Loader2, TrendingUp, Filter, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type SortOption = 'popular' | 'price-low' | 'price-high' | 'rating';

export default function BestSellers() {
  const { products: dbProducts, isLoading } = useProducts({});
  const [sortBy, setSortBy] = useState<SortOption>('popular');

  const allProducts = adaptDBProducts(dbProducts);

  // Sort by popularity (review_count/rating as proxy), then user choice
  let sorted = [...allProducts];
  switch (sortBy) {
    case 'popular':
      sorted.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
      break;
    case 'price-low':
      sorted.sort((a, b) => a.price - b.price);
      break;
    case 'price-high':
      sorted.sort((a, b) => b.price - a.price);
      break;
    case 'rating':
      sorted.sort((a, b) => b.rating - a.rating);
      break;
  }

  const sortLabels: Record<SortOption, string> = {
    popular: 'Most Popular',
    'price-low': 'Price: Low to High',
    'price-high': 'Price: High to Low',
    rating: 'Highest Rated',
  };

  return (
    <Layout>
      <div className="container-main py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-accent/10 rounded-lg">
              <TrendingUp className="h-6 w-6 text-accent" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Best Sellers
            </h1>
          </div>
          <p className="text-muted-foreground">
            Our most popular products — loved by thousands of customers.
          </p>
        </div>

        {/* Sort */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">
            {sorted.length} products
          </p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                {sortLabels[sortBy]}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {Object.entries(sortLabels).map(([key, label]) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => setSortBy(key as SortOption)}
                  className={sortBy === key ? 'bg-accent/10' : ''}
                >
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Products */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
          </div>
        ) : sorted.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {sorted.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <TrendingUp className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No best sellers yet</h3>
            <p className="text-muted-foreground">Products will appear here as they gain popularity.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
