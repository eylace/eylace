 import { useState } from 'react';
 import { 
   MessageSquare, 
   Star, 
   Trash2,
   Loader2,
   Image
 } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import {
   Card,
   CardContent,
   CardHeader,
   CardTitle,
 } from '@/components/ui/card';
 import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
   AlertDialogTrigger,
 } from '@/components/ui/alert-dialog';
 import { useAdminReviews } from '@/hooks/useAdminData';
 import { format } from 'date-fns';
 import { toast } from 'sonner';
 import { cn } from '@/lib/utils';
 
 export const AdminReviewsTab = () => {
   const { reviews, isLoading, deleteReview } = useAdminReviews();
   const [deleting, setDeleting] = useState<string | null>(null);
 
   const handleDelete = async (reviewId: string) => {
     setDeleting(reviewId);
     const { error } = await deleteReview(reviewId);
     
     if (error) {
       toast.error('Failed to delete review');
     } else {
       toast.success('Review deleted successfully');
     }
     setDeleting(null);
   };
 
   if (isLoading) {
     return (
       <div className="flex items-center justify-center py-12">
         <Loader2 className="h-8 w-8 animate-spin text-accent" />
       </div>
     );
   }
 
   if (reviews.length === 0) {
     return (
       <Card>
         <CardContent className="py-12 text-center">
           <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
           <p className="text-muted-foreground">No reviews found</p>
         </CardContent>
       </Card>
     );
   }
 
   return (
     <Card>
       <CardHeader>
         <CardTitle className="flex items-center gap-2">
           <MessageSquare className="h-5 w-5" />
           All Reviews ({reviews.length})
         </CardTitle>
       </CardHeader>
       <CardContent>
         <div className="space-y-4">
           {reviews.map((review) => (
             <div key={review.id} className="border rounded-lg p-4">
               <div className="flex items-start justify-between gap-4">
                 <div className="flex-1">
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
                     {review.verified_purchase && (
                       <Badge variant="secondary" className="text-xs">Verified</Badge>
                     )}
                   </div>
                   
                   <h4 className="font-semibold text-foreground">{review.title}</h4>
                   <p className="text-sm text-muted-foreground mt-1">{review.content}</p>
                   
                   {review.images && review.images.length > 0 && (
                     <div className="flex gap-2 mt-3">
                       {review.images.map((img, i) => (
                         <div 
                           key={i}
                           className="w-16 h-16 rounded-lg bg-secondary overflow-hidden"
                         >
                           <img src={img} alt="Review" className="w-full h-full object-cover" />
                         </div>
                       ))}
                     </div>
                   )}
                   
                   <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                     <span>Product ID: {review.product_id}</span>
                     <span>{format(new Date(review.created_at), 'MMM d, yyyy')}</span>
                     <span>{review.helpful_count || 0} helpful votes</span>
                   </div>
                 </div>
 
                 <AlertDialog>
                   <AlertDialogTrigger asChild>
                     <Button 
                       variant="ghost" 
                       size="icon"
                       className="text-destructive hover:text-destructive hover:bg-destructive/10"
                       disabled={deleting === review.id}
                     >
                       {deleting === review.id ? (
                         <Loader2 className="h-4 w-4 animate-spin" />
                       ) : (
                         <Trash2 className="h-4 w-4" />
                       )}
                     </Button>
                   </AlertDialogTrigger>
                   <AlertDialogContent>
                     <AlertDialogHeader>
                       <AlertDialogTitle>Delete Review</AlertDialogTitle>
                       <AlertDialogDescription>
                         Are you sure you want to delete this review? This action cannot be undone.
                       </AlertDialogDescription>
                     </AlertDialogHeader>
                     <AlertDialogFooter>
                       <AlertDialogCancel>Cancel</AlertDialogCancel>
                       <AlertDialogAction 
                         onClick={() => handleDelete(review.id)}
                         className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                       >
                         Delete
                       </AlertDialogAction>
                     </AlertDialogFooter>
                   </AlertDialogContent>
                 </AlertDialog>
               </div>
             </div>
           ))}
         </div>
       </CardContent>
     </Card>
   );
 };