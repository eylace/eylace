import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, Grid, List, SlidersHorizontal } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { ProductCard } from '@/components/products/ProductCard';
import { SearchFiltersPanel } from '@/components/search/SearchFilters';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useProductSearch } from '@/hooks/useProductSearch';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const Search = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category');
  
  const {
    filters,
    updateFilter,
    resetFilters,
    searchResults,
    categories,
    priceRange,
  } = useProductSearch();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Sync URL params with filters
  useEffect(() => {
    if (query) {
      updateFilter('query', query);
    }
    if (categoryParam) {
      updateFilter('category', categoryParam);
    }
  }, [query, categoryParam]);

  return (
    <Layout>
      <div className="container-main py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">
            {query ? `Search results for "${query}"` : 'All Products'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {searchResults.length} product{searchResults.length !== 1 ? 's' : ''} found
          </p>
        </div>

        <div className="flex gap-8">
          {/* Desktop Filters Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0">
            <SearchFiltersPanel
              filters={filters}
              updateFilter={updateFilter}
              resetFilters={resetFilters}
              categories={categories}
              priceRange={priceRange}
            />
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-4 mb-6 p-4 bg-card rounded-lg border border-border">
              {/* Mobile Filter Button */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="lg:hidden">
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-80">
                  <SearchFiltersPanel
                    filters={filters}
                    updateFilter={updateFilter}
                    resetFilters={resetFilters}
                    categories={categories}
                    priceRange={priceRange}
                    isMobile
                  />
                </SheetContent>
              </Sheet>

              {/* Sort */}
              <div className="flex items-center gap-3 ml-auto">
                <span className="text-sm text-muted-foreground hidden sm:inline">Sort by:</span>
                <Select
                  value={filters.sortBy}
                  onValueChange={(value: typeof filters.sortBy) => 
                    updateFilter('sortBy', value)
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="price-asc">Price: Low to High</SelectItem>
                    <SelectItem value="price-desc">Price: High to Low</SelectItem>
                    <SelectItem value="rating">Customer Rating</SelectItem>
                    <SelectItem value="newest">Newest First</SelectItem>
                  </SelectContent>
                </Select>

                {/* View Toggle */}
                <div className="hidden sm:flex items-center border border-border rounded-lg">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      'rounded-r-none',
                      viewMode === 'grid' && 'bg-secondary'
                    )}
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      'rounded-l-none',
                      viewMode === 'list' && 'bg-secondary'
                    )}
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Results */}
            {searchResults.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto bg-secondary rounded-full flex items-center justify-center mb-4">
                  <Filter className="h-10 w-10 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold mb-2">No products found</h2>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search or filters
                </p>
                <Button variant="accent" onClick={resetFilters}>
                  Clear all filters
                </Button>
              </div>
            ) : (
              <div
                className={cn(
                  viewMode === 'grid'
                    ? 'grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4'
                    : 'space-y-4'
                )}
              >
                {searchResults.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    variant={viewMode === 'list' ? 'horizontal' : 'default'}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Search;
