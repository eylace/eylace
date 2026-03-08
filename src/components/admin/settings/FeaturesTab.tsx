import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Settings } from 'lucide-react';
import type { SettingsState } from '@/pages/AdminSettingsPage';

interface Props { settings: SettingsState; update: (key: string, value: any) => void; }

const features = [
  { key: 'sellerRegistration', label: 'Seller Registration', desc: 'Allow new sellers to register' },
  { key: 'reviewModeration', label: 'Review Moderation', desc: 'Require admin approval for reviews' },
  { key: 'autoConfirmOrders', label: 'Auto Confirm Orders', desc: 'Automatically confirm new orders' },
  { key: 'maintenanceMode', label: 'Maintenance Mode', desc: 'Put the entire store in maintenance mode' },
  { key: 'guestCheckout', label: 'Guest Checkout', desc: 'Allow checkout without account' },
  { key: 'wishlistEnabled', label: 'Wishlist', desc: 'Enable product wishlist feature' },
  { key: 'compareEnabled', label: 'Product Compare', desc: 'Enable product comparison feature' },
  { key: 'flashSaleEnabled', label: 'Flash Sales', desc: 'Enable flash sale promotions' },
  { key: 'couponsEnabled', label: 'Coupons & Promo', desc: 'Enable coupon/promo code system' },
  { key: 'digitalProducts', label: 'Digital Products', desc: 'Allow digital product sales' },
  { key: 'multiLanguage', label: 'Multi Language', desc: 'Enable multi-language support' },
  { key: 'multiCurrency', label: 'Multi Currency', desc: 'Enable multi-currency support' },
];

export const FeaturesTab = ({ settings, update }: Props) => (
  <div className="mt-4">
    <Card className="border border-border">
      <CardHeader><CardTitle className="text-base flex items-center gap-2"><Settings className="h-5 w-5" /> Feature Activation</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {features.map(f => (
          <div key={f.key} className="flex items-center justify-between p-3 border border-border rounded-lg">
            <div>
              <p className="text-sm font-medium text-foreground">{f.label}</p>
              <p className="text-xs text-muted-foreground">{f.desc}</p>
            </div>
            <Switch checked={(settings as any)[f.key]} onCheckedChange={v => update(f.key, v)} />
          </div>
        ))}
      </CardContent>
    </Card>
  </div>
);
