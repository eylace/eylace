import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save } from 'lucide-react';

interface PreorderConfig {
  defaultAdvancePercent: number;
  autoConfirmOrders: boolean;
  maxPreorderDays: number;
  enableNotifications: boolean;
  minAdvanceAmount: number;
  allowCancellation: boolean;
  cancellationWindowHours: number;
}

const DEFAULT_CONFIG: PreorderConfig = {
  defaultAdvancePercent: 20,
  autoConfirmOrders: false,
  maxPreorderDays: 90,
  enableNotifications: true,
  minAdvanceAmount: 100,
  allowCancellation: true,
  cancellationWindowHours: 24,
};

export default function AdminPreorderSettings() {
  const { toast } = useToast();
  const [config, setConfig] = useState<PreorderConfig>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('preorder_settings').select('*').eq('key', 'global_config').single();
      if (data?.value) setConfig({ ...DEFAULT_CONFIG, ...(data.value as any) });
      setIsLoading(false);
    };
    fetch();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    const { error } = await supabase.from('preorder_settings').upsert({ key: 'global_config', value: config as any, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    if (error) {
      toast({ title: 'Error saving settings', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Settings saved successfully' });
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return <AdminLayout><div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></AdminLayout>;
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Preorder Settings</h1>
          <p className="text-muted-foreground">Configure global preorder module settings</p>
        </div>

        <Card>
          <CardHeader><CardTitle>General Configuration</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Default Advance (%)</Label>
                <Input type="number" value={config.defaultAdvancePercent} onChange={e => setConfig(c => ({ ...c, defaultAdvancePercent: Number(e.target.value) }))} />
              </div>
              <div className="space-y-2">
                <Label>Min Advance Amount (৳)</Label>
                <Input type="number" value={config.minAdvanceAmount} onChange={e => setConfig(c => ({ ...c, minAdvanceAmount: Number(e.target.value) }))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Max Preorder Days</Label>
                <Input type="number" value={config.maxPreorderDays} onChange={e => setConfig(c => ({ ...c, maxPreorderDays: Number(e.target.value) }))} />
              </div>
              <div className="space-y-2">
                <Label>Cancellation Window (hours)</Label>
                <Input type="number" value={config.cancellationWindowHours} onChange={e => setConfig(c => ({ ...c, cancellationWindowHours: Number(e.target.value) }))} />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium text-sm">Auto-Confirm Orders</p>
                  <p className="text-xs text-muted-foreground">Automatically confirm preorder orders</p>
                </div>
                <Switch checked={config.autoConfirmOrders} onCheckedChange={v => setConfig(c => ({ ...c, autoConfirmOrders: v }))} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium text-sm">Enable Notifications</p>
                  <p className="text-xs text-muted-foreground">Send notifications for preorder events</p>
                </div>
                <Switch checked={config.enableNotifications} onCheckedChange={v => setConfig(c => ({ ...c, enableNotifications: v }))} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium text-sm">Allow Cancellation</p>
                  <p className="text-xs text-muted-foreground">Allow customers to cancel preorders</p>
                </div>
                <Switch checked={config.allowCancellation} onCheckedChange={v => setConfig(c => ({ ...c, allowCancellation: v }))} />
              </div>
            </div>

            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
