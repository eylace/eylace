-- Create wishlist table
CREATE TABLE public.wishlist (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    product_id TEXT NOT NULL,
    product_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, product_id)
);

-- Enable RLS for wishlist
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

-- RLS policies for wishlist
CREATE POLICY "Users can view their own wishlist"
ON public.wishlist FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their own wishlist"
ON public.wishlist FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from their own wishlist"
ON public.wishlist FOR DELETE
USING (auth.uid() = user_id);

-- Create product reviews table
CREATE TABLE public.product_reviews (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    product_id TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    images TEXT[] DEFAULT ARRAY[]::TEXT[],
    verified_purchase BOOLEAN DEFAULT false,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, product_id)
);

-- Enable RLS for product_reviews
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- RLS policies for product_reviews
CREATE POLICY "Anyone can view reviews"
ON public.product_reviews FOR SELECT
USING (true);

CREATE POLICY "Users can create their own reviews"
ON public.product_reviews FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
ON public.product_reviews FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
ON public.product_reviews FOR DELETE
USING (auth.uid() = user_id);

-- Create review_votes table to track helpful votes
CREATE TABLE public.review_votes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    review_id UUID NOT NULL REFERENCES public.product_reviews(id) ON DELETE CASCADE,
    is_helpful BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, review_id)
);

-- Enable RLS for review_votes
ALTER TABLE public.review_votes ENABLE ROW LEVEL SECURITY;

-- RLS policies for review_votes
CREATE POLICY "Users can view votes"
ON public.review_votes FOR SELECT
USING (true);

CREATE POLICY "Users can vote on reviews"
ON public.review_votes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can change their votes"
ON public.review_votes FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can remove their votes"
ON public.review_votes FOR DELETE
USING (auth.uid() = user_id);

-- Add order tracking fields to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS tracking_number TEXT,
ADD COLUMN IF NOT EXISTS carrier TEXT,
ADD COLUMN IF NOT EXISTS estimated_delivery TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE;

-- Create order_tracking_events table for detailed tracking history
CREATE TABLE public.order_tracking_events (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    location TEXT,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for order_tracking_events
ALTER TABLE public.order_tracking_events ENABLE ROW LEVEL SECURITY;

-- Create function to check order ownership for tracking events
CREATE OR REPLACE FUNCTION public.is_owner_of_order_tracking(tracking_order_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.orders
    WHERE id = tracking_order_id AND user_id = auth.uid()
  )
$$;

-- RLS policy for order_tracking_events
CREATE POLICY "Users can view their own order tracking events"
ON public.order_tracking_events FOR SELECT
USING (is_owner_of_order_tracking(order_id));

-- Trigger to update updated_at on product_reviews
CREATE TRIGGER update_product_reviews_updated_at
BEFORE UPDATE ON public.product_reviews
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();