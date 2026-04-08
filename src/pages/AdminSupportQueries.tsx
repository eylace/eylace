import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, HelpCircle, Send } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const mockQueries = [
  { id: 1, product: 'Wireless Headphones', customer: 'Rahim Ahmed', question: 'Does this support Bluetooth 5.0?', answer: null, status: 'pending', date: '2026-04-06' },
  { id: 2, product: 'Cotton T-Shirt', customer: 'Fatima Khan', question: 'What is the exact fabric composition?', answer: '100% organic cotton', status: 'answered', date: '2026-04-05' },
  { id: 3, product: 'Smart Watch', customer: 'Karim Hossain', question: 'Is it water resistant?', answer: null, status: 'pending', date: '2026-04-04' },
];

export default function AdminSupportQueries() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<typeof mockQueries[0] | null>(null);
  const [answer, setAnswer] = useState('');

  const filtered = mockQueries.filter(q => !search || q.product.toLowerCase().includes(search.toLowerCase()) || q.question.toLowerCase().includes(search.toLowerCase()));

  const handleAnswer = () => {
    if (!answer.trim()) return;
    toast.success('Answer submitted');
    setAnswer('');
    setSelected(null);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Product Queries</h1>
        <Card>
          <CardHeader>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search queries..." className="pl-10" />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Question</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(q => (
                  <TableRow key={q.id}>
                    <TableCell>{q.id}</TableCell>
                    <TableCell className="font-medium">{q.product}</TableCell>
                    <TableCell>{q.customer}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{q.question}</TableCell>
                    <TableCell><Badge variant={q.status === 'answered' ? 'default' : 'secondary'}>{q.status}</Badge></TableCell>
                    <TableCell className="text-sm">{q.date}</TableCell>
                    <TableCell><Button size="sm" variant="outline" onClick={() => { setSelected(q); setAnswer(q.answer || ''); }}><HelpCircle className="h-3 w-3 mr-1" />{q.status === 'answered' ? 'Edit' : 'Answer'}</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Answer Query</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded p-3">
                <p className="text-sm font-medium">{selected.product}</p>
                <p className="text-sm text-muted-foreground mt-1">Q: {selected.question}</p>
              </div>
              <Textarea value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Type your answer..." rows={3} />
              <Button onClick={handleAnswer} className="w-full"><Send className="h-4 w-4 mr-1" />Submit Answer</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
