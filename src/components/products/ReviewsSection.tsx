import { useEffect, useState } from 'react';
import { Star, ThumbsUp, ChevronDown, CheckCircle, Check, MessageSquare, PenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useProductReviews } from '@/hooks/useProductReviews';
import { WriteReviewModal } from './WriteReviewModal';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ReviewsSectionProps {
  productId: string;
  productName?: string;
  rating: number;
  reviewCount: number;
  onStatsChange?: (stats: { averageRating: number; totalReviews: number }) => void;
}

export const ReviewsSection = ({
  productId,
  productName = 'Product',
  rating,
  reviewCount,
  onStatsChange,
}: ReviewsSectionProps) => {
  const { user } = useAuth();
  const [sortBy, setSortBy] = useState<'helpful' | 'recent'>('recent');
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);

  const { reviews, isLoading, stats, userHasReviewed, voteReview, refetch } = useProductReviews({
    productId,
    sortBy,
    filterRating,
  });

  const displayRating = stats.totalReviews > 0 ? stats.averageRating : rating;
  const displayReviewCount = stats.totalReviews > 0 ? stats.totalReviews : reviewCount;

  useEffect(() => {
    onStatsChange?.({
      averageRating: stats.averageRating,
      totalReviews: stats.totalReviews,
    });
  }, [stats.averageRating, stats.totalReviews, onStatsChange]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold text-foreground">Customer Reviews</h2>
          <span className="text-sm text-muted-foreground">({displayReviewCount} reviews)</span>
        </div>
        {user && userHasReviewed ? (
          <Button variant="outline" disabled className="gap-2 opacity-70">
            <Check className="w-4 h-4" />
            Already Reviewed
          </Button>
        ) : (
          <Button
            className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => {
              if (!user) { window.location.href = '/auth'; return; }
              setIsWriteModalOpen(true);
            }}
          >
            <PenLine className="h-4 w-4" />
            Write a Review
          </Button>
        )}
      </div>

      <WriteReviewModal
        open={isWriteModalOpen}
        onOpenChange={setIsWriteModalOpen}
        productId={productId}
        productName={productName}
        onReviewSubmitted={refetch}
      />

      {/* Two-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8">
        {/* Left: Rating Summary */}
        <div className="border border-border rounded-lg p-6 h-fit">
          <div className="text-center mb-4">
            <div className="text-5xl font-bold text-foreground">{displayRating.toFixed(1)}</div>
            <div className="flex items-center justify-center mt-2">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-5 w-5",
                    i < Math.floor(displayRating)
                      ? "fill-warning text-warning"
                      : "fill-muted text-muted"
                  )}
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Based on {displayReviewCount} reviews
            </p>
          </div>

          <div className="space-y-2.5">
            {stats.ratingBreakdown.map((item) => (
              <button
                key={item.stars}
                onClick={() => setFilterRating(filterRating === item.stars ? null : item.stars)}
                className={cn(
                  "flex items-center gap-2.5 w-full group hover:opacity-80 transition-opacity",
                  filterRating === item.stars && "font-semibold"
                )}
              >
                <span className="text-sm w-4 text-foreground">{item.stars}</span>
                <Star className="h-3.5 w-3.5 fill-warning text-warning shrink-0" />
                <Progress value={item.percentage} className="h-2.5 flex-1" />
                <span className="text-sm text-muted-foreground w-6 text-right">{item.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Reviews List */}
        <div className="space-y-4">
          {/* Sort */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Sort by:</span>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'helpful' | 'recent')}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Newest</SelectItem>
                <SelectItem value="helpful">Most Helpful</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reviews */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border border-border rounded-lg p-5 animate-pulse">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-secondary rounded w-1/4" />
                      <div className="h-4 bg-secondary rounded w-1/2" />
                      <div className="h-12 bg-secondary rounded w-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12 border border-border rounded-lg">
              <p className="text-muted-foreground">No reviews yet. Be the first to review this product!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="border border-border rounded-lg p-5">
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center shrink-0">
                      <span className="font-semibold text-sm text-primary">
                        {review.user_initials || 'A'}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Top row: name + verified + date on left, stars on right */}
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-foreground">{review.user_name || 'Anonymous'}</span>
                            {review.verified_purchase && (
                              <span className="flex items-center gap-0.5 text-xs text-green-600 font-medium">
                                <CheckCircle className="h-3.5 w-3.5" />
                                Verified
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(review.created_at), 'MMMM d, yyyy')}
                          </span>
                        </div>
                        <div className="flex shrink-0">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                "h-4 w-4",
                                i < review.rating
                                  ? "fill-warning text-warning"
                                  : "fill-muted text-muted"
                              )}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Title & Content */}
                      <h4 className="font-semibold text-foreground mt-3 mb-1">{review.title}</h4>
                      <p className="text-muted-foreground text-sm leading-relaxed">{review.content}</p>

                      {/* Images */}
                      {review.images && review.images.length > 0 && (
                        <div className="flex gap-2 mt-3">
                          {review.images.map((img, i) => (
                            <div key={i} className="w-16 h-16 rounded-lg bg-secondary overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
                              <img src={img} alt="Review" className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Helpful */}
                      <div className="flex items-center gap-3 mt-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1.5 text-muted-foreground hover:text-primary h-8 px-2"
                          onClick={() => voteReview(review.id, true)}
                        >
                          <ThumbsUp className="h-3.5 w-3.5" />
                          <span className="text-xs">Helpful ({review.helpful_count})</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {reviews.length > 0 && (
            <div className="text-center pt-2">
              <Button variant="outline" size="lg">Load More Reviews</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
