import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';

// --- Mock supabase client ---
const authListeners: Array<(event: string, session: any) => void> = [];
let currentSession: any = { user: { id: 'user-1' } };
const roleQuery = vi.fn(async () => ({
  data: [{ role: 'admin' }],
  error: null,
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      onAuthStateChange: (cb: any) => {
        authListeners.push(cb);
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
      getSession: async () => ({ data: { session: currentSession } }),
      signUp: async () => ({ error: null }),
      signInWithPassword: async () => ({ error: null }),
      signOut: async () => {},
    },
    from: (_table: string) => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: null }),
          in: () => ({ limit: () => roleQuery() }),
        }),
      }),
      update: () => ({ eq: async () => ({ error: null }) }),
    }),
  },
}));

import { AuthProvider } from '@/contexts/AuthContext';
import { useAdminCheck } from '@/hooks/useAdminData';

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(AuthProvider, null, children);

describe('useAdminCheck — tab switch / TOKEN_REFRESHED behavior', () => {
  beforeEach(() => {
    authListeners.length = 0;
    currentSession = { user: { id: 'user-1' } };
    roleQuery.mockClear();
  });

  it('resolves admin check once and does not re-spinner on TOKEN_REFRESHED', async () => {
    const { result } = renderHook(() => useAdminCheck(), { wrapper });

    await waitFor(() => expect(result.current.isAdmin).toBe(true));
    expect(result.current.isLoading).toBe(false);
    expect(roleQuery).toHaveBeenCalledTimes(1);

    // Simulate Supabase emitting TOKEN_REFRESHED (e.g. tab focus). Same uid.
    await act(async () => {
      authListeners.forEach((cb) =>
        cb('TOKEN_REFRESHED', { user: { id: 'user-1' } }),
      );
    });

    // No spinner flip, no extra role lookup.
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isAdmin).toBe(true);
    expect(roleQuery).toHaveBeenCalledTimes(1);
  });

  it('re-runs admin check when the user identity actually changes', async () => {
    const { result } = renderHook(() => useAdminCheck(), { wrapper });
    await waitFor(() => expect(result.current.isAdmin).toBe(true));
    expect(roleQuery).toHaveBeenCalledTimes(1);

    await act(async () => {
      authListeners.forEach((cb) =>
        cb('SIGNED_IN', { user: { id: 'user-2' } }),
      );
    });

    await waitFor(() => expect(roleQuery).toHaveBeenCalledTimes(2));
  });
});