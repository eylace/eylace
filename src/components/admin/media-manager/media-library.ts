import type { QueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { classifyMediaKind } from './media-utils';
import type { MediaFile } from './types';

interface StorageItem {
  created_at?: string | null;
  id?: string | null;
  metadata?: {
    mimetype?: string;
    size?: number;
  } | null;
  name: string;
}

export const MEDIA_LIBRARY_QUERY_KEY = ['media-library-files'] as const;

const MEDIA_DELETE_VISIBILITY_TTL = 15_000;
const pendingDeletedPaths = new Map<string, number>();

const getMediaPublicUrl = (path: string) => supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl;

const prunePendingDeletedPaths = () => {
  const now = Date.now();

  pendingDeletedPaths.forEach((expiresAt, path) => {
    if (expiresAt <= now) {
      pendingDeletedPaths.delete(path);
    }
  });
};

const filterPendingDeletedFiles = (files: MediaFile[]) => {
  prunePendingDeletedPaths();

  if (!pendingDeletedPaths.size) {
    return files;
  }

  return files.filter((file) => !pendingDeletedPaths.has(file.path));
};

export const markMediaFilesPendingDeletion = (paths: string[]) => {
  prunePendingDeletedPaths();
  const expiresAt = Date.now() + MEDIA_DELETE_VISIBILITY_TTL;

  paths.forEach((path) => {
    pendingDeletedPaths.set(path, expiresAt);
  });
};

export const clearMediaFilesPendingDeletion = (paths: string[]) => {
  paths.forEach((path) => {
    pendingDeletedPaths.delete(path);
  });
};

export const scheduleMediaLibrarySync = (queryClient: QueryClient, delay = 1200) => {
  if (typeof window === 'undefined') {
    void queryClient.invalidateQueries({ queryKey: MEDIA_LIBRARY_QUERY_KEY });
    return;
  }

  window.setTimeout(() => {
    prunePendingDeletedPaths();
    void queryClient.invalidateQueries({ queryKey: MEDIA_LIBRARY_QUERY_KEY });
  }, delay);
};

const listFolderItems = async (folder: string) => {
  const items: StorageItem[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase.storage.from('product-images').list(folder, {
      limit: 1000,
      offset,
      sortBy: { column: 'created_at', order: 'desc' },
    });

    if (error) throw error;

    const batch = (data as StorageItem[]) || [];
    items.push(...batch);

    if (batch.length < 1000) break;
    offset += batch.length;
  }

  return items;
};

export const sortMediaFilesByNewest = (files: MediaFile[]) =>
  [...files].sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime;
  });

export const removeMediaFilesByPath = (files: MediaFile[], paths: string[]) => {
  const pathSet = new Set(paths);
  return files.filter((file) => !pathSet.has(file.path));
};

export const upsertMediaFiles = (files: MediaFile[], incomingFiles: MediaFile[]) => {
  const map = new Map(files.map((file) => [file.path, file]));

  incomingFiles.forEach((file) => {
    pendingDeletedPaths.delete(file.path);
    map.set(file.path, file);
  });

  return filterPendingDeletedFiles(sortMediaFilesByNewest(Array.from(map.values())));
};

export const createMediaFileFromUpload = (file: File, path: string): MediaFile => ({
  id: path,
  name: file.name,
  path,
  url: getMediaPublicUrl(path),
  size: file.size,
  mimeType: file.type || '',
  kind: classifyMediaKind(file.name, file.type),
  extension: file.name.split('.').pop()?.toUpperCase() || '',
  createdAt: new Date().toISOString(),
});

export const fetchAllMediaFiles = async (): Promise<MediaFile[]> => {
  const visited = new Set<string>();

  const collect = async (folder = ''): Promise<MediaFile[]> => {
    if (visited.has(folder)) return [];
    visited.add(folder);

    const entries = await listFolderItems(folder);
    const folders: string[] = [];
    const files: MediaFile[] = [];

    entries.forEach((entry) => {
      const fullPath = folder ? `${folder}/${entry.name}` : entry.name;
      const metadata = entry.metadata;
      const isFolder = !metadata || Object.keys(metadata).length === 0 || entry.id == null;

      if (isFolder) {
        folders.push(fullPath);
        return;
      }

      const mimeType = metadata.mimetype || '';
      files.push({
        id: entry.id || fullPath,
        name: entry.name,
        path: fullPath,
        url: getMediaPublicUrl(fullPath),
        size: metadata.size || 0,
        mimeType,
        kind: classifyMediaKind(entry.name, mimeType),
        extension: entry.name.split('.').pop()?.toUpperCase() || '',
        createdAt: entry.created_at || null,
      });
    });

    const nestedFiles = await Promise.all(folders.map((nestedFolder) => collect(nestedFolder)));
    return [...files, ...nestedFiles.flat()];
  };

  const allFiles = await collect('');
  return filterPendingDeletedFiles(sortMediaFilesByNewest(Array.from(new Map(allFiles.map((file) => [file.path, file])).values())));
};