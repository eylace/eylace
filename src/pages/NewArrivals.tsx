import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductGrid } from '@/components/products/ProductGrid';
import { useProducts } from '@/hooks/useProducts';
import { adaptDBProducts } from '@/lib/productAdapter';
import { Loader2, Sparkles, Filter, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type SortOption = 'newest' | 'price-low' | 'price-high' | 'rating';

export default function NewArrivals() {
  const { products: dbProducts, isLoading } = useProducts({});
  const { t } = useLanguage();
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  const allProducts = adaptDBProducts(dbProducts);

  // Sort by newest first (created_at desc is default from DB), then apply user sort
  let sorted = [...allProducts];
  switch (sortBy) {
    case 'price-low':
      sorted.sort((a, b) => a.price - b.price);
      break;
    case 'price-high':
      sorted.sort((a, b) => b.price - a.price);
      break;
    case 'rating':
      sorted.sort((a, b) => b.rating - a.rating);
      break;
    default:
      break; // newest is default order
  }

  const sortLabels: Record<SortOption, string> = {
    newest: 'Newest First',
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
              <Sparkles className="h-6 w-6 text-accent" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              New Arrivals
            </h1>
          </div>
          <p className="text-muted-foreground">
            Fresh additions to our collection — discover the latest products.
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
          <ProductGrid>
            {sorted.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </ProductGrid>
        ) : (
          <div className="text-center py-20">
            <Sparkles className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No new arrivals yet</h3>
            <p className="text-muted-foreground">Check back soon for fresh products!</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
