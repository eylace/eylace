import { useState } from 'react';
import { MessageSquare, Star, Trash2, Loader2, Download, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAdminReviews } from '@/hooks/useAdminData';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { exportToCSV } from '@/lib/csvExport';

export const AdminReviewsTab = () => {
  const { reviews, isLoading, deleteReview } = useAdminReviews();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedReviews, setSelectedReviews] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const { t } = useLanguage();

  const filteredReviews = ratingFilter === null ? reviews : reviews.filter(r => r.rating === ratingFilter);

  const toggleSelect = (id: string) => {
    setSelectedReviews(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedReviews.size === filteredReviews.length) {
      setSelectedReviews(new Set());
    } else {
      setSelectedReviews(new Set(filteredReviews.map(r => r.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedReviews.size === 0) return;
    setBulkDeleting(true);
    let successCount = 0;
    for (const reviewId of selectedReviews) {
      const { error } = await deleteReview(reviewId);
      if (!error) successCount++;
    }
    toast.success(`${successCount} ${t('admin.reviewsDeleted' as any) || 'reviews deleted'}`);
    setSelectedReviews(new Set());
    setBulkDeleting(false);
  };

  const handleDelete = async (reviewId: string) => {
    setDeleting(reviewId);
    const { error } = await deleteReview(reviewId);
    if (error) { toast.error('Failed to delete review'); } else { toast.success('Review deleted'); }
    setDeleting(null);
  };

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>;

  if (reviews.length === 0) {
    return (
      <Card><CardContent className="py-12 text-center">
        <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">{t('admin.noReviews' as any)}</p>
      </CardContent></Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {t('admin.allReviews' as any)} ({filteredReviews.length}{ratingFilter !== null ? `/${reviews.length}` : ''})
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => setRatingFilter(ratingFilter === star ? null : star)}
                  className={cn(
                    "h-7 w-7 rounded flex items-center justify-center text-xs font-medium transition-colors",
                    ratingFilter === star
                      ? "bg-accent text-accent-foreground"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                  )}
                >
                  {star}★
                </button>
              ))}
              {ratingFilter !== null && (
                <button
                  onClick={() => { setRatingFilter(null); setSelectedReviews(new Set()); }}
                  className="text-xs text-muted-foreground hover:text-foreground ml-1"
                >
                  ✕
                </button>
              )}
            </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportToCSV(
              reviews.map(r => ({
                product_id: r.product_id,
                title: r.title,
                rating: r.rating,
                content: r.content,
                verified: r.verified_purchase ? 'Yes' : 'No',
                helpful: r.helpful_count || 0,
                date: format(new Date(r.created_at), 'yyyy-MM-dd'),
              })),
              [
                { key: 'product_id', label: 'Product ID' },
                { key: 'title', label: 'Title' },
                { key: 'rating', label: 'Rating' },
                { key: 'content', label: 'Content' },
                { key: 'verified', label: 'Verified' },
                { key: 'helpful', label: 'Helpful' },
                { key: 'date', label: 'Date' },
              ],
              'reviews'
            )}
          >
            <Download className="h-4 w-4 mr-1" />
            CSV
          </Button>
          </div>
        </div>
      </CardHeader>

      {/* Bulk Actions Bar */}
      {selectedReviews.size > 0 && (
        <div className="mx-4 mb-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
          <span className="text-sm font-medium text-foreground">
            {selectedReviews.size} {t('admin.selected' as any) || 'selected'}
          </span>
          <div className="flex items-center gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="text-xs gap-1" disabled={bulkDeleting}>
                  {bulkDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                  {t('admin.deleteSelected' as any) || 'Delete selected'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('admin.deleteReview' as any)}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('admin.bulkDeleteConfirm' as any) || `Are you sure you want to delete ${selectedReviews.size} reviews? This cannot be undone.`}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('admin.cancel' as any)}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    {t('admin.delete' as any)}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => setSelectedReviews(new Set())}>
              {t('admin.cancel' as any) || 'Cancel'}
            </Button>
          </div>
        </div>
      )}

      <CardContent>
        {/* Select All */}
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-border">
          <Checkbox
            checked={selectedReviews.size === reviews.length && reviews.length > 0}
            onCheckedChange={toggleSelectAll}
            className="h-4 w-4"
          />
          <span className="text-xs text-muted-foreground">
            {t('admin.selectAll' as any) || 'Select all'}
          </span>
        </div>

        <div className="space-y-4">
          {reviews.map((review) => {
            const isSelected = selectedReviews.has(review.id);
            return (
              <div key={review.id} className={cn("border rounded-lg p-4 transition-colors", isSelected && "border-accent/50 bg-accent/5")}>
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleSelect(review.id)}
                    className="h-4 w-4 mt-1 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={cn("h-4 w-4", i < review.rating ? "fill-rating text-rating" : "fill-muted text-muted")} />
                            ))}
                          </div>
                          {review.verified_purchase && <Badge variant="secondary" className="text-xs">{t('admin.verified' as any)}</Badge>}
                        </div>
                        <h4 className="font-semibold text-foreground">{review.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{review.content}</p>
                        {review.images && review.images.length > 0 && (
                          <div className="flex gap-2 mt-3">
                            {review.images.map((img, i) => (
                              <div key={i} className="w-16 h-16 rounded-lg bg-secondary overflow-hidden">
                                <img src={img} alt="Review" className="w-full h-full object-cover" />
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-2 md:gap-4 mt-3 text-[10px] md:text-xs text-muted-foreground flex-wrap">
                          <span className="truncate max-w-[120px] md:max-w-none">{t('admin.productId' as any)}: {review.product_id}</span>
                          <span>{format(new Date(review.created_at), 'MMM d, yyyy')}</span>
                          <span>{review.helpful_count || 0} {t('admin.helpfulVotes' as any)}</span>
                        </div>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0" disabled={deleting === review.id}>
                            {deleting === review.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t('admin.deleteReview' as any)}</AlertDialogTitle>
                            <AlertDialogDescription>{t('admin.deleteReviewConfirm' as any)}</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t('admin.cancel' as any)}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(review.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              {t('admin.delete' as any)}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
