import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HardDrive, Database } from 'lucide-react';
import type { SettingsState } from '@/pages/AdminSettingsPage';

interface Props { settings: SettingsState; update: (key: string, value: any) => void; }

export const FileSystemCacheTab = ({ settings, update }: Props) => (
  <div className="space-y-4 mt-4">
    <Card className="border border-border">
      <CardHeader><CardTitle className="text-base flex items-center gap-2"><HardDrive className="h-5 w-5" /> File System Configuration</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Storage Driver</Label>
            <Select value={settings.storageDriver} onValueChange={v => update('storageDriver', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="supabase">Lovable Cloud Storage</SelectItem>
                <SelectItem value="s3">Amazon S3</SelectItem>
                <SelectItem value="local">Local Storage</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Max Upload Size (MB)</Label><Input type="number" value={settings.maxUploadSize} onChange={e => update('maxUploadSize', e.target.value)} /></div>
          <div className="md:col-span-2 space-y-2"><Label>Allowed File Types</Label><Input value={settings.allowedFileTypes} onChange={e => update('allowedFileTypes', e.target.value)} placeholder="jpg,png,gif,pdf" /></div>
        </div>
      </CardContent>
    </Card>

    <Card className="border border-border">
      <CardHeader><CardTitle className="text-base flex items-center gap-2"><Database className="h-5 w-5" /> Cache Configuration</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 border border-border rounded-lg">
          <div><p className="text-sm font-medium text-foreground">Enable Cache</p><p className="text-xs text-muted-foreground">Cache responses for better performance</p></div>
          <Switch checked={settings.cacheEnabled} onCheckedChange={v => update('cacheEnabled', v)} />
        </div>
        {settings.cacheEnabled && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Cache TTL (seconds)</Label><Input type="number" value={settings.cacheTtl} onChange={e => update('cacheTtl', e.target.value)} /></div>
            <div className="space-y-2">
              <Label>Cache Driver</Label>
              <Select value={settings.cacheDriver} onValueChange={v => update('cacheDriver', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="memory">In-Memory</SelectItem>
                  <SelectItem value="redis">Redis</SelectItem>
                  <SelectItem value="file">File-based</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  </div>
);
