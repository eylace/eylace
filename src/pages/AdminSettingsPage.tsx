import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { Settings, Save, Store, Globe, CreditCard, Truck, Bell, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const AdminSettingsPage = () => {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    storeName: 'Grand Mall Emporium',
    storeEmail: 'admin@grandmall.com',
    storePhone: '+1 234 567 890',
    storeAddress: '123 Commerce Street, NY',
    currency: 'USD',
    language: 'en',
    taxRate: '10',
    freeShippingThreshold: '50',
    maintenanceMode: false,
    sellerRegistration: true,
    reviewModeration: false,
    autoConfirmOrders: false,
    emailNotifications: true,
    orderAlerts: true,
    lowStockAlerts: true,
    lowStockThreshold: '5',
  });

  const handleSave = async () => {
    setLoading(true);
    const { error } = await supabase.from('system_settings').upsert({
      key: 'store_settings',
      value: settings as any,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'key' });

    if (error) toast.error('Failed to save settings');
    else toast.success('Settings saved successfully');
    setLoading(false);
  };

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('system_settings').select('value').eq('key', 'store_settings').single();
      if (data?.value && typeof data.value === 'object') {
        setSettings(prev => ({ ...prev, ...(data.value as any) }));
      }
    };
    load();
  }, []);

  const update = (key: string, value: any) => setSettings(prev => ({ ...prev, [key]: value }));

  return (
    <AdminLayout titleKey="admin.title.settings" descriptionKey="admin.desc.settings">
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />} Save Settings
          </Button>
        </div>

        <Tabs defaultValue="general">
          <TabsList className="flex-wrap">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="payments">Payments & Tax</TabsTrigger>
            <TabsTrigger value="shipping">Shipping</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-4 space-y-4">
            <Card className="border border-border">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Store className="h-5 w-5" /> Store Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Store Name</Label><Input value={settings.storeName} onChange={e => update('storeName', e.target.value)} /></div>
                  <div className="space-y-2"><Label>Store Email</Label><Input value={settings.storeEmail} onChange={e => update('storeEmail', e.target.value)} /></div>
                  <div className="space-y-2"><Label>Phone</Label><Input value={settings.storePhone} onChange={e => update('storePhone', e.target.value)} /></div>
                  <div className="space-y-2"><Label>Address</Label><Input value={settings.storeAddress} onChange={e => update('storeAddress', e.target.value)} /></div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Globe className="h-5 w-5" /> Localization</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Select value={settings.currency} onValueChange={v => update('currency', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                        <SelectItem value="BDT">BDT (৳)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Default Language</Label>
                    <Select value={settings.language} onValueChange={v => update('language', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="bn">বাংলা</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="mt-4">
            <Card className="border border-border">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><CreditCard className="h-5 w-5" /> Payment & Tax</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Tax Rate (%)</Label><Input type="number" value={settings.taxRate} onChange={e => update('taxRate', e.target.value)} /></div>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-foreground">Payment Methods</h4>
                  {['Credit/Debit Card', 'Cash on Delivery', 'bKash', 'Nagad', 'Bank Transfer'].map(method => (
                    <div key={method} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <span className="text-sm">{method}</span>
                      <Switch defaultChecked={method !== 'Bank Transfer'} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shipping" className="mt-4">
            <Card className="border border-border">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Truck className="h-5 w-5" /> Shipping Settings</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2"><Label>Free Shipping Threshold ($)</Label><Input type="number" value={settings.freeShippingThreshold} onChange={e => update('freeShippingThreshold', e.target.value)} /></div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="mt-4">
            <Card className="border border-border">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Bell className="h-5 w-5" /> Notification Preferences</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: 'emailNotifications', label: 'Email Notifications' },
                  { key: 'orderAlerts', label: 'Order Alerts' },
                  { key: 'lowStockAlerts', label: 'Low Stock Alerts' },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <span className="text-sm">{item.label}</span>
                    <Switch checked={(settings as any)[item.key]} onCheckedChange={v => update(item.key, v)} />
                  </div>
                ))}
                <div className="space-y-2"><Label>Low Stock Threshold</Label><Input type="number" value={settings.lowStockThreshold} onChange={e => update('lowStockThreshold', e.target.value)} /></div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="features" className="mt-4">
            <Card className="border border-border">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Settings className="h-5 w-5" /> Feature Toggles</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: 'maintenanceMode', label: 'Maintenance Mode', desc: 'Put the store in maintenance mode' },
                  { key: 'sellerRegistration', label: 'Seller Registration', desc: 'Allow new seller registrations' },
                  { key: 'reviewModeration', label: 'Review Moderation', desc: 'Require approval before reviews are published' },
                  { key: 'autoConfirmOrders', label: 'Auto Confirm Orders', desc: 'Automatically confirm new orders' },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div><p className="text-sm font-medium">{item.label}</p><p className="text-xs text-muted-foreground">{item.desc}</p></div>
                    <Switch checked={(settings as any)[item.key]} onCheckedChange={v => update(item.key, v)} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminSettingsPage;
