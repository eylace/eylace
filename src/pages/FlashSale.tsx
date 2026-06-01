import { useState, useEffect, useMemo } from 'react';
import { Layout } from '@/components/layout/Layout';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductGrid } from '@/components/products/ProductGrid';
import { useProducts } from '@/hooks/useProducts';
import { adaptDBProducts } from '@/lib/productAdapter';
import { Loader2, Zap, Timer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SeoHead } from '@/components/seo/SeoHead';

const CountdownTimer = ({ endTime }: { endTime: Date }) => {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const update = () => {
      const now = new Date().getTime();
      const diff = endTime.getTime() - now;
      if (diff <= 0) {
        setExpired(true);
        return;
      }
      setTimeLeft({
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  if (expired) return <Badge variant="secondary">Expired</Badge>;

  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <div className="flex items-center gap-1">
      <Timer className="h-3.5 w-3.5 text-destructive" />
      <div className="flex items-center gap-0.5 text-sm font-mono font-bold text-destructive">
        <span className="bg-destructive/10 px-1.5 py-0.5 rounded">{pad(timeLeft.hours)}</span>
        <span>:</span>
        <span className="bg-destructive/10 px-1.5 py-0.5 rounded">{pad(timeLeft.minutes)}</span>
        <span>:</span>
        <span className="bg-destructive/10 px-1.5 py-0.5 rounded">{pad(timeLeft.seconds)}</span>
      </div>
    </div>
  );
};

export default function FlashSale() {
  const { products: dbProducts, isLoading } = useProducts({ flashSaleOnly: true });
  const flashProducts = useMemo(() => adaptDBProducts(dbProducts), [dbProducts]);

  // Global countdown for the main sale banner
  const [globalTime, setGlobalTime] = useState({ hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    const endTime = flashProducts.length > 0 && flashProducts[0].flashSaleEnds
      ? flashProducts[0].flashSaleEnds.getTime()
      : Date.now() + 18 * 60 * 60 * 1000;

    const update = () => {
      const diff = endTime - Date.now();
      if (diff <= 0) return;
      setGlobalTime({
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [flashProducts]);

  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <Layout>
      <SeoHead
        title="Flash Sale — Massive Discounts for Limited Time | Eylace"
        description="Don't miss Eylace flash sales — deep discounts on trending products for a few hours only. Shop now before time runs out."
        path="/flash-sale"
      />
      <div className="container-main py-8">
        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-destructive to-accent rounded-2xl p-6 md:p-10 mb-8 text-primary-foreground">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-8 w-8 animate-pulse" />
                <h1 className="text-3xl md:text-4xl font-bold">Flash Sale</h1>
              </div>
              <p className="text-primary-foreground/80 text-lg">
                Massive discounts on top products. Don't miss out!
              </p>
            </div>
            
            {/* Main Countdown */}
            <div className="flex items-center gap-3">
              <span className="text-primary-foreground/80 text-sm">Ends in:</span>
              <div className="flex gap-2">
                {[
                  { value: globalTime.hours, label: 'Hours' },
                  { value: globalTime.minutes, label: 'Mins' },
                  { value: globalTime.seconds, label: 'Secs' },
                ].map((item, i) => (
                  <div key={item.label} className="flex items-center gap-2">
                    {i > 0 && <span className="text-2xl font-bold">:</span>}
                    <div className="bg-primary text-primary-foreground px-4 py-3 rounded-xl text-center min-w-[60px]">
                      <span className="text-2xl font-bold">{pad(item.value)}</span>
                      <p className="text-[10px] text-primary-foreground/70 uppercase">{item.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Products */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
          </div>
        ) : flashProducts.length > 0 ? (
          <div>
            <div className="flex items-center gap-2 mb-6">
              <h2 className="text-xl font-bold text-foreground">{flashProducts.length} Flash Deals</h2>
              <Badge className="badge-flash">Limited Time</Badge>
            </div>
            <ProductGrid>
              {flashProducts.map((product) => (
                <div key={product.id} className="flex flex-col gap-2 h-full">
                  <div className="flex-1 flex"><ProductCard product={product} /></div>
                  {product.flashSaleEnds && (
                    <div className="flex justify-center">
                      <CountdownTimer endTime={product.flashSaleEnds} />
                    </div>
                  )}
                </div>
              ))}
            </ProductGrid>
          </div>
        ) : (
          <div className="text-center py-20">
            <Zap className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No flash sales right now</h3>
            <p className="text-muted-foreground">Check back soon for amazing deals!</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
