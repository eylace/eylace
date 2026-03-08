import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, TrendingUp, Clock, ArrowRight } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useCategories, useProducts } from '@/hooks/useProducts';
import { adaptDBProducts } from '@/lib/productAdapter';

interface SearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SearchModal = ({ open, onOpenChange }: SearchModalProps) => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [recentSearches] = useState(['Wireless Headphones', 'Laptop', 'Smart Watch']);
  const { categories } = useCategories();
  const { products: dbProducts } = useProducts({});
  const allProducts = useMemo(() => adaptDBProducts(dbProducts), [dbProducts]);

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    if (!open) {
      setQuery('');
    }
  }, [open]);

  const sanitizeQuery = (input: string): string => {
    return input
      .replace(/[<>'"&]/g, '') // Strip HTML/script chars
      .trim()
      .slice(0, 200); // Max 200 chars
  };

  const handleSearch = (searchQuery: string) => {
    const sanitized = sanitizeQuery(searchQuery);
    if (sanitized) {
      onOpenChange(false);
      navigate(`/search?q=${encodeURIComponent(sanitized)}`);
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

  const filteredProducts = useMemo(() => {
    if (query.length < 2) return [];
    const lowerQuery = query.toLowerCase();
    return allProducts
      .filter(p => 
        p.name.toLowerCase().includes(lowerQuery) ||
        p.category.name.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 6);
  }, [query, allProducts]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 gap-0 overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <Search className="h-5 w-5 text-muted-foreground shrink-0" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search for products, brands and more..."
            value={query}
            maxLength={200}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearch(query);
            }}
            className="border-0 focus-visible:ring-0 text-lg px-0"
          />
          {query && (
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => setQuery('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {/* Autocomplete Results */}
          {filteredProducts.length > 0 ? (
            <div className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Products</h3>
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
          ) : (
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
                        onClick={() => handleSearch(search)}
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
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
