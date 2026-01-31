import { Layout } from '@/components/layout/Layout';
import { HeroSection } from '@/components/home/HeroSection';
import { CategoriesSection } from '@/components/home/CategoriesSection';
import { FlashSaleSection } from '@/components/home/FlashSaleSection';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { DealsSection } from '@/components/home/DealsSection';
import { PromoBanners } from '@/components/home/PromoBanners';
import { featuredProducts } from '@/data/mockData';

const Index = () => {
  return (
    <Layout>
      {/* Hero Section with Categories & Slider */}
      <HeroSection />

      {/* Categories Grid */}
      <CategoriesSection />

      {/* Flash Sale */}
      <FlashSaleSection />

      {/* Promotional Banners */}
      <PromoBanners />

      {/* Today's Best Deals */}
      <DealsSection />

      {/* Featured Products */}
      <FeaturedProducts 
        title="Featured Products"
        subtitle="Handpicked items just for you"
        icon="star"
      />

      {/* Trending Now */}
      <FeaturedProducts 
        title="Trending Now"
        subtitle="What everyone is buying"
        icon="trending"
        products={[...featuredProducts].reverse()}
      />

      {/* New Arrivals */}
      <FeaturedProducts 
        title="New Arrivals"
        subtitle="Fresh additions to our collection"
        icon="sparkles"
        link="/new-arrivals"
      />

      {/* Recently Viewed - placeholder */}
      <section className="container-main py-8 mb-8">
        <div className="bg-secondary/50 rounded-xl p-8 text-center">
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Your Recently Viewed Products
          </h3>
          <p className="text-muted-foreground text-sm">
            Sign in to see your browsing history and get personalized recommendations
          </p>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
