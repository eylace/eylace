import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Product } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

interface WishlistContextType {
  items: Product[];
  addItem: (product: Product) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  isLoading: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load wishlist from database
  const loadWishlist = useCallback(async () => {
    if (!user) {
      setItems([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('wishlist')
        .select('product_id, product_data')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading wishlist:', error);
        return;
      }

      const products = (data || []).map((item) => item.product_data as unknown as Product);
      setItems(products);
    } catch (err) {
      console.error('Error loading wishlist:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  const addItem = async (product: Product) => {
    if (!user) {
      toast.error('Please sign in to add items to your wishlist');
      return;
    }

    try {
      const productData = {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        originalPrice: product.originalPrice ?? null,
        discount: product.discount ?? null,
        images: product.images,
        rating: product.rating,
        reviewCount: product.reviewCount,
        stock: product.stock,
        isFreeShipping: product.isFreeShipping ?? false,
        isPrime: product.isPrime ?? false,
        category: {
          id: product.category.id,
          name: product.category.name,
          slug: product.category.slug,
          icon: product.category.icon ?? null,
        },
      };

      const { error } = await supabase
        .from('wishlist')
        .insert([{
          user_id: user.id,
          product_id: product.id,
          product_data: JSON.parse(JSON.stringify(productData)),
        }]);

      if (error) {
        if (error.code === '23505') {
          toast.info('Already in wishlist');
          return;
        }
        throw error;
      }

      setItems((prev) => [product, ...prev]);
      toast.success('Added to wishlist');
    } catch (err) {
      console.error('Error adding to wishlist:', err);
      toast.error('Failed to add to wishlist');
    }
  };

  const removeItem = async (productId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (error) throw error;

      setItems((prev) => prev.filter((item) => item.id !== productId));
      toast.success('Removed from wishlist');
    } catch (err) {
      console.error('Error removing from wishlist:', err);
      toast.error('Failed to remove from wishlist');
    }
  };

  const isInWishlist = (productId: string) => {
    return items.some((item) => item.id === productId);
  };

  return (
    <WishlistContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        isInWishlist,
        isLoading,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
