import { useEffect, useState } from 'react';
import { Star, ThumbsUp, ThumbsDown, ChevronDown, Image, CheckCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useProductReviews } from '@/hooks/useProductReviews';
import { WriteReviewModal } from './WriteReviewModal';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

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
  const [sortBy, setSortBy] = useState<'helpful' | 'recent'>('helpful');
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);

  const { reviews, isLoading, stats, userHasReviewed, voteReview, refetch } = useProductReviews({
    productId,
    sortBy,
    filterRating,
  });

  // Use stats from database or fallback to props
  const displayRating = stats.totalReviews > 0 ? stats.averageRating : rating;
  const displayReviewCount = stats.totalReviews > 0 ? stats.totalReviews : reviewCount;

  useEffect(() => {
    onStatsChange?.({
      averageRating: stats.averageRating,
      totalReviews: stats.totalReviews,
    });
  }, [stats.averageRating, stats.totalReviews, onStatsChange]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        {/* Overall Rating */}
        <div className="flex items-start gap-6">
          <div className="text-center">
            <div className="text-5xl font-bold text-foreground">{displayRating.toFixed(1)}</div>
            <div className="flex items-center justify-center mt-2">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i}
                  className={cn(
                    "h-5 w-5",
                    i < Math.floor(displayRating) 
                      ? "fill-rating text-rating" 
                      : "fill-muted text-muted"
                  )}
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {displayReviewCount.toLocaleString()} reviews
            </p>
          </div>

          {/* Rating Breakdown */}
          <div className="space-y-2 min-w-[200px]">
            {stats.ratingBreakdown.map((item) => (
              <button
                key={item.stars}
                onClick={() => setFilterRating(filterRating === item.stars ? null : item.stars)}
                className={cn(
                  "flex items-center gap-2 w-full group",
                  filterRating === item.stars && "font-medium"
                )}
              >
                <span className="text-sm w-8">{item.stars}★</span>
                <Progress 
                  value={item.percentage} 
                  className="h-2 flex-1"
                />
                <span className="text-sm text-muted-foreground w-10 text-right">
                  {item.percentage}%
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Write Review Button */}
        <Button 
          variant="accent" 
          size="lg"
          onClick={() => {
            if (!user) {
              window.location.href = '/auth';
              return;
            }
            setIsWriteModalOpen(true);
          }}
        >
          Write a Review
        </Button>
      </div>

      {/* Write Review Modal */}
      <WriteReviewModal
        open={isWriteModalOpen}
        onOpenChange={setIsWriteModalOpen}
        productId={productId}
        productName={productName}
        onReviewSubmitted={refetch}
      />

      {/* Filters & Sort */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filterRating === null ? "accent" : "outline"}
            size="sm"
            onClick={() => setFilterRating(null)}
          >
            All Reviews
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
          >
            <Image className="h-4 w-4" />
            With Photos
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
          >
            <CheckCircle className="h-4 w-4" />
            Verified Only
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sort by:</span>
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1"
            onClick={() => setSortBy(sortBy === 'helpful' ? 'recent' : 'helpful')}
          >
            {sortBy === 'helpful' ? 'Most Helpful' : 'Most Recent'}
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Reviews List */}
      {isLoading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="pb-6 border-b border-border animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-secondary" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-secondary rounded w-1/4" />
                  <div className="h-4 bg-secondary rounded w-1/2" />
                  <div className="h-16 bg-secondary rounded w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No reviews yet. Be the first to review this product!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="pb-6 border-b border-border last:border-0">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <span className="font-semibold text-foreground">
                    {review.user_initials || 'A'}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  {/* User Info & Rating */}
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="font-medium text-foreground">
                      {review.user_name || 'Anonymous'}
                    </span>
                    {review.verified_purchase && (
                      <span className="flex items-center gap-1 text-xs text-success">
                        <CheckCircle className="h-3 w-3" />
                        Verified Purchase
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(review.created_at), 'MMMM d, yyyy')}
                    </span>
                  </div>

                  {/* Stars */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i}
                          className={cn(
                            "h-4 w-4",
                            i < review.rating 
                              ? "fill-rating text-rating" 
                              : "fill-muted text-muted"
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Title & Content */}
                  <h4 className="font-semibold text-foreground mb-1">{review.title}</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {review.content}
                  </p>

                  {/* Review Images */}
                  {review.images && review.images.length > 0 && (
                    <div className="flex gap-2 mt-3">
                      {review.images.map((img, i) => (
                        <div 
                          key={i}
                          className="w-16 h-16 rounded-lg bg-secondary overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                        >
                          <img src={img} alt="Review" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Helpful */}
                  <div className="flex items-center gap-4 mt-4">
                    <span className="text-sm text-muted-foreground">
                      {review.helpful_count} people found this helpful
                    </span>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="gap-1 text-muted-foreground"
                        onClick={() => voteReview(review.id, true)}
                      >
                        <ThumbsUp className="h-4 w-4" />
                        Helpful
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="gap-1 text-muted-foreground"
                        onClick={() => voteReview(review.id, false)}
                      >
                        <ThumbsDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load More */}
      {reviews.length > 0 && (
        <div className="text-center">
          <Button variant="outline" size="lg">
            Load More Reviews
          </Button>
        </div>
      )}
    </div>
  );
};
