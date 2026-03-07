import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Image as ImageIcon, Upload, Trash2, Search, Grid, List, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface MediaItem {
  id: string;
  name: string;
  url: string;
  type: string;
  size: string;
  uploadedAt: string;
}

const AdminMediaPage = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [items] = useState<MediaItem[]>([
    { id: '1', name: 'hero-banner.jpg', url: '/placeholder.svg', type: 'image/jpeg', size: '245 KB', uploadedAt: '2024-01-15' },
    { id: '2', name: 'product-1.png', url: '/placeholder.svg', type: 'image/png', size: '128 KB', uploadedAt: '2024-01-14' },
    { id: '3', name: 'category-electronics.jpg', url: '/placeholder.svg', type: 'image/jpeg', size: '312 KB', uploadedAt: '2024-01-13' },
    { id: '4', name: 'logo.svg', url: '/placeholder.svg', type: 'image/svg', size: '8 KB', uploadedAt: '2024-01-12' },
    { id: '5', name: 'banner-sale.jpg', url: '/placeholder.svg', type: 'image/jpeg', size: '456 KB', uploadedAt: '2024-01-11' },
    { id: '6', name: 'product-2.png', url: '/placeholder.svg', type: 'image/png', size: '189 KB', uploadedAt: '2024-01-10' },
  ]);

  const filtered = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('URL copied to clipboard');
  };

  return (
    <AdminLayout title="Media Gallery" description="Manage uploaded images and files">
      <div className="space-y-6">
        {/* Controls */}
        <Card className="border border-border">
          <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Button size="sm"><Upload className="h-4 w-4 mr-1" /> Upload Files</Button>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search media..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-56" />
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="icon" className="h-8 w-8" onClick={() => setViewMode('grid')}><Grid className="h-4 w-4" /></Button>
              <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="icon" className="h-8 w-8" onClick={() => setViewMode('list')}><List className="h-4 w-4" /></Button>
            </div>
          </CardContent>
        </Card>

        {/* Media Grid */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filtered.map(item => (
              <Card key={item.id} className="border border-border group cursor-pointer hover:border-accent transition-colors">
                <CardContent className="p-2">
                  <div className="aspect-square bg-muted rounded-lg flex items-center justify-center mb-2 relative overflow-hidden">
                    <img src={item.url} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => copyUrl(item.url)}><Copy className="h-3 w-3" /></Button>
                      <Button size="icon" variant="destructive" className="h-8 w-8"><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </div>
                  <p className="text-xs font-medium truncate text-foreground">{item.name}</p>
                  <p className="text-[10px] text-muted-foreground">{item.size}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border border-border">
            <CardContent className="p-0">
              <table className="w-full">
                <thead><tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="text-left p-3">Preview</th><th className="text-left p-3">Name</th><th className="text-left p-3">Type</th><th className="text-left p-3">Size</th><th className="text-left p-3">Date</th><th className="text-right p-3">Actions</th>
                </tr></thead>
                <tbody>
                  {filtered.map(item => (
                    <tr key={item.id} className="border-b border-border last:border-0">
                      <td className="p-3"><div className="h-10 w-10 bg-muted rounded overflow-hidden"><img src={item.url} alt="" className="w-full h-full object-cover" /></div></td>
                      <td className="p-3 text-sm font-medium">{item.name}</td>
                      <td className="p-3"><Badge variant="outline" className="text-xs">{item.type}</Badge></td>
                      <td className="p-3 text-sm text-muted-foreground">{item.size}</td>
                      <td className="p-3 text-sm text-muted-foreground">{item.uploadedAt}</td>
                      <td className="p-3 text-right space-x-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyUrl(item.url)}><Copy className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

        {filtered.length === 0 && (
          <Card className="border border-border"><CardContent className="py-12 text-center text-muted-foreground">No media files found</CardContent></Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminMediaPage;
