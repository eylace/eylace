import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UsersRound, Search, Trash2, Download } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface Subscriber {
  id: string;
  email: string;
  name: string;
  subscribedAt: string;
  status: 'active' | 'unsubscribed';
  source: string;
}

const AdminMarketingSubscribers = () => {
  const [search, setSearch] = useState('');
  const [subscribers, setSubscribers] = useState<Subscriber[]>([
    { id: '1', email: 'john@example.com', name: 'John Doe', subscribedAt: '2026-01-15', status: 'active', source: 'Footer Form' },
    { id: '2', email: 'jane@example.com', name: 'Jane Smith', subscribedAt: '2026-02-20', status: 'active', source: 'Checkout' },
    { id: '3', email: 'alex@example.com', name: 'Alex Brown', subscribedAt: '2026-03-01', status: 'unsubscribed', source: 'Pop-up' },
    { id: '4', email: 'sarah@example.com', name: 'Sarah Wilson', subscribedAt: '2026-03-05', status: 'active', source: 'Footer Form' },
  ]);

  const filtered = subscribers.filter(s => s.email.toLowerCase().includes(search.toLowerCase()) || s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <AdminLayout titleKey="admin.marketing.subscribers" descriptionKey="admin.marketing.subscribers">
      <Card className="border border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2"><UsersRound className="h-5 w-5" /> Subscribers ({subscribers.filter(s => s.status === 'active').length} active)</CardTitle>
          <Button variant="outline" size="sm" onClick={() => toast.success('CSV exported')}><Download className="h-4 w-4 mr-1" /> Export CSV</Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search by email or name..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Table>
            <TableHeader><TableRow><TableHead>Email</TableHead><TableHead>Name</TableHead><TableHead>Source</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {filtered.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.email}</TableCell>
                  <TableCell>{s.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{s.source}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{s.subscribedAt}</TableCell>
                  <TableCell>{s.status === 'active' ? <Badge className="bg-green-500/10 text-green-600">Active</Badge> : <Badge variant="secondary">Unsubscribed</Badge>}</TableCell>
                  <TableCell className="text-right"><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { setSubscribers(prev => prev.filter(x => x.id !== s.id)); toast.success('Removed'); }}><Trash2 className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminMarketingSubscribers;
