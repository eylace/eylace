import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, ShoppingCart, Zap, Loader2 } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { adaptDBProducts } from '@/lib/productAdapter';
import { getProductFeatureImage } from '@/lib/productImage';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { useCart } from '@/contexts/CartContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { setBuyNowCheckoutItem } from '@/lib/checkoutSession';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface RecommendedSidebarProps {
  categorySlug?: string;
  excludeProductId?: string;
  className?: string;
}

/**
 * Right-column recommended products list used on the product detail page.
 * Same-category picks, scrollable, with Add to Cart + Buy Now on each card.
 */
export const RecommendedSidebar = ({ categorySlug, excludeProductId, className }: RecommendedSidebarProps) => {
  const { products: dbProducts, isLoading } = useProducts({ categorySlug, limit: 24 });
  const products = adaptDBProducts(dbProducts).filter((p) => p.id !== excludeProductId);
  const { addItem } = useCart();
  const { formatPrice } = useCurrency();
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <aside
      className={cn(
        'bg-card border border-border rounded-xl overflow-hidden flex flex-col',
        'max-h-[calc(100vh-8rem)] lg:sticky lg:top-24',
        className,
      )}
      aria-label={t('product.relatedProducts')}
    >
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <div className="p-1.5 bg-accent/10 rounded-md">
          <Sparkles className="h-4 w-4 text-accent" />
        </div>
        <div className="min-w-0">
          <h2 className="font-semibold text-foreground text-sm leading-tight truncate">
            {t('product.relatedProducts')}
          </h2>
          <p className="text-xs text-muted-foreground truncate">Smart picks for you</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-border">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-accent" />
          </div>
        ) : products.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground text-center">No recommendations yet.</p>
        ) : (
          products.map((product) => {
            const img = getProductFeatureImage(product);
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
            return (
              <Link
                key={product.id}
                to={`/product/${product.slug}`}
                className="flex gap-3 p-3 hover:bg-secondary/50 transition-colors group"
              >
                <div className="w-16 h-16 shrink-0 bg-card border border-border/60 rounded-md overflow-hidden p-1">
                  <OptimizedImage
                    src={img}
                    alt={product.name}
                    variant="card"
                    className="w-full h-full object-contain"
                  />
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
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-[11px] flex-1"
                      onClick={handleAdd}
                      disabled={(product.stock ?? 0) === 0}
                    >
                      <ShoppingCart className="h-3 w-3 mr-1" />
                      {t('product.addToCart')}
                    </Button>
                    <Button
                      size="sm"
                      variant="buy-now"
                      className="h-7 px-2 text-[11px] flex-1"
                      onClick={handleBuy}
                      disabled={(product.stock ?? 0) === 0}
                    >
                      <Zap className="h-3 w-3 mr-1" />
                      {t('product.buyNow')}
                    </Button>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </aside>
  );
};