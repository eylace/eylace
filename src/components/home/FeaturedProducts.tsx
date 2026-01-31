import { Link } from 'react-router-dom';
import { ChevronRight, TrendingUp, Star, Sparkles } from 'lucide-react';
import { ProductCard } from '@/components/products/ProductCard';
import { featuredProducts } from '@/data/mockData';

interface FeaturedProductsProps {
  title: string;
  subtitle?: string;
  icon?: 'trending' | 'star' | 'sparkles';
  link?: string;
  products?: typeof featuredProducts;
}

export const FeaturedProducts = ({
  title,
  subtitle,
  icon = 'star',
  link = '/products',
  products = featuredProducts,
}: FeaturedProductsProps) => {
  const IconComponent = {
    trending: TrendingUp,
    star: Star,
    sparkles: Sparkles,
  }[icon];

  return (
    <section className="container-main py-8">
      <div className="flex items-start md:items-center justify-between gap-4 mb-6 flex-col md:flex-row">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent/10 rounded-lg">
            <IconComponent className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground">
              {title}
            </h2>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
        <Link 
          to={link}
          className="text-sm text-accent font-medium hover:underline flex items-center gap-1"
        >
          View All <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {products.slice(0, 5).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
};
