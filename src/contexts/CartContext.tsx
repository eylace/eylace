import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { Product, CartItem } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number, selectedVariations?: Record<string, string>) => void;
  removeItem: (productId: string, selectedVariations?: Record<string, string>) => void;
  updateQuantity: (productId: string, quantity: number, selectedVariations?: Record<string, string>) => void;
  clearCart: () => void;
  getItemCount: () => number;
  getSubtotal: () => number;
  getShipping: () => number;
  getTax: () => number;
  getTotal: () => number;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'grand-mall-cart';

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          return [];
        }
      }
    }
    return [];
  });
  const [isLoading, setIsLoading] = useState(false);

  // Sync cart to database for authenticated users
  const syncCartToDatabase = useCallback(async (cartItems: CartItem[]) => {
    if (!user) return;
    
    try {
      // Convert CartItem[] to JSON-safe format for storage
      const itemsJson = cartItems.map(item => ({
        product: {
          id: item.product.id,
          name: item.product.name,
          slug: item.product.slug,
          description: item.product.description,
          price: item.product.price,
          originalPrice: item.product.originalPrice,
          discount: item.product.discount,
          images: item.product.images,
          category: item.product.category,
          seller: item.product.seller,
          rating: item.product.rating,
          reviewCount: item.product.reviewCount,
          stock: item.product.stock,
          variations: item.product.variations,
          isFreeShipping: item.product.isFreeShipping,
          isPrime: item.product.isPrime,
        },
        quantity: item.quantity,
        selectedVariations: item.selectedVariations,
      }));

      // Use upsert to handle both insert and update
      const { error } = await supabase
        .from('saved_cart')
        .upsert({
          user_id: user.id,
          items: itemsJson as unknown as import('@/integrations/supabase/types').Json,
        }, {
          onConflict: 'user_id',
        });

      if (error) {
        console.error('Error syncing cart:', error);
      }
    } catch (err) {
      console.error('Error syncing cart to database:', err);
    }
  }, [user]);

  // Load cart from database when user logs in
  useEffect(() => {
    const loadCartFromDatabase = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('saved_cart')
          .select('items')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          // PGRST116 means no rows found, which is fine
          console.error('Error loading cart:', error);
          return;
        }

        if (data?.items && Array.isArray(data.items)) {
          const localCart = items;
          // Cast through unknown to handle JSON type
          const dbCart = data.items as unknown as CartItem[];
          
          // Merge local and database carts (prefer database, add new local items)
          const mergedCart = [...dbCart];
          
          localCart.forEach(localItem => {
            const existsInDb = dbCart.some(
              (dbItem) => 
                dbItem.product?.id === localItem.product.id &&
                getVariationKey(dbItem.selectedVariations) === getVariationKey(localItem.selectedVariations)
            );
            
            if (!existsInDb) {
              mergedCart.push(localItem);
            }
          });

          setItems(mergedCart);
          
          // If there were local items merged, sync to database
          if (mergedCart.length > dbCart.length) {
            await syncCartToDatabase(mergedCart);
          }
        } else if (items.length > 0) {
          // No cart in database but we have local items - sync them
          await syncCartToDatabase(items);
        }
      } catch (err) {
        console.error('Error loading cart from database:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadCartFromDatabase();
  }, [user]);

  // Persist cart to localStorage and database
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    
    // Debounce database sync
    const timeoutId = setTimeout(() => {
      if (user) {
        syncCartToDatabase(items);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [items, user, syncCartToDatabase]);

  const getVariationKey = (selectedVariations?: Record<string, string>) => {
    if (!selectedVariations) return '';
    return Object.entries(selectedVariations)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join('|');
  };

  const findItemIndex = (productId: string, selectedVariations?: Record<string, string>) => {
    const variationKey = getVariationKey(selectedVariations);
    return items.findIndex(
      (item) =>
        item.product.id === productId &&
        getVariationKey(item.selectedVariations) === variationKey
    );
  };

  const addItem = (product: Product, quantity = 1, selectedVariations?: Record<string, string>) => {
    setItems((prev) => {
      const existingIndex = findItemIndex(product.id, selectedVariations);
      
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
        };
        return updated;
      }

      return [...prev, { product, quantity, selectedVariations }];
    });
  };

  const removeItem = (productId: string, selectedVariations?: Record<string, string>) => {
    setItems((prev) => {
      const index = findItemIndex(productId, selectedVariations);
      if (index >= 0) {
        const updated = [...prev];
        updated.splice(index, 1);
        return updated;
      }
      return prev;
    });
  };

  const updateQuantity = (productId: string, quantity: number, selectedVariations?: Record<string, string>) => {
    if (quantity <= 0) {
      removeItem(productId, selectedVariations);
      return;
    }

    setItems((prev) => {
      const index = findItemIndex(productId, selectedVariations);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = { ...updated[index], quantity };
        return updated;
      }
      return prev;
    });
  };

  const clearCart = async () => {
    setItems([]);
    
    // Also clear from database if authenticated
    if (user) {
      try {
        await supabase
          .from('saved_cart')
          .delete()
          .eq('user_id', user.id);
      } catch (err) {
        console.error('Error clearing cart from database:', err);
      }
    }
  };

  const getItemCount = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const getSubtotal = () => {
    return items.reduce((total, item) => total + item.product.price * item.quantity, 0);
  };

  const getShipping = () => {
    const subtotal = getSubtotal();
    // Free shipping over $50
    if (subtotal >= 50 || items.some(item => item.product.isFreeShipping)) {
      return 0;
    }
    return 5.99;
  };

  const getTax = () => {
    // 8% tax rate
    return getSubtotal() * 0.08;
  };

  const getTotal = () => {
    return getSubtotal() + getShipping() + getTax();
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getItemCount,
        getSubtotal,
        getShipping,
        getTax,
        getTotal,
        isLoading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
