import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, render, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';

// ---- Mocks ----

// In-memory "saved_cart" table keyed by user_id
const dbRows = new Map<string, { user_id: string; items: any }>();

vi.mock('@/integrations/supabase/client', () => {
  const builder = (table: string) => {
    let mode: 'select' | 'upsert' | 'delete' | null = null;
    let pendingUpsert: any = null;
    let filterUserId: string | null = null;
    const api: any = {
      select() { mode = 'select'; return api; },
      eq(_col: string, val: string) { filterUserId = val; return api; },
      single: async () => {
        const row = dbRows.get(filterUserId!) ?? null;
        if (!row) return { data: null, error: { code: 'PGRST116' } };
        return { data: { items: row.items }, error: null };
      },
      upsert(payload: any) {
        mode = 'upsert';
        pendingUpsert = payload;
        const promise = Promise.resolve({ error: null });
        // Apply write immediately
        dbRows.set(payload.user_id, { user_id: payload.user_id, items: payload.items });
        return promise;
      },
      delete() { mode = 'delete'; return api; },
      then: undefined,
    };
    // Make .delete().eq() awaitable
    const origEq = api.eq;
    api.eq = (col: string, val: string) => {
      origEq(col, val);
      if (mode === 'delete') {
        dbRows.delete(val);
        return Promise.resolve({ error: null });
      }
      return api;
    };
    void table;
    return api;
  };
  return {
    supabase: { from: (table: string) => builder(table) },
  };
});

// Mock AuthContext so we can flip between guest and signed-in
let currentUser: { id: string } | null = null;
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: currentUser }),
}));

import { CartProvider, useCart } from '../CartContext';
import type { Product } from '@/types';

const wrapper = ({ children }: { children: ReactNode }) => (
  <CartProvider>{children}</CartProvider>
);

const makeProduct = (id: string, price = 100): Product => ({
  id,
  name: `P-${id}`,
  slug: id,
  description: '',
  price,
  images: [],
  category: { id: 'c', name: 'c', slug: 'c' } as any,
  seller: { id: 's', name: 's', slug: 's' } as any,
  rating: 0,
  reviewCount: 0,
  stock: 100,
  variations: [],
  isFreeShipping: false,
  isPrime: false,
}) as any;

beforeEach(() => {
  dbRows.clear();
  localStorage.clear();
  currentUser = null;
  vi.useRealTimers();
});

describe('CartContext consistency', () => {
  it('persists items to localStorage for guests (survives reload)', () => {
    const { result, unmount } = renderHook(() => useCart(), { wrapper });
    act(() => { result.current.addItem(makeProduct('a'), 2); });
    expect(result.current.items).toHaveLength(1);
    expect(localStorage.getItem('grand-mall-cart')).toContain('"a"');
    unmount();

    // Simulate reload — fresh hook, same localStorage
    const { result: r2 } = renderHook(() => useCart(), { wrapper });
    expect(r2.current.items).toHaveLength(1);
    expect(r2.current.items[0].quantity).toBe(2);
  });

  it('merges local guest cart with DB cart on sign-in without losing items', async () => {
    // Pre-seed DB with one item for the user about to log in
    dbRows.set('user-1', {
      user_id: 'user-1',
      items: [{ product: makeProduct('db-item'), quantity: 1, selectedVariations: undefined }],
    });

    // Guest adds a different item
    const { result, rerender } = renderHook(() => useCart(), { wrapper });
    act(() => { result.current.addItem(makeProduct('local-item'), 3); });
    expect(result.current.items).toHaveLength(1);

    // Sign in — provider should merge
    currentUser = { id: 'user-1' };
    rerender();

    await waitFor(() => {
      expect(result.current.items).toHaveLength(2);
    });
    const ids = result.current.items.map(i => i.product.id).sort();
    expect(ids).toEqual(['db-item', 'local-item']);
  });

  it('does not overwrite DB cart with empty local cart on initial mount', async () => {
    dbRows.set('user-2', {
      user_id: 'user-2',
      items: [{ product: makeProduct('keep-me'), quantity: 5, selectedVariations: undefined }],
    });
    currentUser = { id: 'user-2' };

    const { result } = renderHook(() => useCart(), { wrapper });
    await waitFor(() => expect(result.current.items.length).toBe(1));
    expect(result.current.items[0].product.id).toBe('keep-me');
    expect(result.current.items[0].quantity).toBe(5);
    // DB row was not nuked
    expect(dbRows.get('user-2')?.items).toBeTruthy();
  });

  it('clearCart wipes both local state and DB row', async () => {
    currentUser = { id: 'user-3' };
    dbRows.set('user-3', { user_id: 'user-3', items: [] });
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => { result.current.addItem(makeProduct('x'), 1); });
    await act(async () => { await result.current.clearCart(); });
    expect(result.current.items).toHaveLength(0);
    expect(dbRows.has('user-3')).toBe(false);
  });

  it('updateQuantity to 0 removes item and keeps state consistent', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => { result.current.addItem(makeProduct('a'), 2); });
    act(() => { result.current.updateQuantity('a', 0); });
    expect(result.current.items).toHaveLength(0);
  });
});