import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { FileText, Plus, Edit, Trash2, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

interface CMSPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  isPublished: boolean;
  updatedAt: string;
}

const AdminPagesPage = () => {
  const [pages, setPages] = useState<CMSPage[]>([
    { id: '1', title: 'About Us', slug: 'about-us', content: 'Grand Mall Emporium is your one-stop shop...', isPublished: true, updatedAt: new Date().toISOString() },
    { id: '2', title: 'Privacy Policy', slug: 'privacy-policy', content: 'We take your privacy seriously...', isPublished: true, updatedAt: new Date().toISOString() },
    { id: '3', title: 'Terms of Service', slug: 'terms-of-service', content: 'By using our service you agree to...', isPublished: true, updatedAt: new Date().toISOString() },
    { id: '4', title: 'Return Policy', slug: 'return-policy', content: '30-day return policy for all items...', isPublished: true, updatedAt: new Date().toISOString() },
    { id: '5', title: 'FAQ', slug: 'faq', content: 'Frequently asked questions...', isPublished: false, updatedAt: new Date().toISOString() },
  ]);
  const [editPage, setEditPage] = useState<CMSPage | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [newPage, setNewPage] = useState({ title: '', slug: '', content: '' });

  const handleCreate = () => {
    if (!newPage.title.trim()) return;
    const page: CMSPage = {
      id: Date.now().toString(),
      ...newPage,
      slug: newPage.slug || newPage.title.toLowerCase().replace(/\s+/g, '-'),
      isPublished: false,
      updatedAt: new Date().toISOString(),
    };
    setPages(prev => [...prev, page]);
    setNewPage({ title: '', slug: '', content: '' });
    setAddOpen(false);
    toast.success('Page created');
  };

  const handleUpdate = () => {
    if (!editPage) return;
    setPages(prev => prev.map(p => p.id === editPage.id ? { ...editPage, updatedAt: new Date().toISOString() } : p));
    setEditPage(null);
    toast.success('Page updated');
  };

  const togglePublish = (id: string) => {
    setPages(prev => prev.map(p => p.id === id ? { ...p, isPublished: !p.isPublished } : p));
  };

  const deletePage = (id: string) => {
    setPages(prev => prev.filter(p => p.id !== id));
    toast.success('Page deleted');
  };

  return (
    <AdminLayout title="Pages" description="Manage static CMS pages">
      <Card className="border border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2"><FileText className="h-5 w-5" /> Pages ({pages.length})</CardTitle>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> New Page</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Page</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2"><Label>Title</Label><Input value={newPage.title} onChange={e => setNewPage(p => ({ ...p, title: e.target.value }))} placeholder="Page title" /></div>
                <div className="space-y-2"><Label>Slug</Label><Input value={newPage.slug} onChange={e => setNewPage(p => ({ ...p, slug: e.target.value }))} placeholder="page-slug" /></div>
                <div className="space-y-2"><Label>Content</Label><Textarea value={newPage.content} onChange={e => setNewPage(p => ({ ...p, content: e.target.value }))} rows={6} placeholder="Page content..." /></div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button onClick={handleCreate}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-0">
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
                    <Badge variant={page.isPublished ? 'default' : 'secondary'}>
                      {page.isPublished ? 'Published' : 'Draft'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => togglePublish(page.id)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditPage(page)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deletePage(page.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editPage} onOpenChange={() => setEditPage(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Page</DialogTitle></DialogHeader>
          {editPage && (
            <div className="space-y-4 py-4">
              <div className="space-y-2"><Label>Title</Label><Input value={editPage.title} onChange={e => setEditPage(p => p ? { ...p, title: e.target.value } : null)} /></div>
              <div className="space-y-2"><Label>Slug</Label><Input value={editPage.slug} onChange={e => setEditPage(p => p ? { ...p, slug: e.target.value } : null)} /></div>
              <div className="space-y-2"><Label>Content</Label><Textarea value={editPage.content} onChange={e => setEditPage(p => p ? { ...p, content: e.target.value } : null)} rows={6} /></div>
              <div className="flex items-center gap-2"><Switch checked={editPage.isPublished} onCheckedChange={v => setEditPage(p => p ? { ...p, isPublished: v } : null)} /><Label>Published</Label></div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleUpdate}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminPagesPage;
