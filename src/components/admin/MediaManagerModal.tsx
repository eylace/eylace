import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Search } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { deleteMediaFiles } from '@/lib/mediaManager';
import { MediaLibraryGrid } from './media-manager/MediaLibraryGrid';
import { MediaUploadPanel } from './media-manager/MediaUploadPanel';
import { classifyMediaKind, getUploadLimit, matchesAcceptedKinds } from './media-manager/media-utils';
import { maybeProcessRasterImage } from './media-manager/image-processing';
import {
  clearMediaFilesPendingDeletion,
  createMediaFileFromUpload,
  fetchAllMediaFiles,
  markMediaFilesPendingDeletion,
  MEDIA_LIBRARY_QUERY_KEY,
  removeMediaFilesByPath,
  scheduleMediaLibrarySync,
  upsertMediaFiles,
} from './media-manager/media-library';
import { ITEMS_PER_PAGE, type MediaFile, type MediaKind } from './media-manager/types';

interface MediaManagerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect?: (urls: string[]) => void;
  multiple?: boolean;
  acceptedKinds?: MediaKind[];
  uploadFolder?: string;
  /**
   * Optional client-side resize/compress applied to raster images before
   * upload. SVGs and non-image files are passed through untouched.
   */
  processImage?: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    mimeType?: 'image/webp' | 'image/jpeg' | 'image/png';
  };
}

export function MediaManagerModal({
  open,
  onOpenChange,
  onSelect,
  multiple = false,
  acceptedKinds = ['image'],
  uploadFolder = 'uploads',
  processImage,
}: MediaManagerModalProps) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('library');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const acceptedKindsKey = acceptedKinds.join('|');

  const { data: files = [], isPending } = useQuery({
    queryKey: MEDIA_LIBRARY_QUERY_KEY,
    queryFn: fetchAllMediaFiles,
    enabled: open,
    staleTime: 60_000,
    gcTime: 300_000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!open) return;
    setTab('library');
    setSearch('');
    setPage(1);
    setSelectedPaths([]);
    setDragOver(false);
  }, [open, acceptedKindsKey, multiple, uploadFolder]);

  const filtered = useMemo(
    () =>
      files.filter(
        (file) =>
          matchesAcceptedKinds(file, acceptedKinds) &&
          (!search || file.name.toLowerCase().includes(search.toLowerCase())),
      ),
    [acceptedKinds, files, search],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  useEffect(() => {
    setPage((currentPage) => Math.min(currentPage, totalPages));
  }, [totalPages]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSelectedPaths([]);
      setSearch('');
      setPage(1);
      setTab('library');
      setDragOver(false);
    }

    onOpenChange(nextOpen);
  };

  const toggleSelection = (path: string) => {
    setSelectedPaths((currentPaths) => {
      if (!multiple) return currentPaths[0] === path ? [] : [path];
      return currentPaths.includes(path)
        ? currentPaths.filter((currentPath) => currentPath !== path)
        : [...currentPaths, path];
    });
  };

  const uploadFiles = useCallback(async (fileList: FileList) => {
    setUploading(true);

    try {
      const rawFiles = multiple ? Array.from(fileList) : [fileList[0]].filter(Boolean);
      const validFiles = rawFiles.filter((file): file is File => {
        const kind = classifyMediaKind(file.name, file.type);
        if (!matchesAcceptedKinds({ kind }, acceptedKinds)) {
          toast.error(`"${file.name}" is not a supported file type for this field.`);
          return false;
        }

        if (file.size > getUploadLimit(kind)) {
          toast.error(`"${file.name}" is too large.`);
          return false;
        }

        return true;
      });

      if (!validFiles.length) return;

      const processedFiles = processImage
        ? await Promise.all(validFiles.map((f) => maybeProcessRasterImage(f, processImage)))
        : validFiles;

      const uploadedFiles = await Promise.allSettled(
        processedFiles.map(async (file) => {
          const extension = file.name.split('.').pop();
          const path = `${uploadFolder}/${Date.now()}_${Math.random().toString(36).slice(2)}${extension ? `.${extension}` : ''}`;
          const { error } = await supabase.storage
            .from('product-images')
            .upload(path, file, { contentType: file.type || undefined });
          if (error) throw error;

          return createMediaFileFromUpload(file, path);
        }),
      );

      const successfulUploads = uploadedFiles
        .filter((result): result is PromiseFulfilledResult<MediaFile> => result.status === 'fulfilled')
        .map((result) => result.value);

      if (!successfulUploads.length) {
        toast.error('Upload failed. Please try again.');
        return;
      }

      queryClient.setQueryData<MediaFile[]>(MEDIA_LIBRARY_QUERY_KEY, (currentFiles = []) =>
        upsertMediaFiles(currentFiles, successfulUploads),
      );

      setSelectedPaths(multiple ? successfulUploads.map((file) => file.path) : [successfulUploads[0].path]);
      toast.success(`${successfulUploads.length} file(s) uploaded`);
      void queryClient.invalidateQueries({ queryKey: MEDIA_LIBRARY_QUERY_KEY });
      setTab('library');
      setSearch('');
      setPage(1);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  }, [acceptedKinds, multiple, queryClient, uploadFolder, processImage]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files);
  };

  const handleCopyLink = async (file: MediaFile) => {
    try {
      await navigator.clipboard.writeText(file.url);
      toast.success('Link copied');
    } catch {
      toast.error('Could not copy the link');
    }
  };

  const handleDeleteFromLibrary = async (file: MediaFile) => {
    markMediaFilesPendingDeletion([file.path]);
    const previousFiles = queryClient.getQueryData<MediaFile[]>(MEDIA_LIBRARY_QUERY_KEY) || [];

    queryClient.setQueryData<MediaFile[]>(MEDIA_LIBRARY_QUERY_KEY, (currentFiles = []) =>
      removeMediaFilesByPath(currentFiles, [file.path]),
    );
    setSelectedPaths((currentPaths) => currentPaths.filter((path) => path !== file.path));

    try {
      await deleteMediaFiles([file.path]);
      toast.success('Deleted');
      scheduleMediaLibrarySync(queryClient, 2000);
    } catch (err: any) {
      clearMediaFilesPendingDeletion([file.path]);
      queryClient.setQueryData(MEDIA_LIBRARY_QUERY_KEY, previousFiles);
      toast.error(err.message || 'Delete failed');
    }
  };

  const handleSelect = () => {
    if (!selectedPaths.length) return;
    const selectedUrls = selectedPaths
      .map((path) => files.find((file) => file.path === path)?.url)
      .filter((url): url is string => Boolean(url));

    if (!selectedUrls.length) return;
    onSelect?.(selectedUrls);
    handleOpenChange(false);
  };

  const selectedLabel = multiple && selectedPaths.length > 1 ? `Select ${selectedPaths.length} files` : 'Select';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex h-[92vh] max-h-[92vh] max-w-[1180px] flex-col overflow-hidden p-8 sm:p-10">
        <DialogHeader className="pb-2">
          <DialogTitle>Media Manager</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="h-auto w-fit gap-2 rounded-lg bg-transparent p-0">
            <TabsTrigger
              value="library"
              className="rounded-md border border-transparent px-4 py-2 text-sm font-medium transition-colors data-[state=active]:border-transparent data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=inactive]:border-border data-[state=inactive]:bg-background data-[state=inactive]:text-foreground hover:data-[state=inactive]:bg-muted"
            >
              Library
            </TabsTrigger>
            <TabsTrigger
              value="upload"
              className="rounded-md border border-transparent px-4 py-2 text-sm font-medium transition-colors data-[state=active]:border-transparent data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=inactive]:border-border data-[state=inactive]:bg-background data-[state=inactive]:text-foreground hover:data-[state=inactive]:bg-muted"
            >
              Upload New
            </TabsTrigger>
          </TabsList>

          {tab === 'library' && (
          <TabsContent value="library" className="mt-4 flex flex-1 flex-col min-h-0 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search files..."
                className="pl-10"
              />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-border bg-muted/10 p-3">
              {isPending ? (
                <div className="flex h-full min-h-[320px] items-center justify-center">
                  <Loader2 className="h-7 w-7 animate-spin text-primary" />
                </div>
              ) : (
                <MediaLibraryGrid
                  files={paginated}
                  multiple={multiple}
                  selectedPaths={selectedPaths}
                  onToggleSelect={toggleSelection}
                  onCopyLink={handleCopyLink}
                  onDelete={handleDeleteFromLibrary}
                  onView={(file) => window.open(file.url, '_blank', 'noopener,noreferrer')}
                />
              )}
            </div>
          </TabsContent>
          )}

          {tab === 'upload' && (
          <TabsContent value="upload" className="mt-4 flex-1 min-h-0">
            <MediaUploadPanel
              acceptedKinds={acceptedKinds}
              dragOver={dragOver}
              multiple={multiple}
              uploading={uploading}
              onDragOver={(event) => {
                event.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onFilesChosen={uploadFiles}
            />
          </TabsContent>
          )}
        </Tabs>

        <div className="mt-4 border-t border-border pt-4">
          {tab === 'library' ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages} • {filtered.length} item{filtered.length === 1 ? '' : 's'}
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((currentPage) => currentPage - 1)}>
                  <ChevronLeft className="mr-1 h-4 w-4" /> Prev
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((currentPage) => currentPage + 1)}>
                  Next <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Upload completes in real time and appears in your library instantly.</p>
          )}

          <div className="mt-3 flex justify-end gap-2">
            <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSelect} disabled={!selectedPaths.length}>{selectedLabel}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
