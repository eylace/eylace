import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { categories } from '@/data/mockData';

const heroSlides = [
  {
    id: 1,
    title: 'Mega Sale Event',
    subtitle: 'Up to 70% Off',
    description: 'Shop thousands of products at unbeatable prices',
    cta: 'Shop Now',
    link: '/sale',
    gradient: 'from-primary via-primary/90 to-primary/70',
  },
  {
    id: 2,
    title: 'New Electronics Collection',
    subtitle: 'Latest Gadgets',
    description: 'Discover cutting-edge technology at amazing prices',
    cta: 'Explore',
    link: '/category/electronics',
    gradient: 'from-[hsl(199,89%,35%)] via-[hsl(199,89%,40%)] to-[hsl(199,89%,48%)]',
  },
  {
    id: 3,
    title: 'Fashion Week Special',
    subtitle: 'Trending Styles',
    description: 'Refresh your wardrobe with the latest trends',
    cta: 'Shop Fashion',
    link: '/category/fashion',
    gradient: 'from-[hsl(330,60%,40%)] via-[hsl(330,60%,50%)] to-[hsl(330,60%,60%)]',
  },
];

export const HeroSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  return (
    <section className="container-main py-4">
      <div className="grid grid-cols-12 gap-4">
        {/* Categories Sidebar - Desktop */}
        <div className="hidden lg:block col-span-2">
          <div className="bg-card rounded-lg shadow-card overflow-hidden">
            <h3 className="font-semibold text-sm px-4 py-3 bg-primary text-primary-foreground">
              Shop by Category
            </h3>
            <div className="py-1">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/category/${cat.slug}`}
                  className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-secondary transition-colors"
                >
                  <span>{cat.icon}</span>
                  <span className="truncate">{cat.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Main Hero Slider */}
        <div className="col-span-12 lg:col-span-7">
          <div className="relative rounded-lg overflow-hidden">
            <div 
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {heroSlides.map((slide) => (
                <div 
                  key={slide.id}
                  className={`min-w-full aspect-[2/1] md:aspect-[2.5/1] bg-gradient-to-r ${slide.gradient} text-primary-foreground p-6 md:p-10 flex flex-col justify-center`}
                >
                  <div className="max-w-lg animate-fade-in">
                    <span className="inline-block px-3 py-1 bg-accent text-accent-foreground text-sm font-bold rounded mb-3">
                      {slide.subtitle}
                    </span>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3">
                      {slide.title}
                    </h2>
                    <p className="text-primary-foreground/80 mb-6 text-sm md:text-base">
                      {slide.description}
                    </p>
                    <Button variant="hero" size="lg" asChild>
                      <Link to={slide.link}>{slide.cta}</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation Arrows */}
            <button 
              onClick={prevSlide}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-card/80 backdrop-blur-sm rounded-full hover:bg-card transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button 
              onClick={nextSlide}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-card/80 backdrop-blur-sm rounded-full hover:bg-card transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {heroSlides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === currentSlide 
                      ? 'bg-accent w-6' 
                      : 'bg-primary-foreground/50 hover:bg-primary-foreground/70'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Side Banners */}
        <div className="hidden lg:flex col-span-3 flex-col gap-4">
          <Link 
            to="/flash-sale"
            className="flex-1 bg-gradient-to-br from-destructive to-accent rounded-lg p-5 text-primary-foreground hover:opacity-95 transition-opacity"
          >
            <span className="text-sm font-bold">⚡ Flash Sale</span>
            <h3 className="text-xl font-bold mt-1">Up to 50% Off</h3>
            <p className="text-sm text-primary-foreground/80 mt-1">Limited time only</p>
          </Link>
          <Link 
            to="/new-arrivals"
            className="flex-1 bg-gradient-to-br from-success to-prime rounded-lg p-5 text-primary-foreground hover:opacity-95 transition-opacity"
          >
            <span className="text-sm font-bold">🆕 New Arrivals</span>
            <h3 className="text-xl font-bold mt-1">Fresh Products</h3>
            <p className="text-sm text-primary-foreground/80 mt-1">Just landed this week</p>
          </Link>
        </div>
      </div>
    </section>
  );
};
