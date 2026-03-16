import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, MapPin, Loader2, Save, Check } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { z } from 'zod';

const profileSchema = z.object({
  first_name: z.string().trim().max(50).optional(),
  last_name: z.string().trim().max(50).optional(),
  phone: z.string().trim().max(20).optional(),
});

const addressSchema = z.object({
  address: z.string().trim().max(200).optional(),
  apartment: z.string().trim().max(50).optional(),
  city: z.string().trim().max(100).optional(),
  state: z.string().trim().max(100).optional(),
  zip_code: z.string().trim().max(20).optional(),
  country: z.string().trim().max(100).optional(),
});

const Settings = () => {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading, updateProfile } = useAuth();
  const { t } = useLanguage();
  const [isSaving, setIsSaving] = useState(false);
  const [profileData, setProfileData] = useState({ first_name: '', last_name: '', phone: '' });
  const [addressData, setAddressData] = useState({ address: '', apartment: '', city: '', state: '', zip_code: '', country: 'US' });

  useEffect(() => {
    if (!authLoading && !user) { navigate('/auth'); return; }
    if (profile) {
      setProfileData({ first_name: profile.first_name || '', last_name: profile.last_name || '', phone: profile.phone || '' });
      setAddressData({ address: profile.address || '', apartment: profile.apartment || '', city: profile.city || '', state: profile.state || '', zip_code: profile.zip_code || '', country: profile.country || 'US' });
    }
  }, [user, profile, authLoading, navigate]);

  const handleProfileSave = async () => {
    const v = profileSchema.safeParse(profileData);
    if (!v.success) { toast.error(v.error.errors[0].message); return; }
    setIsSaving(true);
    const { error } = await updateProfile(profileData);
    setIsSaving(false);
    toast[error ? 'error' : 'success'](error ? 'Failed to update profile' : 'Profile updated successfully');
  };

  const handleAddressSave = async () => {
    const v = addressSchema.safeParse(addressData);
    if (!v.success) { toast.error(v.error.errors[0].message); return; }
    setIsSaving(true);
    const { error } = await updateProfile(addressData);
    setIsSaving(false);
    toast[error ? 'error' : 'success'](error ? 'Failed to update address' : 'Address updated successfully');
  };

  if (authLoading) return (<Layout><div className="container-main py-12 flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div></Layout>);
  if (!user) return null;

  return (
    <Layout>
      <div className="container-main py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold">{t('settings.title')}</h1>
            <p className="text-muted-foreground mt-1">{t('settings.desc')}</p>
          </div>
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profile" className="gap-2"><User className="h-4 w-4" />{t('settings.profile')}</TabsTrigger>
              <TabsTrigger value="shipping" className="gap-2"><MapPin className="h-4 w-4" />{t('settings.shipping')}</TabsTrigger>
            </TabsList>
            <TabsContent value="profile" className="space-y-6">
              <div className="bg-card rounded-xl border border-border p-6">
                <h2 className="text-lg font-semibold mb-4">{t('settings.personalInfo')}</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label htmlFor="first_name">{t('settings.firstName')}</Label><Input id="first_name" value={profileData.first_name} onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })} /></div>
                    <div className="space-y-2"><Label htmlFor="last_name">{t('settings.lastName')}</Label><Input id="last_name" value={profileData.last_name} onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })} /></div>
                  </div>
                  <div className="space-y-2"><Label htmlFor="email">{t('settings.email')}</Label><Input id="email" value={user.email || ''} disabled className="bg-secondary" /><p className="text-xs text-muted-foreground">{t('settings.emailCannotChange')}</p></div>
                  <div className="space-y-2"><Label htmlFor="phone">{t('settings.phoneNumber')}</Label><Input id="phone" type="tel" value={profileData.phone} onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })} /></div>
                </div>
                <Separator className="my-6" />
                <Button onClick={handleProfileSave} disabled={isSaving} className="gap-2">{isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{t('settings.saveChanges')}</Button>
              </div>
            </TabsContent>
            <TabsContent value="shipping" className="space-y-6">
              <div className="bg-card rounded-xl border border-border p-6">
                <h2 className="text-lg font-semibold mb-4">{t('settings.shippingAddress')}</h2>
                <div className="space-y-4">
                  <div className="space-y-2"><Label htmlFor="address">{t('settings.streetAddress')}</Label><Input id="address" value={addressData.address} onChange={(e) => setAddressData({ ...addressData, address: e.target.value })} /></div>
                  <div className="space-y-2"><Label htmlFor="apartment">{t('settings.apartmentOptional')}</Label><Input id="apartment" value={addressData.apartment} onChange={(e) => setAddressData({ ...addressData, apartment: e.target.value })} /></div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label htmlFor="city">{t('settings.city')}</Label><Input id="city" value={addressData.city} onChange={(e) => setAddressData({ ...addressData, city: e.target.value })} /></div>
                    <div className="space-y-2"><Label htmlFor="state">{t('settings.stateProvince')}</Label><Input id="state" value={addressData.state} onChange={(e) => setAddressData({ ...addressData, state: e.target.value })} /></div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label htmlFor="zip_code">{t('settings.zipCode')}</Label><Input id="zip_code" value={addressData.zip_code} onChange={(e) => setAddressData({ ...addressData, zip_code: e.target.value })} /></div>
                    <div className="space-y-2"><Label htmlFor="country">{t('settings.country')}</Label><Input id="country" value={addressData.country} onChange={(e) => setAddressData({ ...addressData, country: e.target.value })} /></div>
                  </div>
                </div>
                <Separator className="my-6" />
                <Button onClick={handleAddressSave} disabled={isSaving} className="gap-2">{isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}{t('settings.saveAddress')}</Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;
