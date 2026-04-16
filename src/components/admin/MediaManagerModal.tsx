import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Search, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

const ITEMS_PER_PAGE = 12;

const formatSize = (bytes: number) => {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

interface MediaManagerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect?: (url: string) => void;
  multiple?: boolean;
}

export function MediaManagerModal({ open, onOpenChange, onSelect, multiple = false }: MediaManagerModalProps) {
  const [tab, setTab] = useState('library');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const { data: files = [], refetch } = useQuery({
    queryKey: ['media-manager-files'],
    queryFn: async () => {
      const { data, error } = await supabase.storage.from('product-images').list('uploads', {
        limit: 1000,
        sortBy: { column: 'created_at', order: 'desc' },
      });
      if (error) throw error;
      return (data || []).map(f => ({
        ...f,
        url: supabase.storage.from('product-images').getPublicUrl(`uploads/${f.name}`).data.publicUrl,
      }));
    },
    enabled: open,
  });

  const filtered = files.filter(f => !search || f.name.toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const uploadFiles = useCallback(async (fileList: FileList) => {
    setUploading(true);
    try {
      for (const file of Array.from(fileList)) {
        const ext = file.name.split('.').pop();
        const path = `uploads/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from('product-images').upload(path, file);
        if (error) throw error;
      }
      toast.success(`${fileList.length} file(s) uploaded`);
      refetch();
      setTab('library');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  }, [refetch]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      uploadFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files);
  };

  const handleDeleteFromLibrary = async (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const { error } = await supabase.storage.from('product-images').remove([`uploads/${name}`]);
    if (error) { toast.error(error.message); return; }
    toast.success('Deleted');
    refetch();
  };

  const handleSelect = () => {
    if (selectedUrl && onSelect) {
      onSelect(selectedUrl);
      onOpenChange(false);
      setSelectedUrl(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Media Manager</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="w-fit">
            <TabsTrigger value="library">Library</TabsTrigger>
            <TabsTrigger value="upload">Upload New</TabsTrigger>
          </TabsList>

          {/* Library Tab */}
          <TabsContent value="library" className="flex-1 flex flex-col min-h-0 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search files..."
                className="pl-10"
              />
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
              {paginated.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {paginated.map(file => {
                    const isImage = file.metadata?.mimetype?.startsWith('image/');
                    const isActive = selectedUrl === file.url;
                    return (
                      <div
                        key={file.id}
                        onClick={() => setSelectedUrl(file.url)}
                        className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all aspect-square ${
                          isActive ? 'border-primary ring-2 ring-primary/30' : 'border-transparent hover:border-accent'
                        }`}
                      >
                        {isImage ? (
                          <img src={file.url} alt={file.name} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center text-xs text-muted-foreground font-bold uppercase">
                            {file.name.split('.').pop()}
                          </div>
                        )}
                        {/* Delete button */}
                        <button
                          onClick={(e) => handleDeleteFromLibrary(file.name, e)}
                          className="absolute bottom-2 right-2 h-7 w-7 rounded-md bg-destructive/90 text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                  No files found
                </div>
              )}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Upload Tab */}
          <TabsContent value="upload" className="flex-1">
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors ${
                dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/30 bg-muted/50'
              }`}
            >
              <Upload className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-1">Upload Files</h3>
              <p className="text-sm text-muted-foreground mb-4">Drag and drop or click to browse</p>
              <label>
                <input type="file" multiple className="hidden" onChange={handleFileInput} />
                <Button asChild disabled={uploading} variant="default">
                  <span>{uploading ? 'Uploading...' : 'Browse Files'}</span>
                </Button>
              </label>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSelect} disabled={!selectedUrl}>Select</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
