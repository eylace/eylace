import { useEffect } from 'react';
import { useSeoSettings } from '@/hooks/useSeoSettings';

const setMeta = (selector: string, attr: 'name' | 'property', key: string, content: string) => {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!content) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
};

const setLink = (rel: string, href: string) => {
  const sel = `link[rel="${rel}"][data-seo-managed="1"]`;
  let el = document.head.querySelector<HTMLLinkElement>(sel);
  if (!href) { el?.remove(); return; }
  if (!el) {
    el = document.createElement('link');
    el.rel = rel;
    el.setAttribute('data-seo-managed', '1');
    document.head.appendChild(el);
  }
  el.href = href;
};

const setJsonLd = (id: string, payload: string) => {
  document.getElementById(id)?.remove();
  if (!payload?.trim()) return;
  try {
    JSON.parse(payload);
  } catch {
    return;
  }
  const s = document.createElement('script');
  s.id = id;
  s.type = 'application/ld+json';
  s.textContent = payload;
  document.head.appendChild(s);
};

/**
 * Applies global SEO settings (managed in Admin > SEO) to <head> in real time.
 * Per-route Helmet tags still override on routes that set them.
 */
export default function SeoSettingsInjector() {
  const seo = useSeoSettings();

  useEffect(() => {
    if (seo.siteTitle) {
      // Only override when no per-route title has been set by Helmet
      if (!document.title || document.title === 'Lovable App' || document.title.trim() === '') {
        document.title = seo.siteTitle;
      }
    }

    setMeta('meta[name="description"]', 'name', 'description', seo.metaDescription || '');
    setMeta('meta[name="keywords"]', 'name', 'keywords', seo.metaKeywords || '');
    setMeta(
      'meta[name="robots"]',
      'name',
      'robots',
      seo.indexable ? 'index,follow' : 'noindex,nofollow'
    );

    setMeta('meta[name="google-site-verification"]', 'name', 'google-site-verification', seo.googleSiteVerification || '');
    setMeta('meta[name="msvalidate.01"]', 'name', 'msvalidate.01', seo.bingSiteVerification || '');

    if (seo.enableOpenGraph) {
      setMeta('meta[property="og:title"]', 'property', 'og:title', seo.ogTitle || seo.siteTitle || '');
      setMeta('meta[property="og:description"]', 'property', 'og:description', seo.ogDescription || seo.metaDescription || '');
      setMeta('meta[property="og:image"]', 'property', 'og:image', seo.ogImage || '');
      setMeta('meta[property="og:type"]', 'property', 'og:type', 'website');
    }

    if (seo.enableTwitterCards) {
      setMeta('meta[name="twitter:card"]', 'name', 'twitter:card', seo.twitterCard || 'summary_large_image');
      setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', seo.ogTitle || seo.siteTitle || '');
      setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', seo.ogDescription || seo.metaDescription || '');
      setMeta('meta[name="twitter:image"]', 'name', 'twitter:image', seo.ogImage || '');
      setMeta('meta[name="twitter:site"]', 'name', 'twitter:site', seo.twitterHandle || '');
    }

    setLink('canonical', seo.canonicalUrl || '');

    if (seo.enableJsonLd) {
      setJsonLd('seo-jsonld-organization', seo.jsonLdOrganization || '');
    } else {
      document.getElementById('seo-jsonld-organization')?.remove();
    }
  }, [seo]);

  return null;
}