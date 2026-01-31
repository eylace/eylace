import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Zap, ChevronRight } from 'lucide-react';
import { ProductCard } from '@/components/products/ProductCard';
import { flashSaleProducts } from '@/data/mockData';

export const FlashSaleSection = () => {
  const [timeLeft, setTimeLeft] = useState({
    hours: 5,
    minutes: 32,
    seconds: 47,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (value: number) => value.toString().padStart(2, '0');

  return (
    <section className="container-main py-8">
      <div className="bg-gradient-to-r from-destructive to-accent rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 md:p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-foreground/20 rounded-lg animate-pulse">
              <Zap className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-primary-foreground flex items-center gap-2">
                Flash Sale
                <span className="text-sm font-normal bg-primary-foreground/20 px-2 py-0.5 rounded">
                  Limited Time
                </span>
              </h2>
              <p className="text-primary-foreground/80 text-sm">
                Grab these deals before they're gone!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Countdown */}
            <div className="flex items-center gap-2">
              <span className="text-primary-foreground/80 text-sm hidden sm:inline">Ends in:</span>
              <div className="flex gap-1">
                <div className="bg-primary text-primary-foreground px-3 py-2 rounded-lg text-center min-w-[50px]">
                  <span className="text-lg font-bold">{formatTime(timeLeft.hours)}</span>
                  <p className="text-[10px] text-primary-foreground/70 uppercase">Hours</p>
                </div>
                <span className="text-primary-foreground text-xl font-bold self-center">:</span>
                <div className="bg-primary text-primary-foreground px-3 py-2 rounded-lg text-center min-w-[50px]">
                  <span className="text-lg font-bold">{formatTime(timeLeft.minutes)}</span>
                  <p className="text-[10px] text-primary-foreground/70 uppercase">Mins</p>
                </div>
                <span className="text-primary-foreground text-xl font-bold self-center">:</span>
                <div className="bg-primary text-primary-foreground px-3 py-2 rounded-lg text-center min-w-[50px]">
                  <span className="text-lg font-bold">{formatTime(timeLeft.seconds)}</span>
                  <p className="text-[10px] text-primary-foreground/70 uppercase">Secs</p>
                </div>
              </div>
            </div>

            <Link 
              to="/flash-sale"
              className="text-primary-foreground font-semibold flex items-center gap-1 hover:underline whitespace-nowrap"
            >
              View All <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Products */}
        <div className="bg-card p-4 md:p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {flashSaleProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
