import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SeoSettings {
  siteTitle: string;
  titleTemplate: string;
  metaDescription: string;
  metaKeywords: string;
  ogImage: string;
  ogTitle: string;
  ogDescription: string;
  twitterCard: 'summary' | 'summary_large_image';
  twitterHandle: string;
  googleAnalyticsId: string;
  facebookPixelId: string;
  googleSiteVerification: string;
  bingSiteVerification: string;
  robotsTxt: string;
  sitemapEnabled: boolean;
  canonicalUrl: string;
  jsonLdOrganization: string;
  enableOpenGraph: boolean;
  enableTwitterCards: boolean;
  enableJsonLd: boolean;
  indexable: boolean;
}

export const defaultSeoSettings: SeoSettings = {
  siteTitle: '',
  titleTemplate: '%s | Eylace',
  metaDescription: '',
  metaKeywords: '',
  ogImage: '',
  ogTitle: '',
  ogDescription: '',
  twitterCard: 'summary_large_image',
  twitterHandle: '',
  googleAnalyticsId: '',
  facebookPixelId: '',
  googleSiteVerification: '',
  bingSiteVerification: '',
  robotsTxt: 'User-agent: *\nAllow: /\nDisallow: /admin/',
  sitemapEnabled: true,
  canonicalUrl: '',
  jsonLdOrganization: '',
  enableOpenGraph: true,
  enableTwitterCards: true,
  enableJsonLd: true,
  indexable: true,
};

const SETTINGS_KEY = 'seo_settings_v1';

let cache: SeoSettings | null = null;
let listeners: Array<(s: SeoSettings) => void> = [];
let loaded = false;
let loading = false;

const notify = (s: SeoSettings) => {
  cache = s;
  listeners.forEach((fn) => fn(s));
};

const fetchSettings = async () => {
  loading = true;
  try {
    const { data } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', SETTINGS_KEY)
      .maybeSingle();
    if (data?.value && typeof data.value === 'object') {
      notify({ ...defaultSeoSettings, ...(data.value as any) });
    } else {
      notify(defaultSeoSettings);
    }
    loaded = true;
  } finally {
    loading = false;
  }
};

export const invalidateSeoCache = () => {
  loaded = false;
  loading = false;
  cache = null;
  fetchSettings();
  try {
    window.dispatchEvent(new Event('seo-settings-updated'));
    localStorage.setItem('seo-settings-updated', String(Date.now()));
  } catch { /* noop */ }
};

export async function saveSeoSettings(settings: SeoSettings) {
  const { error } = await supabase
    .from('system_settings')
    .upsert({ key: SETTINGS_KEY, value: settings as any }, { onConflict: 'key' });
  if (error) throw error;
  invalidateSeoCache();
}

export function useSeoSettings(): SeoSettings {
  const [settings, setSettings] = useState<SeoSettings>(cache || defaultSeoSettings);

  useEffect(() => {
    listeners.push(setSettings);
    if (cache) setSettings(cache);
    if (!loaded && !loading) fetchSettings();

    const channel = supabase
      .channel('seo-settings-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'system_settings', filter: `key=eq.${SETTINGS_KEY}` },
        () => fetchSettings()
      )
      .subscribe();

    const onLocal = () => fetchSettings();
    const onStorage = (e: StorageEvent) => { if (e.key === 'seo-settings-updated') fetchSettings(); };
    window.addEventListener('seo-settings-updated', onLocal);
    window.addEventListener('storage', onStorage);

    return () => {
      listeners = listeners.filter((fn) => fn !== setSettings);
      supabase.removeChannel(channel);
      window.removeEventListener('seo-settings-updated', onLocal);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return settings;
}