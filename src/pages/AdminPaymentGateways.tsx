import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Save, Plus, CreditCard, Wallet, Building2, Globe, Smartphone, ShieldCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface GatewayConfig {
  key: string;
  name: string;
  icon: React.ElementType;
  category: 'global' | 'bangladesh' | 'regional' | 'custom';
  fields: { key: string; label: string; type: 'text' | 'password' | 'email' | 'select'; placeholder?: string; options?: string[]; }[];
  hasSandbox?: boolean;
  description?: string;
}

const GATEWAY_CONFIGS: GatewayConfig[] = [
  // Global
  {
    key: 'stripe', name: 'Stripe', icon: CreditCard, category: 'global',
    fields: [
      { key: 'publishable_key', label: 'Stripe Key', type: 'text', placeholder: 'pk_test_...' },
      { key: 'secret_key', label: 'Stripe Secret', type: 'password', placeholder: 'sk_test_...' },
    ],
  },
  {
    key: 'paypal', name: 'PayPal', icon: Wallet, category: 'global', hasSandbox: true,
    fields: [
      { key: 'client_id', label: 'PayPal Client Id', type: 'text' },
      { key: 'client_secret', label: 'PayPal Client Secret', type: 'password' },
    ],
  },
  {
    key: 'sslcommerz', name: 'SSLCommerz', icon: ShieldCheck, category: 'global', hasSandbox: true,
    fields: [
      { key: 'store_id', label: 'SSLCz Store Id', type: 'text' },
      { key: 'store_password', label: 'SSLCz Store Password', type: 'password' },
    ],
  },
  {
    key: 'razorpay', name: 'Razorpay', icon: CreditCard, category: 'global',
    fields: [
      { key: 'key', label: 'Razor Key', type: 'text' },
      { key: 'secret', label: 'Razor Secret', type: 'password' },
    ],
  },
  {
    key: 'paystack', name: 'Paystack', icon: CreditCard, category: 'global',
    fields: [
      { key: 'public_key', label: 'Public Key', type: 'text', placeholder: 'pk_test_...' },
      { key: 'secret_key', label: 'Secret Key', type: 'password', placeholder: 'sk_test_...' },
      { key: 'merchant_email', label: 'Merchant Email', type: 'email' },
      { key: 'currency_code', label: 'Currency Code', type: 'text', placeholder: 'NGN' },
    ],
  },
  {
    key: 'instamojo', name: 'Instamojo', icon: Wallet, category: 'global', hasSandbox: true,
    fields: [
      { key: 'api_key', label: 'API Key', type: 'text' },
      { key: 'auth_token', label: 'Auth Token', type: 'password' },
    ],
  },
  {
    key: 'voguepay', name: 'VoguePay', icon: CreditCard, category: 'global', hasSandbox: true,
    fields: [
      { key: 'merchant_id', label: 'Merchant ID', type: 'text', placeholder: 'DEMO' },
    ],
  },
  {
    key: 'payhere', name: 'Payhere', icon: CreditCard, category: 'global', hasSandbox: true,
    fields: [
      { key: 'merchant_id', label: 'Payhere Merchant ID', type: 'text' },
      { key: 'secret', label: 'Payhere Secret', type: 'password' },
      { key: 'currency', label: 'Payhere Currency', type: 'text', placeholder: 'USD' },
    ],
  },
  {
    key: 'ngenius', name: 'Ngenius', icon: Building2, category: 'global',
    fields: [
      { key: 'outlet_id', label: 'Ngenius Outlet ID', type: 'text' },
      { key: 'api_key', label: 'Ngenius API Key', type: 'password' },
      { key: 'currency', label: 'Ngenius Currency', type: 'select', options: ['AED', 'USD', 'EUR'] },
    ],
    description: 'Currency must be AED or USD or EUR. If empty, AED is used.',
  },
  {
    key: 'iyzico', name: 'Iyzico', icon: CreditCard, category: 'global', hasSandbox: true,
    fields: [
      { key: 'api_key', label: 'Iyzico API Key', type: 'text' },
      { key: 'secret_key', label: 'Iyzico Secret Key', type: 'password' },
      { key: 'currency_code', label: 'Iyzico Currency Code', type: 'text' },
    ],
  },
  {
    key: 'authorizenet', name: 'Authorize.net', icon: CreditCard, category: 'global', hasSandbox: true,
    fields: [
      { key: 'login_id', label: 'Merchant Login ID', type: 'text' },
      { key: 'transaction_key', label: 'Merchant Transaction Key', type: 'password' },
    ],
  },
  {
    key: 'payku', name: 'Payku', icon: CreditCard, category: 'global',
    fields: [
      { key: 'base_url', label: 'Payku Base URL', type: 'text' },
      { key: 'public_token', label: 'Payku Public Token', type: 'text' },
      { key: 'private_token', label: 'Payku Private Token', type: 'password' },
    ],
  },
  {
    key: 'mercadopago', name: 'MercadoPago', icon: Wallet, category: 'global',
    fields: [
      { key: 'key', label: 'MercadoPago Key', type: 'text' },
      { key: 'access', label: 'MercadoPago Access', type: 'password' },
      { key: 'currency', label: 'Currency', type: 'select', options: ['en-US', 'es-AR', 'es-CL', 'es-CO', 'es-MX', 'es-VE', 'es-UY', 'es-PE', 'pt-BR'] },
    ],
    description: 'Currency: es-AR, es-CL, es-CO, es-MX, es-VE, es-UY, es-PE, pt-BR. Default: en-US',
  },
  {
    key: 'paymob', name: 'Paymob', icon: CreditCard, category: 'global',
    fields: [
      { key: 'api_key', label: 'Paymob API Key', type: 'password' },
      { key: 'iframe_id', label: 'Paymob Iframe ID', type: 'text' },
      { key: 'integration_id', label: 'Paymob Integration ID', type: 'text' },
      { key: 'hmac', label: 'Paymob HMAC', type: 'password' },
    ],
  },
  {
    key: 'tap', name: 'Tap', icon: CreditCard, category: 'global',
    fields: [
      { key: 'secret_key', label: 'Tap Secret Key', type: 'password' },
    ],
  },
  // Bangladesh
  {
    key: 'bkash', name: 'bKash', icon: Smartphone, category: 'bangladesh', hasSandbox: true,
    fields: [
      { key: 'app_key', label: 'bKash App Key', type: 'text' },
      { key: 'app_secret', label: 'bKash App Secret', type: 'password' },
      { key: 'username', label: 'bKash Username', type: 'text' },
      { key: 'password', label: 'bKash Password', type: 'password' },
    ],
  },
  {
    key: 'nagad', name: 'Nagad', icon: Smartphone, category: 'bangladesh',
    fields: [
      { key: 'mode', label: 'Nagad Mode', type: 'select', options: ['sandbox', 'live'] },
      { key: 'merchant_id', label: 'Nagad Merchant ID', type: 'text' },
      { key: 'merchant_number', label: 'Nagad Merchant Number', type: 'text' },
      { key: 'pg_public_key', label: 'Nagad PG Public Key', type: 'password' },
      { key: 'merchant_private_key', label: 'Nagad Merchant Private Key', type: 'password' },
    ],
  },
  {
    key: 'rocket', name: 'Rocket (DBBL)', icon: Smartphone, category: 'bangladesh',
    fields: [
      { key: 'merchant_id', label: 'Rocket Merchant ID', type: 'text' },
      { key: 'secret', label: 'Rocket Secret', type: 'password' },
    ],
  },
  {
    key: 'upay', name: 'Upay', icon: Smartphone, category: 'bangladesh',
    fields: [
      { key: 'merchant_id', label: 'Upay Merchant ID', type: 'text' },
      { key: 'merchant_key', label: 'Upay Merchant Key', type: 'password' },
    ],
  },
  {
    key: 'aamarpay', name: 'AamarPay', icon: CreditCard, category: 'bangladesh', hasSandbox: true,
    fields: [
      { key: 'store_id', label: 'AamarPay Store Id', type: 'text' },
      { key: 'signature_key', label: 'AamarPay Signature Key', type: 'password' },
    ],
  },
  // Regional
  {
    key: 'cash', name: 'Cash on Delivery', icon: Wallet, category: 'regional',
    fields: [],
    description: 'No credentials needed. Customers pay upon delivery.',
  },
];

interface GatewayData {
  id?: string;
  gateway_key: string;
  display_name: string;
  is_enabled: boolean;
  is_sandbox: boolean;
  credentials: Record<string, string>;
  settings: Record<string, string>;
  sort_order: number;
}

export default function AdminPaymentGateways() {
  const [gateways, setGateways] = useState<Record<string, GatewayData>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('global');
  const [customOpen, setCustomOpen] = useState(false);
  const [customForm, setCustomForm] = useState({ name: '', key: '', fields: '', description: '' });

  useEffect(() => { fetchGateways(); }, []);

  const fetchGateways = async () => {
    const { data } = await supabase.from('payment_gateways').select('*');
    const map: Record<string, GatewayData> = {};
    data?.forEach((g: any) => {
      map[g.gateway_key] = {
        id: g.id,
        gateway_key: g.gateway_key,
        display_name: g.display_name,
        is_enabled: g.is_enabled,
        is_sandbox: g.is_sandbox,
        credentials: (g.credentials as Record<string, string>) || {},
        settings: (g.settings as Record<string, string>) || {},
        sort_order: g.sort_order,
      };
    });
    setGateways(map);
    setLoading(false);
  };

  const getGatewayData = (key: string, name: string): GatewayData => {
    return gateways[key] || { gateway_key: key, display_name: name, is_enabled: false, is_sandbox: false, credentials: {}, settings: {}, sort_order: 0 };
  };

  const updateField = (gatewayKey: string, name: string, field: string, value: string) => {
    setGateways(prev => {
      const existing = prev[gatewayKey] || { gateway_key: gatewayKey, display_name: name, is_enabled: false, is_sandbox: false, credentials: {}, settings: {}, sort_order: 0 };
      return { ...prev, [gatewayKey]: { ...existing, credentials: { ...existing.credentials, [field]: value } } };
    });
  };

  const toggleEnabled = (gatewayKey: string, name: string) => {
    setGateways(prev => {
      const existing = prev[gatewayKey] || { gateway_key: gatewayKey, display_name: name, is_enabled: false, is_sandbox: false, credentials: {}, settings: {}, sort_order: 0 };
      return { ...prev, [gatewayKey]: { ...existing, is_enabled: !existing.is_enabled } };
    });
  };

  const toggleSandbox = (gatewayKey: string, name: string) => {
    setGateways(prev => {
      const existing = prev[gatewayKey] || { gateway_key: gatewayKey, display_name: name, is_enabled: false, is_sandbox: false, credentials: {}, settings: {}, sort_order: 0 };
      return { ...prev, [gatewayKey]: { ...existing, is_sandbox: !existing.is_sandbox } };
    });
  };

  const saveGateway = async (config: GatewayConfig) => {
    setSaving(config.key);
    const data = getGatewayData(config.key, config.name);
    try {
      if (data.id) {
        await supabase.from('payment_gateways').update({
          display_name: data.display_name,
          is_enabled: data.is_enabled,
          is_sandbox: data.is_sandbox,
          credentials: data.credentials as any,
          settings: data.settings as any,
        }).eq('id', data.id);
      } else {
        const { data: inserted } = await supabase.from('payment_gateways').insert({
          gateway_key: config.key,
          display_name: data.display_name || config.name,
          is_enabled: data.is_enabled,
          is_sandbox: data.is_sandbox,
          credentials: data.credentials as any,
          settings: data.settings as any,
          sort_order: 0,
        }).select().single();
        if (inserted) {
          setGateways(prev => ({ ...prev, [config.key]: { ...data, id: inserted.id } }));
        }
      }
      toast.success(`${config.name} সেটিংস সংরক্ষিত হয়েছে`);
    } catch (e) {
      toast.error('সংরক্ষণ ব্যর্থ');
    }
    setSaving(null);
  };

  const saveCustomGateway = async () => {
    if (!customForm.name || !customForm.key) return toast.error('Name ও Key আবশ্যক');
    const key = customForm.key.toLowerCase().replace(/\s+/g, '_');
    try {
      const fields = customForm.fields ? customForm.fields.split(',').map(f => f.trim()) : [];
      const creds: Record<string, string> = {};
      fields.forEach(f => { creds[f] = ''; });
      const { data } = await supabase.from('payment_gateways').insert({
        gateway_key: key,
        display_name: customForm.name,
        is_enabled: false,
        is_sandbox: false,
        credentials: creds as any,
        settings: { description: customForm.description, custom_fields: fields } as any,
        sort_order: 99,
      }).select().single();
      if (data) {
        setGateways(prev => ({ ...prev, [key]: { id: data.id, gateway_key: key, display_name: customForm.name, is_enabled: false, is_sandbox: false, credentials: creds, settings: { description: customForm.description, custom_fields: fields } as any, sort_order: 99 } }));
        toast.success('Custom gateway যোগ হয়েছে');
        setCustomOpen(false);
        setCustomForm({ name: '', key: '', fields: '', description: '' });
      }
    } catch { toast.error('যোগ করতে ব্যর্থ'); }
  };

  const customGateways = Object.values(gateways).filter(g => !GATEWAY_CONFIGS.some(c => c.key === g.gateway_key));

  const filteredConfigs = GATEWAY_CONFIGS.filter(c =>
    c.category === activeTab && c.name.toLowerCase().includes(search.toLowerCase())
  );

  const renderGatewayCard = (config: GatewayConfig) => {
    const data = getGatewayData(config.key, config.name);
    const Icon = config.icon;
    return (
      <Card key={config.key} className="border border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">{config.name}</CardTitle>
                {config.description && <CardDescription className="text-xs mt-0.5">{config.description}</CardDescription>}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {data.is_enabled && <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20">সক্রিয়</Badge>}
              <Switch checked={data.is_enabled} onCheckedChange={() => toggleEnabled(config.key, config.name)} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {config.fields.map(field => (
            <div key={field.key} className="space-y-1.5">
              <Label className="text-xs font-medium">{field.label}</Label>
              {field.type === 'select' ? (
                <Select value={data.credentials[field.key] || ''} onValueChange={v => updateField(config.key, config.name, field.key, v)}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>{field.options?.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              ) : (
                <Input
                  type={field.type === 'password' ? 'password' : 'text'}
                  placeholder={field.placeholder || field.label}
                  value={data.credentials[field.key] || ''}
                  onChange={e => updateField(config.key, config.name, field.key, e.target.value)}
                />
              )}
            </div>
          ))}
          {config.hasSandbox && (
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <Label className="text-xs">Sandbox Mode</Label>
              <Switch checked={data.is_sandbox} onCheckedChange={() => toggleSandbox(config.key, config.name)} />
            </div>
          )}
          <Button onClick={() => saveGateway(config)} disabled={saving === config.key} className="w-full mt-2">
            <Save className="h-4 w-4 mr-2" />{saving === config.key ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Payment Gateways</h1>
            <p className="text-sm text-muted-foreground">সকল পেমেন্ট গেটওয়ে কনফিগার ও ম্যানেজ করুন</p>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="গেটওয়ে খুঁজুন..." className="pl-9 w-60" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Button onClick={() => setCustomOpen(true)}><Plus className="h-4 w-4 mr-2" />Custom Gateway</Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="global"><Globe className="h-4 w-4 mr-1.5" />Global ({GATEWAY_CONFIGS.filter(c => c.category === 'global').length})</TabsTrigger>
            <TabsTrigger value="bangladesh"><Smartphone className="h-4 w-4 mr-1.5" />Bangladesh ({GATEWAY_CONFIGS.filter(c => c.category === 'bangladesh').length})</TabsTrigger>
            <TabsTrigger value="regional"><Wallet className="h-4 w-4 mr-1.5" />Other</TabsTrigger>
            <TabsTrigger value="custom"><Plus className="h-4 w-4 mr-1.5" />Custom ({customGateways.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="global" className="mt-4">
            {loading ? <p>লোড হচ্ছে...</p> : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredConfigs.map(renderGatewayCard)}
              </div>
            )}
          </TabsContent>
          <TabsContent value="bangladesh" className="mt-4">
            {loading ? <p>লোড হচ্ছে...</p> : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {GATEWAY_CONFIGS.filter(c => c.category === 'bangladesh' && c.name.toLowerCase().includes(search.toLowerCase())).map(renderGatewayCard)}
              </div>
            )}
          </TabsContent>
          <TabsContent value="regional" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {GATEWAY_CONFIGS.filter(c => c.category === 'regional').map(renderGatewayCard)}
            </div>
          </TabsContent>
          <TabsContent value="custom" className="mt-4">
            {customGateways.length === 0 ? (
              <Card className="p-8 text-center">
                <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="font-semibold text-lg">কোনো Custom Gateway নেই</h3>
                <p className="text-sm text-muted-foreground mt-1">যেকোনো পেমেন্ট গেটওয়ে সহজেই যোগ করুন</p>
                <Button className="mt-4" onClick={() => setCustomOpen(true)}><Plus className="h-4 w-4 mr-2" />Custom Gateway যোগ করুন</Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {customGateways.map(g => {
                  const customFields = (g.settings as any)?.custom_fields || [];
                  return (
                    <Card key={g.gateway_key} className="border border-border">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center"><Globe className="h-5 w-5 text-accent" /></div>
                            <div>
                              <CardTitle className="text-base">{g.display_name}</CardTitle>
                              <CardDescription className="text-xs">{(g.settings as any)?.description || 'Custom gateway'}</CardDescription>
                            </div>
                          </div>
                          <Switch checked={g.is_enabled} onCheckedChange={() => {
                            const updated = { ...g, is_enabled: !g.is_enabled };
                            setGateways(prev => ({ ...prev, [g.gateway_key]: updated }));
                            supabase.from('payment_gateways').update({ is_enabled: !g.is_enabled }).eq('id', g.id!).then(() => toast.success('আপডেট হয়েছে'));
                          }} />
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {customFields.map((f: string) => (
                          <div key={f} className="space-y-1.5">
                            <Label className="text-xs font-medium capitalize">{f.replace(/_/g, ' ')}</Label>
                            <Input
                              type="password"
                              value={g.credentials[f] || ''}
                              onChange={e => {
                                const updated = { ...g, credentials: { ...g.credentials, [f]: e.target.value } };
                                setGateways(prev => ({ ...prev, [g.gateway_key]: updated }));
                              }}
                            />
                          </div>
                        ))}
                        <Button className="w-full" onClick={async () => {
                          await supabase.from('payment_gateways').update({ credentials: g.credentials as any }).eq('id', g.id!);
                          toast.success('সংরক্ষিত');
                        }}><Save className="h-4 w-4 mr-2" />সংরক্ষণ করুন</Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={customOpen} onOpenChange={setCustomOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Custom Payment Gateway যোগ করুন</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label>Gateway Name *</Label><Input value={customForm.name} onChange={e => setCustomForm(p => ({ ...p, name: e.target.value, key: e.target.value.toLowerCase().replace(/\s+/g, '_') }))} placeholder="e.g. My Gateway" /></div>
            <div className="space-y-1.5"><Label>Gateway Key *</Label><Input value={customForm.key} onChange={e => setCustomForm(p => ({ ...p, key: e.target.value }))} placeholder="e.g. my_gateway" /></div>
            <div className="space-y-1.5"><Label>Credential Fields (comma separated)</Label><Input value={customForm.fields} onChange={e => setCustomForm(p => ({ ...p, fields: e.target.value }))} placeholder="api_key, secret_key, merchant_id" /></div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea value={customForm.description} onChange={e => setCustomForm(p => ({ ...p, description: e.target.value }))} placeholder="এই গেটওয়ে সম্পর্কে বর্ণনা..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCustomOpen(false)}>বাতিল</Button>
            <Button onClick={saveCustomGateway}>যোগ করুন</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
