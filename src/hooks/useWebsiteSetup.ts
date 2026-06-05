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
  topBarSpeed: number;
  topBarAudience: 'all' | 'guests' | 'users';
  topBarStartsAt: string | null;
  topBarEndsAt: string | null;
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
  siteName: string;
  heroBanners: HeroBanner[];
  selectedCheckout: string;
  checkoutCustomization: CheckoutCustomization;
  ctaCallNumber: string;
  ctaWhatsappNumber: string;
  ctaCallEnabled: boolean;
  ctaWhatsappEnabled: boolean;
  prepaymentOfferEnabled: boolean;
  prepaymentOfferText: string;
  prepaymentOfferPercent: number;
}

export interface CheckoutVariantConfig {
  headingText: string;
  buttonText: string;
  processingText: string;
  termsText: string;
  showPromoCode: boolean;
  showTrustBadges: boolean;
  showBreadcrumb: boolean;
  showBackButton: boolean;
  showSSLBadge: boolean;
  buttonBgColor: string;
  buttonTextColor: string;
  cardBorderRadius: string;
  trustBadge1Title: string;
  trustBadge1Desc: string;
  trustBadge2Title: string;
  trustBadge2Desc: string;
  trustBadge3Title: string;
  trustBadge3Desc: string;
}

export interface CheckoutCustomization {
  classic: CheckoutVariantConfig;
  modern: CheckoutVariantConfig;
  minimal: CheckoutVariantConfig;
  express: CheckoutVariantConfig;
}

const defaultVariantConfig: CheckoutVariantConfig = {
  headingText: 'Checkout',
  buttonText: 'Place Order',
  processingText: 'Processing...',
  termsText: 'By placing this order, you agree to our Terms & Conditions',
  showPromoCode: true,
  showTrustBadges: true,
  showBreadcrumb: true,
  showBackButton: true,
  showSSLBadge: true,
  buttonBgColor: '',
  buttonTextColor: '',
  cardBorderRadius: '12',
  trustBadge1Title: 'Secure Payment',
  trustBadge1Desc: '100% Safe & Secure',
  trustBadge2Title: 'Fast Delivery',
  trustBadge2Desc: '2-5 Business Days',
  trustBadge3Title: 'Easy Returns',
  trustBadge3Desc: '7 Days Return Policy',
};

const defaultCheckoutCustomization: CheckoutCustomization = {
  classic: { ...defaultVariantConfig, headingText: 'Checkout', showTrustBadges: false },
  modern: { ...defaultVariantConfig, headingText: 'Secure Checkout', buttonText: 'Place Order Securely' },
  minimal: { ...defaultVariantConfig, headingText: 'Checkout', buttonText: 'Complete Order', showBreadcrumb: false, showTrustBadges: false },
  express: { ...defaultVariantConfig, headingText: 'Quick Order', buttonText: 'Confirm Order', showBreadcrumb: false, showTrustBadges: false, showPromoCode: false },
};

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
  topBarSpeed: 35,
  topBarAudience: 'all',
  topBarStartsAt: null,
  topBarEndsAt: null,
  footerStyle: 'default',
  footerAboutText: 'Grand Mall Emporium is your one-stop shop for everything you need.',
  footerCopyright: '© 2025 Grand Mall Emporium. All rights reserved.',
  footerShowSocialLinks: true,
  footerShowNewsletter: true,
  footerShowPaymentIcons: true,
  footerShowDownloadApp: true,
  footerShowFeaturesBar: true,
  footerAppStoreUrl: '#',
  footerGooglePlayUrl: '#',
  footerColumns: [],
  footerSocialLinks: [],
  // Match the navy + orange palette defined in src/index.css so that the
  // first paint (before DB-fetched setup arrives) uses the same brand colors
  // instead of flashing indigo/purple on reload.
  primaryColor: '#1d3557',
  accentColor: '#ff4d00',
  borderRadius: '8',
  darkModeDefault: false,
  customCss: '',
  logoUrl: '',
  faviconUrl: '',
  siteName: 'Eylace',
  heroBanners: [],
  selectedCheckout: 'classic',
  checkoutCustomization: defaultCheckoutCustomization,
  ctaCallNumber: '01XXXXXXXXX',
  ctaWhatsappNumber: '01XXXXXXXXX',
  ctaCallEnabled: true,
  ctaWhatsappEnabled: true,
  prepaymentOfferEnabled: true,
  prepaymentOfferText: 'পেমেন্ট করে অর্ডার করলেই 10% ছাড়!',
  prepaymentOfferPercent: 10,
};

let cachedSetup: WebsiteSetup | null = null;
let listeners: Array<(s: WebsiteSetup) => void> = [];

const LS_KEY = 'website_setup_v1_cache';

// Hydrate from localStorage synchronously so reload uses last-known theme
// immediately instead of flashing the indigo defaults.
try {
  if (typeof window !== 'undefined') {
    const raw = window.localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        cachedSetup = { ...defaults, ...parsed };
      }
    }
  }
} catch {}

const notifyListeners = (s: WebsiteSetup) => {
  cachedSetup = s;
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LS_KEY, JSON.stringify(s));
    }
  } catch {}
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
