import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function AdminAffiliateLogs() {
  const [search, setSearch] = useState('');

  const { data: clicks = [] } = useQuery({
    queryKey: ['admin-affiliate-logs'],
    queryFn: async () => {
      const { data } = await supabase.rpc('admin_list_affiliate_clicks', { _limit: 200, _search: null });
      return (data as any[]) || [];
    },
  });

  const filtered = clicks.filter((c: any) => !search || c.referral_code?.toLowerCase().includes(search.toLowerCase()) || c.landing_page?.includes(search));

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Affiliate Logs</h1>
        <Card>
          <CardHeader>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search logs..." className="pl-10" />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Affiliate Code</TableHead>
                  <TableHead>Landing Page</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>User Agent</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono">{c.referral_code || 'N/A'}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm">{c.landing_page || '/'}</TableCell>
                    <TableCell className="font-mono text-xs">{c.ip_address || 'N/A'}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">{c.user_agent || 'N/A'}</TableCell>
                    <TableCell className="text-sm">{new Date(c.created_at).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No logs found</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
