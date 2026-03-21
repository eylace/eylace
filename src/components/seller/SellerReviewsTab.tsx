import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SellerReviewsTabProps {
  sellerId: string;
}

interface ReviewItem {
  id: string;
  product_id: string;
  rating: number;
  title: string;
  content: string;
  created_at: string;
}

export const SellerReviewsTab = ({ sellerId }: SellerReviewsTabProps) => {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      // Get seller's product IDs
      const { data: prods } = await supabase
        .from('products')
        .select('id')
        .eq('seller_id', sellerId);

      if (!prods?.length) { setLoading(false); return; }

      const ids = prods.map(p => p.id);

      const { data } = await supabase
        .from('product_reviews')
        .select('id, product_id, rating, title, content, created_at')
        .in('product_id', ids)
        .order('created_at', { ascending: false })
        .limit(50);

      if (data) setReviews(data);
      setLoading(false);
    };
    fetchReviews();
  }, [sellerId]);

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : '0';

  const distribution = [5, 4, 3, 2, 1].map(r => ({
    stars: r,
    count: reviews.filter(rv => rv.rating === r).length,
    pct: reviews.length ? (reviews.filter(rv => rv.rating === r).length / reviews.length) * 100 : 0,
  }));

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-center gap-6">
            <div className="text-center">
              <p className="text-4xl font-bold">{avgRating}</p>
              <div className="flex mt-1">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className={`h-4 w-4 ${i <= Math.round(Number(avgRating)) ? 'fill-accent text-accent' : 'text-muted-foreground'}`} />
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{reviews.length} reviews</p>
            </div>
            <div className="flex-1 space-y-1">
              {distribution.map(d => (
                <div key={d.stars} className="flex items-center gap-2 text-sm">
                  <span className="w-3">{d.stars}</span>
                  <Star className="h-3 w-3 fill-accent text-accent" />
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-accent rounded-full" style={{ width: `${d.pct}%` }} />
                  </div>
                  <span className="w-6 text-right text-muted-foreground">{d.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No reviews yet</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {reviews.map(r => (
            <Card key={r.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} className={`h-3.5 w-3.5 ${i <= r.rating ? 'fill-accent text-accent' : 'text-muted-foreground'}`} />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="font-medium text-sm">{r.title}</p>
                <p className="text-sm text-muted-foreground mt-1">{r.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
