import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Save } from 'lucide-react';

export default function AdminAffiliateConfig() {
  const [config, setConfig] = useState({
    enabled: true,
    defaultCommission: 5,
    cookieDays: 30,
    minPayout: 500,
    payoutFrequency: 'monthly',
    autoApproveConversions: false,
    trackReturns: true,
    allowSelfReferral: false,
    multiLevelEnabled: false,
    secondTierCommission: 2,
  });

  const handleSave = () => toast.success('Affiliate configuration saved');

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Affiliate Configurations</h1>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>General</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between"><Label>Enable Affiliate System</Label><Switch checked={config.enabled} onCheckedChange={v => setConfig(p => ({ ...p, enabled: v }))} /></div>
              <div><Label>Default Commission (%)</Label><Input type="number" value={config.defaultCommission} onChange={e => setConfig(p => ({ ...p, defaultCommission: +e.target.value }))} /></div>
              <div><Label>Cookie Duration (days)</Label><Input type="number" value={config.cookieDays} onChange={e => setConfig(p => ({ ...p, cookieDays: +e.target.value }))} /></div>
              <div className="flex items-center justify-between"><Label>Allow Self-Referral</Label><Switch checked={config.allowSelfReferral} onCheckedChange={v => setConfig(p => ({ ...p, allowSelfReferral: v }))} /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Payout Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Minimum Payout (৳)</Label><Input type="number" value={config.minPayout} onChange={e => setConfig(p => ({ ...p, minPayout: +e.target.value }))} /></div>
              <div><Label>Payout Frequency</Label>
                <Select value={config.payoutFrequency} onValueChange={v => setConfig(p => ({ ...p, payoutFrequency: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Bi-weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between"><Label>Auto-approve Conversions</Label><Switch checked={config.autoApproveConversions} onCheckedChange={v => setConfig(p => ({ ...p, autoApproveConversions: v }))} /></div>
              <div className="flex items-center justify-between"><Label>Track Returns</Label><Switch checked={config.trackReturns} onCheckedChange={v => setConfig(p => ({ ...p, trackReturns: v }))} /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Multi-Level</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between"><Label>Enable Multi-Level</Label><Switch checked={config.multiLevelEnabled} onCheckedChange={v => setConfig(p => ({ ...p, multiLevelEnabled: v }))} /></div>
              {config.multiLevelEnabled && <div><Label>2nd Tier Commission (%)</Label><Input type="number" value={config.secondTierCommission} onChange={e => setConfig(p => ({ ...p, secondTierCommission: +e.target.value }))} /></div>}
            </CardContent>
          </Card>
        </div>

        <Button onClick={handleSave} size="lg"><Save className="h-4 w-4 mr-2" />Save Configuration</Button>
      </div>
    </AdminLayout>
  );
}
