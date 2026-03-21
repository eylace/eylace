import { Link } from 'react-router-dom';
import { useCategories } from '@/hooks/useProducts';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import Layout from '@/components/layout/Layout';

const Categories = () => {
  const { categories, isLoading } = useCategories();
  const { t } = useLanguage();

  return (
    <Layout>
      <div className="container-main py-6">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-accent">Home</Link>
          <span>/</span>
          <span className="text-foreground font-medium">All Categories</span>
        </nav>

        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-8">All Categories</h1>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-6">
            {categories.map((category) => (
              <Link key={category.id} to={`/category/${category.slug}`} className="group flex flex-col items-center text-center">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-secondary flex items-center justify-center mb-3 group-hover:bg-accent/10 group-hover:scale-105 transition-all duration-200 shadow-sm overflow-hidden">
                  {category.image ? (
                    <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl md:text-4xl">{category.icon}</span>
                  )}
                </div>
                <span className="text-sm text-foreground group-hover:text-accent transition-colors line-clamp-2">{category.name}</span>
              </Link>
            ))}
          </div>
        )}

        {!isLoading && categories.length === 0 && (
          <p className="text-center text-muted-foreground py-20">No categories found.</p>
        )}
      </div>
    </Layout>
  );
};

export default Categories;
