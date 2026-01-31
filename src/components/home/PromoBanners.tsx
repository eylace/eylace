import { Link } from 'react-router-dom';

export const PromoBanners = () => {
  return (
    <section className="container-main py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link 
          to="/category/electronics"
          className="group relative rounded-xl overflow-hidden aspect-[4/3] md:aspect-auto md:h-64"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(199,89%,35%)] to-[hsl(199,89%,48%)]" />
          <div className="relative h-full p-6 flex flex-col justify-between text-primary-foreground">
            <div>
              <span className="text-sm font-medium text-primary-foreground/80">Up to 40% Off</span>
              <h3 className="text-2xl font-bold mt-1">Electronics</h3>
              <p className="text-sm text-primary-foreground/70 mt-1">Latest gadgets & devices</p>
            </div>
            <span className="text-sm font-semibold group-hover:underline">
              Shop Now →
            </span>
          </div>
        </Link>

        <Link 
          to="/category/fashion"
          className="group relative rounded-xl overflow-hidden aspect-[4/3] md:aspect-auto md:h-64"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(330,60%,40%)] to-[hsl(330,60%,55%)]" />
          <div className="relative h-full p-6 flex flex-col justify-between text-primary-foreground">
            <div>
              <span className="text-sm font-medium text-primary-foreground/80">New Collection</span>
              <h3 className="text-2xl font-bold mt-1">Fashion</h3>
              <p className="text-sm text-primary-foreground/70 mt-1">Trending styles & looks</p>
            </div>
            <span className="text-sm font-semibold group-hover:underline">
              Shop Now →
            </span>
          </div>
        </Link>

        <Link 
          to="/category/beauty"
          className="group relative rounded-xl overflow-hidden aspect-[4/3] md:aspect-auto md:h-64"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(350,70%,50%)] to-[hsl(20,90%,55%)]" />
          <div className="relative h-full p-6 flex flex-col justify-between text-primary-foreground">
            <div>
              <span className="text-sm font-medium text-primary-foreground/80">Beauty Sale</span>
              <h3 className="text-2xl font-bold mt-1">Personal Care</h3>
              <p className="text-sm text-primary-foreground/70 mt-1">Skincare & cosmetics</p>
            </div>
            <span className="text-sm font-semibold group-hover:underline">
              Shop Now →
            </span>
          </div>
        </Link>
      </div>
    </section>
  );
};
