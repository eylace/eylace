import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Edit, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const mockPosts = [
  { id: 1, title: 'Top 10 Fashion Trends 2026', category: 'Fashion', author: 'Admin', status: 'published', views: 1250, date: '2026-04-05' },
  { id: 2, title: 'How to Choose Electronics', category: 'Tech', author: 'Admin', status: 'published', views: 890, date: '2026-04-03' },
  { id: 3, title: 'Summer Sale Guide', category: 'Deals', author: 'Admin', status: 'draft', views: 0, date: '2026-04-06' },
  { id: 4, title: 'Shipping Tips for Sellers', category: 'Sellers', author: 'Admin', status: 'published', views: 560, date: '2026-04-01' },
];

export default function AdminBlogPosts() {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const filtered = mockPosts.filter(p => !search || p.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">All Blog Posts</h1>
          <Button onClick={() => navigate('/admin/blog/add')}><Plus className="h-4 w-4 mr-2" />Add New Post</Button>
        </div>
        <Card>
          <CardHeader>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search posts..." className="pl-10" />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(p => (
                  <TableRow key={p.id}>
                    <TableCell>{p.id}</TableCell>
                    <TableCell className="font-medium">{p.title}</TableCell>
                    <TableCell><Badge variant="outline">{p.category}</Badge></TableCell>
                    <TableCell>{p.author}</TableCell>
                    <TableCell><Badge variant={p.status === 'published' ? 'default' : 'secondary'}>{p.status}</Badge></TableCell>
                    <TableCell><div className="flex items-center gap-1"><Eye className="h-3 w-3" />{p.views}</div></TableCell>
                    <TableCell className="text-sm">{p.date}</TableCell>
                    <TableCell className="space-x-1">
                      <Button size="icon" variant="ghost"><Edit className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" className="text-destructive" onClick={() => toast.success('Post deleted')}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
