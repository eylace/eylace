import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Store, Clock } from 'lucide-react';
import type { SettingsState } from '@/pages/AdminSettingsPage';

interface Props { settings: SettingsState; update: (key: string, value: any) => void; }

export const BusinessSettingsTab = ({ settings, update }: Props) => (
  <div className="space-y-4 mt-4">
    <Card className="border border-border">
      <CardHeader><CardTitle className="text-base flex items-center gap-2"><Store className="h-5 w-5" /> Store Information</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Store Name</Label><Input value={settings.storeName} onChange={e => update('storeName', e.target.value)} /></div>
          <div className="space-y-2"><Label>Store Email</Label><Input type="email" value={settings.storeEmail} onChange={e => update('storeEmail', e.target.value)} /></div>
          <div className="space-y-2"><Label>Phone</Label><Input value={settings.storePhone} onChange={e => update('storePhone', e.target.value)} /></div>
          <div className="space-y-2"><Label>Address</Label><Input value={settings.storeAddress} onChange={e => update('storeAddress', e.target.value)} /></div>
          <div className="space-y-2"><Label>Tagline</Label><Input value={settings.storeTagline} onChange={e => update('storeTagline', e.target.value)} /></div>
          <div className="space-y-2"><Label>Logo URL</Label><Input value={settings.storeLogo} onChange={e => update('storeLogo', e.target.value)} placeholder="https://..." /></div>
        </div>
      </CardContent>
    </Card>

    <Card className="border border-border">
      <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="h-5 w-5" /> Regional Settings</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Timezone</Label>
            <Select value={settings.timezone} onValueChange={v => update('timezone', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Asia/Dhaka">Asia/Dhaka (GMT+6)</SelectItem>
                <SelectItem value="Asia/Kolkata">Asia/Kolkata (GMT+5:30)</SelectItem>
                <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                <SelectItem value="Asia/Dubai">Asia/Dubai (GMT+4)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Date Format</Label>
            <Select value={settings.dateFormat} onValueChange={v => update('dateFormat', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);
