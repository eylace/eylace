import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Search, Eye, CheckCircle, XCircle, RotateCcw, DollarSign, Clock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const mockRefunds = [
  { id: 'REF-001', order: 'ORD-1001', customer: 'Rahim Ahmed', amount: 2500, reason: 'Damaged product', status: 'pending', date: '2026-04-06', product: 'Wireless Headphones' },
  { id: 'REF-002', order: 'ORD-1002', customer: 'Fatima Khan', amount: 1800, reason: 'Wrong item received', status: 'approved', date: '2026-04-05', product: 'Cotton T-Shirt' },
  { id: 'REF-003', order: 'ORD-1003', customer: 'Karim Hossain', amount: 5200, reason: 'Product not as described', status: 'rejected', date: '2026-04-04', product: 'Smart Watch' },
  { id: 'REF-004', order: 'ORD-1004', customer: 'Nusrat Jahan', amount: 3100, reason: 'Defective product', status: 'pending', date: '2026-04-03', product: 'Leather Bag' },
  { id: 'REF-005', order: 'ORD-1005', customer: 'Arif Islam', amount: 900, reason: 'Changed mind', status: 'approved', date: '2026-04-02', product: 'Phone Case' },
];

const statusColors: Record<string, string> = { pending: 'bg-yellow-100 text-yellow-800', approved: 'bg-green-100 text-green-800', rejected: 'bg-red-100 text-red-800', refunded: 'bg-blue-100 text-blue-800' };

export default function AdminRefundRequests() {
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<typeof mockRefunds[0] | null>(null);
  const [adminNote, setAdminNote] = useState('');

  const filtered = mockRefunds.filter(r => {
    if (tab === 'pending' && r.status !== 'pending') return false;
    if (tab === 'approved' && r.status !== 'approved') return false;
    if (tab === 'rejected' && r.status !== 'rejected') return false;
    if (search && !r.customer.toLowerCase().includes(search.toLowerCase()) && !r.id.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleAction = (action: string) => {
    toast.success(`Refund ${action}`);
    setSelected(null);
    setAdminNote('');
  };

  const totalPending = mockRefunds.filter(r => r.status === 'pending').reduce((s, r) => s + r.amount, 0);
  const totalApproved = mockRefunds.filter(r => r.status === 'approved').reduce((s, r) => s + r.amount, 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Refund Requests</h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent className="p-4 flex items-center gap-3"><Clock className="h-8 w-8 text-yellow-600" /><div><p className="text-xl font-bold">{mockRefunds.filter(r => r.status === 'pending').length}</p><p className="text-xs text-muted-foreground">Pending</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><CheckCircle className="h-8 w-8 text-green-600" /><div><p className="text-xl font-bold">{mockRefunds.filter(r => r.status === 'approved').length}</p><p className="text-xs text-muted-foreground">Approved</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><DollarSign className="h-8 w-8 text-blue-600" /><div><p className="text-xl font-bold">৳{totalPending}</p><p className="text-xs text-muted-foreground">Pending Amount</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><DollarSign className="h-8 w-8 text-green-600" /><div><p className="text-xl font-bold">৳{totalApproved}</p><p className="text-xs text-muted-foreground">Approved Amount</p></div></CardContent></Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
              <Tabs value={tab} onValueChange={setTab}>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="approved">Approved</TabsTrigger>
                  <TabsTrigger value="rejected">Rejected</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search refunds..." className="pl-10" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.id}</TableCell>
                    <TableCell className="font-mono text-xs">{r.order}</TableCell>
                    <TableCell className="font-medium">{r.customer}</TableCell>
                    <TableCell>{r.product}</TableCell>
                    <TableCell className="font-bold">৳{r.amount}</TableCell>
                    <TableCell className="text-sm max-w-[150px] truncate">{r.reason}</TableCell>
                    <TableCell><Badge className={statusColors[r.status]}>{r.status}</Badge></TableCell>
                    <TableCell className="text-sm">{r.date}</TableCell>
                    <TableCell><Button size="sm" variant="outline" onClick={() => setSelected(r)}><Eye className="h-3 w-3 mr-1" />View</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Refund Details - {selected?.id}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><strong>Order:</strong> {selected.order}</div>
                <div><strong>Customer:</strong> {selected.customer}</div>
                <div><strong>Product:</strong> {selected.product}</div>
                <div><strong>Amount:</strong> ৳{selected.amount}</div>
                <div className="col-span-2"><strong>Reason:</strong> {selected.reason}</div>
              </div>
              <Textarea value={adminNote} onChange={e => setAdminNote(e.target.value)} placeholder="Admin notes..." rows={2} />
              {selected.status === 'pending' && (
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={() => handleAction('approved')}><CheckCircle className="h-4 w-4 mr-1" />Approve</Button>
                  <Button variant="destructive" className="flex-1" onClick={() => handleAction('rejected')}><XCircle className="h-4 w-4 mr-1" />Reject</Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
