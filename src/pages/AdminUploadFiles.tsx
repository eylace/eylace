import { useState, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload, Search, MoreVertical, Eye, Copy, Trash2, Download, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const formatSize = (bytes: number) => {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export default function AdminUploadFiles() {
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

  const { data: files = [], refetch } = useQuery({
    queryKey: ['admin-uploaded-files'],
    queryFn: async () => {
      const { data, error } = await supabase.storage.from('product-images').list('uploads', {
        limit: 500,
        sortBy: { column: 'created_at', order: 'desc' },
      });
      if (error) throw error;
      return (data || []).map(f => ({
        ...f,
        url: supabase.storage.from('product-images').getPublicUrl(`uploads/${f.name}`).data.publicUrl,
      }));
    },
  });

  const sorted = [...files]
    .filter(f => !search || f.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'size') return (b.metadata?.size || 0) - (a.metadata?.size || 0);
      return 0;
    });

  const allSelected = sorted.length > 0 && sorted.every(f => selectedIds.has(f.id));

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(fileList)) {
        const ext = file.name.split('.').pop();
        const path = `uploads/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from('product-images').upload(path, file);
        if (error) throw error;
      }
      toast.success(`${fileList.length} file(s) uploaded successfully`);
      refetch();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }, [refetch]);

  const handleDelete = async (name: string) => {
    const { error } = await supabase.storage.from('product-images').remove([`uploads/${name}`]);
    if (error) { toast.error(error.message); return; }
    toast.success('File deleted');
    setSelectedIds(prev => { const n = new Set(prev); n.delete(name); return n; });
    setDeleteConfirm(null);
    refetch();
  };

  const handleBulkDelete = async () => {
    const paths = sorted.filter(f => selectedIds.has(f.id)).map(f => `uploads/${f.name}`);
    if (!paths.length) return;
    const { error } = await supabase.storage.from('product-images').remove(paths);
    if (error) { toast.error(error.message); return; }
    toast.success(`${paths.length} file(s) deleted`);
    setSelectedIds(new Set());
    setBulkDeleteConfirm(false);
    refetch();
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('URL copied to clipboard');
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sorted.map(f => f.id)));
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">All uploaded files</h1>
          </div>
          <label>
            <input type="file" multiple className="hidden" onChange={handleUpload} />
            <Button asChild disabled={uploading} className="bg-primary hover:bg-primary/90">
              <span><Upload className="h-4 w-4 mr-2" />{uploading ? 'Uploading...' : 'Upload New File'}</span>
            </Button>
          </label>
        </div>

        {/* Toolbar */}
        <Card className="border border-border">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-foreground">All files</span>
                {selectedIds.size > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">Bulk Action ({selectedIds.size})</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setBulkDeleteConfirm(true)} className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" /> Delete Selected
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40 h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Sort by newest</SelectItem>
                    <SelectItem value="oldest">Sort by oldest</SelectItem>
                    <SelectItem value="name">Sort by name</SelectItem>
                    <SelectItem value="size">Sort by size</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative">
                  <Input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search your files"
                    className="w-52 h-9 pr-3"
                  />
                </div>
                <Button size="sm" variant="default" onClick={() => {}}>
                  <Search className="h-4 w-4 mr-1" /> Search
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Select All */}
        <div className="flex items-center gap-2 px-1">
          <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} />
          <span className="text-sm text-muted-foreground">Select All</span>
        </div>

        {/* File Grid */}
        {sorted.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {sorted.map(file => {
              const isImage = file.metadata?.mimetype?.startsWith('image/');
              const isSelected = selectedIds.has(file.id);
              return (
                <div
                  key={file.id}
                  className={`group relative bg-card border rounded-lg overflow-hidden transition-all ${
                    isSelected ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:border-accent'
                  }`}
                >
                  {/* Checkbox */}
                  <div className="absolute top-2 left-2 z-10">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSelect(file.id)}
                      className="bg-background/80 backdrop-blur-sm"
                    />
                  </div>

                  {/* Three-dot menu */}
                  <div className="absolute top-2 right-2 z-10">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {isImage && (
                          <DropdownMenuItem onClick={() => setPreviewUrl(file.url)}>
                            <Eye className="h-4 w-4 mr-2" /> View Image
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => copyUrl(file.url)}>
                          <Copy className="h-4 w-4 mr-2" /> Copy Link
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => window.open(file.url, '_blank')}>
                          <ExternalLink className="h-4 w-4 mr-2" /> Open in New Tab
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <a href={file.url} download={file.name}>
                            <Download className="h-4 w-4 mr-2" /> Download
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDeleteConfirm(file.name)} className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Thumbnail */}
                  <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                    {isImage ? (
                      <img
                        src={file.url}
                        alt={file.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="text-muted-foreground text-xs uppercase font-bold">
                        {file.name.split('.').pop()}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-2">
                    <p className="text-xs font-medium text-foreground truncate" title={file.name}>{file.name}</p>
                    <p className="text-[10px] text-muted-foreground">{formatSize(file.metadata?.size || 0)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <Card className="border border-border">
            <CardContent className="py-16 text-center text-muted-foreground">
              No files found. Upload your first file to get started.
            </CardContent>
          </Card>
        )}
      </div>

      {/* Image Preview */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Image Preview</DialogTitle></DialogHeader>
          {previewUrl && <img src={previewUrl} className="w-full rounded" alt="Preview" />}
        </DialogContent>
      </Dialog>

      {/* Single Delete Confirm */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete this file? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirm */}
      <AlertDialog open={bulkDeleteConfirm} onOpenChange={setBulkDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} Files</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete {selectedIds.size} selected files? This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground">Delete All</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
