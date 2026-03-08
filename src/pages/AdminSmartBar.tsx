import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Save, Megaphone } from 'lucide-react';

const AdminSmartBar = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    enabled: false,
    text: '',
    link: '',
    bg_color: '#f97316',
    text_color: '#ffffff',
  });

  useEffect(() => {
    setLoading(true);
    supabase.from('system_settings').select('value').eq('key', 'smart_bar').maybeSingle().then(({ data }) => {
      if (data?.value) {
        const val = data.value as any;
        setForm({
          enabled: val.enabled || false,
          text: val.text || '',
          link: val.link || '',
          bg_color: val.bg_color || '#f97316',
          text_color: val.text_color || '#ffffff',
        });
      }
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const { data: existing } = await supabase.from('system_settings').select('id').eq('key', 'smart_bar').single();
    let error;
    if (existing) {
      ({ error } = await supabase.from('system_settings').update({ value: form as any }).eq('key', 'smart_bar'));
    } else {
      ({ error } = await supabase.from('system_settings').insert({ key: 'smart_bar', value: form as any }));
    }
    if (error) toast.error('Failed to save: ' + error.message);
    else toast.success('Smart Bar settings saved!');
    setSaving(false);
  };

  if (loading) {
    return (
      <AdminLayout title="Smart Bar" description="Configure promotional bar">
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Smart Bar" description="Configure the promotional bar displayed on homepage">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Megaphone className="h-5 w-5" /> Smart Bar Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-3">
            <Switch checked={form.enabled} onCheckedChange={v => setForm(f => ({ ...f, enabled: v }))} />
            <Label>Enable Smart Bar</Label>
          </div>

          <div>
            <Label>Promotional Text *</Label>
            <Input value={form.text} onChange={e => setForm(f => ({ ...f, text: e.target.value }))} placeholder="🔥 Free Shipping on orders over $50!" />
          </div>

          <div>
            <Label>Link URL (Optional)</Label>
            <Input value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} placeholder="/deals or https://..." />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Background Color</Label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.bg_color} onChange={e => setForm(f => ({ ...f, bg_color: e.target.value }))} className="h-10 w-10 rounded border border-border cursor-pointer" />
                <Input value={form.bg_color} onChange={e => setForm(f => ({ ...f, bg_color: e.target.value }))} className="flex-1" />
              </div>
            </div>
            <div>
              <Label>Text Color</Label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.text_color} onChange={e => setForm(f => ({ ...f, text_color: e.target.value }))} className="h-10 w-10 rounded border border-border cursor-pointer" />
                <Input value={form.text_color} onChange={e => setForm(f => ({ ...f, text_color: e.target.value }))} className="flex-1" />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div>
            <Label className="mb-2 block">Preview</Label>
            {form.enabled && form.text ? (
              <div className="rounded-lg overflow-hidden">
                <div className="flex items-center justify-center px-4 py-2.5 text-sm font-medium" style={{ backgroundColor: form.bg_color, color: form.text_color }}>
                  {form.text}
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground p-3 border border-dashed border-border rounded-lg text-center">
                Smart Bar is disabled or empty
              </div>
            )}
          </div>

          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Settings
          </Button>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminSmartBar;
