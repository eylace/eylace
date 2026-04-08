import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Award, TrendingUp, Users } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const mockUsers = [
  { id: 1, name: 'Rahim Ahmed', email: 'rahim@example.com', totalEarned: 520, totalRedeemed: 200, balance: 320, lastActivity: '2026-04-06' },
  { id: 2, name: 'Fatima Khan', email: 'fatima@example.com', totalEarned: 1200, totalRedeemed: 800, balance: 400, lastActivity: '2026-04-05' },
  { id: 3, name: 'Karim Hossain', email: 'karim@example.com', totalEarned: 350, totalRedeemed: 0, balance: 350, lastActivity: '2026-04-04' },
  { id: 4, name: 'Nusrat Jahan', email: 'nusrat@example.com', totalEarned: 890, totalRedeemed: 500, balance: 390, lastActivity: '2026-04-03' },
];

export default function AdminClubPointUsers() {
  const [search, setSearch] = useState('');
  const filtered = mockUsers.filter(u => !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));

  const totalPoints = mockUsers.reduce((s, u) => s + u.balance, 0);
  const totalEarned = mockUsers.reduce((s, u) => s + u.totalEarned, 0);
  const totalRedeemed = mockUsers.reduce((s, u) => s + u.totalRedeemed, 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">User Points</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><CardContent className="p-4 flex items-center gap-3"><Award className="h-8 w-8 text-primary" /><div><p className="text-2xl font-bold">{totalPoints}</p><p className="text-xs text-muted-foreground">Total Active Points</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><TrendingUp className="h-8 w-8 text-green-600" /><div><p className="text-2xl font-bold">{totalEarned}</p><p className="text-xs text-muted-foreground">Total Earned</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><Users className="h-8 w-8 text-blue-600" /><div><p className="text-2xl font-bold">{totalRedeemed}</p><p className="text-xs text-muted-foreground">Total Redeemed</p></div></CardContent></Card>
        </div>

        <Card>
          <CardHeader>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..." className="pl-10" />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Total Earned</TableHead>
                  <TableHead>Total Redeemed</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(u => (
                  <TableRow key={u.id}>
                    <TableCell><div><p className="font-medium">{u.name}</p><p className="text-xs text-muted-foreground">{u.email}</p></div></TableCell>
                    <TableCell className="text-green-600 font-medium">+{u.totalEarned}</TableCell>
                    <TableCell className="text-red-600 font-medium">-{u.totalRedeemed}</TableCell>
                    <TableCell><Badge variant="default">{u.balance} pts</Badge></TableCell>
                    <TableCell className="text-sm">{u.lastActivity}</TableCell>
                    <TableCell><Button size="sm" variant="outline" onClick={() => toast.info('Point history coming soon')}>History</Button></TableCell>
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
