 import { useState, useRef } from 'react';
 import { Star, Loader2, X, ImagePlus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { z } from 'zod';
 
 const MAX_IMAGES = 5;
 const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const reviewSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(100, 'Title must be less than 100 characters'),
  content: z.string().trim().min(10, 'Review must be at least 10 characters').max(1000, 'Review must be less than 1000 characters'),
  rating: z.number().min(1, 'Please select a rating').max(5),
});

interface WriteReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productName: string;
  onReviewSubmitted?: () => void | Promise<void>;
}

export const WriteReviewModal = ({
  open,
  onOpenChange,
  productId,
  productName,
  onReviewSubmitted,
}: WriteReviewModalProps) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
   const [images, setImages] = useState<File[]>([]);
   const [imagePreviews, setImagePreviews] = useState<string[]>([]);
   const [uploadingImages, setUploadingImages] = useState(false);
   const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please sign in to write a review');
      return;
    }

    const validation = reviewSchema.safeParse({ title, content, rating });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setIsSubmitting(true);

    try {
       // Upload images first
       let imageUrls: string[] = [];
       if (images.length > 0) {
         setUploadingImages(true);
         for (const image of images) {
           const fileExt = image.name.split('.').pop();
           const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
           
           const { error: uploadError, data } = await supabase.storage
             .from('review-images')
             .upload(fileName, image);
           
           if (uploadError) {
             console.error('Error uploading image:', uploadError);
             continue;
           }
           
           const { data: urlData } = supabase.storage
             .from('review-images')
             .getPublicUrl(fileName);
           
           if (urlData) {
             imageUrls.push(urlData.publicUrl);
           }
         }
         setUploadingImages(false);
       }
 
      const { error } = await supabase
        .from('product_reviews')
        .insert({
          user_id: user.id,
          product_id: productId,
          rating,
          title: title.trim(),
          content: content.trim(),
           images: imageUrls,
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('You have already reviewed this product');
        } else {
          throw error;
        }
        return;
      }

      toast.success('Review submitted successfully!');
      setRating(0);
      setTitle('');
      setContent('');
       setImages([]);
       setImagePreviews([]);
      await onReviewSubmitted?.();
      onOpenChange(false);
    } catch (err) {
      console.error('Error submitting review:', err);
      toast.error('Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayRating = hoverRating || rating;
 
   const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
     const files = Array.from(e.target.files || []);
     const validFiles: File[] = [];
     const previews: string[] = [];
 
     for (const file of files) {
       if (images.length + validFiles.length >= MAX_IMAGES) {
         toast.error(`Maximum ${MAX_IMAGES} images allowed`);
         break;
       }
       if (file.size > MAX_FILE_SIZE) {
         toast.error(`${file.name} is too large. Max size is 5MB`);
         continue;
       }
       if (!file.type.startsWith('image/')) {
         toast.error(`${file.name} is not an image`);
         continue;
       }
       validFiles.push(file);
       previews.push(URL.createObjectURL(file));
     }
 
     setImages(prev => [...prev, ...validFiles]);
     setImagePreviews(prev => [...prev, ...previews]);
     
     // Reset input
     if (fileInputRef.current) {
       fileInputRef.current.value = '';
     }
   };
 
   const removeImage = (index: number) => {
     URL.revokeObjectURL(imagePreviews[index]);
     setImages(prev => prev.filter((_, i) => i !== index));
     setImagePreviews(prev => prev.filter((_, i) => i !== index));
   };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Write a Review</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Reviewing: <span className="font-medium text-foreground">{productName}</span>
          </p>

          {/* Star Rating */}
          <div className="space-y-2">
            <Label>Your Rating</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={cn(
                      'h-8 w-8 transition-colors',
                      star <= displayRating
                        ? 'fill-rating text-rating'
                        : 'fill-muted text-muted'
                    )}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm text-muted-foreground">
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </p>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="review-title">Review Title</Label>
            <Input
              id="review-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summarize your experience"
              maxLength={100}
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="review-content">Your Review</Label>
            <Textarea
              id="review-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What did you like or dislike about this product?"
              rows={4}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground text-right">
              {content.length}/1000
            </p>
          </div>
           
           {/* Image Upload */}
           <div className="space-y-2">
             <Label>Add Photos (Optional)</Label>
             <div className="flex flex-wrap gap-2">
               {imagePreviews.map((preview, index) => (
                 <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden group">
                   <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                   <button
                     type="button"
                     onClick={() => removeImage(index)}
                     className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                   >
                     <Trash2 className="h-5 w-5 text-white" />
                   </button>
                 </div>
               ))}
               {images.length < MAX_IMAGES && (
                 <button
                   type="button"
                   onClick={() => fileInputRef.current?.click()}
                   className="w-20 h-20 rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center gap-1 hover:border-accent transition-colors"
                 >
                   <ImagePlus className="h-5 w-5 text-muted-foreground" />
                   <span className="text-xs text-muted-foreground">Add</span>
                 </button>
               )}
             </div>
             <input
               ref={fileInputRef}
               type="file"
               accept="image/*"
               multiple
               onChange={handleImageSelect}
               className="hidden"
             />
             <p className="text-xs text-muted-foreground">Up to {MAX_IMAGES} images, max 5MB each</p>
           </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
             disabled={isSubmitting || uploadingImages || rating === 0}
            className="flex-1 gap-2"
          >
             {(isSubmitting || uploadingImages) && <Loader2 className="h-4 w-4 animate-spin" />}
             {uploadingImages ? 'Uploading Images...' : 'Submit Review'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
