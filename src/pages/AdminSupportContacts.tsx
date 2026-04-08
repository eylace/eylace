import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Mail, Phone, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const mockContacts = [
  { id: 1, name: 'Rahim Ahmed', email: 'rahim@example.com', phone: '+880171234567', subject: 'Business inquiry', message: 'I want to partner with your platform', date: '2026-04-06', read: false },
  { id: 2, name: 'Fatima Khan', email: 'fatima@example.com', phone: '+880181234567', subject: 'Feedback', message: 'Great platform, love the features!', date: '2026-04-05', read: true },
  { id: 3, name: 'Karim Hossain', email: 'karim@example.com', phone: '+880191234567', subject: 'Complaint', message: 'Website was slow yesterday', date: '2026-04-04', read: true },
];

export default function AdminSupportContacts() {
  const [search, setSearch] = useState('');
  const filtered = mockContacts.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Contact Messages</h1>
        <Card>
          <CardHeader>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search contacts..." className="pl-10" />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(c => (
                  <TableRow key={c.id} className={!c.read ? 'bg-primary/5' : ''}>
                    <TableCell className="font-medium">{c.name}{!c.read && <Badge className="ml-2 bg-primary text-primary-foreground text-[10px]">New</Badge>}</TableCell>
                    <TableCell>{c.email}</TableCell>
                    <TableCell>{c.phone}</TableCell>
                    <TableCell>{c.subject}</TableCell>
                    <TableCell><Badge variant={c.read ? 'secondary' : 'default'}>{c.read ? 'Read' : 'Unread'}</Badge></TableCell>
                    <TableCell className="text-sm">{c.date}</TableCell>
                    <TableCell className="space-x-1">
                      <Button size="icon" variant="ghost" onClick={() => window.open(`mailto:${c.email}`)}><Mail className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => window.open(`tel:${c.phone}`)}><Phone className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" className="text-destructive" onClick={() => toast.success('Contact deleted')}><Trash2 className="h-4 w-4" /></Button>
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
