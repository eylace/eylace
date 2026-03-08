import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Receipt, Plus, Trash2 } from 'lucide-react';
import type { SettingsState } from '@/pages/AdminSettingsPage';

interface Props { settings: SettingsState; update: (key: string, value: any) => void; }

export const VatTaxTab = ({ settings, update }: Props) => {
  const addTaxClass = () => {
    update('taxClasses', [...(settings.taxClasses || []), { name: '', rate: '0' }]);
  };
  const removeTaxClass = (idx: number) => {
    update('taxClasses', (settings.taxClasses || []).filter((_, i) => i !== idx));
  };
  const updateTaxClass = (idx: number, field: string, value: string) => {
    const next = [...(settings.taxClasses || [])];
    next[idx] = { ...next[idx], [field]: value };
    update('taxClasses', next);
  };

  return (
    <div className="space-y-4 mt-4">
      <Card className="border border-border">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Receipt className="h-5 w-5" /> VAT & Tax Settings</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 border border-border rounded-lg">
            <div><p className="text-sm font-medium text-foreground">Enable Tax</p><p className="text-xs text-muted-foreground">Apply tax on orders</p></div>
            <Switch checked={settings.taxEnabled} onCheckedChange={v => update('taxEnabled', v)} />
          </div>
          <div className="flex items-center justify-between p-3 border border-border rounded-lg">
            <div><p className="text-sm font-medium text-foreground">Tax Included in Price</p><p className="text-xs text-muted-foreground">Product prices already include tax</p></div>
            <Switch checked={settings.taxIncludedInPrice} onCheckedChange={v => update('taxIncludedInPrice', v)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2"><Label>Default Tax Rate (%)</Label><Input type="number" value={settings.taxRate} onChange={e => update('taxRate', e.target.value)} /></div>
            <div className="space-y-2">
              <Label>Tax Type</Label>
              <Select value={settings.taxType} onValueChange={v => update('taxType', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Tax Label</Label><Input value={settings.taxLabel} onChange={e => update('taxLabel', e.target.value)} placeholder="e.g. VAT, GST" /></div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Tax Classes</CardTitle>
          <Button size="sm" variant="outline" onClick={addTaxClass}><Plus className="h-4 w-4 mr-1" /> Add Class</Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {(settings.taxClasses || []).map((tc, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 border border-border rounded-lg">
              <Input className="flex-1" placeholder="Class Name" value={tc.name} onChange={e => updateTaxClass(idx, 'name', e.target.value)} />
              <Input className="w-24" type="number" placeholder="Rate %" value={tc.rate} onChange={e => updateTaxClass(idx, 'rate', e.target.value)} />
              <Button size="icon" variant="ghost" onClick={() => removeTaxClass(idx)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
