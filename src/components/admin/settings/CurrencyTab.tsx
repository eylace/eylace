import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard } from 'lucide-react';
import type { SettingsState } from '@/pages/AdminSettingsPage';

interface Props { settings: SettingsState; update: (key: string, value: any) => void; }

const currencies = [
  { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
];

export const CurrencyTab = ({ settings, update }: Props) => {
  const toggleCurrency = (code: string) => {
    const current = settings.enabledCurrencies || [];
    const next = current.includes(code) ? current.filter(c => c !== code) : [...current, code];
    update('enabledCurrencies', next);
  };

  return (
    <div className="space-y-4 mt-4">
      <Card className="border border-border">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><CreditCard className="h-5 w-5" /> Currency Configuration</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Default Currency</Label>
              <Select value={settings.defaultCurrency} onValueChange={v => update('defaultCurrency', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {currencies.map(c => <SelectItem key={c.code} value={c.code}>{c.symbol} {c.name} ({c.code})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Symbol Position</Label>
              <Select value={settings.currencyPosition} onValueChange={v => update('currencyPosition', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="before">Before Amount (৳100)</SelectItem>
                  <SelectItem value="after">After Amount (100৳)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Thousand Separator</Label><Input value={settings.thousandSeparator} onChange={e => update('thousandSeparator', e.target.value)} /></div>
            <div className="space-y-2"><Label>Decimal Separator</Label><Input value={settings.decimalSeparator} onChange={e => update('decimalSeparator', e.target.value)} /></div>
            <div className="space-y-2"><Label>Decimal Places</Label><Input type="number" value={settings.decimalPlaces} onChange={e => update('decimalPlaces', e.target.value)} /></div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border">
        <CardHeader><CardTitle className="text-base">Enabled Currencies</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {currencies.map(c => (
            <div key={c.code} className="flex items-center justify-between p-3 border border-border rounded-lg">
              <div>
                <p className="text-sm font-medium text-foreground">{c.symbol} {c.name}</p>
                <p className="text-xs text-muted-foreground">{c.code}</p>
              </div>
              <Switch checked={(settings.enabledCurrencies || []).includes(c.code)} onCheckedChange={() => toggleCurrency(c.code)} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
