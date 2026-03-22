import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Users, Link2, DollarSign, Wallet, CheckCircle, XCircle, Trash2, Search, Edit } from 'lucide-react';

const AdminAffiliateProgram = () => {
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [conversions, setConversions] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editModal, setEditModal] = useState<any>(null);
  const [editForm, setEditForm] = useState({ status: '', commission_rate: '', admin_notes: '' });
  const [payoutModal, setPayoutModal] = useState<any>(null);
  const [payoutForm, setPayoutForm] = useState({ status: '', transaction_id: '', admin_notes: '' });

  const getAuthHeaders = async () => {
    const session = (await supabase.auth.getSession()).data.session;
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token}`,
      'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    };
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    const headers = await getAuthHeaders();
    const base = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/affiliate-manage`;

    const [affRes, convRes, payRes] = await Promise.all([
      fetch(`${base}?action=admin-list&status=${statusFilter}`, { headers }),
      fetch(`${base}?action=admin-conversions`, { headers }),
      fetch(`${base}?action=admin-payouts`, { headers }),
    ]);

    setAffiliates(await affRes.json());
    setConversions(await convRes.json());
    setPayouts(await payRes.json());
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleUpdateAffiliate = async () => {
    const headers = await getAuthHeaders();
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/affiliate-manage?action=admin-update`, {
      method: 'PUT', headers,
      body: JSON.stringify({ id: editModal.id, ...editForm, commission_rate: Number(editForm.commission_rate) }),
    });
    if (res.ok) { toast.success('Affiliate updated'); setEditModal(null); fetchData(); }
    else toast.error('Failed to update');
  };

  const handleDeleteAffiliate = async (id: string) => {
    if (!confirm('Delete this affiliate?')) return;
    const headers = await getAuthHeaders();
    await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/affiliate-manage?action=admin-delete&id=${id}`, { method: 'DELETE', headers });
    toast.success('Deleted');
    fetchData();
  };

  const handleProcessPayout = async () => {
    const headers = await getAuthHeaders();
    await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/affiliate-manage?action=admin-payout`, {
      method: 'PUT', headers,
      body: JSON.stringify({ payout_id: payoutModal.id, ...payoutForm }),
    });
    toast.success('Payout updated');
    setPayoutModal(null);
    fetchData();
  };

  const statusBadge = (s: string) => {
    const colors: Record<string, string> = { approved: 'bg-green-100 text-green-800', pending: 'bg-yellow-100 text-yellow-800', rejected: 'bg-red-100 text-red-800', suspended: 'bg-gray-100 text-gray-800', completed: 'bg-green-100 text-green-800', failed: 'bg-red-100 text-red-800' };
    return <Badge className={colors[s] || 'bg-gray-100 text-gray-800'}>{s}</Badge>;
  };

  const filteredAffiliates = affiliates.filter(a => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return a.referral_code?.toLowerCase().includes(term) || a.profiles?.email?.toLowerCase().includes(term) || a.profiles?.first_name?.toLowerCase().includes(term);
  });

  const totalEarnings = affiliates.reduce((s, a) => s + (a.total_earnings || 0), 0);
  const totalPaid = affiliates.reduce((s, a) => s + (a.total_paid || 0), 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Affiliate Program</h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><Users className="h-8 w-8 text-blue-500" /><div><p className="text-xs text-muted-foreground">Total Affiliates</p><p className="text-xl font-bold">{affiliates.length}</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><Link2 className="h-8 w-8 text-green-500" /><div><p className="text-xs text-muted-foreground">Total Conversions</p><p className="text-xl font-bold">{conversions.length}</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><DollarSign className="h-8 w-8 text-accent" /><div><p className="text-xs text-muted-foreground">Total Earnings</p><p className="text-xl font-bold">৳{totalEarnings.toFixed(0)}</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><Wallet className="h-8 w-8 text-orange-500" /><div><p className="text-xs text-muted-foreground">Total Paid</p><p className="text-xl font-bold">৳{totalPaid.toFixed(0)}</p></div></div></CardContent></Card>
        </div>

        <Tabs defaultValue="affiliates">
          <TabsList><TabsTrigger value="affiliates">Affiliates</TabsTrigger><TabsTrigger value="conversions">Conversions</TabsTrigger><TabsTrigger value="payouts">Payouts</TabsTrigger></TabsList>

          <TabsContent value="affiliates" className="space-y-4">
            <div className="flex gap-3">
              <div className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input placeholder="Search by code, email, name..." className="pl-9" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
              <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="approved">Approved</SelectItem><SelectItem value="rejected">Rejected</SelectItem><SelectItem value="suspended">Suspended</SelectItem></SelectContent></Select>
            </div>
            <Card><CardContent className="pt-4 overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Email</TableHead><TableHead>Status</TableHead><TableHead>Rate</TableHead><TableHead>Clicks</TableHead><TableHead>Conv.</TableHead><TableHead>Earnings</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {loading ? <TableRow><TableCell colSpan={8} className="text-center py-8">Loading...</TableCell></TableRow> :
                    filteredAffiliates.map(a => (
                      <TableRow key={a.id}>
                        <TableCell className="font-mono text-sm">{a.referral_code}</TableCell>
                        <TableCell className="text-sm">{a.profiles?.email || a.user_id?.slice(0, 8)}</TableCell>
                        <TableCell>{statusBadge(a.status)}</TableCell>
                        <TableCell>{a.commission_rate}%</TableCell>
                        <TableCell>{a.total_clicks}</TableCell>
                        <TableCell>{a.total_conversions}</TableCell>
                        <TableCell className="font-medium">৳{(a.total_earnings || 0).toFixed(0)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {a.status === 'pending' && (
                              <>
                                <Button size="sm" variant="ghost" className="h-7 text-green-600" onClick={async () => {
                                  const h = await getAuthHeaders();
                                  await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/affiliate-manage?action=admin-update`, { method: 'PUT', headers: h, body: JSON.stringify({ id: a.id, status: 'approved' }) });
                                  toast.success('Approved'); fetchData();
                                }}><CheckCircle className="h-4 w-4" /></Button>
                                <Button size="sm" variant="ghost" className="h-7 text-red-600" onClick={async () => {
                                  const h = await getAuthHeaders();
                                  await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/affiliate-manage?action=admin-update`, { method: 'PUT', headers: h, body: JSON.stringify({ id: a.id, status: 'rejected' }) });
                                  toast.success('Rejected'); fetchData();
                                }}><XCircle className="h-4 w-4" /></Button>
                              </>
                            )}
                            <Button size="sm" variant="ghost" className="h-7" onClick={() => { setEditModal(a); setEditForm({ status: a.status, commission_rate: String(a.commission_rate), admin_notes: a.admin_notes || '' }); }}><Edit className="h-4 w-4" /></Button>
                            <Button size="sm" variant="ghost" className="h-7 text-destructive" onClick={() => handleDeleteAffiliate(a.id)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="conversions">
            <Card><CardContent className="pt-4 overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Affiliate</TableHead><TableHead>Order Total</TableHead><TableHead>Commission</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {conversions.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="text-xs">{format(new Date(c.created_at), 'MMM dd, yyyy')}</TableCell>
                      <TableCell className="font-mono text-xs">{c.affiliates?.referral_code || '-'}</TableCell>
                      <TableCell>৳{c.order_total?.toFixed(0)}</TableCell>
                      <TableCell className="font-medium text-accent">৳{c.commission_amount?.toFixed(0)}</TableCell>
                      <TableCell>{statusBadge(c.status)}</TableCell>
                      <TableCell>
                        {c.status === 'pending' && (
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" className="h-7 text-green-600" onClick={async () => {
                              const h = await getAuthHeaders();
                              await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/affiliate-manage?action=admin-update-conversion`, { method: 'PUT', headers: h, body: JSON.stringify({ conversion_id: c.id, status: 'approved' }) });
                              toast.success('Approved'); fetchData();
                            }}><CheckCircle className="h-4 w-4" /></Button>
                            <Button size="sm" variant="ghost" className="h-7 text-red-600" onClick={async () => {
                              const h = await getAuthHeaders();
                              await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/affiliate-manage?action=admin-update-conversion`, { method: 'PUT', headers: h, body: JSON.stringify({ conversion_id: c.id, status: 'rejected' }) });
                              toast.success('Rejected'); fetchData();
                            }}><XCircle className="h-4 w-4" /></Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="payouts">
            <Card><CardContent className="pt-4 overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Affiliate</TableHead><TableHead>Amount</TableHead><TableHead>Method</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {payouts.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="text-xs">{format(new Date(p.created_at), 'MMM dd, yyyy')}</TableCell>
                      <TableCell className="font-mono text-xs">{p.affiliates?.referral_code || '-'}</TableCell>
                      <TableCell className="font-medium">৳{p.amount?.toFixed(0)}</TableCell>
                      <TableCell className="capitalize">{p.payment_method}</TableCell>
                      <TableCell>{statusBadge(p.status)}</TableCell>
                      <TableCell>
                        {p.status === 'pending' && (
                          <Button size="sm" variant="outline" className="h-7" onClick={() => { setPayoutModal(p); setPayoutForm({ status: 'completed', transaction_id: '', admin_notes: '' }); }}>Process</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent></Card>
          </TabsContent>
        </Tabs>

        {/* Edit Affiliate Modal */}
        <Dialog open={!!editModal} onOpenChange={() => setEditModal(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Edit Affiliate</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Status</Label><Select value={editForm.status} onValueChange={v => setEditForm(f => ({ ...f, status: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pending">Pending</SelectItem><SelectItem value="approved">Approved</SelectItem><SelectItem value="rejected">Rejected</SelectItem><SelectItem value="suspended">Suspended</SelectItem></SelectContent></Select></div>
              <div><Label>Commission Rate (%)</Label><Input type="number" value={editForm.commission_rate} onChange={e => setEditForm(f => ({ ...f, commission_rate: e.target.value }))} /></div>
              <div><Label>Admin Notes</Label><Textarea value={editForm.admin_notes} onChange={e => setEditForm(f => ({ ...f, admin_notes: e.target.value }))} /></div>
              <Button onClick={handleUpdateAffiliate} variant="accent" className="w-full">Save Changes</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Process Payout Modal */}
        <Dialog open={!!payoutModal} onOpenChange={() => setPayoutModal(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Process Payout — ৳{payoutModal?.amount?.toFixed(0)}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Status</Label><Select value={payoutForm.status} onValueChange={v => setPayoutForm(f => ({ ...f, status: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="completed">Completed</SelectItem><SelectItem value="failed">Failed</SelectItem></SelectContent></Select></div>
              <div><Label>Transaction ID</Label><Input value={payoutForm.transaction_id} onChange={e => setPayoutForm(f => ({ ...f, transaction_id: e.target.value }))} placeholder="TRX-XXXXX" /></div>
              <div><Label>Notes</Label><Textarea value={payoutForm.admin_notes} onChange={e => setPayoutForm(f => ({ ...f, admin_notes: e.target.value }))} /></div>
              <Button onClick={handleProcessPayout} variant="accent" className="w-full">Confirm</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminAffiliateProgram;
