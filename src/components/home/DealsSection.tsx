import { Link } from 'react-router-dom';
import { Percent, ChevronRight, Loader2 } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { adaptDBProducts } from '@/lib/productAdapter';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { ProductImageFrame } from '@/components/products/ProductImageFrame';
import { getProductFeatureImage } from '@/lib/productImage';

export const DealsSection = () => {
  const { products: dbProducts, isLoading } = useProducts({ limit: 8 });
  const allProducts = adaptDBProducts(dbProducts);
  const dealsProducts = allProducts.filter(p => p.discount && p.discount >= 20).slice(0, 4);
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();

  if (isLoading) {
    return (
      <section className="container-main py-8">
        <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>
      </section>
    );
  }

  return (
    <section className="container-main py-8">
      <div className="bg-card rounded-xl shadow-card overflow-hidden">
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-destructive/10 rounded-lg"><Percent className="h-5 w-5 text-destructive" /></div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-foreground">{t('deals.title')}</h2>
              <p className="text-sm text-muted-foreground">{t('deals.subtitle')}</p>
            </div>
          </div>
          <Link to="/deals" className="text-sm text-accent font-medium hover:underline flex items-center gap-1">
            {t('deals.seeAll')} <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-border">
          {dealsProducts.map((product) => {
            const featureImage = getProductFeatureImage(product);
            return (
            <Link key={product.id} to={`/product/${product.slug}`} className="group p-4 md:p-6 hover:bg-secondary/50 transition-colors">
              <ProductImageFrame
                src={featureImage}
                alt={product.name}
                hoverZoom
                className="mb-4"
              >
                <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 rounded">
                  {product.discount}% {t('common.off')}
                </div>
              </ProductImageFrame>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">{product.category.name}</p>
                <h3 className="font-medium text-foreground line-clamp-2 group-hover:text-accent transition-colors">{product.name}</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-foreground">{formatPrice(product.price)}</span>
                  {product.originalPrice && <span className="text-sm text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-destructive rounded-full" style={{ width: `${Math.min((product.reviewCount / 5000) * 100, 85)}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {product.reviewCount > 1000 ? `${(product.reviewCount / 1000).toFixed(1)}k` : product.reviewCount} {t('deals.sold')}
                  </span>
                </div>
              </div>
            </Link>
          );})}
        </div>
      </div>
    </section>
  );
};
