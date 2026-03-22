import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Zap, ChevronRight, Loader2 } from 'lucide-react';
import { ProductCard } from '@/components/products/ProductCard';
import { useProducts } from '@/hooks/useProducts';
import { adaptDBProducts } from '@/lib/productAdapter';
import { useLanguage } from '@/contexts/LanguageContext';

export const FlashSaleSection = () => {
  const { products: dbProducts, isLoading } = useProducts({ flashSaleOnly: true, limit: 4 });
  const flashSaleProducts = adaptDBProducts(dbProducts);
  const { t } = useLanguage();

  const [timeLeft, setTimeLeft] = useState({ hours: 5, minutes: 32, seconds: 47 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };else
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };else
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (value: number) => value.toString().padStart(2, '0');

  return (
    <section className="container-main py-[25px]">
      <div className="bg-gradient-to-r from-destructive to-accent rounded-xl overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 md:p-6 px-[15px] py-[13px] text-xs font-sans font-bold text-justify gap-[12px]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-foreground/20 rounded-lg animate-pulse"><Zap className="h-6 w-6 text-primary-foreground" /></div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-primary-foreground flex items-center gap-2">
                {t('flashSale.title')}
                <span className="text-sm bg-primary-foreground/20 px-2 py-0.5 rounded font-bold">{t('flashSale.limitedTime')}</span>
              </h2>
              <p className="text-sm text-primary-foreground">{t('flashSale.grabDeals')}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-primary-foreground/80 text-sm hidden sm:inline">{t('flashSale.endsIn')}</span>
              <div className="flex gap-1">
                {[
                { val: timeLeft.hours, label: t('flashSale.hours') },
                { val: timeLeft.minutes, label: t('flashSale.mins') },
                { val: timeLeft.seconds, label: t('flashSale.secs') }].
                map((item, i) =>
                <div key={i} className="flex items-center gap-1">
                    {i > 0 && <span className="text-primary-foreground text-xl font-bold">:</span>}
                    <div className="text-primary-foreground rounded-lg text-center min-w-[50px] bg-primary px-[10px] py-[7px] mx-0">
                      <span className="text-lg font-bold">{formatTime(item.val)}</span>
                      <p className="text-[10px] uppercase text-primary-foreground">{item.label}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <Link to="/flash-sale" className="font-semibold flex items-center gap-1 hover:underline whitespace-nowrap text-primary-foreground">
              {t('flashSale.viewAll')} <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
        <div className="bg-card p-2 sm:p-4 md:p-6">
          {isLoading ?
          <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div> :
          flashSaleProducts.length === 0 ?
          <p className="text-center text-muted-foreground py-8">{t('flashSale.noItems')}</p> :

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
              {flashSaleProducts.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          }
        </div>
      </div>
    </section>);

};