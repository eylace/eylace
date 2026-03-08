import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart } from 'lucide-react';
import type { SettingsState } from '@/pages/AdminSettingsPage';

interface Props { settings: SettingsState; update: (key: string, value: any) => void; }

export const OrderConfigTab = ({ settings, update }: Props) => (
  <div className="space-y-4 mt-4">
    <Card className="border border-border">
      <CardHeader><CardTitle className="text-base flex items-center gap-2"><ShoppingCart className="h-5 w-5" /> Order Configuration</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Order Number Prefix</Label><Input value={settings.orderPrefix} onChange={e => update('orderPrefix', e.target.value)} /></div>
          <div className="space-y-2"><Label>Starting Order Number</Label><Input type="number" value={settings.orderStartNumber} onChange={e => update('orderStartNumber', e.target.value)} /></div>
          <div className="space-y-2"><Label>Minimum Order Amount</Label><Input type="number" value={settings.minOrderAmount} onChange={e => update('minOrderAmount', e.target.value)} /></div>
          <div className="space-y-2"><Label>Maximum Order Amount</Label><Input type="number" value={settings.maxOrderAmount} onChange={e => update('maxOrderAmount', e.target.value)} /></div>
        </div>

        <div className="flex items-center justify-between p-3 border border-border rounded-lg">
          <div>
            <p className="text-sm font-medium text-foreground">Auto Cancel Unpaid Orders</p>
            <p className="text-xs text-muted-foreground">Automatically cancel orders not paid within time limit</p>
          </div>
          <Switch checked={settings.orderAutoCancel} onCheckedChange={v => update('orderAutoCancel', v)} />
        </div>

        {settings.orderAutoCancel && (
          <div className="space-y-2">
            <Label>Auto Cancel After (hours)</Label>
            <Input type="number" value={settings.autoCancelHours} onChange={e => update('autoCancelHours', e.target.value)} />
          </div>
        )}
      </CardContent>
    </Card>

    <Card className="border border-border">
      <CardHeader><CardTitle className="text-base">Order Status Flow</CardTitle></CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {(settings.orderStatusFlow || []).map((status, idx) => (
            <div key={status} className="flex items-center gap-1">
              <Badge variant="outline" className="text-xs">{idx + 1}. {status.replace(/_/g, ' ')}</Badge>
              {idx < (settings.orderStatusFlow || []).length - 1 && <span className="text-muted-foreground">→</span>}
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">This is the default order status progression flow.</p>
      </CardContent>
    </Card>
  </div>
);
