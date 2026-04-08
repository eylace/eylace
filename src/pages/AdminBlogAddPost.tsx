import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Image } from 'lucide-react';

export default function AdminBlogAddPost() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', slug: '', category: '', content: '', excerpt: '',
    featuredImage: '', metaTitle: '', metaDescription: '',
    isPublished: false, allowComments: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) { toast.error('Title is required'); return; }
    toast.success('Blog post created');
    navigate('/admin/blog/posts');
  };

  const generateSlug = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  return (
    <AdminLayout>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button type="button" variant="ghost" size="icon" onClick={() => navigate('/admin/blog/posts')}><ArrowLeft className="h-4 w-4" /></Button>
            <h1 className="text-2xl font-bold">Add New Blog Post</h1>
          </div>
          <div className="flex gap-2">
            <Button type="submit" variant="outline" onClick={() => setForm(p => ({ ...p, isPublished: false }))}>Save Draft</Button>
            <Button type="submit" onClick={() => setForm(p => ({ ...p, isPublished: true }))}><Save className="h-4 w-4 mr-2" />Publish</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader><CardTitle>Post Content</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div><Label>Title *</Label><Input value={form.title} onChange={e => { setForm(p => ({ ...p, title: e.target.value, slug: generateSlug(e.target.value) })); }} placeholder="Post title" /></div>
                <div><Label>Slug</Label><Input value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))} /></div>
                <div><Label>Content</Label><RichTextEditor value={form.content} onChange={v => setForm(p => ({ ...p, content: v }))} placeholder="Write your blog post..." /></div>
                <div><Label>Excerpt</Label><Input value={form.excerpt} onChange={e => setForm(p => ({ ...p, excerpt: e.target.value }))} placeholder="Short summary" /></div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>SEO</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div><Label>Meta Title</Label><Input value={form.metaTitle} onChange={e => setForm(p => ({ ...p, metaTitle: e.target.value }))} /></div>
                <div><Label>Meta Description</Label><Input value={form.metaDescription} onChange={e => setForm(p => ({ ...p, metaDescription: e.target.value }))} /></div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Settings</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div><Label>Category</Label>
                  <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fashion">Fashion</SelectItem>
                      <SelectItem value="tech">Tech</SelectItem>
                      <SelectItem value="deals">Deals</SelectItem>
                      <SelectItem value="sellers">Sellers</SelectItem>
                      <SelectItem value="news">News</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between"><Label>Allow Comments</Label><Switch checked={form.allowComments} onCheckedChange={v => setForm(p => ({ ...p, allowComments: v }))} /></div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Featured Image</CardTitle></CardHeader>
              <CardContent>
                <div><Label>Image URL</Label><Input value={form.featuredImage} onChange={e => setForm(p => ({ ...p, featuredImage: e.target.value }))} placeholder="https://..." /></div>
                {form.featuredImage && <img src={form.featuredImage} className="mt-3 rounded w-full aspect-video object-cover" />}
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </AdminLayout>
  );
}
