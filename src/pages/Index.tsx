import { Layout } from '@/components/layout/Layout';
import { HeroSection } from '@/components/home/HeroSection';
import { CategoriesSection } from '@/components/home/CategoriesSection';
import { FlashSaleSection } from '@/components/home/FlashSaleSection';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { DealsSection } from '@/components/home/DealsSection';
import { PromoBanners } from '@/components/home/PromoBanners';
import { SmartBar } from '@/components/home/SmartBar';
import { useLanguage } from '@/contexts/LanguageContext';

const Index = () => {
  const { t } = useLanguage();

  return (
    <Layout>
      <SmartBar />
      <HeroSection />
      <CategoriesSection />
      <FlashSaleSection />
      <PromoBanners />
      <DealsSection />

      <FeaturedProducts 
        title="Featured Products"
        subtitle="Handpicked items just for you"
        titleKey="featured.title"
        subtitleKey="featured.subtitle"
        icon="star"
        limit={5}
      />
      <FeaturedProducts 
        title="Trending Now"
        subtitle="What everyone is buying"
        titleKey="featured.trending"
        subtitleKey="featured.trendingSub"
        icon="trending"
        limit={5}
      />
      <FeaturedProducts 
        title="New Arrivals"
        subtitle="Fresh additions to our collection"
        titleKey="featured.newArrivals"
        subtitleKey="featured.newArrivalsSub"
        icon="sparkles"
        link="/new-arrivals"
        limit={5}
      />

      <section className="container-main py-8 mb-8">
        <div className="bg-secondary/50 rounded-xl p-8 text-center">
          <h3 className="text-lg font-semibold text-foreground mb-2">{t('recent.title')}</h3>
          <p className="text-muted-foreground text-sm">{t('recent.signIn')}</p>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
