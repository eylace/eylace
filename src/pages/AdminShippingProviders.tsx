import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Save, Loader2, Truck, Package, MapPin, RefreshCw, Search, Eye, Send } from 'lucide-react';

interface ShippingProvider {
  id: string;
  name: string;
  code: string;
  enabled: boolean;
  apiKey: string;
  apiSecret: string;
  apiUrl: string;
  webhookUrl: string;
  defaultWeight: string;
  defaultLength: string;
  defaultWidth: string;
  defaultHeight: string;
  pickupLocation: string;
  codEnabled: boolean;
  autoAssign: boolean;
  // Pathao-specific
  environment?: 'sandbox' | 'live';
  clientId?: string;
  clientSecret?: string;
  username?: string;
  password?: string;
  storeId?: string;
  // Carrybee-specific
  clientContext?: string;
  // Fraud Checker
  fraudUser?: string;
  fraudPassword?: string;
  fraudPhone?: string;
}

const PATHAO_BASE_URLS = {
  sandbox: 'https://courier-api-sandbox.pathao.com',
  live: 'https://api-hermes.pathao.com',
} as const;

interface TrackingResult {
  status: string;
  location: string;
  timestamp: string;
  description: string;
}

const defaultProviders: ShippingProvider[] = [
  {
    id: 'pathao',
    name: 'Pathao',
    code: 'pathao',
    enabled: false,
    apiKey: '',
    apiSecret: '',
    apiUrl: PATHAO_BASE_URLS.live,
    webhookUrl: '',
    defaultWeight: '0.5',
    defaultLength: '20',
    defaultWidth: '15',
    defaultHeight: '10',
    pickupLocation: '',
    codEnabled: true,
    autoAssign: false,
    environment: 'live',
    clientId: '',
    clientSecret: '',
    username: '',
    password: '',
    storeId: '',
    fraudUser: '',
    fraudPassword: '',
  },
  {
    id: 'redx',
    name: 'RedX',
    code: 'redx',
    enabled: false,
    apiKey: '',
    apiSecret: '',
    apiUrl: '',
    webhookUrl: '',
    defaultWeight: '0.5',
    defaultLength: '20',
    defaultWidth: '15',
    defaultHeight: '10',
    pickupLocation: '',
    codEnabled: true,
    autoAssign: false,
    fraudPhone: '',
    fraudPassword: '',
  },
  {
    id: 'steadfast',
    name: 'Steadfast',
    code: 'steadfast',
    enabled: false,
    apiKey: '',
    apiSecret: '',
    apiUrl: '',
    webhookUrl: '',
    defaultWeight: '0.5',
    defaultLength: '20',
    defaultWidth: '15',
    defaultHeight: '10',
    pickupLocation: '',
    codEnabled: true,
    autoAssign: false,
    fraudUser: '',
    fraudPassword: '',
  },
  {
    id: 'carrybee',
    name: 'Carrybee',
    code: 'carrybee',
    enabled: false,
    apiKey: '',
    apiSecret: '',
    apiUrl: '',
    webhookUrl: '',
    defaultWeight: '0.5',
    defaultLength: '20',
    defaultWidth: '15',
    defaultHeight: '10',
    pickupLocation: '',
    codEnabled: true,
    autoAssign: false,
    clientId: '',
    clientSecret: '',
    clientContext: '',
  },
];

const AdminShippingProviders = () => {
  const [providers, setProviders] = useState<ShippingProvider[]>(defaultProviders);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('pathao');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingProvider, setTrackingProvider] = useState('pathao');
  const [trackingResult, setTrackingResult] = useState<TrackingResult[] | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [rateCheckLoading, setRateCheckLoading] = useState(false);
  const [rateResult, setRateResult] = useState<any>(null);
  const [rateForm, setRateForm] = useState({ fromPin: '', toPin: '', weight: '0.5', codAmount: '0' });

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('system_settings').select('value').eq('key', 'shipping_providers_config').single();
      if (data?.value && Array.isArray(data.value)) {
        setProviders(prev => {
          const saved = data.value as any[];
          return prev.map(p => {
            const s = saved.find((sp: any) => sp.id === p.id);
            return s ? { ...p, ...s } : p;
          });
        });
      }
    };
    load();
  }, []);

  const updateProvider = (id: string, key: string, value: any) => {
    setProviders(prev => prev.map(p => p.id === id ? { ...p, [key]: value } : p));
  };

  const handleSave = async () => {
    setLoading(true);
    const { error } = await supabase.from('system_settings').upsert({
      key: 'shipping_providers_config',
      value: providers as any,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'key' });
    if (error) toast.error('Failed to save');
    else toast.success('Shipping providers saved!');
    setLoading(false);
  };

  const handleCheckRate = async () => {
    setRateCheckLoading(true);
    setRateResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('shipping-provider', {
        body: {
          action: 'check_rate',
          provider: activeTab,
          payload: {
            pickup_postcode: rateForm.fromPin,
            delivery_postcode: rateForm.toPin,
            weight: parseFloat(rateForm.weight),
            cod_amount: parseFloat(rateForm.codAmount),
          },
        },
      });
      if (error) throw error;
      setRateResult(data);
    } catch (e: any) {
      toast.error(e.message || 'Rate check failed');
    }
    setRateCheckLoading(false);
  };

  const handleTrack = async () => {
    if (!trackingNumber) return;
    setTrackingLoading(true);
    setTrackingResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('shipping-provider', {
        body: {
          action: 'track',
          provider: trackingProvider,
          payload: { tracking_number: trackingNumber },
        },
      });
      if (error) throw error;
      setTrackingResult(data?.events || []);
    } catch (e: any) {
      toast.error(e.message || 'Tracking failed');
    }
    setTrackingLoading(false);
  };

  const handleCreateTestOrder = async () => {
    toast.info('Test order creation requires a real order. Use the Orders page to assign a shipping provider.');
  };

  const renderProviderConfig = (provider: ShippingProvider) => (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Truck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{provider.name}</h3>
            <p className="text-xs text-muted-foreground">API Base: {provider.apiUrl}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor={`${provider.id}-enabled`} className="text-sm">Enable</Label>
          <Switch
            id={`${provider.id}-enabled`}
            checked={provider.enabled}
            onCheckedChange={(v) => updateProvider(provider.id, 'enabled', v)}
          />
        </div>
      </div>

      {/* Base URL - common to all */}
      <div className="space-y-2">
        <Label>Base URL</Label>
        <Input
          value={provider.apiUrl}
          onChange={(e) => updateProvider(provider.id, 'apiUrl', e.target.value)}
          placeholder="https://api.example.com"
        />
      </div>

      {/* Provider-specific credential fields */}
      {provider.id === 'pathao' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Client ID</Label>
              <Input
                value={provider.clientId || ''}
                onChange={(e) => updateProvider(provider.id, 'clientId', e.target.value)}
                placeholder="Client ID"
              />
            </div>
            <div className="space-y-2">
              <Label>Client Secret</Label>
              <Input
                type="password"
                value={provider.clientSecret || ''}
                onChange={(e) => updateProvider(provider.id, 'clientSecret', e.target.value)}
                placeholder="Client Secret"
              />
            </div>
            <div className="space-y-2">
              <Label>Username</Label>
              <Input
                value={provider.username || ''}
                onChange={(e) => updateProvider(provider.id, 'username', e.target.value)}
                placeholder="merchant.pathao.com login email"
              />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                value={provider.password || ''}
                onChange={(e) => updateProvider(provider.id, 'password', e.target.value)}
                placeholder="Password"
              />
            </div>
            <div className="space-y-2">
              <Label>Store ID</Label>
              <Input
                value={provider.storeId || ''}
                onChange={(e) => updateProvider(provider.id, 'storeId', e.target.value)}
                placeholder="Store ID"
              />
            </div>
            <div className="space-y-2">
              <Label>Webhook URL (Optional)</Label>
              <Input
                value={provider.webhookUrl}
                onChange={(e) => updateProvider(provider.id, 'webhookUrl', e.target.value)}
                placeholder="https://your-domain.com/webhook"
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold mb-3 text-foreground">Fraud Checker Credentials</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Merchant User</Label>
                <Input
                  value={provider.fraudUser || ''}
                  onChange={(e) => updateProvider(provider.id, 'fraudUser', e.target.value)}
                  placeholder="merchant.pathao.com login email"
                />
              </div>
              <div className="space-y-2">
                <Label>Merchant Password</Label>
                <Input
                  type="password"
                  value={provider.fraudPassword || ''}
                  onChange={(e) => updateProvider(provider.id, 'fraudPassword', e.target.value)}
                  placeholder="Password"
                />
              </div>
            </div>
          </div>
        </>
      )}

      {provider.id === 'redx' && (
        <>
          <div className="space-y-2">
            <Label>API Token</Label>
            <Input
              type="password"
              value={provider.apiKey}
              onChange={(e) => updateProvider(provider.id, 'apiKey', e.target.value)}
              placeholder="API Access Token"
            />
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold mb-3 text-foreground">Fraud Checker Credentials</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  value={provider.fraudPhone || ''}
                  onChange={(e) => updateProvider(provider.id, 'fraudPhone', e.target.value)}
                  placeholder="01XXXXXXXXX"
                />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  value={provider.fraudPassword || ''}
                  onChange={(e) => updateProvider(provider.id, 'fraudPassword', e.target.value)}
                  placeholder="Password"
                />
              </div>
            </div>
          </div>
        </>
      )}

      {provider.id === 'steadfast' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>API Key</Label>
              <Input
                type="password"
                value={provider.apiKey}
                onChange={(e) => updateProvider(provider.id, 'apiKey', e.target.value)}
                placeholder="API Key"
              />
            </div>
            <div className="space-y-2">
              <Label>Secret Key</Label>
              <Input
                type="password"
                value={provider.apiSecret}
                onChange={(e) => updateProvider(provider.id, 'apiSecret', e.target.value)}
                placeholder="Secret Key"
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold mb-3 text-foreground">Fraud Checker Credentials</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>User / Email</Label>
                <Input
                  value={provider.fraudUser || ''}
                  onChange={(e) => updateProvider(provider.id, 'fraudUser', e.target.value)}
                  placeholder="steadfast.com.bd login email"
                />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  value={provider.fraudPassword || ''}
                  onChange={(e) => updateProvider(provider.id, 'fraudPassword', e.target.value)}
                  placeholder="Password"
                />
              </div>
            </div>
          </div>
        </>
      )}

      {provider.id === 'carrybee' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Client ID</Label>
            <Input
              value={provider.clientId || ''}
              onChange={(e) => updateProvider(provider.id, 'clientId', e.target.value)}
              placeholder="Client ID"
            />
          </div>
          <div className="space-y-2">
            <Label>Client Secret</Label>
            <Input
              type="password"
              value={provider.clientSecret || ''}
              onChange={(e) => updateProvider(provider.id, 'clientSecret', e.target.value)}
              placeholder="Client Secret"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Client Context</Label>
            <Input
              value={provider.clientContext || ''}
              onChange={(e) => updateProvider(provider.id, 'clientContext', e.target.value)}
              placeholder="Client Context"
            />
          </div>
        </div>
      )}

      {/* Pickup Location - shared */}
      {provider.id !== 'pathao' && (
        <div className="space-y-2">
          <Label>Pickup Location {provider.id === 'pathao' ? '/ Store ID' : ''}</Label>
          <Input
            value={provider.pickupLocation}
            onChange={(e) => updateProvider(provider.id, 'pickupLocation', e.target.value)}
            placeholder="Pickup location name"
          />
        </div>
      )}

      <div className="border-t pt-4">
        <h4 className="text-sm font-semibold mb-3 text-foreground">Default Package Dimensions</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Weight (kg)</Label>
            <Input value={provider.defaultWeight} onChange={(e) => updateProvider(provider.id, 'defaultWeight', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Length (cm)</Label>
            <Input value={provider.defaultLength} onChange={(e) => updateProvider(provider.id, 'defaultLength', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Width (cm)</Label>
            <Input value={provider.defaultWidth} onChange={(e) => updateProvider(provider.id, 'defaultWidth', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Height (cm)</Label>
            <Input value={provider.defaultHeight} onChange={(e) => updateProvider(provider.id, 'defaultHeight', e.target.value)} />
          </div>
        </div>
      </div>

      <div className="border-t pt-4 flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Switch
            checked={provider.codEnabled}
            onCheckedChange={(v) => updateProvider(provider.id, 'codEnabled', v)}
          />
          <Label>Cash on Delivery</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={provider.autoAssign}
            onCheckedChange={(v) => updateProvider(provider.id, 'autoAssign', v)}
          />
          <Label>Auto-assign Orders</Label>
        </div>
      </div>
    </div>
  );

  return (
    <AdminLayout title="Courier Management" description="Configure Pathao, RedX, Steadfast & Carrybee courier integrations and dispatch orders with one click">
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
            Save Configuration
          </Button>
        </div>

        {/* Provider Configs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start">
            {providers.map(p => (
              <TabsTrigger key={p.id} value={p.id} className="gap-2">
                <Truck className="h-3.5 w-3.5" />
                {p.name}
                {p.enabled && <Badge variant="secondary" className="text-[10px] h-4">Active</Badge>}
              </TabsTrigger>
            ))}
          </TabsList>
          {providers.map(p => (
            <TabsContent key={p.id} value={p.id}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{p.name} Configuration</CardTitle>
                  <CardDescription>Configure API credentials and settings for {p.name}</CardDescription>
                </CardHeader>
                <CardContent>{renderProviderConfig(p)}</CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        {/* Rate Calculator */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Shipping Rate Calculator
            </CardTitle>
            <CardDescription>Check shipping rates from enabled providers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 items-end">
              <div className="space-y-2">
                <Label>From Postcode</Label>
                <Input value={rateForm.fromPin} onChange={e => setRateForm(p => ({ ...p, fromPin: e.target.value }))} placeholder="1212" />
              </div>
              <div className="space-y-2">
                <Label>To Postcode</Label>
                <Input value={rateForm.toPin} onChange={e => setRateForm(p => ({ ...p, toPin: e.target.value }))} placeholder="4000" />
              </div>
              <div className="space-y-2">
                <Label>Weight (kg)</Label>
                <Input value={rateForm.weight} onChange={e => setRateForm(p => ({ ...p, weight: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>COD Amount</Label>
                <Input value={rateForm.codAmount} onChange={e => setRateForm(p => ({ ...p, codAmount: e.target.value }))} placeholder="0" />
              </div>
              <Button onClick={handleCheckRate} disabled={rateCheckLoading}>
                {rateCheckLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Search className="h-4 w-4 mr-1" />}
                Check Rate
              </Button>
            </div>
            {rateResult && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Rate Results</h4>
                {rateResult.rates ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Provider</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead>Est. Days</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rateResult.rates.map((r: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell>{r.provider}</TableCell>
                          <TableCell>{r.service}</TableCell>
                          <TableCell>৳{r.rate}</TableCell>
                          <TableCell>{r.estimated_days}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <pre className="text-xs">{JSON.stringify(rateResult, null, 2)}</pre>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tracking */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Shipment Tracking
            </CardTitle>
            <CardDescription>Track shipments across all providers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="space-y-2 flex-1">
                <Label>Tracking Number</Label>
                <Input value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} placeholder="Enter tracking number" />
              </div>
              <div className="space-y-2 w-40">
                <Label>Provider</Label>
                <Select value={trackingProvider} onValueChange={setTrackingProvider}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {providers.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleTrack} disabled={trackingLoading}>
                {trackingLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Search className="h-4 w-4 mr-1" />}
                Track
              </Button>
            </div>
            {trackingResult && (
              <div className="mt-4">
                {trackingResult.length > 0 ? (
                  <div className="space-y-3">
                    {trackingResult.map((event, i) => (
                      <div key={i} className="flex gap-3 items-start">
                        <div className={`h-3 w-3 mt-1 rounded-full shrink-0 ${i === 0 ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                        <div>
                          <p className="text-sm font-medium text-foreground">{event.status}</p>
                          <p className="text-xs text-muted-foreground">{event.description}</p>
                          <p className="text-xs text-muted-foreground">{event.location} • {event.timestamp}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No tracking events found.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {providers.filter(p => p.enabled).map(p => (
                <div key={p.id} className="p-4 border rounded-lg space-y-2">
                  <h4 className="font-semibold text-foreground">{p.name}</h4>
                  <Badge variant="outline" className="text-xs">Connected</Badge>
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" variant="outline" onClick={handleCreateTestOrder}>
                      <Package className="h-3 w-3 mr-1" /> Test Order
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setTrackingProvider(p.id); }}>
                      <Eye className="h-3 w-3 mr-1" /> Track
                    </Button>
                  </div>
                </div>
              ))}
              {providers.filter(p => p.enabled).length === 0 && (
                <p className="col-span-3 text-center text-muted-foreground py-8">No shipping providers enabled. Enable one above to get started.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminShippingProviders;
