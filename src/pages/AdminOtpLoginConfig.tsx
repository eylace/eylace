import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Smartphone, Shield, Clock, Save } from 'lucide-react';

const defaultConfig = {
  otp_login_enabled: true,
  otp_length: 6,
  otp_expiry_minutes: 5,
  max_attempts: 3,
  cooldown_minutes: 15,
  otp_method: 'sms',
  allow_email_otp: true,
  allow_sms_otp: true,
  require_otp_for_login: false,
  require_otp_for_registration: false,
  require_otp_for_password_reset: true,
  require_otp_for_order: false,
};

export default function AdminOtpLoginConfig() {
  const { toast } = useToast();
  const [config, setConfig] = useState(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    const { data } = await supabase
      .from('system_settings')
      .select('*')
      .eq('key', 'otp_login_config')
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
      .eq('key', 'otp_login_config')
      .maybeSingle();

    if (existing) {
      await supabase.from('system_settings').update({ value: config as unknown as Record<string, unknown> }).eq('key', 'otp_login_config');
    } else {
      await supabase.from('system_settings').insert({ key: 'otp_login_config', value: config as unknown as Record<string, unknown> });
    }
    setSaving(false);
    toast({ title: 'Saved', description: 'OTP login configuration updated successfully.' });
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
            <h1 className="text-2xl font-bold text-foreground">OTP Login Configuration</h1>
            <p className="text-muted-foreground">Configure how OTP-based login works for your users</p>
          </div>
          <Button onClick={saveConfig} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* General OTP Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Smartphone className="h-5 w-5" /> General Settings</CardTitle>
              <CardDescription>Basic OTP login preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Enable OTP Login</Label>
                <Switch checked={config.otp_login_enabled} onCheckedChange={(v) => updateField('otp_login_enabled', v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Allow SMS OTP</Label>
                <Switch checked={config.allow_sms_otp} onCheckedChange={(v) => updateField('allow_sms_otp', v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Allow Email OTP</Label>
                <Switch checked={config.allow_email_otp} onCheckedChange={(v) => updateField('allow_email_otp', v)} />
              </div>
              <div>
                <Label>Default OTP Method</Label>
                <Select value={config.otp_method} onValueChange={(v) => updateField('otp_method', v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> Security Settings</CardTitle>
              <CardDescription>OTP security and limits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>OTP Length</Label>
                <Input type="number" min={4} max={8} value={config.otp_length} onChange={(e) => updateField('otp_length', parseInt(e.target.value))} className="mt-1" />
              </div>
              <div>
                <Label>Max Attempts</Label>
                <Input type="number" min={1} max={10} value={config.max_attempts} onChange={(e) => updateField('max_attempts', parseInt(e.target.value))} className="mt-1" />
              </div>
            </CardContent>
          </Card>

          {/* Timing Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" /> Timing Settings</CardTitle>
              <CardDescription>OTP expiry and cooldown periods</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>OTP Expiry (minutes)</Label>
                <Input type="number" min={1} max={30} value={config.otp_expiry_minutes} onChange={(e) => updateField('otp_expiry_minutes', parseInt(e.target.value))} className="mt-1" />
              </div>
              <div>
                <Label>Cooldown After Max Attempts (minutes)</Label>
                <Input type="number" min={1} max={60} value={config.cooldown_minutes} onChange={(e) => updateField('cooldown_minutes', parseInt(e.target.value))} className="mt-1" />
              </div>
            </CardContent>
          </Card>

          {/* Require OTP For */}
          <Card>
            <CardHeader>
              <CardTitle>Require OTP For</CardTitle>
              <CardDescription>Choose where OTP verification is mandatory</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Login</Label>
                <Switch checked={config.require_otp_for_login} onCheckedChange={(v) => updateField('require_otp_for_login', v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Registration</Label>
                <Switch checked={config.require_otp_for_registration} onCheckedChange={(v) => updateField('require_otp_for_registration', v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Password Reset</Label>
                <Switch checked={config.require_otp_for_password_reset} onCheckedChange={(v) => updateField('require_otp_for_password_reset', v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Order Confirmation</Label>
                <Switch checked={config.require_otp_for_order} onCheckedChange={(v) => updateField('require_otp_for_order', v)} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
