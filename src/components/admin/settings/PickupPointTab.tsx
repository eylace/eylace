import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { MapPin, Plus, Trash2 } from 'lucide-react';
import type { SettingsState } from '@/pages/AdminSettingsPage';

interface Props { settings: SettingsState; update: (key: string, value: any) => void; }

export const PickupPointTab = ({ settings, update }: Props) => {
  const points = settings.pickupPoints || [];
  const add = () => update('pickupPoints', [...points, { name: '', address: '', phone: '', isActive: true }]);
  const remove = (idx: number) => update('pickupPoints', points.filter((_, i) => i !== idx));
  const upd = (idx: number, field: string, value: any) => {
    const next = [...points];
    next[idx] = { ...next[idx], [field]: value };
    update('pickupPoints', next);
  };

  return (
    <div className="mt-4">
      <Card className="border border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2"><MapPin className="h-5 w-5" /> Pickup Points</CardTitle>
          <Button size="sm" variant="outline" onClick={add}><Plus className="h-4 w-4 mr-1" /> Add Point</Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {points.length === 0 && <p className="text-sm text-muted-foreground">No pickup points configured.</p>}
          {points.map((p, idx) => (
            <div key={idx} className="p-4 border border-border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Pickup Point #{idx + 1}</span>
                <div className="flex items-center gap-2">
                  <Switch checked={p.isActive} onCheckedChange={v => upd(idx, 'isActive', v)} />
                  <Button size="icon" variant="ghost" onClick={() => remove(idx)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input placeholder="Name" value={p.name} onChange={e => upd(idx, 'name', e.target.value)} />
                <Input placeholder="Address" value={p.address} onChange={e => upd(idx, 'address', e.target.value)} />
                <Input placeholder="Phone" value={p.phone} onChange={e => upd(idx, 'phone', e.target.value)} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
