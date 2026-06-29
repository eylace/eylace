import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
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
import { Users, Link2, DollarSign, Wallet, CheckCircle, XCircle, Trash2, Search, Edit, Eye, Loader2, MousePointerClick, TrendingUp, Phone, Mail, MapPin, Calendar } from 'lucide-react';

const invoke = async (body: Record<string, unknown>) => {
  const { data, error } = await supabase.functions.invoke('affiliate-manage', { body });
  if (error) {
    let msg = 'Request failed';
    try {
      const errBody = error instanceof Response ? await error.json() : (typeof error === 'object' && 'message' in error) ? { error: error.message } : { error: String(error) };
      msg = errBody?.error || msg;
    } catch {}
    throw new Error(msg);
  }
  return data;
};

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
  const [detailModal, setDetailModal] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [aff, conv, pay] = await Promise.all([
        invoke({ action: 'admin-list', status: statusFilter }),
        invoke({ action: 'admin-conversions' }),
        invoke({ action: 'admin-payouts' }),
      ]);
      setAffiliates(Array.isArray(aff) ? aff : []);
      setConversions(Array.isArray(conv) ? conv : []);
      setPayouts(Array.isArray(pay) ? pay : []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load data');
    }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleQuickAction = async (id: string, status: string, label: string) => {
    setActionLoading(id + status);
    try {
      await invoke({ action: 'admin-update', id, status });
      toast.success(`${label} successfully`);
      fetchData();
    } catch (err: any) { toast.error(err.message); }
    setActionLoading(null);
  };

  const handleUpdateAffiliate = async () => {
    try {
      await invoke({
        action: 'admin-update',
        id: editModal.id,
        status: editForm.status,
        commission_rate: Number(editForm.commission_rate),
        admin_notes: editForm.admin_notes,
      });
      toast.success('Affiliate updated');
      setEditModal(null);
      fetchData();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDeleteAffiliate = async (id: string, code: string) => {
    if (!confirm(`Delete affiliate ${code}? This will remove all their clicks, conversions, and payouts.`)) return;
    setActionLoading(id + 'delete');
    try {
      await invoke({ action: 'admin-delete', id });
      toast.success('Affiliate deleted');
      fetchData();
    } catch (err: any) { toast.error(err.message); }
    setActionLoading(null);
  };

  const handleProcessPayout = async () => {
    try {
      await invoke({
        action: 'admin-payout',
        payout_id: payoutModal.id,
        status: payoutForm.status,
        transaction_id: payoutForm.transaction_id,
        admin_notes: payoutForm.admin_notes,
      });
      toast.success('Payout processed');
      setPayoutModal(null);
      fetchData();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleConversionAction = async (conversionId: string, status: string) => {
    setActionLoading(conversionId + status);
    try {
      await invoke({ action: 'admin-update-conversion', conversion_id: conversionId, status });
      toast.success(`Conversion ${status}`);
      fetchData();
    } catch (err: any) { toast.error(err.message); }
    setActionLoading(null);
  };

  const viewDetail = async (id: string) => {
    setDetailLoading(true);
    setDetailModal(null);
    try {
      const data = await invoke({ action: 'admin-detail', id });
      setDetailModal(data);
    } catch (err: any) { toast.error(err.message); }
    setDetailLoading(false);
  };

  const statusBadge = (s: string) => {
    const colors: Record<string, string> = {
      approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      suspended: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      paid: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    };
    return <Badge className={`${colors[s] || 'bg-gray-100 text-gray-800'} capitalize`}>{s}</Badge>;
  };

  const filteredAffiliates = affiliates.filter(a => {
    if (!searchTerm) return true;
    const t = searchTerm.toLowerCase();
    return (
      a.referral_code?.toLowerCase().includes(t) ||
      a.profile?.email?.toLowerCase().includes(t) ||
      a.profile?.first_name?.toLowerCase().includes(t) ||
      a.profile?.last_name?.toLowerCase().includes(t) ||
      a.profile?.phone?.toLowerCase().includes(t)
    );
  });

  const totalEarnings = affiliates.reduce((s, a) => s + (a.total_earnings || 0), 0);
  const totalPaid = affiliates.reduce((s, a) => s + (a.total_paid || 0), 0);
  const totalClicks = affiliates.reduce((s, a) => s + (a.total_clicks || 0), 0);
  const pendingCount = affiliates.filter(a => a.status === 'pending').length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Affiliate Program Management</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage affiliates, track conversions, and process payouts</p>
          </div>
          {pendingCount > 0 && (
            <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 text-sm px-3 py-1">
              {pendingCount} Pending Review
            </Badge>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><Users className="h-8 w-8 text-blue-500" /><div><p className="text-xs text-muted-foreground">Total Affiliates</p><p className="text-xl font-bold text-foreground">{affiliates.length}</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><MousePointerClick className="h-8 w-8 text-purple-500" /><div><p className="text-xs text-muted-foreground">Total Clicks</p><p className="text-xl font-bold text-foreground">{totalClicks}</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><TrendingUp className="h-8 w-8 text-green-500" /><div><p className="text-xs text-muted-foreground">Conversions</p><p className="text-xl font-bold text-foreground">{conversions.length}</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><DollarSign className="h-8 w-8 text-accent" /><div><p className="text-xs text-muted-foreground">Total Earnings</p><p className="text-xl font-bold text-foreground">৳{totalEarnings.toFixed(0)}</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><Wallet className="h-8 w-8 text-orange-500" /><div><p className="text-xs text-muted-foreground">Total Paid</p><p className="text-xl font-bold text-foreground">৳{totalPaid.toFixed(0)}</p></div></div></CardContent></Card>
        </div>

        <Tabs defaultValue="affiliates">
          <TabsList>
            <TabsTrigger value="affiliates">Affiliates ({affiliates.length})</TabsTrigger>
            <TabsTrigger value="conversions">Conversions ({conversions.length})</TabsTrigger>
            <TabsTrigger value="payouts">Payouts ({payouts.length})</TabsTrigger>
          </TabsList>

          {/* ===== AFFILIATES TAB ===== */}
          <TabsContent value="affiliates" className="space-y-4">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by code, email, name, phone..." className="pl-9" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card>
              <CardContent className="pt-4 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Affiliate</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Referral Code</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Clicks</TableHead>
                      <TableHead>Conv.</TableHead>
                      <TableHead>Earnings</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Applied</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={11} className="text-center py-12"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
                    ) : filteredAffiliates.length === 0 ? (
                      <TableRow><TableCell colSpan={11} className="text-center py-12 text-muted-foreground">No affiliates found</TableCell></TableRow>
                    ) : (
                      filteredAffiliates.map(a => (
                        <TableRow key={a.id} className="hover:bg-muted/50">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center text-xs font-bold text-accent">
                                {a.profile?.first_name?.[0] || a.profile?.email?.[0]?.toUpperCase() || '?'}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-foreground">
                                  {a.profile ? `${a.profile.first_name || ''} ${a.profile.last_name || ''}`.trim() || 'No Name' : 'Unknown'}
                                </p>
                                <p className="text-xs text-muted-foreground">{a.profile?.email || '-'}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs space-y-0.5">
                              {a.profile?.phone && <p className="flex items-center gap-1"><Phone className="h-3 w-3" />{a.profile.phone}</p>}
                              {a.profile?.city && <p className="flex items-center gap-1 text-muted-foreground"><MapPin className="h-3 w-3" />{a.profile.city}</p>}
                            </div>
                          </TableCell>
                          <TableCell><code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{a.referral_code}</code></TableCell>
                          <TableCell>{statusBadge(a.status)}</TableCell>
                          <TableCell className="font-medium">{a.commission_rate}%</TableCell>
                          <TableCell>{a.total_clicks || 0}</TableCell>
                          <TableCell>{a.total_conversions || 0}</TableCell>
                          <TableCell className="font-medium text-accent">৳{(a.total_earnings || 0).toFixed(0)}</TableCell>
                          <TableCell><span className="capitalize text-xs">{a.payment_method || '-'}</span></TableCell>
                          <TableCell className="text-xs text-muted-foreground">{format(new Date(a.created_at), 'dd MMM yy')}</TableCell>
                          <TableCell>
                            <div className="flex gap-1 justify-end">
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="View Details" onClick={() => viewDetail(a.id)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              {a.status === 'pending' && (
                                <>
                                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-green-600 hover:text-green-700" title="Approve"
                                    disabled={actionLoading === a.id + 'approved'}
                                    onClick={() => handleQuickAction(a.id, 'approved', 'Approved')}>
                                    {actionLoading === a.id + 'approved' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-600 hover:text-red-700" title="Reject"
                                    disabled={actionLoading === a.id + 'rejected'}
                                    onClick={() => handleQuickAction(a.id, 'rejected', 'Rejected')}>
                                    {actionLoading === a.id + 'rejected' ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                                  </Button>
                                </>
                              )}
                              {a.status === 'approved' && (
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-yellow-600" title="Suspend"
                                  onClick={() => handleQuickAction(a.id, 'suspended', 'Suspended')}>
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              )}
                              {a.status === 'suspended' && (
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-green-600" title="Reactivate"
                                  onClick={() => handleQuickAction(a.id, 'approved', 'Reactivated')}>
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              )}
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Edit"
                                onClick={() => { setEditModal(a); setEditForm({ status: a.status, commission_rate: String(a.commission_rate), admin_notes: a.admin_notes || '' }); }}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" title="Delete"
                                disabled={actionLoading === a.id + 'delete'}
                                onClick={() => handleDeleteAffiliate(a.id, a.referral_code)}>
                                {actionLoading === a.id + 'delete' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== CONVERSIONS TAB ===== */}
          <TabsContent value="conversions">
            <Card>
              <CardContent className="pt-4 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Affiliate Code</TableHead>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Order Total</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                    ) : conversions.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No conversions yet</TableCell></TableRow>
                    ) : (
                      conversions.map(c => (
                        <TableRow key={c.id}>
                          <TableCell className="text-sm">{format(new Date(c.created_at), 'dd MMM yyyy, hh:mm a')}</TableCell>
                          <TableCell><code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{c.affiliates?.referral_code || '-'}</code></TableCell>
                          <TableCell className="text-xs font-mono">{c.order_id?.slice(0, 8) || '-'}</TableCell>
                          <TableCell className="font-medium">৳{c.order_total?.toFixed(0)}</TableCell>
                          <TableCell className="font-bold text-accent">৳{c.commission_amount?.toFixed(2)}</TableCell>
                          <TableCell>{statusBadge(c.status)}</TableCell>
                          <TableCell>
                            <div className="flex gap-1 justify-end">
                              {c.status === 'pending' && (
                                <>
                                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-green-600" title="Approve"
                                    disabled={actionLoading === c.id + 'approved'}
                                    onClick={() => handleConversionAction(c.id, 'approved')}>
                                    {actionLoading === c.id + 'approved' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-600" title="Reject"
                                    disabled={actionLoading === c.id + 'rejected'}
                                    onClick={() => handleConversionAction(c.id, 'rejected')}>
                                    {actionLoading === c.id + 'rejected' ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== PAYOUTS TAB ===== */}
          <TabsContent value="payouts">
            <Card>
              <CardContent className="pt-4 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Affiliate</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={8} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                    ) : payouts.length === 0 ? (
                      <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No payouts yet</TableCell></TableRow>
                    ) : (
                      payouts.map(p => (
                        <TableRow key={p.id}>
                          <TableCell className="text-sm">{format(new Date(p.created_at), 'dd MMM yyyy')}</TableCell>
                          <TableCell><code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{p.affiliates?.referral_code || '-'}</code></TableCell>
                          <TableCell className="font-bold">৳{p.amount?.toFixed(0)}</TableCell>
                          <TableCell className="capitalize text-sm">{p.payment_method || '-'}</TableCell>
                          <TableCell className="text-xs font-mono">{p.transaction_id || '-'}</TableCell>
                          <TableCell>{statusBadge(p.status)}</TableCell>
                          <TableCell className="text-xs max-w-[150px] truncate">{p.admin_notes || '-'}</TableCell>
                          <TableCell>
                            <div className="flex justify-end">
                              {p.status === 'pending' && (
                                <Button size="sm" variant="outline" className="h-7 text-xs"
                                  onClick={() => { setPayoutModal(p); setPayoutForm({ status: 'completed', transaction_id: '', admin_notes: '' }); }}>
                                  Process
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ===== DETAIL MODAL ===== */}
        <Dialog open={!!detailModal || detailLoading} onOpenChange={() => { setDetailModal(null); setDetailLoading(false); }}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            {detailLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>
            ) : detailModal ? (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center text-lg font-bold text-accent">
                      {detailModal.profile?.first_name?.[0] || '?'}
                    </div>
                    <div>
                      <span className="text-foreground">{detailModal.profile ? `${detailModal.profile.first_name || ''} ${detailModal.profile.last_name || ''}`.trim() || 'Unknown' : 'Unknown'}</span>
                      <p className="text-xs font-normal text-muted-foreground mt-0.5">{detailModal.affiliate?.referral_code}</p>
                    </div>
                    <div className="ml-auto">{statusBadge(detailModal.affiliate?.status)}</div>
                  </DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-muted-foreground" /><span>{detailModal.profile?.email || '-'}</span></div>
                  <div className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-muted-foreground" /><span>{detailModal.profile?.phone || '-'}</span></div>
                  <div className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4 text-muted-foreground" /><span>{[detailModal.profile?.address, detailModal.profile?.city].filter(Boolean).join(', ') || '-'}</span></div>
                  <div className="flex items-center gap-2 text-sm"><Calendar className="h-4 w-4 text-muted-foreground" /><span>Joined {format(new Date(detailModal.affiliate?.created_at), 'dd MMM yyyy')}</span></div>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <div className="text-center p-3 border rounded-lg"><p className="text-2xl font-bold text-foreground">{detailModal.affiliate?.total_clicks || 0}</p><p className="text-xs text-muted-foreground">Clicks</p></div>
                  <div className="text-center p-3 border rounded-lg"><p className="text-2xl font-bold text-foreground">{detailModal.affiliate?.total_conversions || 0}</p><p className="text-xs text-muted-foreground">Conversions</p></div>
                  <div className="text-center p-3 border rounded-lg"><p className="text-2xl font-bold text-accent">৳{(detailModal.affiliate?.total_earnings || 0).toFixed(0)}</p><p className="text-xs text-muted-foreground">Earnings</p></div>
                  <div className="text-center p-3 border rounded-lg"><p className="text-2xl font-bold text-foreground">৳{(detailModal.affiliate?.total_paid || 0).toFixed(0)}</p><p className="text-xs text-muted-foreground">Paid</p></div>
                </div>

                <div className="grid grid-cols-2 gap-4 p-3 border rounded-lg">
                  <div><p className="text-xs text-muted-foreground">Commission Rate</p><p className="font-bold text-foreground">{detailModal.affiliate?.commission_rate}%</p></div>
                  <div><p className="text-xs text-muted-foreground">Payment Method</p><p className="font-medium capitalize text-foreground">{detailModal.affiliate?.payment_method || '-'}</p></div>
                  <div><p className="text-xs text-muted-foreground">Pending Balance</p><p className="font-bold text-accent">৳{((detailModal.affiliate?.total_earnings || 0) - (detailModal.affiliate?.total_paid || 0)).toFixed(0)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Payment Details</p><p className="text-xs text-foreground">{JSON.stringify(detailModal.affiliate?.payment_details) !== '{}' ? JSON.stringify(detailModal.affiliate?.payment_details) : 'Not set'}</p></div>
                </div>

                {detailModal.affiliate?.admin_notes && (
                  <div className="p-3 border rounded-lg bg-yellow-50 dark:bg-yellow-900/10">
                    <p className="text-xs text-muted-foreground mb-1">Admin Notes</p>
                    <p className="text-sm text-foreground">{detailModal.affiliate.admin_notes}</p>
                  </div>
                )}

                {/* Application details */}
                <div className="p-3 border rounded-lg space-y-2">
                  <p className="text-sm font-semibold text-foreground">Application Details</p>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div><span className="text-muted-foreground">Full name:</span> <span className="text-foreground">{detailModal.affiliate?.full_name || '-'}</span></div>
                    <div><span className="text-muted-foreground">Phone:</span> <span className="text-foreground">{detailModal.affiliate?.phone || '-'}</span></div>
                    <div className="col-span-2"><span className="text-muted-foreground">Address:</span> <span className="text-foreground">{detailModal.affiliate?.address || '-'}</span></div>
                    <div className="col-span-2"><span className="text-muted-foreground">Website:</span>{' '}
                      {detailModal.affiliate?.website
                        ? <a href={detailModal.affiliate.website} target="_blank" rel="noopener noreferrer" className="text-accent underline">{detailModal.affiliate.website}</a>
                        : <span className="text-foreground">-</span>}
                    </div>
                    <div><span className="text-muted-foreground">Audience size:</span> <span className="text-foreground">{detailModal.affiliate?.audience_size || '-'}</span></div>
                    <div><span className="text-muted-foreground">Terms accepted:</span> <span className="text-foreground">{detailModal.affiliate?.terms_accepted ? 'Yes' : 'No'}</span></div>
                    <div className="col-span-2"><span className="text-muted-foreground">Channels:</span> <span className="text-foreground">{(detailModal.affiliate?.marketing_channels || []).join(', ') || '-'}</span></div>
                    {detailModal.affiliate?.social_handles && Object.values(detailModal.affiliate.social_handles).some(Boolean) && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Social:</span>{' '}
                        <span className="text-foreground">
                          {Object.entries(detailModal.affiliate.social_handles)
                            .filter(([, v]) => !!v)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(' · ')}
                        </span>
                      </div>
                    )}
                    {detailModal.affiliate?.bio && (
                      <div className="col-span-2"><span className="text-muted-foreground">Bio:</span> <span className="text-foreground">{detailModal.affiliate.bio}</span></div>
                    )}
                  </div>
                </div>

                {detailModal.clicks?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-foreground">Recent Clicks ({detailModal.clicks.length})</h4>
                    <div className="max-h-40 overflow-y-auto border rounded-lg">
                      <Table>
                        <TableHeader><TableRow><TableHead className="text-xs">Date</TableHead><TableHead className="text-xs">Landing Page</TableHead><TableHead className="text-xs">IP</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {detailModal.clicks.slice(0, 20).map((c: any) => (
                            <TableRow key={c.id}>
                              <TableCell className="text-xs py-1">{format(new Date(c.created_at), 'dd MMM, hh:mm a')}</TableCell>
                              <TableCell className="text-xs py-1">{c.landing_page || '/'}</TableCell>
                              <TableCell className="text-xs py-1 font-mono">{c.ip_address || '-'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                {detailModal.conversions?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-foreground">Conversions ({detailModal.conversions.length})</h4>
                    <div className="max-h-40 overflow-y-auto border rounded-lg">
                      <Table>
                        <TableHeader><TableRow><TableHead className="text-xs">Date</TableHead><TableHead className="text-xs">Order Total</TableHead><TableHead className="text-xs">Commission</TableHead><TableHead className="text-xs">Status</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {detailModal.conversions.map((c: any) => (
                            <TableRow key={c.id}>
                              <TableCell className="text-xs py-1">{format(new Date(c.created_at), 'dd MMM yyyy')}</TableCell>
                              <TableCell className="text-xs py-1">৳{c.order_total?.toFixed(0)}</TableCell>
                              <TableCell className="text-xs py-1 font-bold text-accent">৳{c.commission_amount?.toFixed(2)}</TableCell>
                              <TableCell className="py-1">{statusBadge(c.status)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                {detailModal.payouts?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-foreground">Payouts ({detailModal.payouts.length})</h4>
                    <div className="max-h-40 overflow-y-auto border rounded-lg">
                      <Table>
                        <TableHeader><TableRow><TableHead className="text-xs">Date</TableHead><TableHead className="text-xs">Amount</TableHead><TableHead className="text-xs">Method</TableHead><TableHead className="text-xs">Status</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {detailModal.payouts.map((p: any) => (
                            <TableRow key={p.id}>
                              <TableCell className="text-xs py-1">{format(new Date(p.created_at), 'dd MMM yyyy')}</TableCell>
                              <TableCell className="text-xs py-1 font-bold">৳{p.amount?.toFixed(0)}</TableCell>
                              <TableCell className="text-xs py-1 capitalize">{p.payment_method || '-'}</TableCell>
                              <TableCell className="py-1">{statusBadge(p.status)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </DialogContent>
        </Dialog>

        {/* ===== EDIT MODAL ===== */}
        <Dialog open={!!editModal} onOpenChange={() => setEditModal(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Affiliate — {editModal?.referral_code}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Status</Label>
                <Select value={editForm.status} onValueChange={v => setEditForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Commission Rate (%)</Label>
                <Input type="number" min={0} max={100} value={editForm.commission_rate} onChange={e => setEditForm(f => ({ ...f, commission_rate: e.target.value }))} />
              </div>
              <div>
                <Label>Admin Notes</Label>
                <Textarea rows={3} value={editForm.admin_notes} onChange={e => setEditForm(f => ({ ...f, admin_notes: e.target.value }))} placeholder="Internal notes about this affiliate..." />
              </div>
              {editModal?.profile && (
                <div className="p-3 bg-muted/50 rounded-lg text-xs space-y-1">
                  <p className="font-semibold text-foreground">Applicant Info</p>
                  <p>Name: {editModal.profile.first_name} {editModal.profile.last_name}</p>
                  <p>Email: {editModal.profile.email}</p>
                  <p>Phone: {editModal.profile.phone || '-'}</p>
                  <p>Payment: {editModal.payment_method} — {JSON.stringify(editModal.payment_details) !== '{}' ? JSON.stringify(editModal.payment_details) : 'Not set'}</p>
                </div>
              )}
              <Button onClick={handleUpdateAffiliate} variant="accent" className="w-full">Save Changes</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* ===== PROCESS PAYOUT MODAL ===== */}
        <Dialog open={!!payoutModal} onOpenChange={() => setPayoutModal(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Process Payout — ৳{payoutModal?.amount?.toFixed(0)}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-3 bg-muted/50 rounded-lg text-sm">
                <p>Affiliate: <code className="font-mono">{payoutModal?.affiliates?.referral_code || '-'}</code></p>
                <p>Method: <span className="capitalize font-medium">{payoutModal?.payment_method || '-'}</span></p>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={payoutForm.status} onValueChange={v => setPayoutForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="pending">Keep Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Transaction ID</Label>
                <Input value={payoutForm.transaction_id} onChange={e => setPayoutForm(f => ({ ...f, transaction_id: e.target.value }))} placeholder="TXN-XXXX" />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea rows={2} value={payoutForm.admin_notes} onChange={e => setPayoutForm(f => ({ ...f, admin_notes: e.target.value }))} />
              </div>
              <Button onClick={handleProcessPayout} variant="accent" className="w-full">Process Payout</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminAffiliateProgram;