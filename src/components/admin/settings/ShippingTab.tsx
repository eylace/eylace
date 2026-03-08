import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Truck, Globe, MapPin, Map, Package, Plus, Trash2, Box } from 'lucide-react';
import type { SettingsState } from '@/pages/AdminSettingsPage';

interface Props { settings: SettingsState; update: (key: string, value: any) => void; }

export const ShippingTab = ({ settings, update }: Props) => {
  const [shippingSubTab, setShippingSubTab] = useState('method');

  // Generic array helpers
  const addItem = (key: string, item: any) => update(key, [...((settings as any)[key] || []), item]);
  const removeItem = (key: string, idx: number) => update(key, ((settings as any)[key] || []).filter((_: any, i: number) => i !== idx));
  const updateItem = (key: string, idx: number, field: string, value: any) => {
    const next = [...((settings as any)[key] || [])];
    next[idx] = { ...next[idx], [field]: value };
    update(key, next);
  };

  return (
    <div className="mt-4">
      <Tabs value={shippingSubTab} onValueChange={setShippingSubTab}>
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="method" className="text-xs">Method</TabsTrigger>
          <TabsTrigger value="config" className="text-xs">Configuration</TabsTrigger>
          <TabsTrigger value="countries" className="text-xs">Countries</TabsTrigger>
          <TabsTrigger value="states" className="text-xs">States</TabsTrigger>
          <TabsTrigger value="cities" className="text-xs">Cities</TabsTrigger>
          <TabsTrigger value="areas" className="text-xs">Areas</TabsTrigger>
          <TabsTrigger value="zones" className="text-xs">Zones</TabsTrigger>
          <TabsTrigger value="carriers" className="text-xs">Carriers</TabsTrigger>
          <TabsTrigger value="pickup" className="text-xs">Pickup</TabsTrigger>
          <TabsTrigger value="boxes" className="text-xs">Box Sizes</TabsTrigger>
        </TabsList>

        {/* Shipping Method */}
        <TabsContent value="method" className="mt-4">
          <Card className="border border-border">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Truck className="h-5 w-5" /> Select Shipping Method</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {[
                { value: 'flat_rate', label: 'Flat Rate', desc: 'Fixed shipping cost for all orders' },
                { value: 'free_shipping', label: 'Free Shipping', desc: 'Free shipping on all orders' },
                { value: 'weight_based', label: 'Weight Based', desc: 'Shipping cost calculated by weight' },
                { value: 'zone_based', label: 'Zone Based', desc: 'Different rates for different zones' },
                { value: 'carrier_based', label: 'Carrier Based', desc: 'Rates from shipping carriers' },
              ].map(m => (
                <div key={m.value} className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${settings.shippingMethod === m.value ? 'border-accent bg-accent/5' : 'border-border'}`}
                  onClick={() => update('shippingMethod', m.value)}>
                  <div>
                    <p className="text-sm font-medium text-foreground">{m.label}</p>
                    <p className="text-xs text-muted-foreground">{m.desc}</p>
                  </div>
                  <div className={`h-4 w-4 rounded-full border-2 ${settings.shippingMethod === m.value ? 'border-accent bg-accent' : 'border-muted-foreground'}`} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shipping Configuration */}
        <TabsContent value="config" className="mt-4">
          <Card className="border border-border">
            <CardHeader><CardTitle className="text-base">Shipping Configuration</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Flat Rate Amount</Label><Input type="number" value={settings.flatRateAmount} onChange={e => update('flatRateAmount', e.target.value)} /></div>
                <div className="space-y-2"><Label>Free Shipping Threshold</Label><Input type="number" value={settings.freeShippingThreshold} onChange={e => update('freeShippingThreshold', e.target.value)} /></div>
              </div>
              <p className="text-xs text-muted-foreground">Orders above the threshold amount get free shipping automatically.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Countries */}
        <TabsContent value="countries" className="mt-4">
          <Card className="border border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><Globe className="h-5 w-5" /> Shipping Countries</CardTitle>
              <Button size="sm" variant="outline" onClick={() => addItem('shippingCountries', { code: '', name: '', enabled: true })}><Plus className="h-4 w-4 mr-1" /> Add</Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {(settings.shippingCountries || []).map((c, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 border border-border rounded-lg">
                  <Input className="w-20" placeholder="Code" value={c.code} onChange={e => updateItem('shippingCountries', idx, 'code', e.target.value)} />
                  <Input className="flex-1" placeholder="Country Name" value={c.name} onChange={e => updateItem('shippingCountries', idx, 'name', e.target.value)} />
                  <Switch checked={c.enabled} onCheckedChange={v => updateItem('shippingCountries', idx, 'enabled', v)} />
                  <Button size="icon" variant="ghost" onClick={() => removeItem('shippingCountries', idx)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* States */}
        <TabsContent value="states" className="mt-4">
          <Card className="border border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><Map className="h-5 w-5" /> Shipping States</CardTitle>
              <Button size="sm" variant="outline" onClick={() => addItem('shippingStates', { country: 'BD', code: '', name: '', enabled: true })}><Plus className="h-4 w-4 mr-1" /> Add</Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {(settings.shippingStates || []).map((s, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 border border-border rounded-lg">
                  <Input className="w-16" placeholder="Ctry" value={s.country} onChange={e => updateItem('shippingStates', idx, 'country', e.target.value)} />
                  <Input className="w-20" placeholder="Code" value={s.code} onChange={e => updateItem('shippingStates', idx, 'code', e.target.value)} />
                  <Input className="flex-1" placeholder="State Name" value={s.name} onChange={e => updateItem('shippingStates', idx, 'name', e.target.value)} />
                  <Switch checked={s.enabled} onCheckedChange={v => updateItem('shippingStates', idx, 'enabled', v)} />
                  <Button size="icon" variant="ghost" onClick={() => removeItem('shippingStates', idx)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cities */}
        <TabsContent value="cities" className="mt-4">
          <Card className="border border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><MapPin className="h-5 w-5" /> Shipping Cities</CardTitle>
              <Button size="sm" variant="outline" onClick={() => addItem('shippingCities', { state: '', name: '', enabled: true })}><Plus className="h-4 w-4 mr-1" /> Add</Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {(settings.shippingCities || []).map((c, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 border border-border rounded-lg">
                  <Input className="w-24" placeholder="State" value={c.state} onChange={e => updateItem('shippingCities', idx, 'state', e.target.value)} />
                  <Input className="flex-1" placeholder="City Name" value={c.name} onChange={e => updateItem('shippingCities', idx, 'name', e.target.value)} />
                  <Switch checked={c.enabled} onCheckedChange={v => updateItem('shippingCities', idx, 'enabled', v)} />
                  <Button size="icon" variant="ghost" onClick={() => removeItem('shippingCities', idx)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Areas */}
        <TabsContent value="areas" className="mt-4">
          <Card className="border border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Shipping Areas</CardTitle>
              <Button size="sm" variant="outline" onClick={() => addItem('shippingAreas', { city: '', name: '', zipCode: '', enabled: true })}><Plus className="h-4 w-4 mr-1" /> Add</Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {(settings.shippingAreas || []).map((a, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 border border-border rounded-lg">
                  <Input className="w-28" placeholder="City" value={a.city} onChange={e => updateItem('shippingAreas', idx, 'city', e.target.value)} />
                  <Input className="flex-1" placeholder="Area Name" value={a.name} onChange={e => updateItem('shippingAreas', idx, 'name', e.target.value)} />
                  <Input className="w-24" placeholder="ZIP" value={a.zipCode} onChange={e => updateItem('shippingAreas', idx, 'zipCode', e.target.value)} />
                  <Switch checked={a.enabled} onCheckedChange={v => updateItem('shippingAreas', idx, 'enabled', v)} />
                  <Button size="icon" variant="ghost" onClick={() => removeItem('shippingAreas', idx)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Zones */}
        <TabsContent value="zones" className="mt-4">
          <Card className="border border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Shipping Zones</CardTitle>
              <Button size="sm" variant="outline" onClick={() => addItem('shippingZones', { name: '', countries: [], rate: '0', enabled: true })}><Plus className="h-4 w-4 mr-1" /> Add</Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {(settings.shippingZones || []).map((z, idx) => (
                <div key={idx} className="p-4 border border-border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch checked={z.enabled} onCheckedChange={v => updateItem('shippingZones', idx, 'enabled', v)} />
                      <span className="text-sm font-medium text-foreground">{z.name || 'Unnamed Zone'}</span>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => removeItem('shippingZones', idx)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input placeholder="Zone Name" value={z.name} onChange={e => updateItem('shippingZones', idx, 'name', e.target.value)} />
                    <Input type="number" placeholder="Rate" value={z.rate} onChange={e => updateItem('shippingZones', idx, 'rate', e.target.value)} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Carriers */}
        <TabsContent value="carriers" className="mt-4">
          <Card className="border border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><Truck className="h-5 w-5" /> Shipping Carriers</CardTitle>
              <Button size="sm" variant="outline" onClick={() => addItem('shippingCarriers', { name: '', code: '', trackingUrl: '', enabled: true })}><Plus className="h-4 w-4 mr-1" /> Add</Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {(settings.shippingCarriers || []).map((c, idx) => (
                <div key={idx} className="p-4 border border-border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch checked={c.enabled} onCheckedChange={v => updateItem('shippingCarriers', idx, 'enabled', v)} />
                      <span className="text-sm font-medium text-foreground">{c.name || 'New Carrier'}</span>
                      {c.enabled && <Badge variant="secondary" className="text-[10px]">Active</Badge>}
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => removeItem('shippingCarriers', idx)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Input placeholder="Carrier Name" value={c.name} onChange={e => updateItem('shippingCarriers', idx, 'name', e.target.value)} />
                    <Input placeholder="Code" value={c.code} onChange={e => updateItem('shippingCarriers', idx, 'code', e.target.value)} />
                    <Input placeholder="Tracking URL ({tracking})" value={c.trackingUrl} onChange={e => updateItem('shippingCarriers', idx, 'trackingUrl', e.target.value)} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pickup Addresses */}
        <TabsContent value="pickup" className="mt-4">
          <Card className="border border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><MapPin className="h-5 w-5" /> Pickup Addresses</CardTitle>
              <Button size="sm" variant="outline" onClick={() => addItem('pickupAddresses', { label: '', address: '', city: '', phone: '', enabled: true })}><Plus className="h-4 w-4 mr-1" /> Add</Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {(settings.pickupAddresses || []).map((p, idx) => (
                <div key={idx} className="p-4 border border-border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch checked={p.enabled} onCheckedChange={v => updateItem('pickupAddresses', idx, 'enabled', v)} />
                      <span className="text-sm font-medium text-foreground">{p.label || 'New Address'}</span>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => removeItem('pickupAddresses', idx)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input placeholder="Label" value={p.label} onChange={e => updateItem('pickupAddresses', idx, 'label', e.target.value)} />
                    <Input placeholder="Address" value={p.address} onChange={e => updateItem('pickupAddresses', idx, 'address', e.target.value)} />
                    <Input placeholder="City" value={p.city} onChange={e => updateItem('pickupAddresses', idx, 'city', e.target.value)} />
                    <Input placeholder="Phone" value={p.phone} onChange={e => updateItem('pickupAddresses', idx, 'phone', e.target.value)} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Box Sizes */}
        <TabsContent value="boxes" className="mt-4">
          <Card className="border border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><Box className="h-5 w-5" /> Shipping Box Sizes</CardTitle>
              <Button size="sm" variant="outline" onClick={() => addItem('shippingBoxSizes', { name: '', length: '', width: '', height: '', weight: '' })}><Plus className="h-4 w-4 mr-1" /> Add</Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="hidden md:grid grid-cols-6 gap-3 text-xs font-medium text-muted-foreground px-3">
                <span>Name</span><span>Length (cm)</span><span>Width (cm)</span><span>Height (cm)</span><span>Max Weight (kg)</span><span></span>
              </div>
              {(settings.shippingBoxSizes || []).map((b, idx) => (
                <div key={idx} className="grid grid-cols-2 md:grid-cols-6 gap-3 p-3 border border-border rounded-lg items-center">
                  <Input placeholder="Name" value={b.name} onChange={e => updateItem('shippingBoxSizes', idx, 'name', e.target.value)} />
                  <Input type="number" placeholder="L" value={b.length} onChange={e => updateItem('shippingBoxSizes', idx, 'length', e.target.value)} />
                  <Input type="number" placeholder="W" value={b.width} onChange={e => updateItem('shippingBoxSizes', idx, 'width', e.target.value)} />
                  <Input type="number" placeholder="H" value={b.height} onChange={e => updateItem('shippingBoxSizes', idx, 'height', e.target.value)} />
                  <Input type="number" placeholder="Wt" value={b.weight} onChange={e => updateItem('shippingBoxSizes', idx, 'weight', e.target.value)} />
                  <Button size="icon" variant="ghost" onClick={() => removeItem('shippingBoxSizes', idx)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
