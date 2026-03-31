import { Link } from 'react-router-dom';
import { useCategories } from '@/hooks/useProducts';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export const CategoriesSection = () => {
  const { categories, isLoading } = useCategories();
  const { t } = useLanguage();

  if (isLoading) {
    return (
      <section className="container-main py-8">
        <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>
      </section>);

  }

  return (
    <section className="container-main py-[25px]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-foreground">{t('categories.title')}</h2>
        <Link to="/categories" className="text-sm text-accent font-medium hover:underline">{t('categories.viewAll')}</Link>
      </div>
      <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
        {categories.map((category) =>
        <Link key={category.id} to={`/category/${category.slug}`} className="group flex flex-col items-center text-center">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-secondary flex items-center justify-center mb-2 group-hover:bg-accent/10 group-hover:scale-105 transition-all duration-200 shadow-sm overflow-hidden">
              {category.image ?
            <img src={category.image} alt={category.name} loading="lazy" className="w-full h-full object-cover" /> :

            <span className="text-2xl md:text-3xl">{category.icon}</span>
            }
            </div>
            <span className="text-xs md:text-sm text-foreground group-hover:text-accent transition-colors line-clamp-2">{category.name}</span>
          </Link>
        )}
      </div>
    </section>);

};