import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Loader2, Search, RotateCcw, Trash2, Eye, Save, CheckCircle2, X, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ReturnReceipt } from '@/components/orders/ReturnReceipt';

interface ReturnRequest {
  id: string;
  order_id: string;
  user_id: string;
  order_item_id: string | null;
  reason: string;
  description: string | null;
  status: string;
  refund_amount: number | null;
  refund_method: string | null;
  admin_notes: string | null;
  created_at: string;
  resolved_at: string | null;
  return_tracking_number?: string | null;
  order?: { id: string; order_number: string; user_id: string } | null;
  item?: { id: string; product_name: string; product_image: string | null; price: number; quantity: number } | null;
  profile?: { user_id: string; first_name: string | null; last_name: string | null; email: string | null } | null;
}

const statusOptions = ['pending', 'approved', 'rejected', 'refunded'];

const statusColors: Record<string, string> = {
  pending: 'bg-warning/10 text-warning border-warning/20',
  approved: 'bg-success/10 text-success border-success/20',
  rejected: 'bg-destructive/10 text-destructive border-destructive/20',
  refunded: 'bg-primary/10 text-primary border-primary/20',
};

export const AdminReturnsTab = () => {
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [detail, setDetail] = useState<ReturnRequest | null>(null);
  const [editStatus, setEditStatus] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchReturns = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke('admin-manage-returns', {
      body: { _action: 'get' },
    });
    if (!error && data?.returns) {
      setReturns(data.returns);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchReturns(); }, [fetchReturns]);

  const openDetail = (r: ReturnRequest) => {
    setDetail(r);
    setEditStatus(r.status);
    setEditNotes(r.admin_notes || '');
    setEditAmount(String(r.refund_amount || 0));
  };

  const handleSave = async () => {
    if (!detail) return;
    setSaving(true);
    const { error } = await supabase.functions.invoke('admin-manage-returns', {
      body: { _action: 'update', id: detail.id, status: editStatus, admin_notes: editNotes, refund_amount: Number(editAmount) },
    });
    setSaving(false);
    if (error) { toast.error('Failed to update'); return; }
    toast.success('Return request updated');
    setDetail(null);
    fetchReturns();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this return request?')) return;
    const { error } = await supabase.functions.invoke('admin-manage-returns', {
      body: { _action: 'delete', id },
    });
    if (error) { toast.error('Failed to delete'); return; }
    toast.success('Deleted');
    fetchReturns();
  };

  const filtered = returns.filter(r => {
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      const name = `${r.profile?.first_name || ''} ${r.profile?.last_name || ''}`.toLowerCase();
      const orderNum = r.order?.order_number?.toLowerCase() || '';
      const itemName = r.item?.product_name?.toLowerCase() || '';
      const rtn = r.return_tracking_number?.toLowerCase() || '';
      return name.includes(q) || orderNum.includes(q) || itemName.includes(q) || r.reason.toLowerCase().includes(q) || rtn.includes(q);
    }
    return true;
  });

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by order, customer, item, tracking #..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {statusOptions.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>RTN</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Refund</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
              <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  <RotateCcw className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  No return requests found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium text-sm">#{r.order?.order_number || '—'}</TableCell>
                  <TableCell>
                    {r.return_tracking_number ? (
                      <div className="flex items-center gap-1">
                        <code className="text-xs font-mono text-accent">{r.return_tracking_number}</code>
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => { navigator.clipboard.writeText(r.return_tracking_number!); toast.success('Copied!'); }}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-sm">
                    {r.profile ? `${r.profile.first_name || ''} ${r.profile.last_name || ''}`.trim() || r.profile.email : '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {r.item?.product_image && (
                        <img src={r.item.product_image} alt="" className="w-8 h-8 rounded object-cover" />
                      )}
                      <span className="text-sm truncate max-w-[120px]">{r.item?.product_name || '—'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm max-w-[150px] truncate">{r.reason}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn('capitalize text-xs', statusColors[r.status] || statusColors.pending)}>
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm font-medium">৳{Number(r.refund_amount || 0).toFixed(2)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{format(new Date(r.created_at), 'MMM d, yyyy')}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openDetail(r)}><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(r.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail / Edit Modal */}
      <Dialog open={!!detail} onOpenChange={() => setDetail(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-accent" />
              Return Request — #{detail?.order?.order_number}
            </DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-4">
              {detail.item && (
                <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                  {detail.item.product_image && (
                    <img src={detail.item.product_image} alt="" className="w-12 h-12 rounded object-cover" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{detail.item.product_name}</p>
                    <p className="text-xs text-muted-foreground">Qty: {detail.item.quantity} · ৳{(detail.item.price * detail.item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              )}

              {/* Progress Tracker */}
              {(() => {
                const isRejected = detail.status === 'rejected';
                const steps = isRejected
                  ? ['pending', 'approved', 'rejected']
                  : ['pending', 'approved', 'refunded'];
                const stepLabels = isRejected
                  ? ['Requested', 'Approved', 'Rejected']
                  : ['Requested', 'Approved', 'Refunded'];
                const currentIdx = steps.indexOf(detail.status);
                return (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Progress</Label>
                    <div className="flex items-center gap-1">
                      {steps.map((step, i) => {
                        const isActive = i <= currentIdx;
                        return (
                          <div key={step} className="flex-1 flex items-center gap-1">
                            <div className={cn(
                              'w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-colors',
                              isRejected && step === 'rejected' ? 'bg-destructive text-destructive-foreground' :
                              isActive ? 'bg-accent text-accent-foreground' : 'bg-secondary text-muted-foreground'
                            )}>
                              {isRejected && step === 'rejected' ? <X className="h-3.5 w-3.5" /> :
                               isActive ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                            </div>
                            {i < steps.length - 1 && (
                              <div className={cn('h-0.5 flex-1 rounded transition-colors', isActive && i < currentIdx ? 'bg-accent' : 'bg-border')} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground px-1">
                      {stepLabels.map((label) => (
                        <span key={label}>{label}</span>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Customer:</span> <span className="font-medium">{detail.profile ? `${detail.profile.first_name || ''} ${detail.profile.last_name || ''}`.trim() : '—'}</span></div>
                <div><span className="text-muted-foreground">Email:</span> <span className="font-medium">{detail.profile?.email || '—'}</span></div>
                <div><span className="text-muted-foreground">Reason:</span> <span className="font-medium">{detail.reason}</span></div>
                <div><span className="text-muted-foreground">Method:</span> <span className="font-medium capitalize">{detail.refund_method || '—'}</span></div>
              </div>

              {detail.description && (
                <div>
                  <Label className="text-xs text-muted-foreground">Customer Notes</Label>
                  <p className="text-sm bg-secondary/50 rounded p-2 mt-1">{detail.description}</p>
                </div>
              )}

              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Status</Label>
                  <Select value={editStatus} onValueChange={setEditStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {statusOptions.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label>Refund Amount (৳)</Label>
                  <Input type="number" value={editAmount} onChange={e => setEditAmount(e.target.value)} />
                </div>

                <div className="space-y-1">
                  <Label>Admin Notes</Label>
                  <Textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} placeholder="Internal notes..." rows={3} />
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setDetail(null)} className="flex-1">Cancel</Button>
                <Button onClick={handleSave} disabled={saving} className="flex-1">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
