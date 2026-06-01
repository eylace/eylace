import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Award, Star, ShieldCheck, Store, Package, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { SeoHead } from '@/components/seo/SeoHead';

interface SellerWithStats {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  rating: number | null;
  is_verified: boolean | null;
  created_at: string;
  product_count: number;
}

export default function BestSellers() {
  const [sellers, setSellers] = useState<SellerWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSellers = async () => {
      setIsLoading(true);

      // Get all sellers from public view
      const { data: sellersData, error } = await supabase
        .from('sellers_public')
        .select('*')
        .order('rating', { ascending: false });

      if (error || !sellersData) {
        setIsLoading(false);
        return;
      }

      // Get product counts for each seller
      const sellerIds = sellersData.map(s => s.id).filter(Boolean) as string[];
      
      let productCounts: Record<string, number> = {};
      if (sellerIds.length > 0) {
        const { data: products } = await supabase
          .from('products_public')
          .select('seller_id')
          .in('seller_id', sellerIds)
          .eq('is_active', true);

        if (products) {
          for (const p of products) {
            if (p.seller_id) {
              productCounts[p.seller_id] = (productCounts[p.seller_id] || 0) + 1;
            }
          }
        }
      }

      const sellersWithStats: SellerWithStats[] = sellersData.map(s => ({
        id: s.id || '',
        name: s.name || '',
        slug: s.slug || '',
        logo: s.logo,
        rating: s.rating,
        is_verified: s.is_verified,
        created_at: s.created_at || '',
        product_count: productCounts[s.id || ''] || 0,
      }));

      // Sort by rating * product_count as "best seller" score
      sellersWithStats.sort((a, b) => {
        const scoreA = (a.rating || 0) * (a.product_count || 1);
        const scoreB = (b.rating || 0) * (b.product_count || 1);
        return scoreB - scoreA;
      });

      setSellers(sellersWithStats);
      setIsLoading(false);
    };

    fetchSellers();
  }, []);

  return (
    <Layout>
      <SeoHead
        title="Best Sellers — Top-Rated Shops on Eylace Bangladesh"
        description="Discover Bangladesh's top-rated sellers on Eylace. Verified shops with thousands of happy customers and fast nationwide delivery."
        path="/best-sellers"
      />
      <div className="container-main py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-accent/10 rounded-xl">
              <Award className="h-7 w-7 text-accent" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Best Sellers
              </h1>
              <p className="text-muted-foreground">
                Top-rated sellers — trusted shops loved by our customers.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">
            {sellers.length} sellers
          </p>
        </div>

        {/* Sellers Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
          </div>
        ) : sellers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {sellers.map((seller, index) => (
              <div
                key={seller.id}
                className="relative bg-card border border-border rounded-xl p-5 hover:shadow-lg transition-shadow group"
              >
                {/* Rank badge for top 3 */}
                {index < 3 && (
                  <div className="absolute -top-2.5 -left-2.5 z-10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-md ${
                      index === 0 ? 'bg-yellow-500 text-white' :
                      index === 1 ? 'bg-gray-400 text-white' :
                      'bg-amber-700 text-white'
                    }`}>
                      #{index + 1}
                    </div>
                  </div>
                )}

                {/* Seller Logo & Info */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0 border-2 border-border">
                    {seller.logo ? (
                      <img src={seller.logo} alt={seller.name} className="w-full h-full object-cover" />
                    ) : (
                      <Store className="h-7 w-7 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{seller.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {seller.is_verified && (
                        <Badge variant="secondary" className="text-xs gap-1 px-1.5 py-0">
                          <ShieldCheck className="h-3 w-3 text-accent" />
                          Verified
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                    <div className="flex items-center justify-center gap-1 text-accent mb-0.5">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      <span className="font-bold text-sm">{seller.rating?.toFixed(1) || '0.0'}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">Rating</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                    <div className="flex items-center justify-center gap-1 text-foreground mb-0.5">
                      <Package className="h-3.5 w-3.5" />
                      <span className="font-bold text-sm">{seller.product_count}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">Products</p>
                  </div>
                </div>

                {/* View Store Button */}
                <Link to={`/search?seller=${seller.slug}`}>
                  <Button variant="outline" size="sm" className="w-full gap-1.5 group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                    View Store <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Award className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No sellers yet</h3>
            <p className="text-muted-foreground">Top sellers will appear here as they join the marketplace.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
