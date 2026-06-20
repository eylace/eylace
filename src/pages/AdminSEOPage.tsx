import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Save, Search, FileText, BarChart3, Loader2, RotateCcw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  defaultSeoSettings,
  SeoSettings,
  saveSeoSettings,
} from '@/hooks/useSeoSettings';

const SETTINGS_KEY = 'seo_settings_v1';

const AdminSEOPage = () => {
  const [seo, setSeo] = useState<SeoSettings>(defaultSeoSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', SETTINGS_KEY)
      .maybeSingle();
    if (error) {
      toast.error('Failed to load SEO settings');
    } else if (data?.value && typeof data.value === 'object') {
      setSeo({ ...defaultSeoSettings, ...(data.value as any) });
    } else {
      setSeo(defaultSeoSettings);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // Realtime: reflect external changes (deletes, edits from another tab)
    const channel = supabase
      .channel('admin-seo-settings')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'system_settings', filter: `key=eq.${SETTINGS_KEY}` },
        () => load()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = <K extends keyof SeoSettings>(key: K, value: SeoSettings[K]) =>
    setSeo((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      if (seo.jsonLdOrganization?.trim()) {
        try { JSON.parse(seo.jsonLdOrganization); }
        catch { toast.error('Organization JSON-LD is not valid JSON'); setSaving(false); return; }
      }
      await saveSeoSettings(seo);
      toast.success('SEO settings saved — applied live');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save SEO settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Reset all SEO settings to defaults?')) return;
    setSaving(true);
    try {
      await saveSeoSettings(defaultSeoSettings);
      setSeo(defaultSeoSettings);
      toast.success('SEO settings reset');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to reset');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout titleKey="admin.title.seo" descriptionKey="admin.desc.seo">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout titleKey="admin.title.seo" descriptionKey="admin.desc.seo">
      <div className="space-y-6">
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleReset} disabled={saving}>
            <RotateCcw className="h-4 w-4 mr-1" /> Reset
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            Save SEO Settings
          </Button>
        </div>

        <Tabs defaultValue="meta">
          <TabsList>
            <TabsTrigger value="meta">Meta Tags</TabsTrigger>
            <TabsTrigger value="social">Social Media</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="meta" className="mt-4 space-y-4">
            <Card className="border border-border">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Search className="h-5 w-5" /> Meta Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Site Title</Label>
                  <Input value={seo.siteTitle} onChange={e => update('siteTitle', e.target.value)} />
                  <p className="text-xs text-muted-foreground">{seo.siteTitle.length}/60 characters</p>
                </div>
                <div className="space-y-2">
                  <Label>Meta Description</Label>
                  <Textarea value={seo.metaDescription} onChange={e => update('metaDescription', e.target.value)} rows={3} />
                  <p className="text-xs text-muted-foreground">{seo.metaDescription.length}/160 characters</p>
                </div>
                <div className="space-y-2">
                  <Label>Meta Keywords</Label>
                  <Input value={seo.metaKeywords} onChange={e => update('metaKeywords', e.target.value)} placeholder="comma separated keywords" />
                </div>
                <div className="space-y-2">
                  <Label>Canonical URL</Label>
                  <Input value={seo.canonicalUrl} onChange={e => update('canonicalUrl', e.target.value)} />
                </div>
                <div className="flex items-center justify-between rounded-md border border-border p-3">
                  <div>
                    <p className="font-medium text-sm">Allow Search Engine Indexing</p>
                    <p className="text-xs text-muted-foreground">Off = noindex,nofollow on every page</p>
                  </div>
                  <Switch checked={seo.indexable} onCheckedChange={v => update('indexable', v)} />
                </div>
              </CardContent>
            </Card>

            {/* Preview */}
            <Card className="border border-border">
              <CardHeader><CardTitle className="text-base">Google Search Preview</CardTitle></CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-lg space-y-1">
                  <p className="text-accent text-lg hover:underline cursor-pointer">{seo.siteTitle || 'Page Title'}</p>
                  <p className="text-green-600 text-sm">{seo.canonicalUrl}</p>
                  <p className="text-sm text-muted-foreground">{seo.metaDescription || 'Meta description will appear here...'}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="social" className="mt-4">
            <Card className="border border-border">
              <CardHeader><CardTitle className="text-base">Open Graph / Social Sharing</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable Open Graph tags</Label>
                  <Switch checked={seo.enableOpenGraph} onCheckedChange={v => update('enableOpenGraph', v)} />
                </div>
                <div className="space-y-2"><Label>OG Title</Label><Input value={seo.ogTitle} onChange={e => update('ogTitle', e.target.value)} placeholder="Defaults to Site Title" /></div>
                <div className="space-y-2"><Label>OG Description</Label><Textarea value={seo.ogDescription} onChange={e => update('ogDescription', e.target.value)} rows={2} placeholder="Defaults to Meta Description" /></div>
                <div className="space-y-2"><Label>OG Image URL</Label><Input value={seo.ogImage} onChange={e => update('ogImage', e.target.value)} placeholder="https://example.com/og-image.jpg" /></div>
                <p className="text-xs text-muted-foreground">Recommended size: 1200x630 pixels</p>

                <div className="border-t pt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Enable Twitter Cards</Label>
                    <Switch checked={seo.enableTwitterCards} onCheckedChange={v => update('enableTwitterCards', v)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Twitter Card Type</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={seo.twitterCard}
                      onChange={(e) => update('twitterCard', e.target.value as any)}
                    >
                      <option value="summary">summary</option>
                      <option value="summary_large_image">summary_large_image</option>
                    </select>
                  </div>
                  <div className="space-y-2"><Label>Twitter Handle</Label><Input value={seo.twitterHandle} onChange={e => update('twitterHandle', e.target.value)} placeholder="@yourbrand" /></div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="mt-4 space-y-4">
            <Card className="border border-border">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Tracking Codes</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground">For the full tracking suite (GTM, GA4, Pixel, TikTok, Clarity, CAPI) use the dedicated <strong>Tracking &amp; Analytics</strong> page. These fields are quick-add convenience only.</p>
                <div className="space-y-2"><Label>Google Analytics ID</Label><Input value={seo.googleAnalyticsId} onChange={e => update('googleAnalyticsId', e.target.value)} placeholder="G-XXXXXXXXXX" /></div>
                <div className="space-y-2"><Label>Facebook Pixel ID</Label><Input value={seo.facebookPixelId} onChange={e => update('facebookPixelId', e.target.value)} placeholder="XXXXXXXXXXXXXXX" /></div>
                <div className="space-y-2"><Label>Google Site Verification</Label><Input value={seo.googleSiteVerification} onChange={e => update('googleSiteVerification', e.target.value)} placeholder="verification code" /></div>
                <div className="space-y-2"><Label>Bing Site Verification</Label><Input value={seo.bingSiteVerification} onChange={e => update('bingSiteVerification', e.target.value)} placeholder="verification code" /></div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="mt-4 space-y-4">
            <Card className="border border-border">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="h-5 w-5" /> Robots.txt (reference)</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Textarea value={seo.robotsTxt} onChange={e => update('robotsTxt', e.target.value)} rows={6} className="font-mono text-sm" />
                <p className="text-xs text-muted-foreground">Stored for reference. The live robots.txt is served from <code>public/robots.txt</code> and ships with the build.</p>
              </CardContent>
            </Card>
            <Card className="border border-border">
              <CardHeader><CardTitle className="text-base">Organization JSON-LD</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Textarea
                  value={seo.jsonLdOrganization}
                  onChange={e => update('jsonLdOrganization', e.target.value)}
                  rows={8}
                  className="font-mono text-xs"
                  placeholder='{"@context":"https://schema.org","@type":"Organization","name":"Eylace","url":"https://eylace.lovable.app"}'
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Must be valid JSON. Injected into every page&apos;s &lt;head&gt;.</p>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">Enable</Label>
                    <Switch checked={seo.enableJsonLd} onCheckedChange={v => update('enableJsonLd', v)} />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border border-border">
              <CardContent className="p-4 flex items-center justify-between">
                <div><p className="font-medium text-sm">Auto-generate Sitemap</p><p className="text-xs text-muted-foreground">Automatically generate sitemap.xml</p></div>
                <Switch checked={seo.sitemapEnabled} onCheckedChange={v => update('sitemapEnabled', v)} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminSEOPage;
