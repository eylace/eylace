import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Settings, Server, Key, Save, TestTube } from 'lucide-react';

const defaultConfig = {
  sms_provider: 'twilio',
  twilio_account_sid: '',
  twilio_auth_token: '',
  twilio_phone_number: '',
  ssl_wireless_username: '',
  ssl_wireless_password: '',
  ssl_wireless_sid: '',
  custom_api_url: '',
  custom_api_key: '',
  custom_api_method: 'POST',
  custom_api_body_template: '{"phone":"{{phone}}","message":"{{message}}"}',
  rate_limit_per_ip: 5,
  rate_limit_window_minutes: 60,
  otp_resend_cooldown_seconds: 60,
  block_disposable_numbers: true,
  log_otp_requests: true,
  test_mode: false,
  test_otp: '123456',
};

export default function AdminOtpConfigurations() {
  const { toast } = useToast();
  const [config, setConfig] = useState(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchConfig(); }, []);

  const fetchConfig = async () => {
    const { data } = await supabase
      .from('system_settings')
      .select('*')
      .eq('key', 'otp_provider_config')
      .maybeSingle();
    if (data?.value) {
      setConfig({ ...defaultConfig, ...(data.value as Record<string, unknown>) });
    }
    setLoading(false);
  };

  const saveConfig = async () => {
    setSaving(true);
    const { data: existing } = await supabase
      .from('system_settings')
      .select('id')
      .eq('key', 'otp_provider_config')
      .maybeSingle();

    if (existing) {
      await supabase.from('system_settings').update({ value: config as unknown as Record<string, unknown> }).eq('key', 'otp_provider_config');
    } else {
      await supabase.from('system_settings').insert({ key: 'otp_provider_config', value: config as unknown as Record<string, unknown> });
    }
    setSaving(false);
    toast({ title: 'Saved', description: 'OTP provider configuration updated.' });
  };

  const updateField = (key: string, value: unknown) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">OTP Configurations</h1>
            <p className="text-muted-foreground">Configure SMS provider, rate limits, and advanced OTP settings</p>
          </div>
          <Button onClick={saveConfig} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* SMS Provider */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Server className="h-5 w-5" /> SMS Provider</CardTitle>
              <CardDescription>Select and configure your SMS gateway</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Provider</Label>
                <Select value={config.sms_provider} onValueChange={(v) => updateField('sms_provider', v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="twilio">Twilio</SelectItem>
                    <SelectItem value="ssl_wireless">SSL Wireless</SelectItem>
                    <SelectItem value="custom">Custom API</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {config.sms_provider === 'twilio' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div>
                    <Label>Account SID</Label>
                    <Input value={config.twilio_account_sid} onChange={(e) => updateField('twilio_account_sid', e.target.value)} placeholder="ACxxxxxx" className="mt-1" />
                  </div>
                  <div>
                    <Label>Auth Token</Label>
                    <Input type="password" value={config.twilio_auth_token} onChange={(e) => updateField('twilio_auth_token', e.target.value)} placeholder="••••••••" className="mt-1" />
                  </div>
                  <div>
                    <Label>Phone Number</Label>
                    <Input value={config.twilio_phone_number} onChange={(e) => updateField('twilio_phone_number', e.target.value)} placeholder="+1234567890" className="mt-1" />
                  </div>
                </div>
              )}

              {config.sms_provider === 'ssl_wireless' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div>
                    <Label>Username</Label>
                    <Input value={config.ssl_wireless_username} onChange={(e) => updateField('ssl_wireless_username', e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label>Password</Label>
                    <Input type="password" value={config.ssl_wireless_password} onChange={(e) => updateField('ssl_wireless_password', e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label>SID</Label>
                    <Input value={config.ssl_wireless_sid} onChange={(e) => updateField('ssl_wireless_sid', e.target.value)} className="mt-1" />
                  </div>
                </div>
              )}

              {config.sms_provider === 'custom' && (
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <Label>API URL</Label>
                      <Input value={config.custom_api_url} onChange={(e) => updateField('custom_api_url', e.target.value)} placeholder="https://api.example.com/send-sms" className="mt-1" />
                    </div>
                    <div>
                      <Label>Method</Label>
                      <Select value={config.custom_api_method} onValueChange={(v) => updateField('custom_api_method', v)}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="POST">POST</SelectItem>
                          <SelectItem value="GET">GET</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>API Key</Label>
                    <Input type="password" value={config.custom_api_key} onChange={(e) => updateField('custom_api_key', e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label>Body Template (JSON)</Label>
                    <Textarea value={config.custom_api_body_template} onChange={(e) => updateField('custom_api_body_template', e.target.value)} rows={3} className="mt-1 font-mono text-xs" />
                    <p className="text-xs text-muted-foreground mt-1">Use {'{{phone}}'} and {'{{message}}'} as placeholders</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Rate Limits */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Key className="h-5 w-5" /> Rate Limiting</CardTitle>
              <CardDescription>Prevent abuse and spam</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Max OTP Requests per IP</Label>
                <Input type="number" min={1} max={100} value={config.rate_limit_per_ip} onChange={(e) => updateField('rate_limit_per_ip', parseInt(e.target.value))} className="mt-1" />
              </div>
              <div>
                <Label>Rate Limit Window (minutes)</Label>
                <Input type="number" min={1} max={1440} value={config.rate_limit_window_minutes} onChange={(e) => updateField('rate_limit_window_minutes', parseInt(e.target.value))} className="mt-1" />
              </div>
              <div>
                <Label>Resend Cooldown (seconds)</Label>
                <Input type="number" min={10} max={300} value={config.otp_resend_cooldown_seconds} onChange={(e) => updateField('otp_resend_cooldown_seconds', parseInt(e.target.value))} className="mt-1" />
              </div>
              <div className="flex items-center justify-between">
                <Label>Block Disposable Numbers</Label>
                <Switch checked={config.block_disposable_numbers} onCheckedChange={(v) => updateField('block_disposable_numbers', v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Log OTP Requests</Label>
                <Switch checked={config.log_otp_requests} onCheckedChange={(v) => updateField('log_otp_requests', v)} />
              </div>
            </CardContent>
          </Card>

          {/* Test Mode */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><TestTube className="h-5 w-5" /> Test Mode</CardTitle>
              <CardDescription>Use a fixed OTP for development/testing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Enable Test Mode</Label>
                <Switch checked={config.test_mode} onCheckedChange={(v) => updateField('test_mode', v)} />
              </div>
              {config.test_mode && (
                <div>
                  <Label>Test OTP Code</Label>
                  <Input value={config.test_otp} onChange={(e) => updateField('test_otp', e.target.value)} placeholder="123456" className="mt-1" />
                  <p className="text-xs text-muted-foreground mt-1">This OTP will always be accepted in test mode</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
