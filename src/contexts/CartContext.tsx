import { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef, useMemo } from 'react';
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
  // Track the last payload we synced to the database so we can skip no-op
  // upserts. This prevents the saved_cart upsert from being the hottest
  // query in the database (it was being called on every render/mount).
  const lastSyncedRef = useRef<string | null>(null);
  const hasLoadedFromDbRef = useRef(false);

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

      const serialized = JSON.stringify(itemsJson);
      if (lastSyncedRef.current === serialized) {
        return; // no change since last sync
      }

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
      } else {
        lastSyncedRef.current = serialized;
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
          // Record what's already in the DB so we don't immediately re-upsert it.
          lastSyncedRef.current = JSON.stringify(dbCart.map(item => ({
            product: item.product,
            quantity: item.quantity,
            selectedVariations: item.selectedVariations,
          })));
          
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
        hasLoadedFromDbRef.current = true;
      }
    };

    loadCartFromDatabase();
  }, [user]);

  // Persist cart to localStorage and database
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    
    // Debounce database sync. Wait until the initial DB load has completed
    // for the signed-in user so we don't race the loader and upsert an
    // empty/local cart over the persisted one.
    if (!user) return;
    const timeoutId = setTimeout(() => {
      if (!hasLoadedFromDbRef.current) return;
      syncCartToDatabase(items);
    }, 1500);

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

  const addItem = useCallback((product: Product, quantity = 1, selectedVariations?: Record<string, string>) => {
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
  }, [items]);

  const removeItem = useCallback((productId: string, selectedVariations?: Record<string, string>) => {
    setItems((prev) => {
      const index = findItemIndex(productId, selectedVariations);
      if (index >= 0) {
        const updated = [...prev];
        updated.splice(index, 1);
        return updated;
      }
      return prev;
    });
  }, [items]);

  const updateQuantity = useCallback((productId: string, quantity: number, selectedVariations?: Record<string, string>) => {
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
  }, [items, removeItem]);

  const clearCart = useCallback(async () => {
    setItems([]);
    lastSyncedRef.current = JSON.stringify([]);
    
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
  }, [user]);

  // Memoize derived totals so consumers that only read totals don't recompute
  // on unrelated context changes.
  const subtotal = useMemo(
    () => items.reduce((total, item) => total + item.product.price * item.quantity, 0),
    [items]
  );
  const itemCount = useMemo(
    () => items.reduce((total, item) => total + item.quantity, 0),
    [items]
  );
  const shipping = useMemo(() => {
    if (subtotal >= 50 || items.some(item => item.product.isFreeShipping)) return 0;
    return 5.99;
  }, [subtotal, items]);
  const tax = useMemo(() => subtotal * 0.08, [subtotal]);
  const total = useMemo(() => subtotal + shipping + tax, [subtotal, shipping, tax]);

  const getItemCount = useCallback(() => itemCount, [itemCount]);
  const getSubtotal = useCallback(() => subtotal, [subtotal]);
  const getShipping = useCallback(() => shipping, [shipping]);
  const getTax = useCallback(() => tax, [tax]);
  const getTotal = useCallback(() => total, [total]);

  const value = useMemo(
    () => ({
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
    }),
    [items, addItem, removeItem, updateQuantity, clearCart,
     getItemCount, getSubtotal, getShipping, getTax, getTotal, isLoading]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
