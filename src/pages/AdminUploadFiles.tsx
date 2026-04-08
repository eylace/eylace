import { useState, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Upload, Trash2, Download, Search, Image, FileText, Film, Music, File, Eye, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return <Image className="h-5 w-5 text-blue-500" />;
  if (type.startsWith('video/')) return <Film className="h-5 w-5 text-purple-500" />;
  if (type.startsWith('audio/')) return <Music className="h-5 w-5 text-green-500" />;
  if (type.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />;
  return <File className="h-5 w-5 text-muted-foreground" />;
};

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function AdminUploadFiles() {
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { data: files = [], refetch } = useQuery({
    queryKey: ['admin-uploaded-files'],
    queryFn: async () => {
      const { data, error } = await supabase.storage.from('product-images').list('uploads', { limit: 200, sortBy: { column: 'created_at', order: 'desc' } });
      if (error) throw error;
      return (data || []).map(f => ({
        ...f,
        url: supabase.storage.from('product-images').getPublicUrl(`uploads/${f.name}`).data.publicUrl,
      }));
    },
  });

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
      toast.success(`${fileList.length} file(s) uploaded`);
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
    refetch();
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('URL copied');
  };

  const filtered = files.filter(f => {
    if (search && !f.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterType === 'images' && !f.metadata?.mimetype?.startsWith('image/')) return false;
    if (filterType === 'documents' && f.metadata?.mimetype?.startsWith('image/')) return false;
    return true;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Upload Files</h1>
          <label>
            <input type="file" multiple className="hidden" onChange={handleUpload} />
            <Button asChild disabled={uploading}>
              <span><Upload className="h-4 w-4 mr-2" />{uploading ? 'Uploading...' : 'Upload Files'}</span>
            </Button>
          </label>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search files..." className="pl-10" />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Files</SelectItem>
                  <SelectItem value="images">Images</SelectItem>
                  <SelectItem value="documents">Documents</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No files found</TableCell></TableRow>
                )}
                {filtered.map(f => (
                  <TableRow key={f.id}>
                    <TableCell className="flex items-center gap-2">
                      {f.metadata?.mimetype?.startsWith('image/') ? (
                        <img src={f.url} className="h-10 w-10 rounded object-cover" />
                      ) : getFileIcon(f.metadata?.mimetype || '')}
                      <span className="text-sm truncate max-w-[200px]">{f.name}</span>
                    </TableCell>
                    <TableCell><Badge variant="outline">{formatSize(f.metadata?.size || 0)}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(f.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right space-x-1">
                      {f.metadata?.mimetype?.startsWith('image/') && (
                        <Button size="icon" variant="ghost" onClick={() => setPreviewUrl(f.url)}><Eye className="h-4 w-4" /></Button>
                      )}
                      <Button size="icon" variant="ghost" onClick={() => copyUrl(f.url)}><Copy className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(f.name)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Preview</DialogTitle></DialogHeader>
          {previewUrl && <img src={previewUrl} className="w-full rounded" />}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
