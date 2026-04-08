import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Settings } from 'lucide-react';

export default function AdminRefundConfig() {
  const [config, setConfig] = useState({
    enabled: true,
    refundWindow: 14,
    autoApproveBelow: 500,
    requireImages: true,
    maxRefundPercent: 100,
    refundMethods: ['original_payment', 'store_credit', 'bank_transfer'],
    defaultMethod: 'original_payment',
    processingDays: 7,
    notifyCustomer: true,
    notifySeller: true,
  });

  const handleSave = () => toast.success('Refund configuration saved');

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Settings className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Refund Configuration</h1>
            <p className="text-muted-foreground">Configure refund policies and automation</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>General Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between"><Label>Enable Refund System</Label><Switch checked={config.enabled} onCheckedChange={v => setConfig(p => ({ ...p, enabled: v }))} /></div>
              <div><Label>Refund Window (days)</Label><Input type="number" value={config.refundWindow} onChange={e => setConfig(p => ({ ...p, refundWindow: +e.target.value }))} /></div>
              <div><Label>Auto-approve below (৳)</Label><Input type="number" value={config.autoApproveBelow} onChange={e => setConfig(p => ({ ...p, autoApproveBelow: +e.target.value }))} /><p className="text-xs text-muted-foreground mt-1">Refunds below this amount will be auto-approved</p></div>
              <div><Label>Max Refund %</Label><Input type="number" value={config.maxRefundPercent} onChange={e => setConfig(p => ({ ...p, maxRefundPercent: +e.target.value }))} /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Refund Methods</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Default Refund Method</Label>
                <Select value={config.defaultMethod} onValueChange={v => setConfig(p => ({ ...p, defaultMethod: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="original_payment">Original Payment Method</SelectItem>
                    <SelectItem value="store_credit">Store Credit</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Processing Days</Label><Input type="number" value={config.processingDays} onChange={e => setConfig(p => ({ ...p, processingDays: +e.target.value }))} /></div>
              <div className="flex items-center justify-between"><Label>Require Images</Label><Switch checked={config.requireImages} onCheckedChange={v => setConfig(p => ({ ...p, requireImages: v }))} /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Notifications</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between"><Label>Notify Customer</Label><Switch checked={config.notifyCustomer} onCheckedChange={v => setConfig(p => ({ ...p, notifyCustomer: v }))} /></div>
              <div className="flex items-center justify-between"><Label>Notify Seller</Label><Switch checked={config.notifySeller} onCheckedChange={v => setConfig(p => ({ ...p, notifySeller: v }))} /></div>
            </CardContent>
          </Card>
        </div>

        <Button onClick={handleSave} size="lg">Save Configuration</Button>
      </div>
    </AdminLayout>
  );
}
