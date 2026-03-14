import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Save, Loader2, Plus, Trash2, Eye, Edit, GripVertical } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { invalidateSetupCache } from '@/hooks/useWebsiteSetup';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';

import type { HeroBanner } from '@/hooks/useWebsiteSetup';

interface WebsiteSetupState {
  selectedHomepage: string;
  homepageBannerEnabled: boolean;
  homepageFeaturedCategories: boolean;
  homepageFlashSale: boolean;
  homepageNewArrivals: boolean;
  homepageBestSellers: boolean;
  homepageDeals: boolean;
  homepagePromoBanners: boolean;
  homepageBrandsCarousel: boolean;
  homepageTestimonials: boolean;
  homepageSectionsOrder: string[];
  fontFamily: string;
  headingFont: string;
  fontSize: string;
  authLayout: string;
  authBgImage: string;
  authShowSocialLogin: boolean;
  authShowRememberMe: boolean;
  authRequireEmailVerification: boolean;
  authAllowGuestCheckout: boolean;
  selectedHeader: string;
  headerStickyEnabled: boolean;
  headerSearchEnabled: boolean;
  headerCartIconEnabled: boolean;
  headerWishlistIconEnabled: boolean;
  headerLanguageSwitcher: boolean;
  headerCurrencySwitcher: boolean;
  headerAnnouncementText: string;
  topBarEnabled: boolean;
  topBarText: string;
  topBarBgColor: string;
  topBarTextColor: string;
  topBarLinks: { label: string; url: string }[];
  footerStyle: string;
  footerAboutText: string;
  footerCopyright: string;
  footerShowSocialLinks: boolean;
  footerShowNewsletter: boolean;
  footerShowPaymentIcons: boolean;
  footerColumns: { title: string; links: { label: string; url: string }[] }[];
  footerSocialLinks: { platform: string; url: string }[];
  pages: { id: string; title: string; slug: string; content: string; isPublished: boolean; sortOrder: number }[];
  primaryColor: string;
  accentColor: string;
  borderRadius: string;
  darkModeDefault: boolean;
  customCss: string;
  logoUrl: string;
  faviconUrl: string;
  heroBanners: HeroBanner[];
}

const defaultSetup: WebsiteSetupState = {
  selectedHomepage: 'default',
  homepageBannerEnabled: true,
  homepageFeaturedCategories: true,
  homepageFlashSale: true,
  homepageNewArrivals: true,
  homepageBestSellers: true,
  homepageDeals: true,
  homepagePromoBanners: true,
  homepageBrandsCarousel: false,
  homepageTestimonials: false,
  homepageSectionsOrder: ['banner', 'categories', 'flash_sale', 'new_arrivals', 'best_sellers', 'deals', 'promo_banners'],
  fontFamily: 'Inter',
  headingFont: 'Inter',
  fontSize: '16',
  authLayout: 'split',
  authBgImage: '',
  authShowSocialLogin: true,
  authShowRememberMe: true,
  authRequireEmailVerification: true,
  authAllowGuestCheckout: true,
  selectedHeader: 'default',
  headerStickyEnabled: true,
  headerSearchEnabled: true,
  headerCartIconEnabled: true,
  headerWishlistIconEnabled: true,
  headerLanguageSwitcher: true,
  headerCurrencySwitcher: false,
  headerAnnouncementText: '',
  topBarEnabled: true,
  topBarText: 'Free shipping on orders over ৳5000!',
  topBarBgColor: '#1a1a2e',
  topBarTextColor: '#ffffff',
  topBarLinks: [
    { label: 'Track Order', url: '/orders' },
    { label: 'Help', url: '/help' },
  ],
  footerStyle: 'default',
  footerAboutText: 'Grand Mall Emporium is your one-stop shop for everything you need.',
  footerCopyright: '© 2025 Grand Mall Emporium. All rights reserved.',
  footerShowSocialLinks: true,
  footerShowNewsletter: true,
  footerShowPaymentIcons: true,
  footerColumns: [
    { title: 'Customer Service', links: [{ label: 'Contact Us', url: '/contact' }, { label: 'FAQ', url: '/faq' }, { label: 'Returns', url: '/returns' }] },
    { title: 'Quick Links', links: [{ label: 'About Us', url: '/about' }, { label: 'Privacy Policy', url: '/privacy' }, { label: 'Terms', url: '/terms' }] },
  ],
  footerSocialLinks: [
    { platform: 'facebook', url: 'https://facebook.com' },
    { platform: 'instagram', url: 'https://instagram.com' },
    { platform: 'twitter', url: 'https://twitter.com' },
  ],
  pages: [
    { id: '1', title: 'About Us', slug: 'about-us', content: 'About our store...', isPublished: true, sortOrder: 1 },
    { id: '2', title: 'Privacy Policy', slug: 'privacy-policy', content: 'Privacy policy content...', isPublished: true, sortOrder: 2 },
    { id: '3', title: 'Terms of Service', slug: 'terms-of-service', content: 'Terms content...', isPublished: true, sortOrder: 3 },
    { id: '4', title: 'Return Policy', slug: 'return-policy', content: '30-day return policy...', isPublished: true, sortOrder: 4 },
  ],
  primaryColor: '#6366f1',
  accentColor: '#f59e0b',
  borderRadius: '8',
  darkModeDefault: false,
  customCss: '',
  logoUrl: '',
  faviconUrl: '',
};

const fontOptions = [
  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Poppins', 'Montserrat', 'Nunito', 'Raleway',
  'Playfair Display', 'Merriweather', 'Source Sans Pro', 'Ubuntu', 'Noto Sans Bengali',
  'Hind Siliguri', 'Kalpurush',
];

const AdminWebsiteSetupPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [setup, setSetup] = useState<WebsiteSetupState>(defaultSetup);
  const [editPage, setEditPage] = useState<WebsiteSetupState['pages'][0] | null>(null);
  const [addPageOpen, setAddPageOpen] = useState(false);
  const [newPage, setNewPage] = useState({ title: '', slug: '', content: '' });
  const activeTab = searchParams.get('tab') || 'homepage';
  const setActiveTab = (tab: string) => setSearchParams({ tab });

  const update = (key: keyof WebsiteSetupState, value: any) => setSetup(prev => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setLoading(true);
    const { error } = await supabase.from('system_settings').upsert({
      key: 'website_setup_v1',
      value: setup as any,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'key' });
    if (error) {
      toast.error('Failed to save settings');
    } else {
      toast.success('Website setup saved!');
      // Invalidate the global cache so frontend picks up changes immediately
      invalidateSetupCache();
    }
    setLoading(false);
  };

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('system_settings').select('value').eq('key', 'website_setup_v1').single();
      if (data?.value && typeof data.value === 'object') {
        setSetup(prev => ({ ...prev, ...(data.value as any) }));
      }
    };
    load();
  }, []);

  const handleCreatePage = () => {
    if (!newPage.title.trim()) return;
    const page = {
      id: Date.now().toString(),
      ...newPage,
      slug: newPage.slug || newPage.title.toLowerCase().replace(/\s+/g, '-'),
      isPublished: false,
      sortOrder: setup.pages.length + 1,
    };
    update('pages', [...setup.pages, page]);
    setNewPage({ title: '', slug: '', content: '' });
    setAddPageOpen(false);
    toast.success('Page added');
  };

  const handleUpdatePage = () => {
    if (!editPage) return;
    update('pages', setup.pages.map(p => p.id === editPage.id ? editPage : p));
    setEditPage(null);
    toast.success('Page updated');
  };

  const deletePage = (id: string) => {
    update('pages', setup.pages.filter(p => p.id !== id));
    toast.success('Page removed');
  };

  return (
    <AdminLayout title="Website Setup" description="Configure your website appearance, layout and pages">
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
            Save All
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex flex-wrap h-auto gap-1">
            <TabsTrigger value="homepage" className="text-xs">Select Homepage</TabsTrigger>
            <TabsTrigger value="homepage-settings" className="text-xs">Homepage Settings</TabsTrigger>
            <TabsTrigger value="font" className="text-xs">Font Family</TabsTrigger>
            <TabsTrigger value="auth" className="text-xs">Auth Layout</TabsTrigger>
            <TabsTrigger value="header" className="text-xs">Select Header</TabsTrigger>
            <TabsTrigger value="header-settings" className="text-xs">Header Settings</TabsTrigger>
            <TabsTrigger value="topbar" className="text-xs">Top Bar</TabsTrigger>
            <TabsTrigger value="footer" className="text-xs">Footer Settings</TabsTrigger>
            <TabsTrigger value="pages" className="text-xs">Pages</TabsTrigger>
            <TabsTrigger value="appearance" className="text-xs">Appearance</TabsTrigger>
          </TabsList>

          {/* Select Homepage */}
          <TabsContent value="homepage">
            <Card>
              <CardHeader><CardTitle className="text-base">Select Homepage Layout</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['default', 'minimal', 'modern'].map(layout => (
                  <div
                    key={layout}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${setup.selectedHomepage === layout ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                    onClick={() => update('selectedHomepage', layout)}
                  >
                    <div className="h-32 bg-muted rounded-md mb-3 flex items-center justify-center">
                      <span className="text-muted-foreground text-sm capitalize">{layout} Layout</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium capitalize text-sm">{layout}</span>
                      {setup.selectedHomepage === layout && <Badge>Active</Badge>}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Homepage Settings */}
          <TabsContent value="homepage-settings">
            <Card>
              <CardHeader><CardTitle className="text-base">Homepage Sections</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: 'homepageBannerEnabled', label: 'Hero Banner / Slider' },
                  { key: 'homepageFeaturedCategories', label: 'Featured Categories' },
                  { key: 'homepageFlashSale', label: 'Flash Sale Section' },
                  { key: 'homepageNewArrivals', label: 'New Arrivals' },
                  { key: 'homepageBestSellers', label: 'Best Sellers' },
                  { key: 'homepageDeals', label: 'Deals Section' },
                  { key: 'homepagePromoBanners', label: 'Promotional Banners' },
                  { key: 'homepageBrandsCarousel', label: 'Brands Carousel' },
                  { key: 'homepageTestimonials', label: 'Customer Testimonials' },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <Label className="font-normal">{item.label}</Label>
                    <Switch
                      checked={(setup as any)[item.key]}
                      onCheckedChange={v => update(item.key as keyof WebsiteSetupState, v)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Font Family */}
          <TabsContent value="font">
            <Card>
              <CardHeader><CardTitle className="text-base">Typography Settings</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Body Font Family</Label>
                    <Select value={setup.fontFamily} onValueChange={v => update('fontFamily', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {fontOptions.map(f => (
                          <SelectItem key={f} value={f}><span style={{ fontFamily: f }}>{f}</span></SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Heading Font Family</Label>
                    <Select value={setup.headingFont} onValueChange={v => update('headingFont', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {fontOptions.map(f => (
                          <SelectItem key={f} value={f}><span style={{ fontFamily: f }}>{f}</span></SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Base Font Size (px)</Label>
                  <Input type="number" value={setup.fontSize} onChange={e => update('fontSize', e.target.value)} className="w-32" />
                </div>
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground mb-2">Preview:</p>
                    <h3 style={{ fontFamily: setup.headingFont, fontSize: `${Number(setup.fontSize) + 8}px` }} className="font-bold mb-1">Heading Text Preview</h3>
                    <p style={{ fontFamily: setup.fontFamily, fontSize: `${setup.fontSize}px` }}>Body text preview — Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Auth Layout */}
          <TabsContent value="auth">
            <Card>
              <CardHeader><CardTitle className="text-base">Authentication Layout & Settings</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Auth Page Layout</Label>
                  <Select value={setup.authLayout} onValueChange={v => update('authLayout', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="split">Split (Image + Form)</SelectItem>
                      <SelectItem value="centered">Centered Card</SelectItem>
                      <SelectItem value="fullwidth">Full Width</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Background Image URL</Label>
                  <Input value={setup.authBgImage} onChange={e => update('authBgImage', e.target.value)} placeholder="https://..." />
                </div>
                {[
                  { key: 'authShowSocialLogin', label: 'Show Social Login Buttons' },
                  { key: 'authShowRememberMe', label: 'Show Remember Me Option' },
                  { key: 'authRequireEmailVerification', label: 'Require Email Verification' },
                  { key: 'authAllowGuestCheckout', label: 'Allow Guest Checkout' },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between">
                    <Label className="font-normal">{item.label}</Label>
                    <Switch
                      checked={(setup as any)[item.key]}
                      onCheckedChange={v => update(item.key as keyof WebsiteSetupState, v)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Select Header */}
          <TabsContent value="header">
            <Card>
              <CardHeader><CardTitle className="text-base">Select Header Style</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['default', 'compact', 'mega'].map(style => (
                  <div
                    key={style}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${setup.selectedHeader === style ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                    onClick={() => update('selectedHeader', style)}
                  >
                    <div className="h-20 bg-muted rounded-md mb-3 flex items-center justify-center">
                      <span className="text-muted-foreground text-xs capitalize">{style} Header</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium capitalize text-sm">{style}</span>
                      {setup.selectedHeader === style && <Badge>Active</Badge>}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Header Settings */}
          <TabsContent value="header-settings">
            <Card>
              <CardHeader><CardTitle className="text-base">Header Configuration</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: 'headerStickyEnabled', label: 'Sticky Header' },
                  { key: 'headerSearchEnabled', label: 'Show Search Bar' },
                  { key: 'headerCartIconEnabled', label: 'Show Cart Icon' },
                  { key: 'headerWishlistIconEnabled', label: 'Show Wishlist Icon' },
                  { key: 'headerLanguageSwitcher', label: 'Show Language Switcher' },
                  { key: 'headerCurrencySwitcher', label: 'Show Currency Switcher' },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <Label className="font-normal">{item.label}</Label>
                    <Switch
                      checked={(setup as any)[item.key]}
                      onCheckedChange={v => update(item.key as keyof WebsiteSetupState, v)}
                    />
                  </div>
                ))}
                <div className="space-y-2 pt-2">
                  <Label>Announcement Bar Text</Label>
                  <Input value={setup.headerAnnouncementText} onChange={e => update('headerAnnouncementText', e.target.value)} placeholder="e.g. Free delivery on orders above ৳5000!" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Top Bar */}
          <TabsContent value="topbar">
            <Card>
              <CardHeader><CardTitle className="text-base">Top Bar Settings</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="font-normal">Enable Top Bar</Label>
                  <Switch checked={setup.topBarEnabled} onCheckedChange={v => update('topBarEnabled', v)} />
                </div>
                <div className="space-y-2">
                  <Label>Top Bar Text</Label>
                  <Input value={setup.topBarText} onChange={e => update('topBarText', e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Background Color</Label>
                    <div className="flex gap-2">
                      <input type="color" value={setup.topBarBgColor} onChange={e => update('topBarBgColor', e.target.value)} className="h-10 w-10 rounded border cursor-pointer" />
                      <Input value={setup.topBarBgColor} onChange={e => update('topBarBgColor', e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Text Color</Label>
                    <div className="flex gap-2">
                      <input type="color" value={setup.topBarTextColor} onChange={e => update('topBarTextColor', e.target.value)} className="h-10 w-10 rounded border cursor-pointer" />
                      <Input value={setup.topBarTextColor} onChange={e => update('topBarTextColor', e.target.value)} />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Top Bar Links</Label>
                    <Button size="sm" variant="outline" onClick={() => update('topBarLinks', [...setup.topBarLinks, { label: '', url: '' }])}>
                      <Plus className="h-3 w-3 mr-1" /> Add Link
                    </Button>
                  </div>
                  {setup.topBarLinks.map((link, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <Input value={link.label} placeholder="Label" onChange={e => {
                        const links = [...setup.topBarLinks];
                        links[i] = { ...links[i], label: e.target.value };
                        update('topBarLinks', links);
                      }} />
                      <Input value={link.url} placeholder="/url" onChange={e => {
                        const links = [...setup.topBarLinks];
                        links[i] = { ...links[i], url: e.target.value };
                        update('topBarLinks', links);
                      }} />
                      <Button size="icon" variant="ghost" className="shrink-0 text-destructive" onClick={() => update('topBarLinks', setup.topBarLinks.filter((_, idx) => idx !== i))}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                {setup.topBarEnabled && (
                  <Card className="bg-muted/50">
                    <CardContent className="p-3">
                      <p className="text-xs text-muted-foreground mb-1">Preview:</p>
                      <div style={{ backgroundColor: setup.topBarBgColor, color: setup.topBarTextColor }} className="rounded px-4 py-2 text-sm text-center">
                        {setup.topBarText}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Footer Settings */}
          <TabsContent value="footer">
            <Card>
              <CardHeader><CardTitle className="text-base">Footer Configuration</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Footer Style</Label>
                  <Select value={setup.footerStyle} onValueChange={v => update('footerStyle', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default (Multi-column)</SelectItem>
                      <SelectItem value="minimal">Minimal</SelectItem>
                      <SelectItem value="dark">Dark Theme</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>About Text</Label>
                  <Textarea value={setup.footerAboutText} onChange={e => update('footerAboutText', e.target.value)} rows={3} />
                </div>
                <div className="space-y-2">
                  <Label>Copyright Text</Label>
                  <Input value={setup.footerCopyright} onChange={e => update('footerCopyright', e.target.value)} />
                </div>
                {[
                  { key: 'footerShowSocialLinks', label: 'Show Social Links' },
                  { key: 'footerShowNewsletter', label: 'Show Newsletter Signup' },
                  { key: 'footerShowPaymentIcons', label: 'Show Payment Method Icons' },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between">
                    <Label className="font-normal">{item.label}</Label>
                    <Switch
                      checked={(setup as any)[item.key]}
                      onCheckedChange={v => update(item.key as keyof WebsiteSetupState, v)}
                    />
                  </div>
                ))}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Footer Columns</Label>
                    <Button size="sm" variant="outline" onClick={() => update('footerColumns', [...setup.footerColumns, { title: 'New Column', links: [] }])}>
                      <Plus className="h-3 w-3 mr-1" /> Add Column
                    </Button>
                  </div>
                  {setup.footerColumns.map((col, ci) => (
                    <Card key={ci} className="p-3 space-y-2">
                      <div className="flex gap-2 items-center">
                        <Input value={col.title} placeholder="Column Title" onChange={e => {
                          const cols = [...setup.footerColumns];
                          cols[ci] = { ...cols[ci], title: e.target.value };
                          update('footerColumns', cols);
                        }} />
                        <Button size="icon" variant="ghost" className="shrink-0 text-destructive" onClick={() => update('footerColumns', setup.footerColumns.filter((_, idx) => idx !== ci))}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      {col.links.map((link, li) => (
                        <div key={li} className="flex gap-2 items-center pl-4">
                          <Input value={link.label} placeholder="Link label" className="text-xs" onChange={e => {
                            const cols = [...setup.footerColumns];
                            cols[ci].links[li] = { ...cols[ci].links[li], label: e.target.value };
                            update('footerColumns', cols);
                          }} />
                          <Input value={link.url} placeholder="/url" className="text-xs" onChange={e => {
                            const cols = [...setup.footerColumns];
                            cols[ci].links[li] = { ...cols[ci].links[li], url: e.target.value };
                            update('footerColumns', cols);
                          }} />
                          <Button size="icon" variant="ghost" className="shrink-0 h-7 w-7 text-destructive" onClick={() => {
                            const cols = [...setup.footerColumns];
                            cols[ci].links = cols[ci].links.filter((_, idx) => idx !== li);
                            update('footerColumns', cols);
                          }}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      <Button size="sm" variant="ghost" className="text-xs ml-4" onClick={() => {
                        const cols = [...setup.footerColumns];
                        cols[ci].links.push({ label: '', url: '' });
                        update('footerColumns', cols);
                      }}>
                        <Plus className="h-3 w-3 mr-1" /> Add Link
                      </Button>
                    </Card>
                  ))}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Social Links</Label>
                    <Button size="sm" variant="outline" onClick={() => update('footerSocialLinks', [...setup.footerSocialLinks, { platform: '', url: '' }])}>
                      <Plus className="h-3 w-3 mr-1" /> Add
                    </Button>
                  </div>
                  {setup.footerSocialLinks.map((sl, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <Select value={sl.platform} onValueChange={v => {
                        const links = [...setup.footerSocialLinks];
                        links[i] = { ...links[i], platform: v };
                        update('footerSocialLinks', links);
                      }}>
                        <SelectTrigger className="w-40"><SelectValue placeholder="Platform" /></SelectTrigger>
                        <SelectContent>
                          {['facebook', 'instagram', 'twitter', 'youtube', 'linkedin', 'tiktok', 'whatsapp'].map(p => (
                            <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input value={sl.url} placeholder="https://..." onChange={e => {
                        const links = [...setup.footerSocialLinks];
                        links[i] = { ...links[i], url: e.target.value };
                        update('footerSocialLinks', links);
                      }} />
                      <Button size="icon" variant="ghost" className="shrink-0 text-destructive" onClick={() => update('footerSocialLinks', setup.footerSocialLinks.filter((_, idx) => idx !== i))}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pages */}
          <TabsContent value="pages">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Pages ({setup.pages.length})</CardTitle>
                <Button size="sm" onClick={() => setAddPageOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" /> New Page
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {setup.pages.map(page => (
                      <TableRow key={page.id}>
                        <TableCell className="font-medium">{page.title}</TableCell>
                        <TableCell className="text-sm text-muted-foreground font-mono">/{page.slug}</TableCell>
                        <TableCell>
                          <Badge variant={page.isPublished ? 'default' : 'secondary'}>
                            {page.isPublished ? 'Published' : 'Draft'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                            update('pages', setup.pages.map(p => p.id === page.id ? { ...p, isPublished: !p.isPublished } : p));
                          }}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditPage(page)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deletePage(page.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance */}
          <TabsContent value="appearance">
            <Card>
              <CardHeader><CardTitle className="text-base">Appearance & Theme</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Primary Color</Label>
                    <div className="flex gap-2">
                      <input type="color" value={setup.primaryColor} onChange={e => update('primaryColor', e.target.value)} className="h-10 w-10 rounded border cursor-pointer" />
                      <Input value={setup.primaryColor} onChange={e => update('primaryColor', e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Accent Color</Label>
                    <div className="flex gap-2">
                      <input type="color" value={setup.accentColor} onChange={e => update('accentColor', e.target.value)} className="h-10 w-10 rounded border cursor-pointer" />
                      <Input value={setup.accentColor} onChange={e => update('accentColor', e.target.value)} />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Border Radius (px)</Label>
                  <Input type="number" value={setup.borderRadius} onChange={e => update('borderRadius', e.target.value)} className="w-32" />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="font-normal">Dark Mode as Default</Label>
                  <Switch checked={setup.darkModeDefault} onCheckedChange={v => update('darkModeDefault', v)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Logo URL</Label>
                    <Input value={setup.logoUrl} onChange={e => update('logoUrl', e.target.value)} placeholder="https://..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Favicon URL</Label>
                    <Input value={setup.faviconUrl} onChange={e => update('faviconUrl', e.target.value)} placeholder="https://..." />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Custom CSS</Label>
                  <Textarea value={setup.customCss} onChange={e => update('customCss', e.target.value)} rows={6} placeholder="/* Add custom CSS here */" className="font-mono text-xs" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add Page Dialog */}
        <Dialog open={addPageOpen} onOpenChange={setAddPageOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Page</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2"><Label>Title</Label><Input value={newPage.title} onChange={e => setNewPage(p => ({ ...p, title: e.target.value }))} placeholder="Page title" /></div>
              <div className="space-y-2"><Label>Slug</Label><Input value={newPage.slug} onChange={e => setNewPage(p => ({ ...p, slug: e.target.value }))} placeholder="page-slug" /></div>
              <div className="space-y-2"><Label>Content</Label><Textarea value={newPage.content} onChange={e => setNewPage(p => ({ ...p, content: e.target.value }))} rows={6} /></div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button onClick={handleCreatePage}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Page Dialog */}
        <Dialog open={!!editPage} onOpenChange={() => setEditPage(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Edit Page</DialogTitle></DialogHeader>
            {editPage && (
              <div className="space-y-4 py-4">
                <div className="space-y-2"><Label>Title</Label><Input value={editPage.title} onChange={e => setEditPage(p => p ? { ...p, title: e.target.value } : null)} /></div>
                <div className="space-y-2"><Label>Slug</Label><Input value={editPage.slug} onChange={e => setEditPage(p => p ? { ...p, slug: e.target.value } : null)} /></div>
                <div className="space-y-2"><Label>Content</Label><Textarea value={editPage.content} onChange={e => setEditPage(p => p ? { ...p, content: e.target.value } : null)} rows={6} /></div>
                <div className="flex items-center gap-2">
                  <Switch checked={editPage.isPublished} onCheckedChange={v => setEditPage(p => p ? { ...p, isPublished: v } : null)} />
                  <Label>Published</Label>
                </div>
              </div>
            )}
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button onClick={handleUpdatePage}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminWebsiteSetupPage;
