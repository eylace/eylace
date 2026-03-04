import { createContext, useContext, useState, ReactNode } from 'react';
import { Product } from '@/types';
import { toast } from 'sonner';

interface CompareContextType {
  items: Product[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  isInCompare: (productId: string) => boolean;
  clearAll: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

const MAX_COMPARE = 4;

export const CompareProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<Product[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const addItem = (product: Product) => {
    if (items.length >= MAX_COMPARE) {
      toast.error(`Maximum ${MAX_COMPARE} products can be compared`);
      return;
    }
    if (items.some(p => p.id === product.id)) {
      toast.info('Product already in comparison');
      return;
    }
    setItems(prev => [...prev, product]);
    toast.success('Added to compare!', { description: product.name });
  };

  const removeItem = (productId: string) => {
    setItems(prev => prev.filter(p => p.id !== productId));
  };

  const isInCompare = (productId: string) => items.some(p => p.id === productId);

  const clearAll = () => setItems([]);

  return (
    <CompareContext.Provider value={{ items, addItem, removeItem, isInCompare, clearAll, isOpen, setIsOpen }}>
      {children}
    </CompareContext.Provider>
  );
};

export const useCompare = () => {
  const context = useContext(CompareContext);
  if (!context) throw new Error('useCompare must be used within CompareProvider');
  return context;
};
