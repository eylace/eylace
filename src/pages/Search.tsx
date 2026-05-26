import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, Grid, List, SlidersHorizontal, Sparkles } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductGrid } from '@/components/products/ProductGrid';
import { SearchFiltersPanel } from '@/components/search/SearchFilters';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useProductSearch } from '@/hooks/useProductSearch';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const Search = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category');
  const isAI = searchParams.get('ai') === '1';
  const aiIds = searchParams.get('ids')?.split(',').filter(Boolean) || [];
  const { t } = useLanguage();

  const { filters, updateFilter, resetFilters, searchResults, categories, priceRange, isLoading } = useProductSearch();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    if (query) updateFilter('query', query);
    if (categoryParam) updateFilter('category', categoryParam);
  }, [query, categoryParam]);

  const finalResults = useMemo(() => {
    if (!isAI || !aiIds.length) return searchResults;
    const idSet = new Set(aiIds);
    const aiMatched = aiIds.map(id => searchResults.find(p => p.id === id)).filter(Boolean) as typeof searchResults;
    const remaining = searchResults.filter(p => !idSet.has(p.id));
    return [...aiMatched, ...remaining];
  }, [isAI, aiIds, searchResults]);

  return (
    <Layout>
      <div className="container-main py-6">
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">
              {query ? `${t('search.resultsFor')} "${query}"` : t('search.allProducts')}
            </h1>
            {isAI && (
              <Badge className="gap-1 bg-accent/10 text-accent border-accent/20">
                <Sparkles className="h-3 w-3" /> {t('search.aiPowered')}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1">
            {finalResults.length} {finalResults.length !== 1 ? t('search.productsFoundPlural') : t('search.productsFound')}
          </p>
        </div>

        <div className="flex gap-8">
          <aside className="hidden lg:block w-64 shrink-0">
            <SearchFiltersPanel filters={filters} updateFilter={updateFilter} resetFilters={resetFilters} categories={categories} priceRange={priceRange} />
          </aside>

          <div className="flex-1">
            <div className="flex items-center justify-between gap-4 mb-6 p-4 bg-card rounded-lg border border-border">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="lg:hidden">
                    <SlidersHorizontal className="h-4 w-4 mr-2" />{t('search.filters')}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-80">
                  <SearchFiltersPanel filters={filters} updateFilter={updateFilter} resetFilters={resetFilters} categories={categories} priceRange={priceRange} isMobile />
                </SheetContent>
              </Sheet>

              <div className="flex items-center gap-3 ml-auto">
                <span className="text-sm text-muted-foreground hidden sm:inline">{t('search.sortBy')}</span>
                <Select value={filters.sortBy} onValueChange={(value: typeof filters.sortBy) => updateFilter('sortBy', value)}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">{t('search.relevance')}</SelectItem>
                    <SelectItem value="price-asc">{t('search.priceLowHigh')}</SelectItem>
                    <SelectItem value="price-desc">{t('search.priceHighLow')}</SelectItem>
                    <SelectItem value="rating">{t('search.customerRating')}</SelectItem>
                    <SelectItem value="newest">{t('search.newestFirst')}</SelectItem>
                  </SelectContent>
                </Select>
                <div className="hidden sm:flex items-center border border-border rounded-lg">
                  <Button variant="ghost" size="icon" className={cn('rounded-r-none', viewMode === 'grid' && 'bg-secondary')} onClick={() => setViewMode('grid')}><Grid className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className={cn('rounded-l-none', viewMode === 'list' && 'bg-secondary')} onClick={() => setViewMode('list')}><List className="h-4 w-4" /></Button>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-16"><div className="h-8 w-8 border-4 border-accent border-t-transparent rounded-full animate-spin" /></div>
            ) : finalResults.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto bg-secondary rounded-full flex items-center justify-center mb-4"><Filter className="h-10 w-10 text-muted-foreground" /></div>
                <h2 className="text-xl font-semibold mb-2">{t('search.noProducts')}</h2>
                <p className="text-muted-foreground mb-4">{t('search.tryAdjusting')}</p>
                <Button variant="accent" onClick={resetFilters}>{t('search.clearFilters')}</Button>
              </div>
            ) : (
              {viewMode === 'grid' ? (
                <ProductGrid maxCols={4}>
                  {finalResults.map((product) => (<ProductCard key={product.id} product={product} />))}
                </ProductGrid>
              ) : (
                <div className="space-y-4">
                  {finalResults.map((product) => (<ProductCard key={product.id} product={product} variant="horizontal" />))}
                </div>
              )}
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Search;
