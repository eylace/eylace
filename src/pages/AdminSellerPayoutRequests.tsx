import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Loader2, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const AdminSellerPayoutRequests = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionReq, setActionReq] = useState<{ req: any; action: 'approved' | 'rejected' } | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const { data } = await supabase.from('seller_payout_requests').select('*, seller:sellers(name)').order('created_at', { ascending: false });
    if (data) setRequests(data);
    setIsLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAction = async () => {
    if (!actionReq) return;
    const { error } = await supabase.from('seller_payout_requests').update({ status: actionReq.action, admin_notes: adminNotes || null, updated_at: new Date().toISOString() }).eq('id', actionReq.req.id);
    if (!error) { toast.success(`Request ${actionReq.action}`); setActionReq(null); setAdminNotes(''); fetchData(); } else toast.error('Failed');
  };

  const statusBadge = (s: string) => {
    if (s === 'approved') return <Badge className="bg-green-500/10 text-green-600"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
    if (s === 'rejected') return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
    return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
  };

  return (
    <AdminLayout titleKey="admin.sellers.payoutRequests" descriptionKey="admin.sellers.payoutRequestsDesc">
      <Card>
        <CardHeader><CardTitle className="text-lg">Payout Requests</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div> : requests.length === 0 ? <p className="text-center text-muted-foreground py-8">No payout requests</p> : (
            <Table>
              <TableHeader><TableRow><TableHead>Seller</TableHead><TableHead>Amount</TableHead><TableHead>Method</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {requests.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{(r.seller as any)?.name || 'N/A'}</TableCell>
                    <TableCell>${r.amount}</TableCell>
                    <TableCell><Badge variant="outline">{r.payment_method}</Badge></TableCell>
                    <TableCell>{statusBadge(r.status)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {r.status === 'pending' && (
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" className="text-green-600 text-xs" onClick={() => { setActionReq({ req: r, action: 'approved' }); setAdminNotes(''); }}>Approve</Button>
                          <Button size="sm" variant="outline" className="text-destructive text-xs" onClick={() => { setActionReq({ req: r, action: 'rejected' }); setAdminNotes(''); }}>Reject</Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!actionReq} onOpenChange={() => setActionReq(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{actionReq?.action === 'approved' ? 'Approve' : 'Reject'} Request</DialogTitle></DialogHeader>
          <div className="space-y-3"><Label>Admin Notes</Label><Textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} /></div>
          <DialogFooter><Button variant="outline" onClick={() => setActionReq(null)}>Cancel</Button><Button variant={actionReq?.action === 'approved' ? 'default' : 'destructive'} onClick={handleAction}>{actionReq?.action === 'approved' ? 'Approve' : 'Reject'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminSellerPayoutRequests;
