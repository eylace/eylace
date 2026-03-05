import { Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Home, Search } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const NotFound = () => {
  const location = useLocation();
  const { t } = useLanguage();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="text-8xl font-bold text-accent mb-4">404</div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{t('notFound.title')}</h1>
        <p className="text-muted-foreground mb-8 max-w-md">{t('notFound.desc')}</p>
        <div className="flex gap-4">
          <Button variant="accent" size="lg" asChild>
            <Link to="/"><Home className="h-4 w-4 mr-2" />{t('notFound.goHome')}</Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link to="/search"><Search className="h-4 w-4 mr-2" />{t('notFound.searchProducts')}</Link>
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
