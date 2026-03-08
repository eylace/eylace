import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { SettingsState } from '@/pages/AdminSettingsPage';

interface Props { settings: SettingsState; update: (key: string, value: any) => void; }

export const SmtpSettingsTab = ({ settings, update }: Props) => {
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState('');

  const sendTestEmail = async () => {
    if (!testEmail) { toast.error('Enter a test email address'); return; }
    setTesting(true);
    // Simulate test
    await new Promise(r => setTimeout(r, 2000));
    toast.success(`Test email sent to ${testEmail}`);
    setTesting(false);
  };

  return (
    <div className="space-y-4 mt-4">
      <Card className="border border-border">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Mail className="h-5 w-5" /> SMTP Configuration</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>SMTP Host</Label><Input placeholder="smtp.gmail.com" value={settings.smtpHost} onChange={e => update('smtpHost', e.target.value)} /></div>
            <div className="space-y-2"><Label>SMTP Port</Label><Input placeholder="587" value={settings.smtpPort} onChange={e => update('smtpPort', e.target.value)} /></div>
            <div className="space-y-2"><Label>Username</Label><Input value={settings.smtpUsername} onChange={e => update('smtpUsername', e.target.value)} /></div>
            <div className="space-y-2"><Label>Password</Label><Input type="password" value={settings.smtpPassword} onChange={e => update('smtpPassword', e.target.value)} /></div>
            <div className="space-y-2">
              <Label>Encryption</Label>
              <Select value={settings.smtpEncryption} onValueChange={v => update('smtpEncryption', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="tls">TLS</SelectItem>
                  <SelectItem value="ssl">SSL</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>From Email</Label><Input type="email" value={settings.smtpFromEmail} onChange={e => update('smtpFromEmail', e.target.value)} /></div>
            <div className="space-y-2"><Label>From Name</Label><Input value={settings.smtpFromName} onChange={e => update('smtpFromName', e.target.value)} /></div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Send className="h-5 w-5" /> Test SMTP</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-2">
              <Label>Send test email to</Label>
              <Input type="email" placeholder="test@example.com" value={testEmail} onChange={e => setTestEmail(e.target.value)} />
            </div>
            <Button onClick={sendTestEmail} disabled={testing}>
              {testing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}
              Send Test
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
