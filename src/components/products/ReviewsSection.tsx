import { useState } from 'react';
import { Star, ThumbsUp, ThumbsDown, ChevronDown, Image, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface Review {
  id: string;
  user: string;
  avatar?: string;
  rating: number;
  title: string;
  content: string;
  date: string;
  verified: boolean;
  helpful: number;
  images?: string[];
  variation?: string;
}

interface ReviewsSectionProps {
  productId: string;
  rating: number;
  reviewCount: number;
}

const mockReviews: Review[] = [
  {
    id: '1',
    user: 'Sarah M.',
    rating: 5,
    title: 'Exceeded my expectations!',
    content: 'Absolutely love this product! The quality is outstanding and it arrived earlier than expected. Would definitely recommend to anyone looking for a premium option.',
    date: '2024-01-15',
    verified: true,
    helpful: 124,
    variation: 'Black, Size M',
  },
  {
    id: '2',
    user: 'John D.',
    rating: 4,
    title: 'Great value for money',
    content: 'Very happy with my purchase. The product works exactly as described. Only reason for 4 stars is the packaging could be better.',
    date: '2024-01-12',
    verified: true,
    helpful: 67,
  },
  {
    id: '3',
    user: 'Emily R.',
    rating: 5,
    title: 'Perfect gift!',
    content: 'Bought this as a gift and the recipient loved it. Fast shipping and great customer service. Will definitely shop here again.',
    date: '2024-01-10',
    verified: true,
    helpful: 45,
    images: ['/placeholder.svg'],
  },
  {
    id: '4',
    user: 'Michael T.',
    rating: 3,
    title: 'Good but could be better',
    content: 'The product itself is fine but I had some issues with the sizing. Make sure to check the size guide before ordering.',
    date: '2024-01-08',
    verified: false,
    helpful: 23,
  },
];

const ratingBreakdown = [
  { stars: 5, percentage: 72 },
  { stars: 4, percentage: 18 },
  { stars: 3, percentage: 6 },
  { stars: 2, percentage: 2 },
  { stars: 1, percentage: 2 },
];

export const ReviewsSection = ({ productId, rating, reviewCount }: ReviewsSectionProps) => {
  const [sortBy, setSortBy] = useState<'helpful' | 'recent'>('helpful');
  const [filterRating, setFilterRating] = useState<number | null>(null);

  const filteredReviews = mockReviews.filter((review) => 
    filterRating ? review.rating === filterRating : true
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        {/* Overall Rating */}
        <div className="flex items-start gap-6">
          <div className="text-center">
            <div className="text-5xl font-bold text-foreground">{rating.toFixed(1)}</div>
            <div className="flex items-center justify-center mt-2">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i}
                  className={cn(
                    "h-5 w-5",
                    i < Math.floor(rating) 
                      ? "fill-rating text-rating" 
                      : "fill-muted text-muted"
                  )}
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {reviewCount.toLocaleString()} reviews
            </p>
          </div>

          {/* Rating Breakdown */}
          <div className="space-y-2 min-w-[200px]">
            {ratingBreakdown.map((item) => (
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
        <Button variant="accent" size="lg">
          Write a Review
        </Button>
      </div>

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
          <Button variant="outline" size="sm" className="gap-1">
            {sortBy === 'helpful' ? 'Most Helpful' : 'Most Recent'}
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {filteredReviews.map((review) => (
          <div key={review.id} className="pb-6 border-b border-border last:border-0">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                <span className="font-semibold text-foreground">
                  {review.user.charAt(0)}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                {/* User Info & Rating */}
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="font-medium text-foreground">{review.user}</span>
                  {review.verified && (
                    <span className="flex items-center gap-1 text-xs text-success">
                      <CheckCircle className="h-3 w-3" />
                      Verified Purchase
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {new Date(review.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
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
                  {review.variation && (
                    <span className="text-xs text-muted-foreground">
                      {review.variation}
                    </span>
                  )}
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
                    {review.helpful} people found this helpful
                  </span>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                      <ThumbsUp className="h-4 w-4" />
                      Helpful
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                      <ThumbsDown className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load More */}
      <div className="text-center">
        <Button variant="outline" size="lg">
          Load More Reviews
        </Button>
      </div>
    </div>
  );
};
