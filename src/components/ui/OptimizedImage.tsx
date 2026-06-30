import { ImgHTMLAttributes, memo } from 'react';
import { buildProductImageSources, ProductImageVariant, PRODUCT_IMAGE_DIMENSIONS } from '@/lib/productImage';

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'srcSet' | 'sizes'> {
  src?: string;
  alt: string;
  variant?: ProductImageVariant;
  /** Hint to the browser that this image is the LCP candidate. */
  priority?: boolean;
}

/**
 * <picture>-wrapped <img> that emits AVIF + WebP + JPEG/PNG fallbacks at
 * multiple widths via Supabase's render endpoint. Non-Supabase URLs fall
 * back to a plain <img> with native lazy loading.
 */
const OptimizedImageInner = ({
  src,
  alt,
  variant = 'card',
  priority = false,
  loading,
  decoding = 'async',
  ...rest
}: OptimizedImageProps) => {
  const sources = buildProductImageSources(src, variant);
  const finalLoading = loading ?? (priority ? 'eager' : 'lazy');
  const fetchPriority = priority ? 'high' : 'auto';
  const fallbackDimensions = PRODUCT_IMAGE_DIMENSIONS[variant];
  const width = rest.width ?? sources?.width ?? fallbackDimensions.width;
  const height = rest.height ?? sources?.height ?? fallbackDimensions.height;
  const imgProps = {
    ...rest,
    width,
    height,
    style: {
      maxWidth: '100%',
      height: 'auto',
      ...rest.style,
    },
  };

  if (!sources) {
    return (
      <img
        alt={alt}
        loading={finalLoading}
        decoding={decoding}
        // @ts-expect-error fetchpriority is a valid HTML attribute
        fetchpriority={fetchPriority}
        {...imgProps}
      />
    );
  }

  return (
    <picture className="contents">
      {sources.avifSrcSet && (
        <source type="image/avif" srcSet={sources.avifSrcSet} sizes={sources.sizes} />
      )}
      {sources.webpSrcSet && (
        <source type="image/webp" srcSet={sources.webpSrcSet} sizes={sources.sizes} />
      )}
      <img
        src={sources.src}
        srcSet={sources.srcSet}
        sizes={sources.sizes}
        alt={alt}
        loading={finalLoading}
        decoding={decoding}
        // @ts-expect-error fetchpriority is a valid HTML attribute
        fetchpriority={fetchPriority}
        {...imgProps}
      />
    </picture>
  );
};

export const OptimizedImage = memo(OptimizedImageInner);