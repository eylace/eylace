import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductGrid } from '@/components/products/ProductGrid';
import { useProducts } from '@/hooks/useProducts';
import { adaptDBProducts } from '@/lib/productAdapter';
import { Loader2, Percent, Filter, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SeoHead } from '@/components/seo/SeoHead';

type SortOption = 'discount' | 'price-low' | 'price-high' | 'rating';

export default function Deals() {
  const { products: dbProducts, isLoading } = useProducts({});
  const [sortBy, setSortBy] = useState<SortOption>('discount');
  const [minDiscount, setMinDiscount] = useState<number>(0);

  const allProducts = adaptDBProducts(dbProducts);
  
  // Filter products with discounts
  let dealsProducts = allProducts.filter(p => p.discount && p.discount >= minDiscount);
  
  // Sort products
  dealsProducts = [...dealsProducts].sort((a, b) => {
    switch (sortBy) {
      case 'discount':
        return (b.discount || 0) - (a.discount || 0);
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'rating':
        return b.rating - a.rating;
      default:
        return 0;
    }
  });

  const sortLabels: Record<SortOption, string> = {
    'discount': 'Biggest Discount',
    'price-low': 'Price: Low to High',
    'price-high': 'Price: High to Low',
    'rating': 'Highest Rated',
  };

  const discountFilters = [
    { label: 'All Deals', value: 0 },
    { label: '10%+ Off', value: 10 },
    { label: '20%+ Off', value: 20 },
    { label: '30%+ Off', value: 30 },
    { label: '50%+ Off', value: 50 },
  ];

  return (
    <Layout>
      <SeoHead
        title="Daily Deals & Discounts — Eylace Bangladesh"
        description="Save big on top-rated products with daily deals on Eylace. Discounts up to 70% off — limited time offers across electronics, fashion, home and more."
        path="/deals"
      />
      <div className="container-main py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-destructive/10 rounded-lg">
              <Percent className="h-6 w-6 text-destructive" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Today's Best Deals
            </h1>
          </div>
          <p className="text-muted-foreground">
            Discover amazing discounts on top products. Limited time offers!
          </p>
        </div>

        {/* Filters and Sort */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Discount Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {discountFilters.map((filter) => (
              <Button
                key={filter.value}
                variant={minDiscount === filter.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMinDiscount(filter.value)}
                className="rounded-full"
              >
                {filter.label}
              </Button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="sm:ml-auto">
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
        </div>

        {/* Results Count */}
        <p className="text-sm text-muted-foreground mb-6">
          {dealsProducts.length} deals found
        </p>

        {/* Products Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
          </div>
        ) : dealsProducts.length > 0 ? (
          <ProductGrid>
            {dealsProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </ProductGrid>
        ) : (
          <div className="text-center py-20">
            <Percent className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No deals found
            </h3>
            <p className="text-muted-foreground">
              Try adjusting your filters to find more deals.
            </p>
          </div>
        )}

        {/* Promo Banner */}
        <div className="mt-12 bg-gradient-to-r from-destructive/10 via-destructive/5 to-accent/10 rounded-2xl p-8 text-center">
          <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2">
            🔥 Flash Sale Coming Soon!
          </h2>
          <p className="text-muted-foreground mb-4">
            Subscribe to get notified about our biggest sale event of the year.
          </p>
          <Button variant="default" size="lg">
            Notify Me
          </Button>
        </div>
      </div>
    </Layout>
  );
}
