import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductGrid } from '@/components/products/ProductGrid';
import { useProducts } from '@/hooks/useProducts';
import { adaptDBProducts } from '@/lib/productAdapter';
import { Loader2, TrendingUp, Flame, Star, Filter, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SeoHead } from '@/components/seo/SeoHead';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type SortOption = 'trending' | 'top-selling' | 'top-rated' | 'price-low' | 'price-high';

export default function TrendingNow() {
  const { products: dbProducts, isLoading } = useProducts({});
  const [sortBy, setSortBy] = useState<SortOption>('trending');

  const allProducts = adaptDBProducts(dbProducts);

  let sorted = [...allProducts];
  switch (sortBy) {
    case 'trending':
      sorted.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
      break;
    case 'top-selling':
      sorted.sort((a, b) => ((b.reviewCount || 0) * b.rating) - ((a.reviewCount || 0) * a.rating));
      break;
    case 'top-rated':
      sorted.sort((a, b) => b.rating - a.rating);
      break;
    case 'price-low':
      sorted.sort((a, b) => a.price - b.price);
      break;
    case 'price-high':
      sorted.sort((a, b) => b.price - a.price);
      break;
  }

  const sortLabels: Record<SortOption, { label: string; icon: typeof TrendingUp }> = {
    trending: { label: 'Trending', icon: TrendingUp },
    'top-selling': { label: 'Top Selling', icon: Flame },
    'top-rated': { label: 'Top Rated', icon: Star },
    'price-low': { label: 'Price: Low to High', icon: Filter },
    'price-high': { label: 'Price: High to Low', icon: Filter },
  };

  const filterTabs: { key: SortOption; label: string; icon: typeof TrendingUp }[] = [
    { key: 'trending', label: 'Trending', icon: TrendingUp },
    { key: 'top-selling', label: 'Top Selling', icon: Flame },
    { key: 'top-rated', label: 'Top Rated', icon: Star },
  ];

  return (
    <Layout>
      <SeoHead
        title="Trending Now — Bangladesh's Most Popular Products | Eylace"
        description="See what's trending on Eylace right now — the most-loved products and bestsellers across categories with fast delivery nationwide."
        path="/trending"
      />
      <div className="container-main py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-accent/10 rounded-xl">
              <TrendingUp className="h-7 w-7 text-accent" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Trending Now
              </h1>
              <p className="text-muted-foreground text-sm">
                Discover what's hot — the most popular products everyone is buying right now.
              </p>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {filterTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = sortBy === tab.key;
            return (
              <Button
                key={tab.key}
                variant={isActive ? 'accent' : 'outline'}
                size="sm"
                onClick={() => setSortBy(tab.key)}
                className="gap-1.5"
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </Button>
            );
          })}

          <div className="ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Sort
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {Object.entries(sortLabels).map(([key, { label }]) => (
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
        </div>

        {/* Stats bar */}
        <div className="flex items-center justify-between mb-4 px-1">
          <p className="text-sm text-muted-foreground">
            {sorted.length} products · Sorted by <span className="font-medium text-foreground">{sortLabels[sortBy].label}</span>
          </p>
          <Badge variant="secondary" className="gap-1">
            <Flame className="h-3 w-3" /> Live
          </Badge>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
          </div>
        ) : sorted.length > 0 ? (
          <ProductGrid>
            {sorted.map((product, index) => (
              <div key={product.id} className="relative">
                {index < 3 && (
                  <div className="absolute -top-2 -left-2 z-10 bg-accent text-accent-foreground text-xs font-bold px-2 py-0.5 rounded-full shadow-md">
                    #{index + 1}
                  </div>
                )}
                <ProductCard product={product} />
              </div>
            ))}
          </ProductGrid>
        ) : (
          <div className="text-center py-20">
            <TrendingUp className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No trending products yet</h3>
            <p className="text-muted-foreground">Products will appear here as they gain popularity.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
