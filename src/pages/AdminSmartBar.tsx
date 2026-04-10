import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Save, Megaphone, Plus, Trash2, GripVertical } from 'lucide-react';

/* ── Smart Bar (homepage promotional bar) ── */
interface SmartBarForm {
  enabled: boolean;
  text: string;
  link: string;
  bg_color: string;
  text_color: string;
}

/* ── Top Bar Headlines (scrolling marquee above header) ── */
interface TopBarForm {
  enabled: boolean;
  headlines: string[];
  bg_color: string;
  text_color: string;
  speed: number;
}

const AdminSmartBar = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<'smart' | 'topbar' | null>(null);

  const [smartBar, setSmartBar] = useState<SmartBarForm>({
    enabled: false, text: '', link: '', bg_color: '#f97316', text_color: '#ffffff',
  });

  const [topBar, setTopBar] = useState<TopBarForm>({
    enabled: true, headlines: [''], bg_color: '#1a1a2e', text_color: '#ffffff', speed: 30,
  });

  useEffect(() => {
    Promise.all([
      supabase.from('system_settings').select('value').eq('key', 'smart_bar').maybeSingle(),
      supabase.from('system_settings').select('value').eq('key', 'top_bar_headlines').maybeSingle(),
    ]).then(([sbRes, tbRes]) => {
      if (sbRes.data?.value) {
        const v = sbRes.data.value as any;
        setSmartBar({ enabled: v.enabled || false, text: v.text || '', link: v.link || '', bg_color: v.bg_color || '#f97316', text_color: v.text_color || '#ffffff' });
      }
      if (tbRes.data?.value) {
        const v = tbRes.data.value as any;
        setTopBar({
          enabled: v.enabled ?? true,
          headlines: Array.isArray(v.headlines) && v.headlines.length > 0 ? v.headlines : [''],
          bg_color: v.bg_color || '#1a1a2e',
          text_color: v.text_color || '#ffffff',
          speed: v.speed || 30,
        });
      }
      setLoading(false);
    });
  }, []);

  const upsert = async (key: string, value: any) => {
    const { data: existing } = await supabase.from('system_settings').select('id').eq('key', key).maybeSingle();
    if (existing) {
      return supabase.from('system_settings').update({ value }).eq('key', key);
    } else {
      return supabase.from('system_settings').insert({ key, value });
    }
  };

  const saveSmartBar = async () => {
    setSaving('smart');
    const { error } = await upsert('smart_bar', smartBar as any);
    if (error) toast.error('Failed: ' + error.message); else toast.success('Smart Bar saved!');
    setSaving(null);
  };

  const saveTopBar = async () => {
    setSaving('topbar');
    const cleaned = { ...topBar, headlines: topBar.headlines.filter(h => h.trim()) };
    const { error } = await upsert('top_bar_headlines', cleaned as any);
    if (error) toast.error('Failed: ' + error.message); else toast.success('Top Bar Headlines saved!');
    setSaving(null);
  };

  const addHeadline = () => setTopBar(f => ({ ...f, headlines: [...f.headlines, ''] }));
  const removeHeadline = (i: number) => setTopBar(f => ({ ...f, headlines: f.headlines.filter((_, idx) => idx !== i) }));
  const updateHeadline = (i: number, v: string) => setTopBar(f => ({ ...f, headlines: f.headlines.map((h, idx) => idx === i ? v : h) }));

  if (loading) {
    return (
      <AdminLayout title="Smart Bar & Top Bar" description="Configure promotional bars">
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </AdminLayout>
    );
  }

  const separator = '  ★  ';
  const previewText = topBar.headlines.filter(h => h.trim()).join(separator);

  return (
    <AdminLayout title="Smart Bar & Top Bar" description="Configure the promotional bars displayed on your storefront">
      <div className="space-y-6">

        {/* ── Top Bar Headlines (Marquee) ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Megaphone className="h-5 w-5" /> Top Bar Headlines (Scrolling Marquee)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-sm text-muted-foreground">এই হেডলাইনগুলো হেডারের উপরে ডান থেকে বামে স্ক্রল করবে।</p>

            <div className="flex items-center gap-3">
              <Switch checked={topBar.enabled} onCheckedChange={v => setTopBar(f => ({ ...f, enabled: v }))} />
              <Label>Enable Top Bar</Label>
            </div>

            <div className="space-y-3">
              <Label>Headlines</Label>
              {topBar.headlines.map((h, i) => (
                <div key={i} className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Textarea
                    value={h}
                    onChange={e => updateHeadline(i, e.target.value)}
                    placeholder={`Headline ${i + 1} — e.g. Eylace অনলাইন শপে আপনাকে স্বাগতম...`}
                    className="min-h-[60px]"
                  />
                  {topBar.headlines.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => removeHeadline(i)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addHeadline} className="gap-1">
                <Plus className="h-4 w-4" /> Add Headline
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label>Background Color</Label>
                <div className="flex items-center gap-2 mt-1">
                  <input type="color" value={topBar.bg_color} onChange={e => setTopBar(f => ({ ...f, bg_color: e.target.value }))} className="h-10 w-10 rounded border border-border cursor-pointer" />
                  <Input value={topBar.bg_color} onChange={e => setTopBar(f => ({ ...f, bg_color: e.target.value }))} className="flex-1" />
                </div>
              </div>
              <div>
                <Label>Text Color</Label>
                <div className="flex items-center gap-2 mt-1">
                  <input type="color" value={topBar.text_color} onChange={e => setTopBar(f => ({ ...f, text_color: e.target.value }))} className="h-10 w-10 rounded border border-border cursor-pointer" />
                  <Input value={topBar.text_color} onChange={e => setTopBar(f => ({ ...f, text_color: e.target.value }))} className="flex-1" />
                </div>
              </div>
              <div>
                <Label>Scroll Speed (seconds)</Label>
                <Input type="number" min={5} max={120} value={topBar.speed} onChange={e => setTopBar(f => ({ ...f, speed: Number(e.target.value) || 30 }))} className="mt-1" />
                <p className="text-xs text-muted-foreground mt-1">Lower = faster</p>
              </div>
            </div>

            {/* Preview */}
            <div>
              <Label className="mb-2 block">Preview</Label>
              {topBar.enabled && previewText ? (
                <div className="rounded-lg overflow-hidden" style={{ height: '40px', backgroundColor: topBar.bg_color, color: topBar.text_color }}>
                  <div className="flex items-center h-full overflow-hidden">
                    <div className="topbar-marquee whitespace-nowrap text-sm font-medium" style={{ animationDuration: `${topBar.speed}s` }}>
                      <span>{previewText + separator}</span>
                      <span>{previewText + separator}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground p-3 border border-dashed border-border rounded-lg text-center">
                  Top Bar is disabled or has no headlines
                </div>
              )}
            </div>

            <Button onClick={saveTopBar} disabled={saving === 'topbar'} className="gap-2">
              {saving === 'topbar' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Top Bar
            </Button>
          </CardContent>
        </Card>

        {/* ── Smart Bar (Homepage) ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Megaphone className="h-5 w-5" /> Smart Bar (Homepage Promotional)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center gap-3">
              <Switch checked={smartBar.enabled} onCheckedChange={v => setSmartBar(f => ({ ...f, enabled: v }))} />
              <Label>Enable Smart Bar</Label>
            </div>

            <div>
              <Label>Promotional Text *</Label>
              <Input value={smartBar.text} onChange={e => setSmartBar(f => ({ ...f, text: e.target.value }))} placeholder="🔥 Free Shipping on orders over $50!" />
            </div>

            <div>
              <Label>Link URL (Optional)</Label>
              <Input value={smartBar.link} onChange={e => setSmartBar(f => ({ ...f, link: e.target.value }))} placeholder="/deals or https://..." />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Background Color</Label>
                <div className="flex items-center gap-2 mt-1">
                  <input type="color" value={smartBar.bg_color} onChange={e => setSmartBar(f => ({ ...f, bg_color: e.target.value }))} className="h-10 w-10 rounded border border-border cursor-pointer" />
                  <Input value={smartBar.bg_color} onChange={e => setSmartBar(f => ({ ...f, bg_color: e.target.value }))} className="flex-1" />
                </div>
              </div>
              <div>
                <Label>Text Color</Label>
                <div className="flex items-center gap-2 mt-1">
                  <input type="color" value={smartBar.text_color} onChange={e => setSmartBar(f => ({ ...f, text_color: e.target.value }))} className="h-10 w-10 rounded border border-border cursor-pointer" />
                  <Input value={smartBar.text_color} onChange={e => setSmartBar(f => ({ ...f, text_color: e.target.value }))} className="flex-1" />
                </div>
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Preview</Label>
              {smartBar.enabled && smartBar.text ? (
                <div className="rounded-lg overflow-hidden">
                  <div className="flex items-center justify-center px-4 py-2.5 text-sm font-medium" style={{ backgroundColor: smartBar.bg_color, color: smartBar.text_color }}>
                    {smartBar.text}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground p-3 border border-dashed border-border rounded-lg text-center">
                  Smart Bar is disabled or empty
                </div>
              )}
            </div>

            <Button onClick={saveSmartBar} disabled={saving === 'smart'} className="gap-2">
              {saving === 'smart' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Smart Bar
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminSmartBar;
