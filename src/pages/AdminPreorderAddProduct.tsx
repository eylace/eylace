import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft } from 'lucide-react';

export default function AdminPreorderAddProduct() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [products, setProducts] = useState<{ id: string; name: string; price: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    product_id: '',
    preorder_price: '',
    advance_amount: '',
    advance_type: 'percentage',
    estimated_delivery: '',
    max_quantity: '100',
  });

  useEffect(() => {
    supabase.from('products').select('id, name, price').eq('is_active', true).order('name').then(({ data }) => {
      setProducts(data || []);
      setIsLoading(false);
    });
  }, []);

  const handleSave = async () => {
    if (!form.product_id) {
      toast({ title: 'Please select a product', variant: 'destructive' });
      return;
    }
    setIsSaving(true);
    const { error } = await supabase.from('preorder_products').insert({
      product_id: form.product_id,
      preorder_price: parseFloat(form.preorder_price) || 0,
      advance_amount: parseFloat(form.advance_amount) || 0,
      advance_type: form.advance_type,
      estimated_delivery: form.estimated_delivery || null,
      max_quantity: parseInt(form.max_quantity) || 100,
    });

    if (error) {
      toast({ title: 'Error creating preorder product', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Preorder product created successfully' });
      navigate('/admin/preorder/products');
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return <AdminLayout><div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></AdminLayout>;
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/preorder/products')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Add New Preorder Product</h1>
            <p className="text-muted-foreground">Configure a product for preorder</p>
          </div>
        </div>

        <Card>
          <CardHeader><CardTitle>Preorder Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Select Product *</Label>
              <Select value={form.product_id} onValueChange={(v) => setForm(f => ({ ...f, product_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Choose a product" /></SelectTrigger>
                <SelectContent>
                  {products.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name} (৳{p.price})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Preorder Price (৳)</Label>
                <Input type="number" value={form.preorder_price} onChange={e => setForm(f => ({ ...f, preorder_price: e.target.value }))} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>Max Quantity</Label>
                <Input type="number" value={form.max_quantity} onChange={e => setForm(f => ({ ...f, max_quantity: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Advance Amount</Label>
                <Input type="number" value={form.advance_amount} onChange={e => setForm(f => ({ ...f, advance_amount: e.target.value }))} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>Advance Type</Label>
                <Select value={form.advance_type} onValueChange={(v) => setForm(f => ({ ...f, advance_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount (৳)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Estimated Delivery Date</Label>
              <Input type="datetime-local" value={form.estimated_delivery} onChange={e => setForm(f => ({ ...f, estimated_delivery: e.target.value }))} />
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Create Preorder Product
              </Button>
              <Button variant="outline" onClick={() => navigate('/admin/preorder/products')}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
