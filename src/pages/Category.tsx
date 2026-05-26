import { useParams } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { Filter, Grid, List, SlidersHorizontal, Loader2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductGrid } from '@/components/products/ProductGrid';
import { SearchFiltersPanel } from '@/components/search/SearchFilters';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue } from
'@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetTrigger } from
'@/components/ui/sheet';
import { useProductSearch, SearchFilters } from '@/hooks/useProductSearch';
import { useProducts, useCategories } from '@/hooks/useProducts';
import { adaptDBProducts } from '@/lib/productAdapter';
import { cn } from '@/lib/utils';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator } from
'@/components/ui/breadcrumb';
import { Link } from 'react-router-dom';

const Category = () => {
  const { slug } = useParams<{slug: string;}>();
  const { categories, isLoading: categoriesLoading } = useCategories();
  const { products: dbProducts, isLoading: productsLoading } = useProducts({ categorySlug: slug });

  const category = useMemo(() => categories.find((c) => c.slug === slug), [categories, slug]);

  const {
    filters,
    updateFilter,
    resetFilters,
    priceRange
  } = useProductSearch();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<SearchFilters['sortBy']>('relevance');

  // Convert DB products and apply additional filters
  const categoryProducts = useMemo(() => {
    let adapted = adaptDBProducts(dbProducts);

    // Apply additional filters
    if (filters.minPrice !== null) {
      adapted = adapted.filter((p) => p.price >= filters.minPrice!);
    }
    if (filters.maxPrice !== null) {
      adapted = adapted.filter((p) => p.price <= filters.maxPrice!);
    }
    if (filters.rating !== null) {
      adapted = adapted.filter((p) => p.rating >= filters.rating!);
    }
    if (filters.inStock) {
      adapted = adapted.filter((p) => p.stock > 0);
    }
    if (filters.freeShipping) {
      adapted = adapted.filter((p) => p.isFreeShipping);
    }
    if (filters.isPrime) {
      adapted = adapted.filter((p) => p.isPrime);
    }

    // Sorting
    switch (sortBy) {
      case 'price-asc':
        adapted.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        adapted.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        adapted.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        adapted.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        break;
    }

    return adapted;
  }, [dbProducts, filters, sortBy]);

  if (categoriesLoading || productsLoading) {
    return (
      <Layout>
         <div className="container-main py-16 flex items-center justify-center">
           <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      </Layout>);

  }

  if (!category) {
    return (
      <Layout>
         <div className="container-main py-16 text-center">
           <h1 className="text-2xl font-bold mb-4">Category not found</h1>
           <Link to="/">
             <Button variant="accent">Back to Home</Button>
           </Link>
         </div>
       </Layout>);

  }

  return (
    <Layout>
      <div className="container-main py-6">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{category.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Category Header */}
        <div className="mb-8 p-6 bg-gradient-to-r from-primary to-primary/80 rounded-xl text-primary-foreground px-[24px] py-[15px]">
          <div className="flex items-center gap-4">
            <span className="text-4xl">{category.icon}</span>
            <div>
              <h1 className="text-2xl font-bold">{category.name}</h1>
              <p className="text-primary-foreground/80 mt-1">
                {categoryProducts.length} product{categoryProducts.length !== 1 ? 's' : ''} available
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Desktop Filters Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0">
            <SearchFiltersPanel
              filters={{ ...filters, category: slug || null }}
              updateFilter={updateFilter}
              resetFilters={resetFilters}
              categories={categories}
              priceRange={priceRange} />
            
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-4 mb-6 p-4 bg-card rounded-lg border border-border py-[5px]">
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
                    filters={{ ...filters, category: slug || null }}
                    updateFilter={updateFilter}
                    resetFilters={resetFilters}
                    categories={categories}
                    priceRange={priceRange}
                    isMobile />
                  
                </SheetContent>
              </Sheet>

              {/* Sort */}
              <div className="flex items-center gap-3 ml-auto">
                <span className="text-sm text-muted-foreground hidden sm:inline">Sort by:</span>
                <Select
                  value={sortBy}
                  onValueChange={(value: typeof sortBy) => setSortBy(value)}>
                  
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
                    onClick={() => setViewMode('grid')}>
                    
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      'rounded-l-none',
                      viewMode === 'list' && 'bg-secondary'
                    )}
                    onClick={() => setViewMode('list')}>
                    
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Results */}
            {categoryProducts.length === 0 ?
            <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto bg-secondary rounded-full flex items-center justify-center mb-4">
                  <Filter className="h-10 w-10 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold mb-2">No products found</h2>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your filters
                </p>
                <Button variant="accent" onClick={resetFilters}>
                  Clear all filters
                </Button>
              </div> :

            viewMode === 'grid' ? (
              <ProductGrid maxCols={4}>
                {categoryProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </ProductGrid>
            ) : (
              <div className="space-y-4">
                {categoryProducts.map((product) => (
                  <ProductCard key={product.id} product={product} variant="horizontal" />
                ))}
              </div>
            )
            }
          </div>
        </div>
      </div>
    </Layout>);

};

export default Category;