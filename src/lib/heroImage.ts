/**
 * Helpers for rendering the hero LCP image as small as possible.
 *
 * Supabase Storage exposes an on-the-fly image transformer at
 *   /storage/v1/render/image/public/<bucket>/<path>?width=&quality=&format=
 * If the URL points at a Supabase /object/public/ path we rewrite it to
 * the render endpoint so we can request AVIF/WebP and width variants.
 * Anything else (external CDN, absolute http URL) is returned as-is.
 */

const WIDTHS = [480, 768, 1024, 1440, 1920] as const;

function isSupabaseObjectUrl(url: string): boolean {
  return /\/storage\/v1\/object\/public\//.test(url);
}

function toRenderBase(url: string): string {
  return url.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');
}

function withParams(url: string, params: Record<string, string | number>): string {
  try {
    const u = new URL(url);
    Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, String(v)));
    return u.toString();
  } catch {
    return url;
  }
}

export interface HeroImageSources {
  src: string;
  srcSet?: string;
  sizes?: string;
  // Optional WebP/AVIF variants for <picture>
  avifSrcSet?: string;
  webpSrcSet?: string;
}

export function buildHeroImageSources(url: string | undefined): HeroImageSources | null {
  if (!url) return null;

  if (!isSupabaseObjectUrl(url)) {
    // Non-Supabase asset — return as-is so browser still loads it.
    return { src: url };
  }

  const base = toRenderBase(url);
  const sizes = '(max-width: 768px) 100vw, (max-width: 1280px) 70vw, 900px';

  const srcSet = WIDTHS.map((w) => `${withParams(base, { width: w, quality: 75 })} ${w}w`).join(', ');
  const avifSrcSet = WIDTHS.map((w) => `${withParams(base, { width: w, quality: 70, format: 'avif' })} ${w}w`).join(', ');
  const webpSrcSet = WIDTHS.map((w) => `${withParams(base, { width: w, quality: 75, format: 'webp' })} ${w}w`).join(', ');

  return {
    src: withParams(base, { width: 1440, quality: 75 }),
    srcSet,
    sizes,
    avifSrcSet,
    webpSrcSet,
  };
}

/**
 * Inject a <link rel="preload" as="image"> for the first hero slide so
 * the LCP image starts downloading as soon as JS hydrates. This runs
 * client-side, so it's a best-effort boost — not as fast as a static
 * preload in index.html, but works for dynamic admin-managed banners.
 */
export function preloadHeroImage(sources: HeroImageSources): () => void {
  if (typeof document === 'undefined') return () => {};

  const existing = document.querySelector<HTMLLinkElement>('link[data-hero-preload="1"]');
  if (existing) existing.remove();

  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = sources.src;
  if (sources.srcSet) link.setAttribute('imagesrcset', sources.srcSet);
  if (sources.sizes) link.setAttribute('imagesizes', sources.sizes);
  link.setAttribute('fetchpriority', 'high');
  link.setAttribute('data-hero-preload', '1');
  document.head.appendChild(link);

  return () => link.remove();
}