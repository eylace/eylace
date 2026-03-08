import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UsersRound, Search, Trash2, Download, Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  source: string | null;
  subscribed_at: string;
  status: string;
}

const AdminMarketingSubscribers = () => {
  const [search, setSearch] = useState('');
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSubscribers = async () => {
    const { data, error } = await supabase.from('newsletter_subscribers').select('*').order('subscribed_at', { ascending: false });
    if (error) console.error(error);
    else setSubscribers(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchSubscribers(); }, []);

  const deleteSubscriber = async (id: string) => {
    await supabase.from('newsletter_subscribers').delete().eq('id', id);
    toast.success('Removed');
    fetchSubscribers();
  };

  const exportCSV = () => {
    const csv = ['Email,Name,Source,Status,Date', ...subscribers.map(s => `${s.email},${s.name || ''},${s.source || ''},${s.status},${s.subscribed_at.split('T')[0]}`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'subscribers.csv'; a.click();
    toast.success('CSV exported');
  };

  const filtered = subscribers.filter(s => s.email.toLowerCase().includes(search.toLowerCase()) || (s.name || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <AdminLayout titleKey="admin.marketing.subscribers" descriptionKey="admin.marketing.subscribers">
      <Card className="border border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2"><UsersRound className="h-5 w-5" /> Subscribers ({subscribers.filter(s => s.status === 'active').length} active)</CardTitle>
          <Button variant="outline" size="sm" onClick={exportCSV}><Download className="h-4 w-4 mr-1" /> Export CSV</Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search by email or name..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Email</TableHead><TableHead>Name</TableHead><TableHead>Source</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No subscribers yet</TableCell></TableRow>
                ) : filtered.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.email}</TableCell>
                    <TableCell>{s.name || '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{s.source || '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{s.subscribed_at.split('T')[0]}</TableCell>
                    <TableCell>{s.status === 'active' ? <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Active</Badge> : <Badge variant="secondary">Unsubscribed</Badge>}</TableCell>
                    <TableCell className="text-right"><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteSubscriber(s.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminMarketingSubscribers;
