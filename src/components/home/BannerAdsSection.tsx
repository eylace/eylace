import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { BannerAd } from '@/pages/AdminMarketingAds';

export const BannerAdsSection = () => {
  const [ads, setAds] = useState<BannerAd[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('system_settings').select('value').eq('key', 'marketing_ads_v1').maybeSingle();
      if (data?.value && Array.isArray(data.value)) {
        const now = new Date().toISOString().split('T')[0];
        const active = (data.value as unknown as BannerAd[]).filter(ad => {
          if (!ad.isActive) return false;
          if (ad.placement !== 'homepage') return false;
          if (ad.startDate && ad.startDate > now) return false;
          if (ad.endDate && ad.endDate < now) return false;
          return true;
        });
        setAds(active);
      }
    };
    load();
  }, []);

  if (ads.length === 0) return null;

  return (
    <section className="container-main py-4">
      <div className={`grid gap-4 ${ads.length === 1 ? 'grid-cols-1' : ads.length === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
        {ads.map(ad => (
          <Link key={ad.id} to={ad.linkUrl || '#'} className="block rounded-lg overflow-hidden border border-border hover:shadow-lg transition-shadow">
            {ad.imageUrl ? (
              <img src={ad.imageUrl} alt={ad.title} loading="lazy" className="w-full h-40 md:h-48 object-cover" />
            ) : (
              <div className="w-full h-40 md:h-48 bg-gradient-to-r from-primary to-accent flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">{ad.title}</span>
              </div>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
};
