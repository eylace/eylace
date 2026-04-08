import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, MessageCircle, Eye } from 'lucide-react';
import { useState } from 'react';

const mockConversations = [
  { id: 1, product: 'Wireless Headphones', buyer: 'Rahim Ahmed', seller: 'TechShop BD', messages: 12, lastMessage: '2026-04-06 14:30', status: 'active' },
  { id: 2, product: 'Cotton T-Shirt', buyer: 'Fatima Khan', seller: 'Fashion House', messages: 5, lastMessage: '2026-04-05 10:15', status: 'active' },
  { id: 3, product: 'Smart Watch', buyer: 'Karim Hossain', seller: 'GadgetWorld', messages: 8, lastMessage: '2026-04-04 16:45', status: 'closed' },
  { id: 4, product: 'Leather Bag', buyer: 'Nusrat Jahan', seller: 'Leather Craft', messages: 3, lastMessage: '2026-04-03 09:20', status: 'active' },
];

export default function AdminSupportConversations() {
  const [search, setSearch] = useState('');
  const filtered = mockConversations.filter(c =>
    !search || c.product.toLowerCase().includes(search.toLowerCase()) || c.buyer.toLowerCase().includes(search.toLowerCase()) || c.seller.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Product Conversations</h1>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search conversations..." className="pl-10" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Seller</TableHead>
                  <TableHead>Messages</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(c => (
                  <TableRow key={c.id}>
                    <TableCell>{c.id}</TableCell>
                    <TableCell className="font-medium">{c.product}</TableCell>
                    <TableCell>{c.buyer}</TableCell>
                    <TableCell>{c.seller}</TableCell>
                    <TableCell><div className="flex items-center gap-1"><MessageCircle className="h-3 w-3" />{c.messages}</div></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.lastMessage}</TableCell>
                    <TableCell><Badge variant={c.status === 'active' ? 'default' : 'secondary'}>{c.status}</Badge></TableCell>
                    <TableCell><Button size="sm" variant="outline"><Eye className="h-3 w-3 mr-1" />View</Button></TableCell>
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
