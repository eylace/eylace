export type MediaKind = 'image' | 'video' | 'document' | 'other';

export interface MediaFile {
  id: string;
  name: string;
  path: string;
  url: string;
  size: number;
  mimeType: string;
  kind: MediaKind;
  extension: string;
  createdAt: string | null;
}

export const ITEMS_PER_PAGE = 12;