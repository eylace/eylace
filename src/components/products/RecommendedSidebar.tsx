import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, ShoppingCart, Zap, AlertCircle, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { adaptDBProducts } from '@/lib/productAdapter';
import { getProductFeatureImage } from '@/lib/productImage';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { useCart } from '@/contexts/CartContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { setBuyNowCheckoutItem } from '@/lib/checkoutSession';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface RecommendedSidebarProps {
  categorySlug?: string;
  excludeProductId?: string;
  className?: string;
  /** 'sidebar' = vertical sticky (desktop). 'mobile' = collapsible horizontal scroller. */
  variant?: 'sidebar' | 'mobile';
}

/**
 * Recommended products used on the product detail page.
 * Ranks by same-category match, rating and sold count, then falls back to newest.
 * Renders as a vertical sticky sidebar on desktop and a collapsible horizontal
 * scroller on mobile. Add to Cart and Buy Now mirror the main product page flows.
 */
export const RecommendedSidebar = ({
  categorySlug,
  excludeProductId,
  className,
  variant = 'sidebar',
}: RecommendedSidebarProps) => {
  const { products: dbProducts, isLoading, error, refetch } = useProducts({
    categorySlug,
    limit: 12,
  });
  const products = adaptDBProducts(dbProducts)
    .filter((p) => p.id !== excludeProductId)
    .sort((a, b) => {
      const rA = (a.rating ?? 0) * 2 + Math.log1p(a.soldCount ?? 0);
      const rB = (b.rating ?? 0) * 2 + Math.log1p(b.soldCount ?? 0);
      return rB - rA;
    })
    .slice(0, 10);
  const { addItem } = useCart();
  const { formatPrice } = useCurrency();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [openMobile, setOpenMobile] = useState(false);

  const title = t('cart.recommended');

  const renderCard = (product: ReturnType<typeof adaptDBProducts>[number], layout: 'row' | 'tile') => {
    const img = getProductFeatureImage(product);
    const outOfStock = (product.stock ?? 0) === 0;
    const handleAdd = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      addItem(product, 1, {});
      toast.success(t('product.addedToCart'), { description: product.name });
    };
    const handleBuy = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setBuyNowCheckoutItem({ product, quantity: 1, selectedVariations: {} });
      navigate('/checkout?source=buy-now');
    };

    if (layout === 'tile') {
      return (
        <Link
          key={product.id}
          to={`/product/${product.slug}`}
          className="shrink-0 w-40 border border-border rounded-lg p-2 bg-card hover:border-accent transition-colors flex flex-col gap-2"
        >
          <div className="aspect-square w-full bg-card border border-border/60 rounded-md overflow-hidden p-1">
            <OptimizedImage src={img} alt={product.name} variant="card" className="w-full h-full object-contain" />
          </div>
          <h3 className="text-xs font-medium text-foreground line-clamp-2">{product.name}</h3>
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-sm font-bold text-destructive">{formatPrice(product.price)}</span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-[11px] text-muted-foreground line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>
          <div className="flex gap-1.5 mt-auto">
            <Button size="sm" variant="outline" className="h-7 px-2 text-[11px] flex-1" onClick={handleAdd} disabled={outOfStock}>
              <ShoppingCart className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="buy-now" className="h-7 px-2 text-[11px] flex-1" onClick={handleBuy} disabled={outOfStock}>
              <Zap className="h-3 w-3 mr-1" />
              {t('product.buyNow')}
            </Button>
          </div>
        </Link>
      );
    }

    return (
      <Link
        key={product.id}
        to={`/product/${product.slug}`}
        className="flex gap-3 p-3 hover:bg-secondary/50 transition-colors group"
      >
        <div className="w-16 h-16 shrink-0 bg-card border border-border/60 rounded-md overflow-hidden p-1">
          <OptimizedImage src={img} alt={product.name} variant="card" className="w-full h-full object-contain" />
        </div>
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <h3 className="text-xs font-medium text-foreground line-clamp-2 group-hover:text-accent transition-colors">
            {product.name}
          </h3>
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-sm font-bold text-destructive">{formatPrice(product.price)}</span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-[11px] text-muted-foreground line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>
          <div className="flex gap-1.5 mt-1">
            <Button size="sm" variant="outline" className="h-7 px-2 text-[11px] flex-1" onClick={handleAdd} disabled={outOfStock}>
              <ShoppingCart className="h-3 w-3 mr-1" />
              {t('product.addToCart')}
            </Button>
            <Button size="sm" variant="buy-now" className="h-7 px-2 text-[11px] flex-1" onClick={handleBuy} disabled={outOfStock}>
              <Zap className="h-3 w-3 mr-1" />
              {t('product.buyNow')}
            </Button>
          </div>
        </div>
      </Link>
    );
  };

  const renderSkeletonRows = (n: number) => (
    <div className="divide-y divide-border">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="flex gap-3 p-3">
          <Skeleton className="w-16 h-16 rounded-md shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-6 w-full" />
          </div>
        </div>
      ))}
    </div>
  );

  const renderError = () => (
    <div className="p-4 text-center flex flex-col items-center gap-2">
      <AlertCircle className="h-5 w-5 text-destructive" />
      <p className="text-xs text-muted-foreground">Could not load recommendations.</p>
      <Button size="sm" variant="outline" onClick={() => refetch()}>
        Retry
      </Button>
    </div>
  );

  const renderEmpty = () => (
    <p className="p-4 text-sm text-muted-foreground text-center">No recommendations yet.</p>
  );

  // === Mobile: collapsible with horizontal scroller ===
  if (variant === 'mobile') {
    return (
      <Collapsible
        open={openMobile}
        onOpenChange={setOpenMobile}
        className={cn('bg-card border border-border rounded-xl overflow-hidden', className)}
      >
        <CollapsibleTrigger className="w-full flex items-center gap-2 px-4 py-3 border-b border-border">
          <div className="p-1.5 bg-accent/10 rounded-md">
            <Sparkles className="h-4 w-4 text-accent" />
          </div>
          <div className="min-w-0 flex-1 text-left">
            <h2 className="font-semibold text-foreground text-sm leading-tight truncate">{title}</h2>
            <p className="text-xs text-muted-foreground truncate">Smart picks for you</p>
          </div>
          <ChevronDown className={cn('h-4 w-4 transition-transform', openMobile && 'rotate-180')} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          {isLoading ? (
            <div className="flex gap-3 p-3 overflow-x-auto">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="w-40 h-56 rounded-lg shrink-0" />
              ))}
            </div>
          ) : error ? (
            renderError()
          ) : products.length === 0 ? (
            renderEmpty()
          ) : (
            <div className="flex gap-3 p-3 overflow-x-auto snap-x snap-mandatory">
              {products.map((p) => (
                <div key={p.id} className="snap-start">
                  {renderCard(p, 'tile')}
                </div>
              ))}
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    );
  }

  // === Desktop: vertical sticky sidebar ===
  return (
    <aside
      className={cn(
        'bg-card border border-border rounded-xl overflow-hidden flex flex-col',
        'sticky top-24 max-h-[calc(100vh-8rem)]',
        className,
      )}
      aria-label={title}
    >
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <div className="p-1.5 bg-accent/10 rounded-md">
          <Sparkles className="h-4 w-4 text-accent" />
        </div>
        <div className="min-w-0">
          <h2 className="font-semibold text-foreground text-sm leading-tight truncate">{title}</h2>
          <p className="text-xs text-muted-foreground truncate">Smart picks for you</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto overscroll-contain divide-y divide-border">
        {isLoading
          ? renderSkeletonRows(6)
          : error
          ? renderError()
          : products.length === 0
          ? renderEmpty()
          : products.map((p) => renderCard(p, 'row'))}
      </div>
    </aside>
  );
};