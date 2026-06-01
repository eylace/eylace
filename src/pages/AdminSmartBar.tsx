import { useState, useEffect, useMemo } from 'react';
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
import {
  Loader2, Save, Megaphone, Plus, Trash2, GripVertical, Eye, RotateCcw,
  Palette, MousePointerClick, Clock, Users, Sparkles, ArrowUp, ArrowDown,
} from 'lucide-react';
import { SmartBar as SmartBarPreview, type SmartBarConfig } from '@/components/home/SmartBar';

type FormState = Required<Omit<SmartBarConfig, 'starts_at' | 'ends_at'>> & {
  starts_at: string;
  ends_at: string;
};

const DEFAULTS: FormState = {
  enabled: false,
  text: '🔥 Free Shipping on orders over ৳5000!',
  messages: [],
  rotation_seconds: 5,
  link: '/deals',
  open_in_new_tab: false,
  bg_color: '#f97316',
  text_color: '#ffffff',
  gradient_enabled: false,
  gradient_end_color: '#ef4444',
  icon: '',
  position: 'top',
  animation: 'none',
  dismissible: true,
  text_size: 'sm',
  font_weight: 'medium',
  audience: 'all',
  starts_at: '',
  ends_at: '',
};

const PRESETS: { name: string; patch: Partial<FormState> }[] = [
  { name: 'Orange CTA',  patch: { bg_color: '#f97316', text_color: '#ffffff', gradient_enabled: false } },
  { name: 'Sunset',      patch: { bg_color: '#f97316', gradient_end_color: '#dc2626', gradient_enabled: true, text_color: '#ffffff' } },
  { name: 'Deep Navy',   patch: { bg_color: '#1a3a5c', text_color: '#ffd700', gradient_enabled: false } },
  { name: 'Mint Fresh',  patch: { bg_color: '#10b981', gradient_end_color: '#0ea5e9', gradient_enabled: true, text_color: '#ffffff' } },
  { name: 'Royal',       patch: { bg_color: '#6d28d9', gradient_end_color: '#db2777', gradient_enabled: true, text_color: '#ffffff' } },
  { name: 'Midnight',    patch: { bg_color: '#0f172a', text_color: '#f8fafc', gradient_enabled: false } },
];

const AdminSmartBar = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(DEFAULTS);

  useEffect(() => {
    supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'smart_bar')
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value) {
          const v = data.value as any;
          setForm({
            ...DEFAULTS,
            ...v,
            messages: Array.isArray(v.messages) ? v.messages : [],
            starts_at: v.starts_at || '',
            ends_at: v.ends_at || '',
          });
        }
        setLoading(false);
      });
  }, []);

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const updateMessage = (i: number, v: string) =>
    setForm(f => ({ ...f, messages: f.messages.map((m, idx) => (idx === i ? v : m)) }));
  const addMessage = () => setForm(f => ({ ...f, messages: [...f.messages, ''] }));
  const removeMessage = (i: number) =>
    setForm(f => ({ ...f, messages: f.messages.filter((_, idx) => idx !== i) }));
  const moveMessage = (i: number, dir: -1 | 1) =>
    setForm(f => {
      const next = [...f.messages];
      const j = i + dir;
      if (j < 0 || j >= next.length) return f;
      [next[i], next[j]] = [next[j], next[i]];
      return { ...f, messages: next };
    });

  const save = async () => {
    if (!form.text?.trim() && form.messages.filter(m => m.trim()).length === 0) {
      toast.error('Add at least one message.');
      return;
    }
    setSaving(true);
    const payload: SmartBarConfig = {
      ...form,
      messages: form.messages.map(m => m.trim()).filter(Boolean),
      starts_at: form.starts_at || null,
      ends_at: form.ends_at || null,
    };
    const { data: existing } = await supabase
      .from('system_settings')
      .select('id')
      .eq('key', 'smart_bar')
      .maybeSingle();
    const { error } = existing
      ? await supabase.from('system_settings').update({ value: payload as any }).eq('key', 'smart_bar')
      : await supabase.from('system_settings').insert({ key: 'smart_bar', value: payload as any });
    if (error) toast.error('Failed: ' + error.message);
    else toast.success('Smart Bar saved successfully!');
    setSaving(false);
  };

  const resetDismissals = () => {
    try {
      Object.keys(localStorage)
        .filter(k => k.startsWith('smartbar:dismissed:'))
        .forEach(k => localStorage.removeItem(k));
      toast.success('Dismissals cleared — bar will reappear on next reload.');
    } catch {
      toast.error('Unable to clear local storage.');
    }
  };

  // Live preview config — strips empty messages so the storefront renders sanely
  const previewConfig = useMemo<SmartBarConfig>(() => {
    const cleanedMessages = form.messages.map(m => m.trim()).filter(Boolean);
    return {
      ...form,
      messages: cleanedMessages,
      starts_at: form.starts_at || null,
      ends_at: form.ends_at || null,
      audience: 'all', // ignore audience in preview so admin always sees it
    };
  }, [form]);

  if (loading) {
    return (
      <AdminLayout title="Smart Bar" description="Configure your storefront promotional bar">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Smart Bar" description="A promotional bar shown on your storefront — supports rotating messages, scheduling, audience targeting and more.">
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* ─────────────────── LEFT: Editor ─────────────────── */}
        <div className="space-y-6">
          {/* ── Status ── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Megaphone className="h-5 w-5 text-accent" /> Status & Content
              </CardTitle>
              <CardDescription>Enable the bar and write what your customers should see.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-4 py-3">
                <div>
                  <Label className="font-medium">Enable Smart Bar</Label>
                  <p className="text-xs text-muted-foreground">When off, nothing is rendered on the storefront.</p>
                </div>
                <Switch checked={form.enabled} onCheckedChange={v => update('enabled', v)} />
              </div>

              <div className="space-y-2">
                <Label>Primary Message *</Label>
                <Input
                  value={form.text}
                  onChange={e => update('text', e.target.value)}
                  placeholder="🔥 Free Shipping on orders over ৳5000!"
                  maxLength={160}
                />
                <p className="text-xs text-muted-foreground">{form.text.length}/160 characters</p>
              </div>

              <div className="space-y-2">
                <Label>Icon / Emoji <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input
                  value={form.icon}
                  onChange={e => update('icon', e.target.value.slice(0, 4))}
                  placeholder="🚚  or  ⚡  or  🎁"
                  className="w-32 text-lg"
                />
              </div>

              <Separator />

              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium flex items-center gap-2">
                      <RotateCcw className="h-4 w-4" /> Rotating Messages
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Add multiple messages to auto-rotate them. The primary message is used when this list is empty.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={addMessage} className="gap-1">
                    <Plus className="h-4 w-4" /> Add
                  </Button>
                </div>

                {form.messages.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {form.messages.map((m, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                        <Input
                          value={m}
                          onChange={e => updateMessage(i, e.target.value)}
                          placeholder={`Message ${i + 1}`}
                          maxLength={160}
                        />
                        <Button variant="ghost" size="icon" onClick={() => moveMessage(i, -1)} disabled={i === 0}>
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => moveMessage(i, 1)} disabled={i === form.messages.length - 1}>
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => removeMessage(i)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div>
                        <Label>Rotation Interval (seconds)</Label>
                        <Input
                          type="number" min={2} max={60}
                          value={form.rotation_seconds}
                          onChange={e => update('rotation_seconds', Math.max(2, Math.min(60, Number(e.target.value) || 5)))}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ── Link ── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MousePointerClick className="h-5 w-5 text-accent" /> Click Behavior
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Link URL <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input
                  value={form.link}
                  onChange={e => update('link', e.target.value)}
                  placeholder="/deals  or  https://example.com"
                />
                <p className="text-xs text-muted-foreground">
                  Internal route (starts with <code>/</code>) or full external URL. Leave empty to make the bar non-clickable.
                </p>
              </div>
              <div className="flex items-center justify-between">
                <Label className="font-normal">Open link in new tab</Label>
                <Switch checked={form.open_in_new_tab} onCheckedChange={v => update('open_in_new_tab', v)} />
              </div>
            </CardContent>
          </Card>

          {/* ── Appearance ── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Palette className="h-5 w-5 text-accent" /> Appearance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <Label className="mb-2 block">Color Presets</Label>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map(p => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, ...p.patch }))}
                      className="group flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs hover:border-accent transition"
                    >
                      <span
                        className="h-4 w-8 rounded-full border border-border/60"
                        style={{
                          background: p.patch.gradient_enabled
                            ? `linear-gradient(90deg, ${p.patch.bg_color}, ${p.patch.gradient_end_color})`
                            : p.patch.bg_color,
                        }}
                      />
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Background Color</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <input type="color" value={form.bg_color} onChange={e => update('bg_color', e.target.value)} className="h-10 w-12 rounded border border-border cursor-pointer" />
                    <Input value={form.bg_color} onChange={e => update('bg_color', e.target.value)} className="flex-1" />
                  </div>
                </div>
                <div>
                  <Label>Text Color</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <input type="color" value={form.text_color} onChange={e => update('text_color', e.target.value)} className="h-10 w-12 rounded border border-border cursor-pointer" />
                    <Input value={form.text_color} onChange={e => update('text_color', e.target.value)} className="flex-1" />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                <div>
                  <Label className="font-medium">Use Gradient Background</Label>
                  <p className="text-xs text-muted-foreground">Blends from background color to a second color.</p>
                </div>
                <Switch checked={form.gradient_enabled} onCheckedChange={v => update('gradient_enabled', v)} />
              </div>
              {form.gradient_enabled && (
                <div>
                  <Label>Gradient End Color</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <input type="color" value={form.gradient_end_color} onChange={e => update('gradient_end_color', e.target.value)} className="h-10 w-12 rounded border border-border cursor-pointer" />
                    <Input value={form.gradient_end_color} onChange={e => update('gradient_end_color', e.target.value)} className="flex-1" />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label>Text Size</Label>
                  <Select value={form.text_size} onValueChange={v => update('text_size', v as FormState['text_size'])}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sm">Small</SelectItem>
                      <SelectItem value="base">Medium</SelectItem>
                      <SelectItem value="lg">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Font Weight</Label>
                  <Select value={form.font_weight} onValueChange={v => update('font_weight', v as FormState['font_weight'])}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="semibold">Semibold</SelectItem>
                      <SelectItem value="bold">Bold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Position</Label>
                  <Select value={form.position} onValueChange={v => update('position', v as FormState['position'])}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="top">Top of page</SelectItem>
                      <SelectItem value="bottom">Fixed at bottom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> Animation</Label>
                  <Select value={form.animation} onValueChange={v => update('animation', v as FormState['animation'])}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="pulse">Pulse</SelectItem>
                      <SelectItem value="slide">Slide-in (per message)</SelectItem>
                      <SelectItem value="marquee">Marquee scroll</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end justify-between rounded-lg border border-border px-4 py-3">
                  <Label className="font-normal">Allow user to dismiss</Label>
                  <Switch checked={form.dismissible} onCheckedChange={v => update('dismissible', v)} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Targeting & Schedule ── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-5 w-5 text-accent" /> Audience & Schedule
              </CardTitle>
              <CardDescription>Control who sees the bar and when it goes live.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Audience</Label>
                <Select value={form.audience} onValueChange={v => update('audience', v as FormState['audience'])}>
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
                  <Input type="datetime-local" value={form.starts_at} onChange={e => update('starts_at', e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="flex items-center gap-2"><Clock className="h-4 w-4" /> Ends at</Label>
                  <Input type="datetime-local" value={form.ends_at} onChange={e => update('ends_at', e.target.value)} className="mt-1" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Leave blank for no time limits. Times use the visitor's local timezone.</p>
            </CardContent>
          </Card>

          {/* ── Actions ── */}
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={save} disabled={saving} size="lg" className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Smart Bar
            </Button>
            <Button variant="outline" onClick={resetDismissals} className="gap-2">
              <RotateCcw className="h-4 w-4" /> Reset visitor dismissals
            </Button>
            <Button
              variant="ghost"
              onClick={() => setForm(DEFAULTS)}
              className="gap-2 text-muted-foreground"
            >
              Reset to defaults
            </Button>
          </div>
        </div>

        {/* ─────────────────── RIGHT: Sticky live preview ─────────────────── */}
        <div className="space-y-4 lg:sticky lg:top-4 self-start">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Eye className="h-5 w-5 text-accent" /> Live Preview
              </CardTitle>
              <CardDescription>Updates instantly as you edit. Matches the storefront output 1:1.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border bg-background overflow-hidden">
                {form.enabled ? (
                  <SmartBarPreview key={JSON.stringify(previewConfig)} />
                ) : (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    Smart Bar is disabled. Toggle it on to preview.
                  </div>
                )}
                {/* Hidden inline render driven by the in-memory form so admins
                    see edits before saving. We bypass the DB fetch by passing
                    the config via a custom render below. */}
                <InlinePreview config={previewConfig} />
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Badge variant="secondary" className="text-[10px]">{form.position}</Badge>
                <Badge variant="secondary" className="text-[10px]">{form.animation}</Badge>
                <Badge variant="secondary" className="text-[10px]">{form.audience}</Badge>
                {form.gradient_enabled && <Badge variant="secondary" className="text-[10px]">gradient</Badge>}
                {form.dismissible && <Badge variant="secondary" className="text-[10px]">dismissible</Badge>}
                {form.messages.filter(m => m.trim()).length > 0 && (
                  <Badge variant="secondary" className="text-[10px]">{form.messages.filter(m => m.trim()).length + 1} messages</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tips</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2">
              <p>• Keep messages under ~80 characters so they fit on mobile without truncation.</p>
              <p>• Use rotating messages to highlight several promos without crowding the bar.</p>
              <p>• If you enable the bottom position, allow dismissal so it doesn't block content forever.</p>
              <p>• Schedule a campaign by setting Starts/Ends in advance — the bar will switch on/off automatically.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

/**
 * Lightweight inline renderer that mirrors the storefront SmartBar look but
 * uses the in-memory form values directly so unsaved edits preview live.
 */
const InlinePreview = ({ config }: { config: SmartBarConfig }) => {
  const messages = (config.messages?.length ? config.messages : [config.text || '']).filter(Boolean);
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (messages.length <= 1) return;
    const id = setInterval(() => setIdx(i => (i + 1) % messages.length), Math.max(2, config.rotation_seconds ?? 5) * 1000);
    return () => clearInterval(id);
  }, [messages.length, config.rotation_seconds]);

  if (!config.enabled || messages.length === 0) return null;

  const bg = config.bg_color || '#f97316';
  const fg = config.text_color || '#ffffff';
  const background = config.gradient_enabled && config.gradient_end_color
    ? `linear-gradient(90deg, ${bg}, ${config.gradient_end_color})`
    : bg;
  const sizeCls = config.text_size === 'lg' ? 'text-base' : config.text_size === 'sm' ? 'text-xs' : 'text-sm';
  const weightCls =
    config.font_weight === 'bold' ? 'font-bold' :
    config.font_weight === 'semibold' ? 'font-semibold' :
    config.font_weight === 'normal' ? 'font-normal' : 'font-medium';

  const current = messages[idx % messages.length];
  const isMarquee = config.animation === 'marquee';

  return (
    <div className="relative px-10 py-2.5 flex items-center justify-center overflow-hidden" style={{ background, color: fg }}>
      {isMarquee ? (
        <div className="flex w-full overflow-hidden">
          <div className="topbar-marquee whitespace-nowrap" style={{ animationDuration: `${Math.max(15, 60 - (config.rotation_seconds ?? 5) * 2)}s` }}>
            {[0, 1, 2].map(k => (
              <span key={k} className={`px-8 inline-flex items-center gap-2 ${sizeCls} ${weightCls}`}>
                {config.icon && <span>{config.icon}</span>}{current}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <span
          key={idx}
          className={`inline-flex items-center gap-2 ${sizeCls} ${weightCls} ${config.animation === 'pulse' ? 'animate-pulse' : ''} ${config.animation === 'slide' ? 'smartbar-slide-in' : ''}`}
        >
          {config.icon && <span>{config.icon}</span>}{current}
        </span>
      )}
    </div>
  );
};

export default AdminSmartBar;
