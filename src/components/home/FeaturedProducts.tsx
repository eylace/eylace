import { Link } from 'react-router-dom';
import { ChevronRight, TrendingUp, Star, Sparkles, Loader2 } from 'lucide-react';
import { ProductCard } from '@/components/products/ProductCard';
import { useProducts } from '@/hooks/useProducts';
import { adaptDBProducts } from '@/lib/productAdapter';
import { Product } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { TranslationKey } from '@/i18n/translations';

interface FeaturedProductsProps {
  title: string;
  subtitle?: string;
  icon?: 'trending' | 'star' | 'sparkles';
  link?: string;
  products?: Product[];
  limit?: number;
  titleKey?: TranslationKey;
  subtitleKey?: TranslationKey;
}

export const FeaturedProducts = ({
  title,
  subtitle,
  icon = 'star',
  link = '/products',
  products: propProducts,
  limit = 5,
  titleKey,
  subtitleKey
}: FeaturedProductsProps) => {
  const { products: dbProducts, isLoading } = useProducts({ limit });
  const products = propProducts || adaptDBProducts(dbProducts);
  const { t } = useLanguage();

  const displayTitle = titleKey ? t(titleKey) : title;
  const displaySubtitle = subtitleKey ? t(subtitleKey) : subtitle;

  const IconComponent = { trending: TrendingUp, star: Star, sparkles: Sparkles }[icon];

  return (
    <section className="container-main py-[30px]">
      <div className="md:items-center mb-6 md:flex-row gap-[10px] items-start justify-between flex flex-row">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent/10 rounded-lg"><IconComponent className="h-5 w-5 text-accent" /></div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground">{displayTitle}</h2>
            {displaySubtitle && <p className="text-sm text-muted-foreground">{displaySubtitle}</p>}
          </div>
        </div>
        <Link to={link} className="text-sm text-accent font-medium hover:underline flex items-center gap-1 py-[12px]">
          {t('featured.viewAll')} <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      {isLoading ?
      <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div> :

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4">
          {products.slice(0, limit).map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      }
    </section>);

};