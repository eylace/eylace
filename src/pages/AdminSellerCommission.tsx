import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Loader2, Percent, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const AdminSellerCommission = () => {
  const [defaultRate, setDefaultRate] = useState('10');
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('system_settings').select('value').eq('key', 'default_seller_commission').single();
      if (data?.value) setDefaultRate(String((data.value as any).rate || 10));
      setIsLoading(false);
    };
    load();
  }, []);

  const save = async () => {
    setSaving(true);
    const { data: existing } = await supabase.from('system_settings').select('id').eq('key', 'default_seller_commission').single();
    if (existing) {
      await supabase.from('system_settings').update({ value: { rate: parseFloat(defaultRate) } }).eq('key', 'default_seller_commission');
    } else {
      await supabase.from('system_settings').insert({ key: 'default_seller_commission', value: { rate: parseFloat(defaultRate) } });
    }
    toast.success('Commission rate saved');
    setSaving(false);
  };

  if (isLoading) return <AdminLayout titleKey="admin.sellers.commission" descriptionKey="admin.sellers.commissionDesc"><div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div></AdminLayout>;

  return (
    <AdminLayout titleKey="admin.sellers.commission" descriptionKey="admin.sellers.commissionDesc">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Percent className="h-5 w-5" /> Seller Commission</CardTitle>
          <CardDescription>Set the default commission rate for all sellers. Override per seller or per category in their respective pages.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-xs space-y-2">
            <Label>Default Commission Rate (%)</Label>
            <Input type="number" min={0} max={100} value={defaultRate} onChange={e => setDefaultRate(e.target.value)} />
          </div>
          <Button onClick={save} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}<Save className="h-4 w-4 mr-1" /> Save</Button>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminSellerCommission;
