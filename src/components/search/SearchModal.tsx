import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, TrendingUp, Clock, ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCategories, useProducts } from '@/hooks/useProducts';
import { adaptDBProducts } from '@/lib/productAdapter';
import { useAISearch } from '@/hooks/useAISearch';

interface SearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SearchModal = ({ open, onOpenChange }: SearchModalProps) => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('recent_searches') || '[]');
    } catch { return []; }
  });
  const [useAI, setUseAI] = useState(true);
  const { categories } = useCategories();
  const { products: dbProducts } = useProducts({});
  const allProducts = useMemo(() => adaptDBProducts(dbProducts), [dbProducts]);
  const { searchWithAI, clearAISearch, isSearching, aiMessage, aiProductIds } = useAISearch();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    if (!open) {
      setQuery('');
      clearAISearch();
    }
  }, [open, clearAISearch]);

  const sanitizeQuery = (input: string): string => {
    return input.replace(/[<>'"&]/g, '').trim().slice(0, 200);
  };

  const saveRecentSearch = useCallback((q: string) => {
    setRecentSearches(prev => {
      const updated = [q, ...prev.filter(s => s !== q)].slice(0, 5);
      localStorage.setItem('recent_searches', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleSearch = (searchQuery: string) => {
    const sanitized = sanitizeQuery(searchQuery);
    if (sanitized) {
      saveRecentSearch(sanitized);
      onOpenChange(false);
      if (useAI && aiProductIds.length > 0) {
        navigate(`/search?q=${encodeURIComponent(sanitized)}&ai=1&ids=${aiProductIds.join(',')}`);
      } else {
        navigate(`/search?q=${encodeURIComponent(sanitized)}`);
      }
    }
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (useAI && value.trim().length >= 3) {
      debounceRef.current = setTimeout(() => {
        searchWithAI(value);
      }, 600);
    } else {
      clearAISearch();
    }
  };

  const handleProductClick = (slug: string) => {
    onOpenChange(false);
    navigate(`/product/${slug}`);
  };

  const handleCategoryClick = (categorySlug: string) => {
    onOpenChange(false);
    navigate(`/category/${categorySlug}`);
  };

  // AI-matched products
  const aiMatchedProducts = useMemo(() => {
    if (!aiProductIds.length) return [];
    const idSet = new Set(aiProductIds);
    const matched = allProducts.filter(p => idSet.has(p.id));
    // Preserve AI ordering
    return aiProductIds
      .map(id => matched.find(p => p.id === id))
      .filter(Boolean)
      .slice(0, 6) as typeof allProducts;
  }, [aiProductIds, allProducts]);

  // Fallback: simple text matching
  const filteredProducts = useMemo(() => {
    if (aiMatchedProducts.length > 0) return aiMatchedProducts;
    if (query.length < 2) return [];
    const lowerQuery = query.toLowerCase();
    return allProducts
      .filter(p =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.category.name.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 6);
  }, [query, allProducts, aiMatchedProducts]);

  const showResults = filteredProducts.length > 0 || isSearching;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 gap-0 overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 p-4 border-b border-border">
          {isSearching ? (
            <Loader2 className="h-5 w-5 text-accent animate-spin shrink-0" />
          ) : (
            <Search className="h-5 w-5 text-muted-foreground shrink-0" />
          )}
          <Input
            ref={inputRef}
            type="text"
            placeholder="যেকোনো ভাষায় সার্চ করুন... AI আপনাকে সাহায্য করবে"
            value={query}
            maxLength={200}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearch(query);
            }}
            className="border-0 focus-visible:ring-0 text-lg px-0"
          />
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant={useAI ? "default" : "ghost"}
              size="sm"
              className={useAI ? "gap-1 bg-accent text-accent-foreground hover:bg-accent/90 h-7 px-2 text-xs" : "gap-1 h-7 px-2 text-xs"}
              onClick={() => setUseAI(!useAI)}
            >
              <Sparkles className="h-3 w-3" />
              AI
            </Button>
            {query && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => { setQuery(''); clearAISearch(); }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {/* AI Message */}
          {aiMessage && (
            <div className="mx-4 mt-3 px-3 py-2 rounded-lg bg-accent/10 border border-accent/20 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent shrink-0" />
              <span className="text-sm text-accent font-medium">{aiMessage}</span>
            </div>
          )}

          {/* Loading State */}
          {isSearching && !filteredProducts.length && (
            <div className="p-8 text-center">
              <Loader2 className="h-6 w-6 animate-spin text-accent mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">AI সার্চ করছে...</p>
            </div>
          )}

          {/* Results */}
          {filteredProducts.length > 0 ? (
            <div className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                {aiMatchedProducts.length > 0 ? (
                  <>
                    <Sparkles className="h-3.5 w-3.5 text-accent" />
                    AI Recommended Products
                  </>
                ) : (
                  'Products'
                )}
              </h3>
              <div className="space-y-1">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleProductClick(product.slug)}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-secondary transition-colors text-left"
                  >
                    <div className="w-12 h-12 bg-secondary rounded-lg overflow-hidden shrink-0">
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.category.name} · ${product.price.toFixed(2)}
                        {product.isFlashSale && (
                          <Badge className="ml-2 badge-flash text-[10px] h-4">Flash Sale</Badge>
                        )}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </button>
                ))}
              </div>
              <Button
                variant="ghost"
                className="w-full mt-2 text-accent"
                onClick={() => handleSearch(query)}
              >
                View all results for "{query}"
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          ) : !isSearching ? (
            <div className="p-4 space-y-6">
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Recent Searches
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((search, i) => (
                      <Button
                        key={i}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setQuery(search);
                          handleQueryChange(search);
                        }}
                      >
                        {search}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Trending Categories */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Popular Categories
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {categories.slice(0, 8).map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleCategoryClick(category.slug)}
                      className="flex items-center gap-2 p-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors text-left"
                    >
                      <span className="text-xl">{category.icon}</span>
                      <span className="text-sm font-medium truncate">{category.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
};
