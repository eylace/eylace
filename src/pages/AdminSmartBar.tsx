import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Save, Megaphone, Clock, Users, Gauge } from 'lucide-react';
import { invalidateSetupCache } from '@/hooks/useWebsiteSetup';

interface TopBarState {
  enabled: boolean;
  text: string;
  bgColor: string;
  textColor: string;
  speed: number;
  audience: 'all' | 'guests' | 'users';
  startsAt: string;
  endsAt: string;
}

const DEFAULTS: TopBarState = {
  enabled: true,
  text: 'eylace অনলাইন শপে আপনাকে স্বাগতম  ||  অনলাইনে আস্থা ও বিশ্বস্ততার সাথে সারা বাংলাদেশে হোম ডেলিভারী দিয়ে থাকি  ||  অর্ডার করতে অগ্রিম টাকা দিতে হবে না  ||  এ্যাডভান্স বিকাশ পেমেন্টে ৫% ডিসকাউন্ট  ||  ৩-৫ দিনে সারাদেশে হোম ডেলিভারী দেওয়া হয়  ||  ক্যাশঅন ডেলিভারীর সুবিধা রয়েছে, তাই অর্ডার করুন নিশ্চিন্তে  ||  ধন্যবাদ',
  bgColor: '#1a1a2e',
  textColor: '#ffffff',
  speed: 35,
  audience: 'all',
  startsAt: '',
  endsAt: '',
};

const AdminSmartBar = () => {
  const [state, setState] = useState<TopBarState>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'website_setup_v1')
      .maybeSingle()
      .then(({ data }) => {
        const v: any = data?.value || {};
        setState({
          enabled: v.topBarEnabled ?? DEFAULTS.enabled,
          text: v.topBarText ?? DEFAULTS.text,
          bgColor: v.topBarBgColor || DEFAULTS.bgColor,
          textColor: v.topBarTextColor || DEFAULTS.textColor,
          speed: typeof v.topBarSpeed === 'number' ? v.topBarSpeed : DEFAULTS.speed,
          audience: v.topBarAudience || DEFAULTS.audience,
          startsAt: v.topBarStartsAt || '',
          endsAt: v.topBarEndsAt || '',
        });
        setLoading(false);
      });
  }, []);

  const save = async () => {
    setSaving(true);
    const { data: existing } = await supabase
      .from('system_settings')
      .select('id, value')
      .eq('key', 'website_setup_v1')
      .maybeSingle();
    const merged = {
      ...((existing?.value as any) || {}),
      topBarEnabled: state.enabled,
      topBarText: state.text,
      topBarBgColor: state.bgColor,
      topBarTextColor: state.textColor,
      topBarSpeed: state.speed,
      topBarAudience: state.audience,
      topBarStartsAt: state.startsAt || null,
      topBarEndsAt: state.endsAt || null,
    };
    const { error } = existing
      ? await supabase.from('system_settings').update({ value: merged }).eq('key', 'website_setup_v1')
      : await supabase.from('system_settings').insert({ key: 'website_setup_v1', value: merged });
    if (error) toast.error('Failed: ' + error.message);
    else {
      invalidateSetupCache();
      toast.success('Top Bar saved!');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <AdminLayout title="Smart Bar" description="Configure the storefront top bar">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Smart Bar" description="Bangla right-to-left scrolling headline shown above the storefront header.">
      <div className="max-w-3xl space-y-6">
        <Card className="border-accent/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Megaphone className="h-5 w-5 text-accent" /> Top Bar (Bangla Marquee)
              <Badge variant="secondary" className="ml-1 text-[10px]">Headline</Badge>
            </CardTitle>
            <CardDescription>
              The right-to-left scrolling text bar that sits above the header on the storefront.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-4 py-3">
              <div>
                <Label className="font-medium">Enable Top Bar</Label>
                <p className="text-xs text-muted-foreground">Shows the marquee strip above the site header.</p>
              </div>
              <Switch checked={state.enabled} onCheckedChange={v => setState(s => ({ ...s, enabled: v }))} />
            </div>

            <div className="space-y-2">
              <Label>Headline Text (Bangla / English)</Label>
              <Input
                value={state.text}
                onChange={e => setState(s => ({ ...s, text: e.target.value }))}
                placeholder="eylace অনলাইন শপে আপনাকে স্বাগতম ..."
                maxLength={500}
                dir="auto"
              />
              <p className="text-xs text-muted-foreground">Scrolls right → left continuously. {state.text.length}/500</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Background Color</Label>
                <div className="flex items-center gap-2 mt-1">
                  <input type="color" value={state.bgColor} onChange={e => setState(s => ({ ...s, bgColor: e.target.value }))} className="h-10 w-12 rounded border border-border cursor-pointer" />
                  <Input value={state.bgColor} onChange={e => setState(s => ({ ...s, bgColor: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>Text Color</Label>
                <div className="flex items-center gap-2 mt-1">
                  <input type="color" value={state.textColor} onChange={e => setState(s => ({ ...s, textColor: e.target.value }))} className="h-10 w-12 rounded border border-border cursor-pointer" />
                  <Input value={state.textColor} onChange={e => setState(s => ({ ...s, textColor: e.target.value }))} />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Gauge className="h-4 w-4" /> Scroll Speed (seconds per loop)
              </Label>
              <div className="flex items-center gap-3">
                <Input
                  type="range"
                  min={5}
                  max={120}
                  step={1}
                  value={state.speed}
                  onChange={e => setState(s => ({ ...s, speed: Number(e.target.value) }))}
                  className="flex-1"
                />
                <Input
                  type="number"
                  min={5}
                  max={120}
                  value={state.speed}
                  onChange={e => setState(s => ({ ...s, speed: Math.max(5, Math.min(120, Number(e.target.value) || 35)) }))}
                  className="w-24"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Lower = faster scroll, higher = slower. Default 35.
              </p>
            </div>

            {/* Live preview */}
            <div>
              <Label className="mb-2 block">Live Preview</Label>
              <div
                className="relative overflow-hidden rounded-lg border border-border"
                style={{ backgroundColor: state.bgColor, color: state.textColor, height: 40 }}
              >
                {state.text.trim() ? (
                  <div className="absolute inset-0 flex items-center">
                    <div className="topbar-marquee whitespace-nowrap text-sm font-medium" style={{ animationDuration: `${state.speed}s` }}>
                      <span>{(state.text + '  ★  ').repeat(2)}</span>
                      <span>{(state.text + '  ★  ').repeat(2)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-xs opacity-70">No text</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-5 w-5 text-accent" /> Audience & Schedule
            </CardTitle>
            <CardDescription>Control who sees the top bar and when it goes live.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Audience</Label>
              <Select value={state.audience} onValueChange={v => setState(s => ({ ...s, audience: v as TopBarState['audience'] }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Everyone</SelectItem>
                  <SelectItem value="guests">Guests only (not logged in)</SelectItem>
                  <SelectItem value="users">Logged-in users only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-2"><Clock className="h-4 w-4" /> Starts at</Label>
                <Input type="datetime-local" value={state.startsAt} onChange={e => setState(s => ({ ...s, startsAt: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label className="flex items-center gap-2"><Clock className="h-4 w-4" /> Ends at</Label>
                <Input type="datetime-local" value={state.endsAt} onChange={e => setState(s => ({ ...s, endsAt: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Leave blank for no time limits. Times use the visitor's local timezone.</p>
          </CardContent>
        </Card>

        <Separator />

        <div>
          <Button onClick={save} disabled={saving} size="lg" className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Top Bar
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSmartBar;