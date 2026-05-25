/**
 * Client-side raster image processing — resize + re-encode.
 * SVG/GIF/non-image files are passed through unchanged.
 */

export interface ImageProcessOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: 'image/webp' | 'image/jpeg' | 'image/png';
}

const RASTER_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const extensionForMime = (mime: string): string => {
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/jpeg') return 'jpg';
  if (mime === 'image/png') return 'png';
  return 'bin';
};

const loadImageFromFile = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });

export async function maybeProcessRasterImage(
  file: File,
  opts: ImageProcessOptions,
): Promise<File> {
  if (!file.type.startsWith('image/')) return file;
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') return file;
  if (!RASTER_TYPES.includes(file.type)) return file;

  try {
    const img = await loadImageFromFile(file);
    const maxW = opts.maxWidth ?? img.naturalWidth;
    const maxH = opts.maxHeight ?? img.naturalHeight;
    const ratio = Math.min(1, maxW / img.naturalWidth, maxH / img.naturalHeight);
    const targetW = Math.round(img.naturalWidth * ratio);
    const targetH = Math.round(img.naturalHeight * ratio);
    const outMime = opts.mimeType ?? (file.type === 'image/png' ? 'image/png' : 'image/webp');
    const quality = opts.quality ?? 0.85;

    // Skip work if dimensions already small enough and format unchanged
    if (ratio === 1 && outMime === file.type) return file;

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, targetW, targetH);

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), outMime, quality),
    );
    if (!blob || blob.size === 0) return file;

    // If processed blob ended up larger than the original (rare with small
    // PNGs), keep the original to avoid bloating storage.
    if (blob.size >= file.size && outMime === file.type) return file;

    const baseName = file.name.replace(/\.[^.]+$/, '');
    return new File([blob], `${baseName}.${extensionForMime(outMime)}`, {
      type: outMime,
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}