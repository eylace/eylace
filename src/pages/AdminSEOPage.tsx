import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Globe, Save, Search, FileText, BarChart3 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

const AdminSEOPage = () => {
  const [seo, setSeo] = useState({
    siteTitle: 'Grand Mall Emporium - Online Shopping',
    metaDescription: 'Shop the best products at Grand Mall Emporium. Great deals, fast shipping.',
    metaKeywords: 'ecommerce, shopping, deals, online store',
    ogImage: '',
    googleAnalyticsId: '',
    facebookPixelId: '',
    robotsTxt: 'User-agent: *\nAllow: /\nDisallow: /admin/',
    sitemapEnabled: true,
    canonicalUrl: 'https://grand-mall-emporium.lovable.app',
  });

  const update = (key: string, value: any) => setSeo(prev => ({ ...prev, [key]: value }));

  const handleSave = () => {
    toast.success('SEO settings saved');
  };

  return (
    <AdminLayout titleKey="admin.title.seo" descriptionKey="admin.desc.seo">
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button onClick={handleSave}><Save className="h-4 w-4 mr-1" /> Save SEO Settings</Button>
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
                <div className="space-y-2"><Label>OG Image URL</Label><Input value={seo.ogImage} onChange={e => update('ogImage', e.target.value)} placeholder="https://example.com/og-image.jpg" /></div>
                <p className="text-xs text-muted-foreground">Recommended size: 1200x630 pixels</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="mt-4 space-y-4">
            <Card className="border border-border">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Tracking Codes</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2"><Label>Google Analytics ID</Label><Input value={seo.googleAnalyticsId} onChange={e => update('googleAnalyticsId', e.target.value)} placeholder="G-XXXXXXXXXX" /></div>
                <div className="space-y-2"><Label>Facebook Pixel ID</Label><Input value={seo.facebookPixelId} onChange={e => update('facebookPixelId', e.target.value)} placeholder="XXXXXXXXXXXXXXX" /></div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="mt-4 space-y-4">
            <Card className="border border-border">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="h-5 w-5" /> Robots.txt</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Textarea value={seo.robotsTxt} onChange={e => update('robotsTxt', e.target.value)} rows={6} className="font-mono text-sm" />
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
