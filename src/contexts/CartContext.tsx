import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Product, CartItem } from '@/types';

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
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'grand-mall-cart';

export const CartProvider = ({ children }: { children: ReactNode }) => {
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

  // Persist cart to localStorage
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

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

  const clearCart = () => {
    setItems([]);
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
