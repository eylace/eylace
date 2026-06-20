import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';

// In-memory store + realtime listener registry the mock will use.
let store: any = null;
const realtimeListeners: Array<(payload: any) => void> = [];

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (_table: string) => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: store ? { value: store } : null,
            error: null,
          }),
        }),
      }),
      upsert: async (row: any) => {
        store = row.value;
        // Simulate Postgres change broadcast.
        realtimeListeners.forEach((cb) => cb({ new: row }));
        return { error: null };
      },
      delete: () => ({
        eq: async () => {
          store = null;
          realtimeListeners.forEach((cb) => cb({ old: {} }));
          return { error: null };
        },
      }),
    }),
    channel: (_name: string) => {
      const api: any = {
        on: (_evt: string, _filter: any, cb: any) => {
          realtimeListeners.push(cb);
          return api;
        },
        subscribe: () => api,
      };
      return api;
    },
    removeChannel: () => {},
  },
}));

import {
  useSeoSettings,
  saveSeoSettings,
  defaultSeoSettings,
  invalidateSeoCache,
} from '@/hooks/useSeoSettings';
import SeoSettingsInjector from '@/components/seo/SeoSettingsInjector';
import { render } from '@testing-library/react';

const resetState = () => {
  store = null;
  realtimeListeners.length = 0;
  // Clear any tags the injector created.
  document.head.querySelectorAll('meta,link[data-seo-managed],script[id^="seo-jsonld"]').forEach((n) => n.remove());
};

describe('Global SEO end-to-end flow', () => {
  beforeEach(() => {
    resetState();
    invalidateSeoCache();
  });

  it('save → hook receives update → <head> reflects new tags without refresh', async () => {
    render(React.createElement(SeoSettingsInjector));
    const { result } = renderHook(() => useSeoSettings());

    // Initial load resolves to defaults.
    await waitFor(() => expect(result.current.titleTemplate).toBe(defaultSeoSettings.titleTemplate));

    // Admin edits + saves.
    await act(async () => {
      await saveSeoSettings({
        ...defaultSeoSettings,
        siteTitle: 'Eylace Marketplace',
        metaDescription: 'Multi-vendor shopping in Bangladesh.',
        metaKeywords: 'shopping, bd',
        ogTitle: 'Eylace OG',
        ogImage: 'https://eylace.lovable.app/og.jpg',
        googleSiteVerification: 'gsv-token-123',
        canonicalUrl: 'https://eylace.lovable.app/',
      });
    });

    // Hook propagates fresh values.
    await waitFor(() => expect(result.current.siteTitle).toBe('Eylace Marketplace'));
    expect(result.current.googleSiteVerification).toBe('gsv-token-123');

    // Frontend <head> reflects the change without a reload.
    await waitFor(() => {
      expect(document.querySelector('meta[name="description"]')?.getAttribute('content'))
        .toBe('Multi-vendor shopping in Bangladesh.');
    });
    expect(document.querySelector('meta[name="google-site-verification"]')?.getAttribute('content')).toBe('gsv-token-123');
    expect(document.querySelector('meta[property="og:image"]')?.getAttribute('content')).toBe('https://eylace.lovable.app/og.jpg');
    expect(document.querySelector('link[rel="canonical"][data-seo-managed="1"]')?.getAttribute('href'))
      .toBe('https://eylace.lovable.app/');
  });

  it('edit → re-save updates the same head tags in place', async () => {
    render(React.createElement(SeoSettingsInjector));
    renderHook(() => useSeoSettings());

    await act(async () => {
      await saveSeoSettings({ ...defaultSeoSettings, metaDescription: 'First version' });
    });
    await waitFor(() => {
      expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toBe('First version');
    });

    await act(async () => {
      await saveSeoSettings({ ...defaultSeoSettings, metaDescription: 'Second version' });
    });
    await waitFor(() => {
      expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toBe('Second version');
    });
    // Still only one description meta — no duplicates.
    expect(document.querySelectorAll('meta[name="description"]').length).toBe(1);
  });

  it('reset to defaults → optional tags are removed from <head>', async () => {
    render(React.createElement(SeoSettingsInjector));
    renderHook(() => useSeoSettings());

    await act(async () => {
      await saveSeoSettings({
        ...defaultSeoSettings,
        metaKeywords: 'temp, tags',
        googleSiteVerification: 'will-be-removed',
      });
    });
    await waitFor(() => {
      expect(document.querySelector('meta[name="keywords"]')?.getAttribute('content')).toBe('temp, tags');
    });

    // "Reset" == saving defaults (empty strings).
    await act(async () => {
      await saveSeoSettings(defaultSeoSettings);
    });

    await waitFor(() => {
      expect(document.querySelector('meta[name="keywords"]')).toBeNull();
    });
    // google-site-verification only re-renders when value is set, so old node should be gone too.
    expect(document.querySelector('meta[name="google-site-verification"]')?.getAttribute('content') || '')
      .toBe('');
  });

  it('JSON-LD: enabling injects script, disabling removes it', async () => {
    render(React.createElement(SeoSettingsInjector));
    renderHook(() => useSeoSettings());

    const ld = JSON.stringify({ '@context': 'https://schema.org', '@type': 'Organization', name: 'Eylace' });

    await act(async () => {
      await saveSeoSettings({ ...defaultSeoSettings, enableJsonLd: true, jsonLdOrganization: ld });
    });
    await waitFor(() => {
      expect(document.getElementById('seo-jsonld-organization')?.textContent).toBe(ld);
    });

    await act(async () => {
      await saveSeoSettings({ ...defaultSeoSettings, enableJsonLd: false, jsonLdOrganization: ld });
    });
    await waitFor(() => {
      expect(document.getElementById('seo-jsonld-organization')).toBeNull();
    });
  });
});