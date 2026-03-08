import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminPreorderQueries() {
  const { toast } = useToast();
  const [queries, setQueries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [answerModal, setAnswerModal] = useState<any>(null);
  const [answer, setAnswer] = useState('');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('preorder_queries')
      .select('*, preorder_products(products(name))')
      .order('created_at', { ascending: false });
    setQueries(data || []);
    setIsLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const submitAnswer = async () => {
    if (!answer.trim() || !answerModal) return;
    const { error } = await supabase.from('preorder_queries').update({
      answer, status: 'answered', answered_at: new Date().toISOString()
    }).eq('id', answerModal.id);

    if (!error) {
      toast({ title: 'Answer submitted' });
      setAnswerModal(null);
      setAnswer('');
      fetchData();
    }
  };

  const filtered = queries.filter(q =>
    q.question?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Preorder Product Queries</h1>
          <p className="text-muted-foreground">{queries.filter(q => q.status === 'pending').length} pending queries</p>
        </div>

        <Card>
          <CardHeader>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search queries..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No queries found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Question</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(q => (
                    <TableRow key={q.id}>
                      <TableCell>{q.preorder_products?.products?.name || '-'}</TableCell>
                      <TableCell className="max-w-xs truncate">{q.question}</TableCell>
                      <TableCell><Badge variant={q.status === 'answered' ? 'default' : 'secondary'}>{q.status}</Badge></TableCell>
                      <TableCell>{format(new Date(q.created_at), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>
                        {q.status === 'pending' ? (
                          <Button size="sm" variant="outline" onClick={() => { setAnswerModal(q); setAnswer(''); }}>Answer</Button>
                        ) : (
                          <span className="text-xs text-muted-foreground truncate max-w-[150px] block">{q.answer}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={!!answerModal} onOpenChange={() => setAnswerModal(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Answer Query</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">Question:</p>
                <p className="text-sm text-muted-foreground">{answerModal?.question}</p>
              </div>
              <Textarea placeholder="Type your answer..." value={answer} onChange={e => setAnswer(e.target.value)} rows={4} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAnswerModal(null)}>Cancel</Button>
              <Button onClick={submitAnswer} disabled={!answer.trim()}>Submit Answer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
