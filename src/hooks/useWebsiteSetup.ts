import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface HeroBanner {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  ctaText: string;
  ctaLink: string;
  imageUrl: string;
  gradient: string;
  sortOrder: number;
}

export interface WebsiteSetup {
  selectedHomepage: string;
  homepageBannerEnabled: boolean;
  homepageFeaturedCategories: boolean;
  homepageFlashSale: boolean;
  homepageNewArrivals: boolean;
  homepageBestSellers: boolean;
  homepageDeals: boolean;
  homepagePromoBanners: boolean;
  homepageBrandsCarousel: boolean;
  homepageTestimonials: boolean;
  fontFamily: string;
  headingFont: string;
  fontSize: string;
  authLayout: string;
  authBgImage: string;
  authShowSocialLogin: boolean;
  authShowRememberMe: boolean;
  authRequireEmailVerification: boolean;
  authAllowGuestCheckout: boolean;
  selectedHeader: string;
  headerStickyEnabled: boolean;
  headerSearchEnabled: boolean;
  headerCartIconEnabled: boolean;
  headerWishlistIconEnabled: boolean;
  headerLanguageSwitcher: boolean;
  headerCurrencySwitcher: boolean;
  headerAnnouncementText: string;
  topBarEnabled: boolean;
  topBarText: string;
  topBarBgColor: string;
  topBarTextColor: string;
  topBarLinks: { label: string; url: string }[];
  footerStyle: string;
  footerAboutText: string;
  footerCopyright: string;
  footerShowSocialLinks: boolean;
  footerShowNewsletter: boolean;
  footerShowPaymentIcons: boolean;
  footerShowDownloadApp: boolean;
  footerShowFeaturesBar: boolean;
  footerAppStoreUrl: string;
  footerGooglePlayUrl: string;
  footerColumns: { title: string; links: { label: string; url: string }[] }[];
  footerSocialLinks: { platform: string; url: string }[];
  primaryColor: string;
  accentColor: string;
  borderRadius: string;
  darkModeDefault: boolean;
  customCss: string;
  logoUrl: string;
  faviconUrl: string;
  heroBanners: HeroBanner[];
}

const defaults: WebsiteSetup = {
  selectedHomepage: 'default',
  homepageBannerEnabled: true,
  homepageFeaturedCategories: true,
  homepageFlashSale: true,
  homepageNewArrivals: true,
  homepageBestSellers: true,
  homepageDeals: true,
  homepagePromoBanners: true,
  homepageBrandsCarousel: false,
  homepageTestimonials: false,
  fontFamily: 'Inter',
  headingFont: 'Inter',
  fontSize: '16',
  authLayout: 'split',
  authBgImage: '',
  authShowSocialLogin: true,
  authShowRememberMe: true,
  authRequireEmailVerification: true,
  authAllowGuestCheckout: true,
  selectedHeader: 'default',
  headerStickyEnabled: true,
  headerSearchEnabled: true,
  headerCartIconEnabled: true,
  headerWishlistIconEnabled: true,
  headerLanguageSwitcher: true,
  headerCurrencySwitcher: false,
  headerAnnouncementText: '',
  topBarEnabled: true,
  topBarText: 'Free shipping on orders over ৳5000!',
  topBarBgColor: '#1a1a2e',
  topBarTextColor: '#ffffff',
  topBarLinks: [],
  footerStyle: 'default',
  footerAboutText: 'Grand Mall Emporium is your one-stop shop for everything you need.',
  footerCopyright: '© 2025 Grand Mall Emporium. All rights reserved.',
  footerShowSocialLinks: true,
  footerShowNewsletter: true,
  footerShowPaymentIcons: true,
  footerColumns: [],
  footerSocialLinks: [],
  primaryColor: '#6366f1',
  accentColor: '#f59e0b',
  borderRadius: '8',
  darkModeDefault: false,
  customCss: '',
  logoUrl: '',
  faviconUrl: '',
  heroBanners: [],
};

let cachedSetup: WebsiteSetup | null = null;
let listeners: Array<(s: WebsiteSetup) => void> = [];

const notifyListeners = (s: WebsiteSetup) => {
  cachedSetup = s;
  listeners.forEach(fn => fn(s));
};

let loaded = false;
let loading = false;

const fetchSetup = async () => {
  loading = true;
  const { data } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'website_setup_v1')
    .maybeSingle();
  if (data?.value && typeof data.value === 'object') {
    notifyListeners({ ...defaults, ...(data.value as any) });
  } else {
    notifyListeners(defaults);
  }
  loaded = true;
  loading = false;
};

const loadSetup = () => {
  if (loaded || loading) return;
  fetchSetup();
};

/** Call this after saving website setup to force all components to re-read from DB */
export const invalidateSetupCache = () => {
  loaded = false;
  loading = false;
  cachedSetup = null;
  fetchSetup();
};

export function useWebsiteSetup(): WebsiteSetup {
  const [setup, setSetup] = useState<WebsiteSetup>(cachedSetup || defaults);

  useEffect(() => {
    listeners.push(setSetup);
    loadSetup();
    if (cachedSetup) setSetup(cachedSetup);
    return () => {
      listeners = listeners.filter(fn => fn !== setSetup);
    };
  }, []);

  return setup;
}
