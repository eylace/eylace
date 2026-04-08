import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Search, MessageSquare, Clock, CheckCircle, XCircle, AlertCircle, Eye, Send } from 'lucide-react';
import { toast } from 'sonner';

const mockTickets = [
  { id: 'TKT-001', subject: 'Order not delivered', customer: 'Rahim Ahmed', email: 'rahim@example.com', status: 'open', priority: 'high', created: '2026-04-05', messages: 3 },
  { id: 'TKT-002', subject: 'Refund not received', customer: 'Fatima Khan', email: 'fatima@example.com', status: 'in_progress', priority: 'medium', created: '2026-04-04', messages: 5 },
  { id: 'TKT-003', subject: 'Product quality issue', customer: 'Karim Hossain', email: 'karim@example.com', status: 'resolved', priority: 'low', created: '2026-04-03', messages: 8 },
  { id: 'TKT-004', subject: 'Wrong item received', customer: 'Nusrat Jahan', email: 'nusrat@example.com', status: 'open', priority: 'high', created: '2026-04-06', messages: 1 },
  { id: 'TKT-005', subject: 'Payment failed', customer: 'Arif Islam', email: 'arif@example.com', status: 'closed', priority: 'medium', created: '2026-04-01', messages: 4 },
];

const statusColors: Record<string, string> = { open: 'bg-yellow-100 text-yellow-800', in_progress: 'bg-blue-100 text-blue-800', resolved: 'bg-green-100 text-green-800', closed: 'bg-gray-100 text-gray-800' };
const priorityColors: Record<string, string> = { high: 'bg-red-100 text-red-800', medium: 'bg-orange-100 text-orange-800', low: 'bg-green-100 text-green-800' };

export default function AdminSupportTickets() {
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [viewTicket, setViewTicket] = useState<typeof mockTickets[0] | null>(null);
  const [reply, setReply] = useState('');

  const filtered = mockTickets.filter(t => {
    if (tab !== 'all' && t.status !== tab) return false;
    if (search && !t.subject.toLowerCase().includes(search.toLowerCase()) && !t.customer.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleReply = () => {
    if (!reply.trim()) return;
    toast.success('Reply sent successfully');
    setReply('');
  };

  const updateStatus = (status: string) => {
    toast.success(`Ticket status updated to ${status}`);
    setViewTicket(null);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Support Tickets</h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Open', count: mockTickets.filter(t => t.status === 'open').length, icon: AlertCircle, color: 'text-yellow-600' },
            { label: 'In Progress', count: mockTickets.filter(t => t.status === 'in_progress').length, icon: Clock, color: 'text-blue-600' },
            { label: 'Resolved', count: mockTickets.filter(t => t.status === 'resolved').length, icon: CheckCircle, color: 'text-green-600' },
            { label: 'Closed', count: mockTickets.filter(t => t.status === 'closed').length, icon: XCircle, color: 'text-gray-600' },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <s.icon className={`h-8 w-8 ${s.color}`} />
                <div><p className="text-2xl font-bold">{s.count}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
              <Tabs value={tab} onValueChange={setTab}>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="open">Open</TabsTrigger>
                  <TabsTrigger value="in_progress">In Progress</TabsTrigger>
                  <TabsTrigger value="resolved">Resolved</TabsTrigger>
                  <TabsTrigger value="closed">Closed</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tickets..." className="pl-10" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Messages</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-xs">{t.id}</TableCell>
                    <TableCell className="font-medium">{t.subject}</TableCell>
                    <TableCell><div><p className="text-sm">{t.customer}</p><p className="text-xs text-muted-foreground">{t.email}</p></div></TableCell>
                    <TableCell><Badge className={priorityColors[t.priority]}>{t.priority}</Badge></TableCell>
                    <TableCell><Badge className={statusColors[t.status]}>{t.status.replace('_', ' ')}</Badge></TableCell>
                    <TableCell><div className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{t.messages}</div></TableCell>
                    <TableCell className="text-sm">{t.created}</TableCell>
                    <TableCell><Button size="sm" variant="outline" onClick={() => setViewTicket(t)}><Eye className="h-3 w-3 mr-1" />View</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!viewTicket} onOpenChange={() => setViewTicket(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{viewTicket?.subject}</DialogTitle></DialogHeader>
          {viewTicket && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Badge className={priorityColors[viewTicket.priority]}>{viewTicket.priority}</Badge>
                <Badge className={statusColors[viewTicket.status]}>{viewTicket.status.replace('_', ' ')}</Badge>
              </div>
              <p className="text-sm"><strong>Customer:</strong> {viewTicket.customer} ({viewTicket.email})</p>
              <div className="bg-muted/50 rounded p-3 text-sm">
                <p className="font-medium mb-1">Customer Message:</p>
                <p className="text-muted-foreground">I have an issue with my order. Please help me resolve this as soon as possible.</p>
              </div>
              <Textarea value={reply} onChange={e => setReply(e.target.value)} placeholder="Type your reply..." rows={3} />
              <div className="flex gap-2">
                <Button onClick={handleReply} className="flex-1"><Send className="h-4 w-4 mr-1" />Send Reply</Button>
                <Select onValueChange={updateStatus}>
                  <SelectTrigger className="w-40"><SelectValue placeholder="Update Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
