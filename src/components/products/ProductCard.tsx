import { forwardRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, Heart, ShoppingCart, Zap, GitCompareArrows } from 'lucide-react';
import { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useWishlist } from '@/contexts/WishlistContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCompare } from '@/contexts/CompareContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
  variant?: 'default' | 'compact' | 'horizontal';
  showWishlistButton?: boolean;
}

export const ProductCard = forwardRef<HTMLDivElement, ProductCardProps>(({ product, variant = 'default', showWishlistButton = false }, ref) => {
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const { addItem, removeItem, isInWishlist } = useWishlist();
  const { addItem: addToCompare, removeItem: removeFromCompare, isInCompare } = useCompare();
  const inCompare = isInCompare(product.id);
  const hasDiscount = product.discount && product.discount > 0;
  const isOutOfStock = product.stock === 0;
  const isWishlisted = isInWishlist(product.id);

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isWishlisted) {
      removeItem(product.id);
    } else {
      addItem(product);
    }
  };

  if (variant === 'horizontal') {
    return (
      <div className="card-product flex gap-4 p-4">
        <Link to={`/product/${product.slug}`} className="shrink-0">
          <div className="relative w-32 h-32 bg-secondary rounded-lg overflow-hidden">
            <img 
              src={product.images[0]} 
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {hasDiscount && (
              <Badge className="badge-flash absolute top-2 left-2">
                -{product.discount}%
              </Badge>
            )}
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <Link to={`/product/${product.slug}`}>
            <h3 className="font-medium text-foreground hover:text-accent transition-colors line-clamp-2">
              {product.name}
            </h3>
          </Link>
          <div className="flex items-center gap-1 mt-1">
            <Star className="h-4 w-4 fill-rating text-rating" />
            <span className="text-sm font-medium">{product.rating}</span>
            <span className="text-xs text-muted-foreground">({product.reviewCount.toLocaleString()})</span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="price-current">{formatPrice(product.price)}</span>
            {hasDiscount && product.originalPrice && (
              <span className="price-original">{formatPrice(product.originalPrice)}</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className={cn(
      "card-product group relative flex flex-col h-full",
      variant === 'compact' ? 'p-2 sm:p-3' : 'p-2 sm:p-4'
    )}>
      {/* Wishlist Button */}
      <button 
        onClick={handleWishlistToggle}
        className={cn(
          "absolute top-3 right-3 z-10 p-2 bg-card/80 backdrop-blur-sm rounded-full transition-all hover:bg-card",
          isWishlisted 
            ? "text-destructive opacity-100" 
            : "opacity-0 group-hover:opacity-100 hover:text-destructive"
        )}
      >
        <Heart className={cn("h-4 w-4", isWishlisted && "fill-current")} />
      </button>

      {/* Compare Button */}
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); inCompare ? removeFromCompare(product.id) : addToCompare(product); }}
        className={cn(
          "absolute top-12 right-3 z-10 p-2 bg-card/80 backdrop-blur-sm rounded-full transition-all hover:bg-card",
          inCompare
            ? "text-accent opacity-100"
            : "opacity-0 group-hover:opacity-100 hover:text-accent"
        )}
      >
        <GitCompareArrows className={cn("h-4 w-4")} />
      </button>

      {/* Image */}
      <Link to={`/product/${product.slug}`}>
        <div className="relative aspect-square bg-secondary rounded-lg overflow-hidden mb-2 sm:mb-3">
          <img 
            src={product.images[0]} 
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          
          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.isFlashSale && (
              <Badge className="badge-flash flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Flash Sale
              </Badge>
            )}
            {hasDiscount && !product.isFlashSale && (
              <Badge className="badge-flash">
                -{product.discount}%
              </Badge>
            )}
            {product.isPrime && (
              <Badge className="badge-prime">
                Prime
              </Badge>
            )}
          </div>

          {/* Out of Stock Overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-foreground/60 flex items-center justify-center">
              <span className="bg-card text-foreground px-3 py-1 rounded font-semibold text-sm">
                Out of Stock
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="space-y-1 sm:space-y-2 flex-1 flex flex-col">
        {/* Category */}
        <p className="text-xs text-muted-foreground uppercase tracking-wide">
          {product.category.name}
        </p>

        {/* Title */}
        <Link to={`/product/${product.slug}`}>
          <h3 className={cn(
            "font-medium text-foreground hover:text-accent transition-colors",
            variant === 'compact' ? 'text-sm line-clamp-1' : 'line-clamp-2'
          )}>
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-1">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i}
                className={cn(
                  "h-3.5 w-3.5",
                  i < Math.floor(product.rating) 
                    ? "fill-rating text-rating" 
                    : "fill-muted text-muted"
                )}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            ({product.reviewCount.toLocaleString()})
          </span>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-1 sm:gap-2 flex-wrap">
          <span className="price-current text-base sm:text-lg">{formatPrice(product.price)}</span>
          {hasDiscount && product.originalPrice && (
            <>
              <span className="price-original text-xs sm:text-sm">{formatPrice(product.originalPrice)}</span>
              <span className="price-discount hidden sm:inline">Save {formatPrice(product.originalPrice - product.price)}</span>
            </>
          )}
        </div>

        {/* Free Shipping */}
        {product.isFreeShipping && (
          <p className="text-xs text-success font-medium">Free Shipping</p>
        )}

        {/* Variations Preview */}
        {product.variations && product.variations.length > 0 && (() => {
          // Prefer color variation for preview, fallback to first variation
          const colorVar = product.variations.find(v => v.type === 'color') || product.variations[0];
          if (!colorVar?.options) return null;
          const opts = colorVar.options.filter(Boolean);
          if (opts.length === 0) return null;

          const colorMap: Record<string, string> = {
            'black': '#1a1a1a', 'white': '#ffffff', 'navy': '#1e3a5f', 'red': '#dc2626',
            'blue': '#2563eb', 'green': '#16a34a', 'pink': '#ec4899', 'gray': '#6b7280',
            'grey': '#6b7280', 'brown': '#92400e', 'beige': '#d4c4a8', 'yellow': '#eab308',
            'orange': '#f97316', 'purple': '#9333ea', 'maroon': '#7f1d1d', 'silver': '#c0c0c0',
            'gold': '#d4a843', 'camel': '#c19a6b', 'burgundy': '#800020', 'tan': '#d2b48c',
          };

          return (
            <div className="flex items-center gap-1 sm:gap-1.5">
              {opts.slice(0, 3).map((option, i) => {
                const val = option?.value || '';
                const hex = colorMap[val.toLowerCase().split('/')[0].trim()];
                return hex ? (
                  <div
                    key={option?.id || i}
                    className={cn(
                      "w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-border",
                      val.toLowerCase() === 'white' && "border-muted-foreground/30"
                    )}
                    style={{ backgroundColor: hex }}
                    title={val}
                  />
                ) : (
                  <div
                    key={option?.id || i}
                    className="px-1 sm:px-1.5 py-0.5 rounded border border-border bg-secondary text-[8px] sm:text-[9px] font-medium text-foreground"
                    title={val}
                  >
                    {val}
                  </div>
                );
              })}
              {opts.length > 3 && (
                <span className="text-[10px] sm:text-xs text-muted-foreground">+{opts.length - 3}</span>
              )}
            </div>
          );
        })()}

        {/* Actions */}
        <div className="flex flex-row gap-1.5 pt-1.5 sm:pt-2 mt-auto">
          {isOutOfStock ? (
            <Button variant="book-now" size="sm" className="flex-1 h-8 sm:h-9 text-xs sm:text-sm">
              Book Now
            </Button>
          ) : (
            <>
              <Button variant="accent" size="sm" className="flex-1 h-8 sm:h-9 text-xs sm:text-sm">
                <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Add
              </Button>
              <Button variant="buy-now" size="sm" className="flex-1 h-8 sm:h-9 text-xs sm:text-sm">
                Buy Now
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';
