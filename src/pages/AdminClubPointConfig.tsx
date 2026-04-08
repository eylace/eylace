import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Award, Settings } from 'lucide-react';

export default function AdminClubPointConfig() {
  const [config, setConfig] = useState({
    enabled: true,
    pointsPerPurchase: 1,
    purchaseAmount: 100,
    minPointsRedeem: 100,
    pointValue: 1,
    maxRedeemPerOrder: 50,
    enableOnSignup: true,
    signupBonus: 50,
    enableOnReview: true,
    reviewBonus: 10,
  });

  const handleSave = () => toast.success('Club Point configuration saved');

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Award className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Club Point Configurations</h1>
            <p className="text-muted-foreground">Configure how customers earn and redeem points</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>General Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Enable Club Point System</Label>
                <Switch checked={config.enabled} onCheckedChange={v => setConfig(p => ({ ...p, enabled: v }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Points per Purchase</Label><Input type="number" value={config.pointsPerPurchase} onChange={e => setConfig(p => ({ ...p, pointsPerPurchase: +e.target.value }))} /></div>
                <div><Label>Per Amount (৳)</Label><Input type="number" value={config.purchaseAmount} onChange={e => setConfig(p => ({ ...p, purchaseAmount: +e.target.value }))} /></div>
              </div>
              <p className="text-xs text-muted-foreground">Customer earns {config.pointsPerPurchase} point(s) for every ৳{config.purchaseAmount} spent</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Redemption Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Minimum Points to Redeem</Label><Input type="number" value={config.minPointsRedeem} onChange={e => setConfig(p => ({ ...p, minPointsRedeem: +e.target.value }))} /></div>
              <div><Label>Point Value (৳ per point)</Label><Input type="number" value={config.pointValue} onChange={e => setConfig(p => ({ ...p, pointValue: +e.target.value }))} /></div>
              <div><Label>Max Redeem % per Order</Label><Input type="number" value={config.maxRedeemPerOrder} onChange={e => setConfig(p => ({ ...p, maxRedeemPerOrder: +e.target.value }))} /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Bonus Points</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Signup Bonus</Label>
                <Switch checked={config.enableOnSignup} onCheckedChange={v => setConfig(p => ({ ...p, enableOnSignup: v }))} />
              </div>
              {config.enableOnSignup && <div><Label>Signup Bonus Points</Label><Input type="number" value={config.signupBonus} onChange={e => setConfig(p => ({ ...p, signupBonus: +e.target.value }))} /></div>}
              <div className="flex items-center justify-between">
                <Label>Review Bonus</Label>
                <Switch checked={config.enableOnReview} onCheckedChange={v => setConfig(p => ({ ...p, enableOnReview: v }))} />
              </div>
              {config.enableOnReview && <div><Label>Review Bonus Points</Label><Input type="number" value={config.reviewBonus} onChange={e => setConfig(p => ({ ...p, reviewBonus: +e.target.value }))} /></div>}
            </CardContent>
          </Card>
        </div>

        <Button onClick={handleSave} size="lg">Save Configuration</Button>
      </div>
    </AdminLayout>
  );
}
