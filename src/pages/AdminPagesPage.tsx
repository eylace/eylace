import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { FileText, Plus, Edit, Trash2, Eye, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

interface CMSPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

const AdminPagesPage = () => {
  const queryClient = useQueryClient();
  const [editPage, setEditPage] = useState<CMSPage | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [newPage, setNewPage] = useState({ title: '', slug: '', content: '' });

  const { data: pages = [], isLoading } = useQuery({
    queryKey: ['admin-cms-pages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cms_pages')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as CMSPage[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (page: { title: string; slug: string; content: string }) => {
      const { error } = await supabase.from('cms_pages').insert({
        title: page.title,
        slug: page.slug || page.title.toLowerCase().replace(/\s+/g, '-'),
        content: page.content,
        is_published: false,
        sort_order: pages.length,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-cms-pages'] });
      setNewPage({ title: '', slug: '', content: '' });
      setAddOpen(false);
      toast.success('Page created');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async (page: CMSPage) => {
      const { error } = await supabase.from('cms_pages').update({
        title: page.title,
        slug: page.slug,
        content: page.content,
        is_published: page.is_published,
      }).eq('id', page.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-cms-pages'] });
      setEditPage(null);
      toast.success('Page updated');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_published }: { id: string; is_published: boolean }) => {
      const { error } = await supabase.from('cms_pages').update({ is_published }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-cms-pages'] });
      toast.success('Status updated');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('cms_pages').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-cms-pages'] });
      toast.success('Page deleted');
    },
  });

  return (
    <AdminLayout titleKey="admin.title.pages" descriptionKey="admin.desc.pages">
      <Card className="border border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-5 w-5" /> Pages ({pages.length})
          </CardTitle>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> New Page</Button></DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>Create Page</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2"><Label>Title</Label><Input value={newPage.title} onChange={e => setNewPage(p => ({ ...p, title: e.target.value }))} placeholder="Page title" /></div>
                <div className="space-y-2"><Label>Slug</Label><Input value={newPage.slug} onChange={e => setNewPage(p => ({ ...p, slug: e.target.value }))} placeholder="page-slug (auto-generated if empty)" /></div>
                <div className="space-y-2"><Label>Content (HTML)</Label><Textarea value={newPage.content} onChange={e => setNewPage(p => ({ ...p, content: e.target.value }))} rows={10} placeholder="Page content (HTML supported)..." /></div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button onClick={() => createMutation.mutate(newPage)} disabled={!newPage.title.trim() || createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pages.map(page => (
                <TableRow key={page.id}>
                  <TableCell className="font-medium">{page.title}</TableCell>
                  <TableCell className="text-sm text-muted-foreground font-mono">/{page.slug}</TableCell>
                  <TableCell>
                    <Badge variant={page.is_published ? 'default' : 'secondary'}>
                      {page.is_published ? 'Published' : 'Draft'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleMutation.mutate({ id: page.id, is_published: !page.is_published })}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditPage(page)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(page.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editPage} onOpenChange={() => setEditPage(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Edit Page</DialogTitle></DialogHeader>
          {editPage && (
            <div className="space-y-4 py-4">
              <div className="space-y-2"><Label>Title</Label><Input value={editPage.title} onChange={e => setEditPage(p => p ? { ...p, title: e.target.value } : null)} /></div>
              <div className="space-y-2"><Label>Slug</Label><Input value={editPage.slug} onChange={e => setEditPage(p => p ? { ...p, slug: e.target.value } : null)} /></div>
              <div className="space-y-2"><Label>Content (HTML)</Label><Textarea value={editPage.content} onChange={e => setEditPage(p => p ? { ...p, content: e.target.value } : null)} rows={10} /></div>
              <div className="flex items-center gap-2"><Switch checked={editPage.is_published} onCheckedChange={v => setEditPage(p => p ? { ...p, is_published: v } : null)} /><Label>Published</Label></div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={() => editPage && updateMutation.mutate(editPage)} disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminPagesPage;
