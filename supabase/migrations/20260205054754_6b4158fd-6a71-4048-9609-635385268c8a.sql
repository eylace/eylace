-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table for RBAC (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create categories table
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    icon TEXT,
    image TEXT,
    parent_id UUID REFERENCES public.categories(id),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sellers table
CREATE TABLE public.sellers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    logo TEXT,
    rating NUMERIC(3,2) DEFAULT 0,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create products table
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    price NUMERIC(10,2) NOT NULL,
    original_price NUMERIC(10,2),
    discount INTEGER DEFAULT 0,
    images TEXT[] DEFAULT ARRAY[]::TEXT[],
    category_id UUID REFERENCES public.categories(id),
    seller_id UUID REFERENCES public.sellers(id),
    rating NUMERIC(3,2) DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    stock INTEGER DEFAULT 0,
    variations JSONB DEFAULT '[]'::JSONB,
    attributes JSONB DEFAULT '[]'::JSONB,
    is_flash_sale BOOLEAN DEFAULT false,
    flash_sale_ends TIMESTAMP WITH TIME ZONE,
    is_prime BOOLEAN DEFAULT false,
    is_free_shipping BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- RLS policies for categories (public read, admin write)
CREATE POLICY "Anyone can view categories"
ON public.categories FOR SELECT
USING (true);

CREATE POLICY "Admins can manage categories"
ON public.categories FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- RLS policies for sellers
CREATE POLICY "Anyone can view sellers"
ON public.sellers FOR SELECT
USING (true);

CREATE POLICY "Sellers can update their own profile"
ON public.sellers FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage sellers"
ON public.sellers FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- RLS policies for products (public read, seller/admin write)
CREATE POLICY "Anyone can view active products"
ON public.products FOR SELECT
USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all products"
ON public.products FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create storage bucket for review images
INSERT INTO storage.buckets (id, name, public)
VALUES ('review-images', 'review-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for review images
CREATE POLICY "Anyone can view review images"
ON storage.objects FOR SELECT
USING (bucket_id = 'review-images');

CREATE POLICY "Authenticated users can upload review images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'review-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their own review images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'review-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create triggers for updated_at
CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_sellers_updated_at
BEFORE UPDATE ON public.sellers
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Insert initial categories
INSERT INTO public.categories (name, slug, icon, sort_order) VALUES
('Fashion & Apparel', 'fashion', '👗', 1),
('Electronics', 'electronics', '📱', 2),
('Shoes', 'shoes', '👟', 3),
('Gadgets', 'gadgets', '🎧', 4),
('Beauty & Personal Care', 'beauty', '💄', 5),
('Lifestyle', 'lifestyle', '🏠', 6),
('Sports & Outdoors', 'sports', '⚽', 7),
('Books & Stationery', 'books', '📚', 8);

-- Insert a default seller
INSERT INTO public.sellers (name, slug, rating, is_verified) VALUES
('ShopHub Official', 'shophub-official', 4.9, true);

-- Insert sample products
INSERT INTO public.products (name, slug, description, price, original_price, discount, images, category_id, seller_id, rating, review_count, stock, is_prime, is_free_shipping, variations)
SELECT 
  'Wireless Noise Cancelling Headphones Pro',
  'wireless-headphones-pro',
  'Premium wireless headphones with active noise cancellation. Features 40mm custom drivers, up to 30 hours battery life, and quick charge capability.',
  299.99,
  399.99,
  25,
  ARRAY['/placeholder.svg'],
  c.id,
  s.id,
  4.7,
  2345,
  50,
  true,
  true,
  '[{"id": "color", "name": "Color", "type": "color", "options": [{"id": "c1", "value": "Black", "stock": 20}, {"id": "c2", "value": "White", "stock": 15}, {"id": "c3", "value": "Navy", "stock": 15}]}]'::JSONB
FROM public.categories c, public.sellers s
WHERE c.slug = 'electronics' AND s.slug = 'shophub-official';

INSERT INTO public.products (name, slug, description, price, original_price, discount, images, category_id, seller_id, rating, review_count, stock, is_prime, is_free_shipping, is_flash_sale, flash_sale_ends)
SELECT 
  'Smart Watch Series X - Health & Fitness Tracker',
  'smart-watch-series-x',
  'Advanced smartwatch with health monitoring, GPS, and 7-day battery life.',
  449.00,
  549.00,
  18,
  ARRAY['/placeholder.svg'],
  c.id,
  s.id,
  4.9,
  5678,
  30,
  true,
  true,
  true,
  now() + interval '5 hours'
FROM public.categories c, public.sellers s
WHERE c.slug = 'gadgets' AND s.slug = 'shophub-official';

INSERT INTO public.products (name, slug, description, price, original_price, discount, images, category_id, seller_id, rating, review_count, stock, is_free_shipping, variations)
SELECT 
  'Premium Leather Sneakers - Handcrafted',
  'premium-leather-sneakers',
  'Handcrafted leather sneakers for everyday comfort and style.',
  189.99,
  249.99,
  24,
  ARRAY['/placeholder.svg'],
  c.id,
  s.id,
  4.6,
  892,
  75,
  true,
  '[{"id": "size", "name": "Size", "type": "size", "options": [{"id": "s1", "value": "40", "stock": 15}, {"id": "s2", "value": "41", "stock": 20}, {"id": "s3", "value": "42", "stock": 20}, {"id": "s4", "value": "43", "stock": 20}]}]'::JSONB
FROM public.categories c, public.sellers s
WHERE c.slug = 'shoes' AND s.slug = 'shophub-official';

INSERT INTO public.products (name, slug, description, price, original_price, discount, images, category_id, seller_id, rating, review_count, stock, is_prime)
SELECT 
  'Organic Skincare Set - Complete Collection',
  'organic-skincare-set',
  'Complete organic skincare routine set with cleanser, toner, serum, and moisturizer.',
  129.00,
  189.00,
  32,
  ARRAY['/placeholder.svg'],
  c.id,
  s.id,
  4.8,
  1234,
  100,
  true
FROM public.categories c, public.sellers s
WHERE c.slug = 'beauty' AND s.slug = 'shophub-official';

INSERT INTO public.products (name, slug, description, price, original_price, discount, images, category_id, seller_id, rating, review_count, stock, is_prime, is_free_shipping)
SELECT 
  'Ultra-Thin Laptop Pro 15" - Latest Gen',
  'ultra-thin-laptop-pro',
  'Powerful ultra-thin laptop for professionals with M3 chip, 16GB RAM, and 512GB SSD.',
  1299.00,
  1499.00,
  13,
  ARRAY['/placeholder.svg'],
  c.id,
  s.id,
  4.9,
  3456,
  25,
  true,
  true
FROM public.categories c, public.sellers s
WHERE c.slug = 'electronics' AND s.slug = 'shophub-official';

INSERT INTO public.products (name, slug, description, price, original_price, discount, images, category_id, seller_id, rating, review_count, stock, variations)
SELECT 
  'Designer Summer Dress - Floral Collection',
  'designer-summer-dress',
  'Elegant designer dress for summer occasions with beautiful floral patterns.',
  89.99,
  129.99,
  31,
  ARRAY['/placeholder.svg'],
  c.id,
  s.id,
  4.5,
  567,
  150,
  '[{"id": "size", "name": "Size", "type": "size", "options": [{"id": "sz1", "value": "XS", "stock": 30}, {"id": "sz2", "value": "S", "stock": 40}, {"id": "sz3", "value": "M", "stock": 40}, {"id": "sz4", "value": "L", "stock": 40}]}]'::JSONB
FROM public.categories c, public.sellers s
WHERE c.slug = 'fashion' AND s.slug = 'shophub-official';

INSERT INTO public.products (name, slug, description, price, images, category_id, seller_id, rating, review_count, stock, is_prime, is_free_shipping)
SELECT 
  'Professional DSLR Camera Kit',
  'professional-dslr-camera',
  'Full-frame DSLR camera with lens kit, perfect for professional photography.',
  2499.00,
  ARRAY['/placeholder.svg'],
  c.id,
  s.id,
  4.9,
  789,
  0,
  true,
  true
FROM public.categories c, public.sellers s
WHERE c.slug = 'electronics' AND s.slug = 'shophub-official';

INSERT INTO public.products (name, slug, description, price, original_price, discount, images, category_id, seller_id, rating, review_count, stock)
SELECT 
  'Yoga Mat Premium - Eco-Friendly',
  'yoga-mat-premium',
  'Non-slip eco-friendly yoga mat with alignment lines.',
  49.99,
  69.99,
  29,
  ARRAY['/placeholder.svg'],
  c.id,
  s.id,
  4.7,
  2100,
  200
FROM public.categories c, public.sellers s
WHERE c.slug = 'sports' AND s.slug = 'shophub-official';