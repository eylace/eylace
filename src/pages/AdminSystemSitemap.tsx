import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Map, RefreshCw, Download, CheckCircle, Globe, FileText, Clock } from 'lucide-react';

const AdminSystemSitemap = () => {
  const [generating, setGenerating] = useState(false);
  const [config, setConfig] = useState({
    includeProducts: true,
    includeCategories: true,
    includePages: true,
    includeBrands: true,
    changeFrequency: 'daily',
    priority: '0.8',
    autoGenerate: true,
    autoInterval: '24',
  });
  const [lastGenerated, setLastGenerated] = useState<string | null>(null);
  const [sitemapUrls, setSitemapUrls] = useState<{ loc: string; lastmod: string; priority: string }[]>([]);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    const { data } = await supabase.from('system_settings').select('value').eq('key', 'sitemap_config').maybeSingle();
    if (data?.value && typeof data.value === 'object') {
      const val = data.value as any;
      setConfig(prev => ({ ...prev, ...val.config }));
      setLastGenerated(val.lastGenerated || null);
    }
  };

  const saveConfig = async () => {
    const payload = { config, lastGenerated };
    const { data: existing } = await supabase.from('system_settings').select('id').eq('key', 'sitemap_config').maybeSingle();
    if (existing) {
      await supabase.from('system_settings').update({ value: payload as any, updated_at: new Date().toISOString() }).eq('key', 'sitemap_config');
    } else {
      await supabase.from('system_settings').insert({ key: 'sitemap_config', value: payload as any });
    }
    toast({ title: 'Configuration Saved' });
  };

  const generateSitemap = async () => {
    setGenerating(true);
    
    const urls: { loc: string; lastmod: string; priority: string }[] = [];
    const baseUrl = window.location.origin;
    const now = new Date().toISOString().split('T')[0];

    // Static pages
    urls.push({ loc: `${baseUrl}/`, lastmod: now, priority: '1.0' });
    urls.push({ loc: `${baseUrl}/deals`, lastmod: now, priority: '0.9' });
    urls.push({ loc: `${baseUrl}/flash-sale`, lastmod: now, priority: '0.9' });

    if (config.includeProducts) {
      const { data: products } = await supabase.from('products').select('slug, updated_at').eq('is_active', true).limit(500);
      products?.forEach(p => urls.push({ loc: `${baseUrl}/product/${p.slug}`, lastmod: p.updated_at.split('T')[0], priority: config.priority }));
    }

    if (config.includeCategories) {
      const { data: categories } = await supabase.from('categories').select('slug, updated_at').limit(200);
      categories?.forEach(c => urls.push({ loc: `${baseUrl}/category/${c.slug}`, lastmod: c.updated_at.split('T')[0], priority: '0.7' }));
    }

    if (config.includeBrands) {
      const { data: brands } = await supabase.from('brands').select('slug, updated_at').eq('is_active', true).limit(200);
      brands?.forEach(b => urls.push({ loc: `${baseUrl}/brand/${b.slug}`, lastmod: b.updated_at.split('T')[0], priority: '0.6' }));
    }

    setSitemapUrls(urls);
    const genTime = new Date().toISOString();
    setLastGenerated(genTime);

    // Save
    const payload = { config, lastGenerated: genTime };
    const { data: existing } = await supabase.from('system_settings').select('id').eq('key', 'sitemap_config').maybeSingle();
    if (existing) {
      await supabase.from('system_settings').update({ value: payload as any, updated_at: new Date().toISOString() }).eq('key', 'sitemap_config');
    } else {
      await supabase.from('system_settings').insert({ key: 'sitemap_config', value: payload as any });
    }

    setGenerating(false);
    toast({ title: 'Sitemap Generated', description: `${urls.length} URLs included in sitemap.` });
  };

  const downloadSitemap = () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${config.changeFrequency}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sitemap.xml';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout titleKey="admin.system.sitemap">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Map className="h-5 w-5" />
              Sitemap Generator
            </CardTitle>
            <CardDescription>Generate and manage your XML sitemap for SEO</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {lastGenerated && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Last generated: {new Date(lastGenerated).toLocaleString()}</span>
              </div>
            )}
            <div className="flex gap-3">
              <Button onClick={generateSitemap} disabled={generating}>
                <RefreshCw className={`h-4 w-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
                {generating ? 'Generating...' : 'Generate Sitemap'}
              </Button>
              {sitemapUrls.length > 0 && (
                <Button variant="outline" onClick={downloadSitemap}>
                  <Download className="h-4 w-4 mr-2" />
                  Download XML ({sitemapUrls.length} URLs)
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>Choose what to include in your sitemap</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: 'includeProducts', label: 'Products', icon: FileText },
                { key: 'includeCategories', label: 'Categories', icon: Globe },
                { key: 'includePages', label: 'Static Pages', icon: FileText },
                { key: 'includeBrands', label: 'Brands', icon: Globe },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between p-3 rounded-lg border">
                  <Label className="flex items-center gap-2 cursor-pointer">
                    <item.icon className="h-4 w-4" />
                    Include {item.label}
                  </Label>
                  <Switch
                    checked={(config as any)[item.key]}
                    onCheckedChange={(v) => setConfig(prev => ({ ...prev, [item.key]: v }))}
                  />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Change Frequency</Label>
                <select
                  value={config.changeFrequency}
                  onChange={(e) => setConfig(prev => ({ ...prev, changeFrequency: e.target.value }))}
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  {['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'].map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Default Priority</Label>
                <Input
                  type="number" min="0" max="1" step="0.1"
                  value={config.priority}
                  onChange={(e) => setConfig(prev => ({ ...prev, priority: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Auto-generate Sitemap
                </Label>
                <p className="text-xs text-muted-foreground mt-1">Automatically regenerate sitemap periodically</p>
              </div>
              <Switch
                checked={config.autoGenerate}
                onCheckedChange={(v) => setConfig(prev => ({ ...prev, autoGenerate: v }))}
              />
            </div>

            {config.autoGenerate && (
              <div>
                <Label>Auto-generate Interval (hours)</Label>
                <Input
                  type="number" min="1" max="168"
                  value={config.autoInterval}
                  onChange={(e) => setConfig(prev => ({ ...prev, autoInterval: e.target.value }))}
                  className="mt-1 max-w-xs"
                />
              </div>
            )}

            <Button onClick={saveConfig}>Save Configuration</Button>
          </CardContent>
        </Card>

        {sitemapUrls.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Preview ({sitemapUrls.length} URLs)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-64 overflow-y-auto space-y-1">
                {sitemapUrls.slice(0, 50).map((u, i) => (
                  <div key={i} className="flex items-center justify-between text-xs p-2 rounded bg-muted/50">
                    <span className="truncate flex-1 mr-4">{u.loc}</span>
                    <Badge variant="outline" className="shrink-0">{u.priority}</Badge>
                  </div>
                ))}
                {sitemapUrls.length > 50 && (
                  <p className="text-xs text-muted-foreground text-center py-2">... and {sitemapUrls.length - 50} more URLs</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminSystemSitemap;
