import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Save, Store } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MediaInputField } from '@/components/admin/MediaInputField';
import type { SellerProfile } from '@/hooks/useSellerData';

interface SellerStoreSettingsProps {
  seller: SellerProfile;
  onUpdate: () => void;
}

export const SellerStoreSettings = ({ seller, onUpdate }: SellerStoreSettingsProps) => {
  const [name, setName] = useState(seller.name);
  const [logo, setLogo] = useState(seller.logo || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('sellers')
      .update({ name, logo: logo || null })
      .eq('id', seller.id);

    if (error) {
      toast.error('Failed to update store settings');
    } else {
      toast.success('Store settings updated');
      onUpdate();
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Store className="h-5 w-5" /> Store Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="storeName">Store Name</Label>
            <Input id="storeName" value={name} onChange={e => setName(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="storeLogo">Logo URL</Label>
            <MediaInputField
              inputId="storeLogo"
              value={logo}
              onChange={setLogo}
              uploadFolder={`sellers/${seller.slug}`}
              previewClassName="w-16 h-16 rounded-lg object-cover border border-border"
              maxSizeBytes={2 * 1024 * 1024}
              maxWidth={1024}
              maxHeight={1024}
            />
          </div>

          <div className="space-y-2">
            <Label>Store Slug</Label>
            <Input value={seller.slug} disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground">Slug cannot be changed</p>
          </div>

          <div className="space-y-2">
            <Label>Verification Status</Label>
            <p className="text-sm">
              {seller.is_verified ? (
                <span className="text-[hsl(var(--success))] font-medium">✓ Verified</span>
              ) : (
                <span className="text-muted-foreground">Not verified</span>
              )}
            </p>
          </div>

          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
