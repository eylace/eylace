import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Activity, CheckCircle2, XCircle, AlertTriangle, Save, RefreshCw, Loader2,
  Globe, BarChart3, Eye, Search, MousePointerClick, Video, FileDown, ShoppingCart,
  CreditCard, UserPlus, LogIn, Mail, Play, ExternalLink, Code2, Map, Home,
} from 'lucide-react';

interface TrackingSettings {
  globalEnabled: boolean;
  gtm: { enabled: boolean; containerId: string; testMode: boolean };
  facebookCapi: { enabled: boolean; pixelId: string; accessToken: string; testEventCode: string };
  metaPixel: { enabled: boolean; pixelId: string };
  ga4Client: { enabled: boolean; measurementId: string };
  ga4Server: { enabled: boolean; measurementId: string; apiSecret: string };
  tiktok: { enabled: boolean; pixelId: string };
  clarity: { enabled: boolean; projectId: string };
  lookerStudio: { enabled: boolean; reportUrl: string };
  searchConsole: { enabled: boolean; verificationCode: string; metaTag: string };
  customScript: { enabled: boolean; headHtml: string; bodyHtml: string };
}

const defaultSettings: TrackingSettings = {
  globalEnabled: false,
  gtm: { enabled: false, containerId: '', testMode: false },
  facebookCapi: { enabled: false, pixelId: '', accessToken: '', testEventCode: '' },
  metaPixel: { enabled: false, pixelId: '' },
  ga4Client: { enabled: false, measurementId: '' },
  ga4Server: { enabled: false, measurementId: '', apiSecret: '' },
  tiktok: { enabled: false, pixelId: '' },
  clarity: { enabled: false, projectId: '' },
  lookerStudio: { enabled: false, reportUrl: '' },
  searchConsole: { enabled: false, verificationCode: '', metaTag: '' },
  customScript: { enabled: false, headHtml: '', bodyHtml: '' },
};

type StatusType = 'connected' | 'not_connected' | 'error';

const StatusBadge = ({ status }: { status: StatusType }) => {
  if (status === 'connected') return <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 gap-1"><CheckCircle2 className="h-3 w-3" />Connected</Badge>;
  if (status === 'error') return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />Error</Badge>;
  return <Badge variant="secondary" className="gap-1"><XCircle className="h-3 w-3" />Not Connected</Badge>;
};

const getStatus = (enabled: boolean, ...fields: string[]): StatusType => {
  if (!enabled) return 'not_connected';
  return fields.every(f => f.trim().length > 0) ? 'connected' : 'error';
};

const EventList = ({ events }: { events: string[] }) => (
  <div className="mt-3 p-3 rounded-lg bg-muted/50 border border-border">
    <p className="text-xs font-medium text-muted-foreground mb-2">Tracked Events:</p>
    <div className="flex flex-wrap gap-1.5">
      {events.map(e => (
        <span key={e} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{e}</span>
      ))}
    </div>
  </div>
);

export default function AdminTrackingAnalytics() {
  const [settings, setSettings] = useState<TrackingSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'home';
  const setActiveTab = (v: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', v);
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'tracking_analytics_v1')
        .maybeSingle();
      if (data?.value && typeof data.value === 'object') {
        setSettings({ ...defaultSettings, ...(data.value as any) });
      }
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('system_settings')
      .upsert({ key: 'tracking_analytics_v1', value: settings as any }, { onConflict: 'key' });
    setSaving(false);
    if (error) { toast.error('Failed to save settings'); return; }
    toast.success('Tracking settings saved! Scripts will be injected automatically.');
  };

  const update = <K extends keyof TrackingSettings>(key: K, val: TrackingSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: val }));
  };

  const updateNested = <K extends keyof TrackingSettings>(
    key: K,
    field: string,
    val: any
  ) => {
    setSettings(prev => ({ ...prev, [key]: { ...(prev[key] as any), [field]: val } }));
  };

  if (loading) return (
    <AdminLayout title="Tracking & Analytics" description="Configure all tracking pixels and analytics">
      <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
    </AdminLayout>
  );

  const connectedCount = [
    settings.gtm.enabled && settings.gtm.containerId,
    settings.facebookCapi.enabled && settings.facebookCapi.pixelId && settings.facebookCapi.accessToken,
    settings.metaPixel?.enabled && settings.metaPixel?.pixelId,
    settings.ga4Client.enabled && settings.ga4Client.measurementId,
    settings.ga4Server.enabled && settings.ga4Server.measurementId,
    settings.tiktok.enabled && settings.tiktok.pixelId,
    settings.clarity.enabled && settings.clarity.projectId,
    settings.lookerStudio.enabled && settings.lookerStudio.reportUrl,
    settings.searchConsole.enabled && (settings.searchConsole.verificationCode || settings.searchConsole.metaTag),
    settings.customScript?.enabled && (settings.customScript?.headHtml || settings.customScript?.bodyHtml),
  ].filter(Boolean).length;

  return (
    <AdminLayout title="Tracking & Analytics" description="Configure all tracking pixels, analytics, and marketing integrations">
      {/* Global Controls */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
            <Switch checked={settings.globalEnabled} onCheckedChange={v => update('globalEnabled', v)} />
            <div>
              <p className="text-sm font-semibold text-foreground">Global Tracking</p>
              <p className="text-xs text-muted-foreground">{settings.globalEnabled ? 'Active' : 'Disabled'} · {connectedCount}/10 connected</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Activity className="h-4 w-4" />
            <span>{connectedCount} platforms active</span>
          </div>
        </div>
        <Button onClick={save} disabled={saving} variant="accent" className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save All Settings
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
          <TabsTrigger value="home" className="text-xs gap-1.5"><Home className="h-3.5 w-3.5" />Home</TabsTrigger>
          <TabsTrigger value="ga4-client" className="text-xs gap-1.5"><BarChart3 className="h-3.5 w-3.5" />Google Analytics (GA4)</TabsTrigger>
          <TabsTrigger value="gtm" className="text-xs gap-1.5"><Globe className="h-3.5 w-3.5" />GTM</TabsTrigger>
          <TabsTrigger value="meta-pixel" className="text-xs gap-1.5"><MousePointerClick className="h-3.5 w-3.5" />Meta Pixel</TabsTrigger>
          <TabsTrigger value="facebook" className="text-xs gap-1.5"><MousePointerClick className="h-3.5 w-3.5" />Meta Conversion API</TabsTrigger>
          <TabsTrigger value="ga4-server" className="text-xs gap-1.5"><RefreshCw className="h-3.5 w-3.5" />GA4 Server</TabsTrigger>
          <TabsTrigger value="tiktok" className="text-xs gap-1.5"><Play className="h-3.5 w-3.5" />TikTok</TabsTrigger>
          <TabsTrigger value="clarity" className="text-xs gap-1.5"><Eye className="h-3.5 w-3.5" />Clarity</TabsTrigger>
          <TabsTrigger value="custom" className="text-xs gap-1.5"><Code2 className="h-3.5 w-3.5" />Custom Script</TabsTrigger>
          <TabsTrigger value="looker" className="text-xs gap-1.5"><BarChart3 className="h-3.5 w-3.5" />Looker Studio</TabsTrigger>
          <TabsTrigger value="search-console" className="text-xs gap-1.5"><Search className="h-3.5 w-3.5" />Search Console</TabsTrigger>
          <TabsTrigger value="sitemap" className="text-xs gap-1.5"><Map className="h-3.5 w-3.5" />Sitemap Generator</TabsTrigger>
          <TabsTrigger value="seo" className="text-xs gap-1.5"><Globe className="h-3.5 w-3.5" />Global SEO</TabsTrigger>
        </TabsList>

        {/* Home overview */}
        <TabsContent value="home">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Activity className="h-5 w-5 text-accent" />Marketing Analytics Home</CardTitle>
              <CardDescription>Overview of all tracking & analytics integrations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { label: 'Google Analytics (GA4)', tab: 'ga4-client', status: getStatus(settings.ga4Client.enabled, settings.ga4Client.measurementId) },
                  { label: 'Google Tag Manager', tab: 'gtm', status: getStatus(settings.gtm.enabled, settings.gtm.containerId) },
                  { label: 'Meta Pixel', tab: 'meta-pixel', status: getStatus(settings.metaPixel?.enabled || false, settings.metaPixel?.pixelId || '') },
                  { label: 'Meta Conversion API', tab: 'facebook', status: getStatus(settings.facebookCapi.enabled, settings.facebookCapi.pixelId, settings.facebookCapi.accessToken) },
                  { label: 'GA4 Server-Side', tab: 'ga4-server', status: getStatus(settings.ga4Server.enabled, settings.ga4Server.measurementId) },
                  { label: 'TikTok Pixel', tab: 'tiktok', status: getStatus(settings.tiktok.enabled, settings.tiktok.pixelId) },
                  { label: 'Microsoft Clarity', tab: 'clarity', status: getStatus(settings.clarity.enabled, settings.clarity.projectId) },
                  { label: 'Custom Script', tab: 'custom', status: getStatus(settings.customScript?.enabled || false, (settings.customScript?.headHtml || '') + (settings.customScript?.bodyHtml || '')) },
                  { label: 'Looker Studio', tab: 'looker', status: getStatus(settings.lookerStudio.enabled, settings.lookerStudio.reportUrl) },
                  { label: 'Search Console', tab: 'search-console', status: getStatus(settings.searchConsole.enabled, settings.searchConsole.verificationCode || settings.searchConsole.metaTag) },
                ].map(item => (
                  <button key={item.tab} onClick={() => setActiveTab(item.tab)} className="text-left p-4 rounded-lg border border-border hover:border-accent/50 hover:bg-accent/5 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold">{item.label}</span>
                      <StatusBadge status={item.status} />
                    </div>
                    <span className="text-xs text-muted-foreground">Click to configure</span>
                  </button>
                ))}
                <Link to="/admin/system/sitemap" className="text-left p-4 rounded-lg border border-border hover:border-accent/50 hover:bg-accent/5 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold">Sitemap Generator</span>
                    <Badge variant="outline" className="gap-1"><ExternalLink className="h-3 w-3" />Open</Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">Generate & submit XML sitemap</span>
                </Link>
                <Link to="/admin/seo" className="text-left p-4 rounded-lg border border-border hover:border-accent/50 hover:bg-accent/5 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold">Global SEO</span>
                    <Badge variant="outline" className="gap-1"><ExternalLink className="h-3 w-3" />Open</Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">Site-wide SEO & meta defaults</span>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* GTM */}
        <TabsContent value="gtm">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2"><Globe className="h-5 w-5 text-blue-500" />Google Tag Manager</CardTitle>
                <CardDescription>Container-based tag management with Data Layer events</CardDescription>
              </div>
              <StatusBadge status={getStatus(settings.gtm.enabled, settings.gtm.containerId)} />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Switch checked={settings.gtm.enabled} onCheckedChange={v => updateNested('gtm', 'enabled', v)} />
                <Label>Enable GTM</Label>
              </div>
              <div className="space-y-2">
                <Label>GTM Container ID</Label>
                <Input placeholder="GTM-XXXXXXX" value={settings.gtm.containerId} onChange={e => updateNested('gtm', 'containerId', e.target.value)} />
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={settings.gtm.testMode} onCheckedChange={v => updateNested('gtm', 'testMode', v)} />
                <Label>Test Mode (Preview & Debug)</Label>
              </div>
              <EventList events={[
                'page_view', 'scroll', 'button_click', 'link_click', 'form_submit', 'search',
                'add_to_cart', 'remove_from_cart', 'view_item', 'begin_checkout', 'add_payment_info',
                'purchase', 'sign_up', 'login', 'contact_form', 'newsletter_subscribe', 'video_play', 'file_download',
              ]} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Facebook CAPI */}
        <TabsContent value="facebook">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2"><MousePointerClick className="h-5 w-5 text-blue-600" />Facebook Conversion API</CardTitle>
                <CardDescription>Server-side event tracking with event deduplication</CardDescription>
              </div>
              <StatusBadge status={getStatus(settings.facebookCapi.enabled, settings.facebookCapi.pixelId, settings.facebookCapi.accessToken)} />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Switch checked={settings.facebookCapi.enabled} onCheckedChange={v => updateNested('facebookCapi', 'enabled', v)} />
                <Label>Enable Facebook CAPI</Label>
              </div>
              <div className="space-y-2">
                <Label>Facebook Pixel ID</Label>
                <Input placeholder="1234567890" value={settings.facebookCapi.pixelId} onChange={e => updateNested('facebookCapi', 'pixelId', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Conversion API Access Token</Label>
                <Input type="password" placeholder="EAAxxxxxxx..." value={settings.facebookCapi.accessToken} onChange={e => updateNested('facebookCapi', 'accessToken', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Test Event Code (optional)</Label>
                <Input placeholder="TEST12345" value={settings.facebookCapi.testEventCode} onChange={e => updateNested('facebookCapi', 'testEventCode', e.target.value)} />
              </div>
              <EventList events={[
                'PageView', 'ViewContent', 'Search', 'AddToCart', 'AddToWishlist',
                'InitiateCheckout', 'AddPaymentInfo', 'Purchase', 'Lead',
                'CompleteRegistration', 'Contact', 'Subscribe',
              ]} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* GA4 Client */}
        <TabsContent value="ga4-client">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2"><BarChart3 className="h-5 w-5 text-orange-500" />Google Analytics 4 (Client-Side)</CardTitle>
                <CardDescription>Enhanced measurement with automatic event tracking</CardDescription>
              </div>
              <StatusBadge status={getStatus(settings.ga4Client.enabled, settings.ga4Client.measurementId)} />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Switch checked={settings.ga4Client.enabled} onCheckedChange={v => updateNested('ga4Client', 'enabled', v)} />
                <Label>Enable GA4</Label>
              </div>
              <div className="space-y-2">
                <Label>GA4 Measurement ID</Label>
                <Input placeholder="G-XXXXXXXXXX" value={settings.ga4Client.measurementId} onChange={e => updateNested('ga4Client', 'measurementId', e.target.value)} />
              </div>
              <EventList events={[
                'page_view', 'scroll', 'outbound_click', 'site_search',
                'video_engagement', 'file_download', 'form_submit',
              ]} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* GA4 Server */}
        <TabsContent value="ga4-server">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2"><RefreshCw className="h-5 w-5 text-green-500" />GA4 Server-Side Tracking</CardTitle>
                <CardDescription>Bypass ad blockers with server-side event forwarding</CardDescription>
              </div>
              <StatusBadge status={getStatus(settings.ga4Server.enabled, settings.ga4Server.measurementId)} />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Switch checked={settings.ga4Server.enabled} onCheckedChange={v => updateNested('ga4Server', 'enabled', v)} />
                <Label>Enable GA4 Server-Side</Label>
              </div>
              <div className="space-y-2">
                <Label>GA4 Measurement ID</Label>
                <Input placeholder="G-XXXXXXXXXX" value={settings.ga4Server.measurementId} onChange={e => updateNested('ga4Server', 'measurementId', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>API Secret (optional)</Label>
                <Input type="password" placeholder="API Secret" value={settings.ga4Server.apiSecret} onChange={e => updateNested('ga4Server', 'apiSecret', e.target.value)} />
              </div>
              <EventList events={[
                'page_view', 'session_start', 'user_engagement', 'view_item',
                'add_to_cart', 'remove_from_cart', 'begin_checkout',
                'add_payment_info', 'purchase', 'generate_lead', 'login', 'sign_up', 'search',
              ]} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* TikTok */}
        <TabsContent value="tiktok">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2"><Play className="h-5 w-5 text-foreground" />TikTok Pixel</CardTitle>
                <CardDescription>Event tracking via Data Layer for TikTok Ads</CardDescription>
              </div>
              <StatusBadge status={getStatus(settings.tiktok.enabled, settings.tiktok.pixelId)} />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Switch checked={settings.tiktok.enabled} onCheckedChange={v => updateNested('tiktok', 'enabled', v)} />
                <Label>Enable TikTok Pixel</Label>
              </div>
              <div className="space-y-2">
                <Label>TikTok Pixel ID</Label>
                <Input placeholder="CXXXXXXXXXXXXXXX" value={settings.tiktok.pixelId} onChange={e => updateNested('tiktok', 'pixelId', e.target.value)} />
              </div>
              <EventList events={[
                'PageView', 'ViewContent', 'Search', 'AddToCart',
                'InitiateCheckout', 'AddPaymentInfo', 'Purchase',
                'SignUp', 'Subscribe', 'Contact',
              ]} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Clarity */}
        <TabsContent value="clarity">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2"><Eye className="h-5 w-5 text-purple-500" />Microsoft Clarity</CardTitle>
                <CardDescription>Heatmaps, session recordings & user behavior analytics</CardDescription>
              </div>
              <StatusBadge status={getStatus(settings.clarity.enabled, settings.clarity.projectId)} />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Switch checked={settings.clarity.enabled} onCheckedChange={v => updateNested('clarity', 'enabled', v)} />
                <Label>Enable Clarity</Label>
              </div>
              <div className="space-y-2">
                <Label>Clarity Project ID</Label>
                <Input placeholder="abcdefghij" value={settings.clarity.projectId} onChange={e => updateNested('clarity', 'projectId', e.target.value)} />
              </div>
              <div className="mt-3 p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-xs font-medium text-muted-foreground mb-2">Features Enabled:</p>
                <div className="flex flex-wrap gap-1.5">
                  {['Heatmaps', 'Session Recordings', 'User Interactions', 'Scroll Behavior', 'Click Tracking', 'Rage Clicks'].map(f => (
                    <span key={f} className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 font-medium">{f}</span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Looker Studio */}
        <TabsContent value="looker">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2"><BarChart3 className="h-5 w-5 text-yellow-500" />Looker Studio Dashboard</CardTitle>
                <CardDescription>Embed analytics dashboards directly in the admin panel</CardDescription>
              </div>
              <StatusBadge status={getStatus(settings.lookerStudio.enabled, settings.lookerStudio.reportUrl)} />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Switch checked={settings.lookerStudio.enabled} onCheckedChange={v => updateNested('lookerStudio', 'enabled', v)} />
                <Label>Enable Looker Studio Embed</Label>
              </div>
              <div className="space-y-2">
                <Label>Looker Studio Report URL</Label>
                <Input placeholder="https://lookerstudio.google.com/embed/reporting/..." value={settings.lookerStudio.reportUrl} onChange={e => updateNested('lookerStudio', 'reportUrl', e.target.value)} />
              </div>
              {settings.lookerStudio.enabled && settings.lookerStudio.reportUrl && (
                <div className="mt-4 rounded-lg overflow-hidden border border-border">
                  <iframe
                    src={settings.lookerStudio.reportUrl}
                    className="w-full h-[500px]"
                    frameBorder="0"
                    allowFullScreen
                    sandbox="allow-scripts allow-same-origin allow-popups"
                    title="Looker Studio Report"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Search Console */}
        <TabsContent value="search-console">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2"><Search className="h-5 w-5 text-green-600" />Google Search Console</CardTitle>
                <CardDescription>Site ownership verification & search performance</CardDescription>
              </div>
              <StatusBadge status={getStatus(settings.searchConsole.enabled, settings.searchConsole.verificationCode || settings.searchConsole.metaTag)} />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Switch checked={settings.searchConsole.enabled} onCheckedChange={v => updateNested('searchConsole', 'enabled', v)} />
                <Label>Enable Search Console Verification</Label>
              </div>
              <div className="space-y-2">
                <Label>HTML Verification Code</Label>
                <Input placeholder="google-site-verification=xxxxx" value={settings.searchConsole.verificationCode} onChange={e => updateNested('searchConsole', 'verificationCode', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Meta Tag Verification (alternative)</Label>
                <Input placeholder='<meta name="google-site-verification" content="..." />' value={settings.searchConsole.metaTag} onChange={e => updateNested('searchConsole', 'metaTag', e.target.value)} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}
