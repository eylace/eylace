import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Save, Loader2 } from 'lucide-react';
import { BusinessSettingsTab } from '@/components/admin/settings/BusinessSettingsTab';
import { FeaturesTab } from '@/components/admin/settings/FeaturesTab';
import { LanguagesTab } from '@/components/admin/settings/LanguagesTab';
import { CurrencyTab } from '@/components/admin/settings/CurrencyTab';
import { VatTaxTab } from '@/components/admin/settings/VatTaxTab';
import { PickupPointTab } from '@/components/admin/settings/PickupPointTab';
import { SmtpSettingsTab } from '@/components/admin/settings/SmtpSettingsTab';
import { OrderConfigTab } from '@/components/admin/settings/OrderConfigTab';
import { FileSystemCacheTab } from '@/components/admin/settings/FileSystemCacheTab';
import { SocialMediaLoginsTab } from '@/components/admin/settings/SocialMediaLoginsTab';
import { ShippingTab } from '@/components/admin/settings/ShippingTab';

export interface SettingsState {
  // Business
  storeName: string;
  storeEmail: string;
  storePhone: string;
  storeAddress: string;
  storeLogo: string;
  storeTagline: string;
  timezone: string;
  dateFormat: string;
  // Features
  sellerRegistration: boolean;
  reviewModeration: boolean;
  autoConfirmOrders: boolean;
  maintenanceMode: boolean;
  guestCheckout: boolean;
  wishlistEnabled: boolean;
  compareEnabled: boolean;
  flashSaleEnabled: boolean;
  couponsEnabled: boolean;
  digitalProducts: boolean;
  multiLanguage: boolean;
  multiCurrency: boolean;
  // Languages
  defaultLanguage: string;
  enabledLanguages: string[];
  // Currency
  defaultCurrency: string;
  currencyPosition: string;
  thousandSeparator: string;
  decimalSeparator: string;
  decimalPlaces: string;
  enabledCurrencies: string[];
  // VAT & Tax
  taxEnabled: boolean;
  taxRate: string;
  taxType: string;
  taxIncludedInPrice: boolean;
  taxLabel: string;
  taxClasses: { name: string; rate: string }[];
  // Pickup Points
  pickupPoints: { name: string; address: string; phone: string; isActive: boolean }[];
  // SMTP
  smtpHost: string;
  smtpPort: string;
  smtpUsername: string;
  smtpPassword: string;
  smtpEncryption: string;
  smtpFromEmail: string;
  smtpFromName: string;
  // Order Config
  orderPrefix: string;
  orderStartNumber: string;
  minOrderAmount: string;
  maxOrderAmount: string;
  orderAutoCancel: boolean;
  autoCancelHours: string;
  orderStatusFlow: string[];
  // File System
  storageDriver: string;
  maxUploadSize: string;
  allowedFileTypes: string;
  cacheEnabled: boolean;
  cacheTtl: string;
  cacheDriver: string;
  // Social Logins
  facebookEnabled: boolean;
  facebookAppId: string;
  facebookAppSecret: string;
  googleEnabled: boolean;
  googleClientId: string;
  googleClientSecret: string;
  // Shipping
  shippingMethod: string;
  freeShippingThreshold: string;
  flatRateAmount: string;
  shippingCountries: { code: string; name: string; enabled: boolean }[];
  shippingStates: { country: string; code: string; name: string; enabled: boolean }[];
  shippingCities: { state: string; name: string; enabled: boolean }[];
  shippingAreas: { city: string; name: string; zipCode: string; enabled: boolean }[];
  shippingZones: { name: string; countries: string[]; rate: string; enabled: boolean }[];
  shippingCarriers: { name: string; code: string; trackingUrl: string; enabled: boolean }[];
  pickupAddresses: { label: string; address: string; city: string; phone: string; enabled: boolean }[];
  shippingBoxSizes: { name: string; length: string; width: string; height: string; weight: string }[];
}

const defaultSettings: SettingsState = {
  storeName: 'Grand Mall Emporium',
  storeEmail: 'admin@grandmall.com',
  storePhone: '+880 1234 567890',
  storeAddress: 'Dhaka, Bangladesh',
  storeLogo: '',
  storeTagline: 'Your one-stop online shop',
  timezone: 'Asia/Dhaka',
  dateFormat: 'DD/MM/YYYY',
  sellerRegistration: true,
  reviewModeration: false,
  autoConfirmOrders: false,
  maintenanceMode: false,
  guestCheckout: true,
  wishlistEnabled: true,
  compareEnabled: true,
  flashSaleEnabled: true,
  couponsEnabled: true,
  digitalProducts: true,
  multiLanguage: true,
  multiCurrency: false,
  defaultLanguage: 'en',
  enabledLanguages: ['en', 'bn'],
  defaultCurrency: 'BDT',
  currencyPosition: 'before',
  thousandSeparator: ',',
  decimalSeparator: '.',
  decimalPlaces: '2',
  enabledCurrencies: ['BDT', 'USD'],
  taxEnabled: true,
  taxRate: '15',
  taxType: 'percentage',
  taxIncludedInPrice: false,
  taxLabel: 'VAT',
  taxClasses: [{ name: 'Standard', rate: '15' }, { name: 'Reduced', rate: '5' }, { name: 'Zero', rate: '0' }],
  pickupPoints: [{ name: 'Main Office', address: 'Dhaka, Bangladesh', phone: '+880 1234 567890', isActive: true }],
  smtpHost: '',
  smtpPort: '587',
  smtpUsername: '',
  smtpPassword: '',
  smtpEncryption: 'tls',
  smtpFromEmail: '',
  smtpFromName: '',
  orderPrefix: 'ORD-',
  orderStartNumber: '1000',
  minOrderAmount: '0',
  maxOrderAmount: '999999',
  orderAutoCancel: false,
  autoCancelHours: '24',
  orderStatusFlow: ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'],
  storageDriver: 'supabase',
  maxUploadSize: '10',
  allowedFileTypes: 'jpg,jpeg,png,gif,webp,pdf,zip',
  cacheEnabled: true,
  cacheTtl: '3600',
  cacheDriver: 'memory',
  facebookEnabled: false,
  facebookAppId: '',
  facebookAppSecret: '',
  googleEnabled: false,
  googleClientId: '',
  googleClientSecret: '',
  shippingMethod: 'flat_rate',
  freeShippingThreshold: '5000',
  flatRateAmount: '60',
  shippingCountries: [
    { code: 'BD', name: 'Bangladesh', enabled: true },
    { code: 'IN', name: 'India', enabled: false },
    { code: 'US', name: 'United States', enabled: false },
    { code: 'GB', name: 'United Kingdom', enabled: false },
    { code: 'AE', name: 'UAE', enabled: false },
  ],
  shippingStates: [
    { country: 'BD', code: 'DHK', name: 'Dhaka', enabled: true },
    { country: 'BD', code: 'CTG', name: 'Chittagong', enabled: true },
    { country: 'BD', code: 'RAJ', name: 'Rajshahi', enabled: true },
    { country: 'BD', code: 'KHU', name: 'Khulna', enabled: true },
    { country: 'BD', code: 'SYL', name: 'Sylhet', enabled: false },
    { country: 'BD', code: 'BAR', name: 'Barisal', enabled: false },
    { country: 'BD', code: 'RAN', name: 'Rangpur', enabled: false },
    { country: 'BD', code: 'MYM', name: 'Mymensingh', enabled: false },
  ],
  shippingCities: [
    { state: 'DHK', name: 'Dhaka City', enabled: true },
    { state: 'DHK', name: 'Gazipur', enabled: true },
    { state: 'DHK', name: 'Narayanganj', enabled: true },
    { state: 'CTG', name: 'Chittagong City', enabled: true },
    { state: 'CTG', name: "Cox's Bazar", enabled: false },
  ],
  shippingAreas: [
    { city: 'Dhaka City', name: 'Gulshan', zipCode: '1212', enabled: true },
    { city: 'Dhaka City', name: 'Banani', zipCode: '1213', enabled: true },
    { city: 'Dhaka City', name: 'Dhanmondi', zipCode: '1205', enabled: true },
    { city: 'Dhaka City', name: 'Mirpur', zipCode: '1216', enabled: true },
    { city: 'Dhaka City', name: 'Uttara', zipCode: '1230', enabled: true },
  ],
  shippingZones: [
    { name: 'Inside Dhaka', countries: ['BD'], rate: '60', enabled: true },
    { name: 'Outside Dhaka', countries: ['BD'], rate: '120', enabled: true },
  ],
  shippingCarriers: [
    { name: 'Pathao Courier', code: 'pathao', trackingUrl: 'https://pathao.com/track/{tracking}', enabled: true },
    { name: 'Steadfast', code: 'steadfast', trackingUrl: 'https://steadfast.com.bd/track/{tracking}', enabled: true },
    { name: 'RedX', code: 'redx', trackingUrl: 'https://redx.com.bd/track/{tracking}', enabled: true },
    { name: 'Sundarban Courier', code: 'sundarban', trackingUrl: '', enabled: false },
  ],
  pickupAddresses: [
    { label: 'Main Warehouse', address: 'House 12, Road 5, Gulshan-1', city: 'Dhaka', phone: '+880 1711 000000', enabled: true },
  ],
  shippingBoxSizes: [
    { name: 'Small', length: '20', width: '15', height: '10', weight: '0.5' },
    { name: 'Medium', length: '35', width: '25', height: '15', weight: '1' },
    { name: 'Large', length: '50', width: '35', height: '25', weight: '2' },
  ],
};

const AdminSettingsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const activeTab = searchParams.get('tab') || 'business';
  const setActiveTab = (tab: string) => setSearchParams({ tab });

  const update = (key: string, value: any) => setSettings(prev => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setLoading(true);
    const { error } = await supabase.from('system_settings').upsert({
      key: 'store_settings_v2',
      value: settings as any,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'key' });

    if (error) toast.error('Failed to save settings');
    else toast.success('Settings saved successfully!');
    setLoading(false);
  };

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('system_settings').select('value').eq('key', 'store_settings_v2').single();
      if (data?.value && typeof data.value === 'object') {
        setSettings(prev => ({ ...prev, ...(data.value as any) }));
      }
    };
    load();
  }, []);

  return (
    <AdminLayout title="Setup & Configurations" description="Manage all store settings and configurations">
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
            Save All Settings
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex flex-wrap h-auto gap-1">
            <TabsTrigger value="business" className="text-xs">Business</TabsTrigger>
            <TabsTrigger value="features" className="text-xs">Features</TabsTrigger>
            <TabsTrigger value="languages" className="text-xs">Languages</TabsTrigger>
            <TabsTrigger value="currency" className="text-xs">Currency</TabsTrigger>
            <TabsTrigger value="vat" className="text-xs">VAT & Tax</TabsTrigger>
            <TabsTrigger value="pickup" className="text-xs">Pickup Point</TabsTrigger>
            <TabsTrigger value="smtp" className="text-xs">SMTP</TabsTrigger>
            <TabsTrigger value="order" className="text-xs">Order Config</TabsTrigger>
            <TabsTrigger value="filesystem" className="text-xs">File System</TabsTrigger>
            <TabsTrigger value="social" className="text-xs">Social Logins</TabsTrigger>
            <TabsTrigger value="shipping" className="text-xs">Shipping</TabsTrigger>
          </TabsList>

          <TabsContent value="business"><BusinessSettingsTab settings={settings} update={update} /></TabsContent>
          <TabsContent value="features"><FeaturesTab settings={settings} update={update} /></TabsContent>
          <TabsContent value="languages"><LanguagesTab settings={settings} update={update} /></TabsContent>
          <TabsContent value="currency"><CurrencyTab settings={settings} update={update} /></TabsContent>
          <TabsContent value="vat"><VatTaxTab settings={settings} update={update} /></TabsContent>
          <TabsContent value="pickup"><PickupPointTab settings={settings} update={update} /></TabsContent>
          <TabsContent value="smtp"><SmtpSettingsTab settings={settings} update={update} /></TabsContent>
          <TabsContent value="order"><OrderConfigTab settings={settings} update={update} /></TabsContent>
          <TabsContent value="filesystem"><FileSystemCacheTab settings={settings} update={update} /></TabsContent>
          <TabsContent value="social"><SocialMediaLoginsTab settings={settings} update={update} /></TabsContent>
          <TabsContent value="shipping"><ShippingTab settings={settings} update={update} /></TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminSettingsPage;
