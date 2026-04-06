import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Review {
  id: string;
  user_id: string;
  product_id: string;
  rating: number;
  title: string;
  content: string;
  images: string[];
  verified_purchase: boolean;
  helpful_count: number;
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_initials?: string;
  user_voted?: boolean | null;
}

interface UseProductReviewsOptions {
  productId: string;
  sortBy?: 'helpful' | 'recent';
  filterRating?: number | null;
}

export const useProductReviews = ({
  productId,
  sortBy = 'helpful',
  filterRating = null,
}: UseProductReviewsOptions) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userHasReviewed, setUserHasReviewed] = useState(false);
  const [stats, setStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    ratingBreakdown: [
      { stars: 5, percentage: 0, count: 0 },
      { stars: 4, percentage: 0, count: 0 },
      { stars: 3, percentage: 0, count: 0 },
      { stars: 2, percentage: 0, count: 0 },
      { stars: 1, percentage: 0, count: 0 },
    ],
  });

  const fetchReviews = useCallback(async () => {
    setIsLoading(true);

    try {
      let query = supabase
        .from('product_reviews')
        .select('*')
        .eq('product_id', productId);

      if (filterRating) {
        query = query.eq('rating', filterRating);
      }

      if (sortBy === 'helpful') {
        query = query.order('helpful_count', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching reviews:', error);
        return;
      }

      // Fetch profile names for all review authors
      const userIds = [...new Set((data || []).map((r) => r.user_id))];
      let profileMap: Record<string, { first_name: string | null; last_name: string | null }> = {};

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name')
          .in('user_id', userIds);

        if (profiles) {
          profiles.forEach((p) => {
            profileMap[p.user_id] = { first_name: p.first_name, last_name: p.last_name };
          });
        }
      }

      // Calculate stats from all reviews (not filtered)
      const { data: allReviews } = await supabase
        .from('product_reviews')
        .select('rating')
        .eq('product_id', productId);

      if (allReviews && allReviews.length > 0) {
        const total = allReviews.length;
        const sum = allReviews.reduce((acc, r) => acc + r.rating, 0);
        const avg = sum / total;

        const breakdown = [5, 4, 3, 2, 1].map((stars) => {
          const count = allReviews.filter((r) => r.rating === stars).length;
          return {
            stars,
            count,
            percentage: Math.round((count / total) * 100),
          };
        });

        setStats({
          averageRating: avg,
          totalReviews: total,
          ratingBreakdown: breakdown,
        });
      }

      const enrichedReviews: Review[] = (data || []).map((r) => {
        const profile = profileMap[r.user_id];
        const firstName = profile?.first_name || '';
        const lastName = profile?.last_name || '';
        const fullName = [firstName, lastName].filter(Boolean).join(' ') || 'Anonymous';
        const initials = [firstName?.[0], lastName?.[0]].filter(Boolean).join('').toUpperCase() || 'A';

        return {
          ...r,
          images: r.images || [],
          verified_purchase: r.verified_purchase ?? false,
          helpful_count: r.helpful_count ?? 0,
          user_name: fullName,
          user_initials: initials,
        };
      });

      setReviews(enrichedReviews);

      // Check if current user already reviewed
      if (user) {
        const alreadyReviewed = enrichedReviews.some((r) => r.user_id === user.id);
        setUserHasReviewed(alreadyReviewed);
      } else {
        setUserHasReviewed(false);
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setIsLoading(false);
    }
  }, [productId, sortBy, filterRating]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const voteReview = async (reviewId: string, isHelpful: boolean) => {
    if (!user) return;

    try {
      const { data: existingVote } = await supabase
        .from('review_votes')
        .select('id, is_helpful')
        .eq('user_id', user.id)
        .eq('review_id', reviewId)
        .single();

      if (existingVote) {
        if (existingVote.is_helpful !== isHelpful) {
          await supabase
            .from('review_votes')
            .update({ is_helpful: isHelpful })
            .eq('id', existingVote.id);

          const review = reviews.find((r) => r.id === reviewId);
          if (review) {
            const delta = isHelpful ? 2 : -2;
            await supabase
              .from('product_reviews')
              .update({ helpful_count: review.helpful_count + delta })
              .eq('id', reviewId);
          }
        }
      } else {
        await supabase
          .from('review_votes')
          .insert({
            user_id: user.id,
            review_id: reviewId,
            is_helpful: isHelpful,
          });

        if (isHelpful) {
          const review = reviews.find((r) => r.id === reviewId);
          if (review) {
            await supabase
              .from('product_reviews')
              .update({ helpful_count: review.helpful_count + 1 })
              .eq('id', reviewId);
          }
        }
      }

      fetchReviews();
    } catch (err) {
      console.error('Error voting on review:', err);
    }
  };

  return {
    reviews,
    isLoading,
    stats,
    voteReview,
    refetch: fetchReviews,
  };
};
