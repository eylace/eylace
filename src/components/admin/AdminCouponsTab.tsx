import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Loader2, Tag, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  min_order_amount: number | null;
  max_discount: number | null;
  usage_limit: number | null;
  used_count: number;
  is_active: boolean;
  starts_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export const AdminCouponsTab = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form state
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [minOrderAmount, setMinOrderAmount] = useState('');
  const [maxDiscount, setMaxDiscount] = useState('');
  const [usageLimit, setUsageLimit] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  const fetchCoupons = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) setCoupons(data as unknown as Coupon[]);
    setLoading(false);
  };

  useEffect(() => { fetchCoupons(); }, []);

  const resetForm = () => {
    setCode(''); setDescription(''); setDiscountType('percentage');
    setDiscountValue(''); setMinOrderAmount(''); setMaxDiscount('');
    setUsageLimit(''); setExpiresAt(''); setEditingCoupon(null);
  };

  const openEdit = (c: Coupon) => {
    setEditingCoupon(c);
    setCode(c.code);
    setDescription(c.description || '');
    setDiscountType(c.discount_type);
    setDiscountValue(String(c.discount_value));
    setMinOrderAmount(c.min_order_amount ? String(c.min_order_amount) : '');
    setMaxDiscount(c.max_discount ? String(c.max_discount) : '');
    setUsageLimit(c.usage_limit ? String(c.usage_limit) : '');
    setExpiresAt(c.expires_at ? c.expires_at.slice(0, 16) : '');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!code || !discountValue) { toast.error('Code and discount value are required'); return; }

    const payload = {
      code: code.toUpperCase().trim(),
      description: description || null,
      discount_type: discountType,
      discount_value: parseFloat(discountValue),
      min_order_amount: minOrderAmount ? parseFloat(minOrderAmount) : 0,
      max_discount: maxDiscount ? parseFloat(maxDiscount) : null,
      usage_limit: usageLimit ? parseInt(usageLimit) : null,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
    };

    let error;
    if (editingCoupon) {
      ({ error } = await supabase.from('coupons').update(payload).eq('id', editingCoupon.id));
    } else {
      ({ error } = await supabase.from('coupons').insert(payload));
    }

    if (error) { toast.error(error.message); return; }
    toast.success(editingCoupon ? 'Coupon updated' : 'Coupon created');
    setDialogOpen(false);
    resetForm();
    fetchCoupons();
  };

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from('coupons').update({ is_active: active }).eq('id', id);
    fetchCoupons();
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm('Delete this coupon?')) return;
    await supabase.from('coupons').delete().eq('id', id);
    toast.success('Coupon deleted');
    fetchCoupons();
  };

  const copyCode = (id: string, c: string) => {
    navigator.clipboard.writeText(c);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Coupons & Promo Codes</h2>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button variant="accent" size="sm"><Plus className="h-4 w-4 mr-2" />Add Coupon</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingCoupon ? 'Edit Coupon' : 'Create Coupon'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Code *</Label>
                <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="SAVE20" />
              </div>
              <div>
                <Label>Description</Label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="20% off all orders" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Discount Type</Label>
                  <Select value={discountType} onValueChange={setDiscountType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Value *</Label>
                  <Input type="number" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} placeholder={discountType === 'percentage' ? '20' : '10.00'} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Min Order ($)</Label>
                  <Input type="number" value={minOrderAmount} onChange={(e) => setMinOrderAmount(e.target.value)} placeholder="0" />
                </div>
                <div>
                  <Label>Max Discount ($)</Label>
                  <Input type="number" value={maxDiscount} onChange={(e) => setMaxDiscount(e.target.value)} placeholder="No limit" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Usage Limit</Label>
                  <Input type="number" value={usageLimit} onChange={(e) => setUsageLimit(e.target.value)} placeholder="Unlimited" />
                </div>
                <div>
                  <Label>Expires At</Label>
                  <Input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
                </div>
              </div>
              <Button onClick={handleSave} className="w-full" variant="accent">
                {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {coupons.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-lg">
          <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No coupons yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {coupons.map((c) => (
            <div key={c.id} className="flex items-center gap-4 p-4 bg-card border border-border rounded-lg">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <button onClick={() => copyCode(c.id, c.code)} className="font-mono font-bold text-foreground bg-secondary px-2 py-0.5 rounded flex items-center gap-1 hover:bg-accent/10 transition-colors">
                    {c.code}
                    {copiedId === c.id ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
                  </button>
                  <Badge variant={c.is_active ? 'default' : 'secondary'}>
                    {c.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <Badge variant="outline">
                    {c.discount_type === 'percentage' ? `${c.discount_value}%` : `$${c.discount_value}`} off
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {c.description || 'No description'}
                  {c.min_order_amount && c.min_order_amount > 0 ? ` • Min $${c.min_order_amount}` : ''}
                  {c.usage_limit ? ` • ${c.used_count}/${c.usage_limit} used` : ` • ${c.used_count} used`}
                  {c.expires_at ? ` • Expires ${format(new Date(c.expires_at), 'MMM d, yyyy')}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Switch checked={c.is_active} onCheckedChange={(v) => toggleActive(c.id, v)} />
                <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Edit2 className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteCoupon(c.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
