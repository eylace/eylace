import type { MediaFile, MediaKind } from './types';

const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif', 'bmp']);
const VIDEO_EXTENSIONS = new Set(['mp4', 'mov', 'webm', 'ogg', 'm4v', 'avi', 'mkv']);
const DOCUMENT_EXTENSIONS = new Set(['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'txt']);

export const formatSize = (bytes: number) => {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

export const classifyMediaKind = (fileName: string, mimeType = ''): MediaKind => {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';

  if (mimeType.startsWith('image/') || IMAGE_EXTENSIONS.has(extension)) return 'image';
  if (mimeType.startsWith('video/') || VIDEO_EXTENSIONS.has(extension)) return 'video';
  if (mimeType.includes('pdf') || DOCUMENT_EXTENSIONS.has(extension)) return 'document';

  return 'other';
};

export const matchesAcceptedKinds = (file: Pick<MediaFile, 'kind'>, acceptedKinds: MediaKind[]) => {
  if (!acceptedKinds.length) return true;
  return acceptedKinds.includes(file.kind);
};

export const getFileAcceptValue = (acceptedKinds: MediaKind[]) => {
  if (!acceptedKinds.length) return undefined;

  const values = new Set<string>();

  acceptedKinds.forEach((kind) => {
    if (kind === 'image') values.add('image/*');
    if (kind === 'video') values.add('video/*');
    if (kind === 'document') values.add('.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt');
  });

  return Array.from(values).join(',') || undefined;
};

export const getUploadLimit = (kind: MediaKind) => {
  if (kind === 'video') return 50 * 1024 * 1024;
  if (kind === 'document') return 20 * 1024 * 1024;
  return 10 * 1024 * 1024;
};

export const getAcceptedKindsLabel = (acceptedKinds: MediaKind[]) => {
  if (!acceptedKinds.length) return 'media';

  const labels = acceptedKinds.map((kind) => {
    if (kind === 'image') return 'images';
    if (kind === 'video') return 'videos';
    if (kind === 'document') return 'documents';
    return 'files';
  });

  return labels.join(', ');
};