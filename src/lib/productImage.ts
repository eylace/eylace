/**
 * Build responsive <picture> sources for a product image.
 *
 * Mirrors the logic in lib/heroImage.ts but tuned for thumbnails on cards
 * and the gallery on the product detail page. Uses Supabase's on-the-fly
 * image transformer to emit AVIF / WebP variants at multiple widths so the
 * browser can pick the smallest acceptable bytes.
 */

const CARD_WIDTHS = [160, 240, 320, 480, 640] as const;
const DETAIL_WIDTHS = [320, 480, 640, 960, 1280, 1600] as const;

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

export interface ProductImageSources {
  src: string;
  srcSet?: string;
  sizes?: string;
  avifSrcSet?: string;
  webpSrcSet?: string;
  width: number;
  height: number;
}

export type ProductImageVariant = 'card' | 'detail';

export const PRODUCT_IMAGE_DIMENSIONS: Record<ProductImageVariant, { width: number; height: number }> = {
  card: { width: 480, height: 480 },
  detail: { width: 960, height: 960 },
};

export function getProductFeatureImage(
  product: { thumbnail?: string; images?: string[] } | null | undefined,
  fallback = '/placeholder.svg'
): string {
  const thumbnail = product?.thumbnail?.trim();
  if (thumbnail) return thumbnail;

  const firstImage = product?.images?.find((image) => typeof image === 'string' && image.trim().length > 0)?.trim();
  return firstImage || fallback;
}

export function buildProductImageSources(
  url: string | undefined,
  variant: ProductImageVariant = 'card'
): ProductImageSources | null {
  if (!url) return null;

  const dimensions = PRODUCT_IMAGE_DIMENSIONS[variant];

  if (!isSupabaseObjectUrl(url)) {
    return { src: url, ...dimensions };
  }

  const widths = variant === 'detail' ? DETAIL_WIDTHS : CARD_WIDTHS;
  const sizes =
    variant === 'detail'
      ? '(max-width: 768px) 100vw, (max-width: 1280px) 60vw, 800px'
      : '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 240px';

  const base = toRenderBase(url);
  const defaultWidth = dimensions.width;

  const srcSet = widths
    .map((w) => `${withParams(base, { width: w, height: w, resize: 'contain', quality: 75 })} ${w}w`)
    .join(', ');
  const avifSrcSet = widths
    .map((w) => `${withParams(base, { width: w, height: w, resize: 'contain', quality: 65, format: 'avif' })} ${w}w`)
    .join(', ');
  const webpSrcSet = widths
    .map((w) => `${withParams(base, { width: w, height: w, resize: 'contain', quality: 72, format: 'webp' })} ${w}w`)
    .join(', ');

  return {
    src: withParams(base, { width: defaultWidth, height: defaultWidth, resize: 'contain', quality: 75 }),
    srcSet,
    sizes,
    avifSrcSet,
    webpSrcSet,
    ...dimensions,
  };
}