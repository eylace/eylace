import type { CartItem } from '@/types';

const BUY_NOW_CHECKOUT_STORAGE_KEY = 'grand-mall-buy-now-checkout';

const canUseStorage = () => typeof window !== 'undefined';

export const getBuyNowCheckoutItems = (): CartItem[] => {
  if (!canUseStorage()) return [];

  try {
    const stored = sessionStorage.getItem(BUY_NOW_CHECKOUT_STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const setBuyNowCheckoutItems = (items: CartItem[]) => {
  if (!canUseStorage()) return;
  sessionStorage.setItem(BUY_NOW_CHECKOUT_STORAGE_KEY, JSON.stringify(items));
};

export const setBuyNowCheckoutItem = (item: CartItem) => {
  setBuyNowCheckoutItems([item]);
};

export const clearBuyNowCheckout = () => {
  if (!canUseStorage()) return;
  sessionStorage.removeItem(BUY_NOW_CHECKOUT_STORAGE_KEY);
};