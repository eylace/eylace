import { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Store, CheckCircle, Clock, XCircle, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FulfillmentPlanSelector } from '@/components/seller/FulfillmentPlanSelector';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';

const applicationSchema = z.object({
  store_name: z.string().trim().min(2, 'Store name must be at least 2 characters').max(100),
  store_description: z.string().trim().max(500, 'Description must be under 500 characters').optional(),
  phone: z.string().trim().min(6, 'Enter a valid phone number').max(20),
  business_type: z.string().min(1, 'Select a business type'),
});

type FulfillmentType = 'fbe' | 'fbm';

const SellerRegistration = () => {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [registrationEnabled, setRegistrationEnabled] = useState<boolean | null>(null);
  const [existingApplication, setExistingApplication] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState<'plan' | 'form'>('plan');
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType | null>(null);

  const [form, setForm] = useState({
    store_name: '', store_description: '', phone: '', business_type: '',
  });

  useEffect(() => {
    const load = async () => {
      const { data: settings } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'seller_registration_enabled')
        .single();

      setRegistrationEnabled((settings?.value as any)?.enabled ?? false);

      if (user) {
        const { data: app } = await supabase
          .from('seller_applications')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (app) setExistingApplication(app);
      }

      setIsLoading(false);
    };

    if (!authLoading) load();
  }, [user, authLoading]);

  if (authLoading || isLoading) {
    return (
      <Layout>
        <div className="container-main py-12 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      </Layout>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  if (!registrationEnabled) {
    return (
      <Layout>
        <div className="container-main py-12">
          <div className="max-w-lg mx-auto text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Store className="h-8 w-8 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">{t('sellerReg.closed')}</h1>
            <p className="text-muted-foreground">{t('sellerReg.closedDesc')}</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (existingApplication) {
    const statusConfig: Record<string, { icon: any; color: string; text: string }> = {
      pending: { icon: Clock, color: 'text-yellow-500', text: t('sellerReg.pendingText') },
      approved: { icon: CheckCircle, color: 'text-green-500', text: t('sellerReg.approvedText') },
      rejected: { icon: XCircle, color: 'text-destructive', text: t('sellerReg.rejectedText') },
    };

    const status = statusConfig[existingApplication.status] || statusConfig.pending;
    const StatusIcon = status.icon;
    const planLabel = existingApplication.fulfillment_type === 'fbe' ? 'FBE — Fulfilled by Eylace' : 'FBM — Fulfilled by Merchant';

    return (
      <Layout>
        <div className="container-main py-12">
          <div className="max-w-lg mx-auto text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${existingApplication.status === 'approved' ? 'bg-green-500/10' : existingApplication.status === 'rejected' ? 'bg-destructive/10' : 'bg-yellow-500/10'}`}>
              <StatusIcon className={`h-8 w-8 ${status.color}`} />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {t('sellerReg.application')} {existingApplication.status.charAt(0).toUpperCase() + existingApplication.status.slice(1)}
            </h1>
            <p className="text-muted-foreground mb-2">{status.text}</p>
            <p className="text-sm text-muted-foreground mb-4">
              নির্বাচিত প্ল্যান: <span className="font-semibold text-foreground">{planLabel}</span>
            </p>
            {existingApplication.admin_notes && (
              <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                <strong>{t('sellerReg.note')}</strong> {existingApplication.admin_notes}
              </p>
            )}
            {existingApplication.status === 'approved' && (
              <Button asChild className="mt-6">
                <Link to="/seller">
                  {t('sellerReg.goToDashboard')} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = applicationSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase
      .from('seller_applications')
      .insert({
        user_id: user.id,
        store_name: result.data.store_name,
        store_description: result.data.store_description || null,
        phone: result.data.phone,
        business_type: result.data.business_type,
        fulfillment_type: fulfillmentType || 'fbm',
      });

    if (error) {
      toast.error('Failed to submit application. Please try again.');
    } else {
      toast.success('Application submitted successfully!');
      window.location.reload();
    }

    setIsSubmitting(false);
  };

  return (
    <Layout>
      <div className="container-main py-12">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Store className="h-8 w-8 text-accent" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">{t('sellerReg.title')}</h1>
            <p className="text-muted-foreground mt-2">{t('sellerReg.subtitle')}</p>
          </div>

          {/* Step indicators */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${step === 'plan' ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}`}>
              <span className="w-6 h-6 rounded-full bg-primary-foreground/20 flex items-center justify-center text-xs">১</span>
              প্ল্যান নির্বাচন
            </div>
            <div className="w-8 h-px bg-border" />
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${step === 'form' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              <span className="w-6 h-6 rounded-full bg-primary-foreground/20 flex items-center justify-center text-xs">২</span>
              তথ্য পূরণ
            </div>
          </div>

          {step === 'plan' && (
            <FulfillmentPlanSelector
              selected={fulfillmentType}
              onSelect={setFulfillmentType}
              onContinue={() => setStep('form')}
            />
          )}

          {step === 'form' && (
            <>
              <div className="mb-6">
                <Button variant="ghost" onClick={() => setStep('plan')} className="text-muted-foreground">
                  <ArrowLeft className="h-4 w-4 mr-2" /> প্ল্যান পরিবর্তন করুন
                </Button>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>{t('sellerReg.applicationTitle')}</CardTitle>
                  <CardDescription>
                    {t('sellerReg.applicationDesc')} — নির্বাচিত প্ল্যান: <span className="font-semibold">{fulfillmentType === 'fbe' ? 'FBE (Eylace ম্যানেজড)' : 'FBM (সেলার ম্যানেজড)'}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="store_name">{t('sellerReg.storeName')}</Label>
                      <Input
                        id="store_name"
                        value={form.store_name}
                        onChange={(e) => setForm({ ...form, store_name: e.target.value })}
                        placeholder={t('sellerReg.storeNamePlaceholder')}
                        maxLength={100}
                      />
                      {errors.store_name && <p className="text-sm text-destructive">{errors.store_name}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="business_type">{t('sellerReg.businessType')}</Label>
                      <Select value={form.business_type} onValueChange={(v) => setForm({ ...form, business_type: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('sellerReg.selectBusinessType')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="individual">{t('sellerReg.individual')}</SelectItem>
                          <SelectItem value="small_business">{t('sellerReg.smallBusiness')}</SelectItem>
                          <SelectItem value="brand">{t('sellerReg.brandManufacturer')}</SelectItem>
                          <SelectItem value="wholesaler">{t('sellerReg.wholesaler')}</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.business_type && <p className="text-sm text-destructive">{errors.business_type}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">{t('sellerReg.phoneNumber')}</Label>
                      <Input
                        id="phone"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="+880 1XXX-XXXXXX"
                        maxLength={20}
                      />
                      {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="store_description">{t('sellerReg.storeDescription')}</Label>
                      <Textarea
                        id="store_description"
                        value={form.store_description}
                        onChange={(e) => setForm({ ...form, store_description: e.target.value })}
                        placeholder={t('sellerReg.storeDescPlaceholder')}
                        maxLength={500}
                        rows={4}
                      />
                      {errors.store_description && <p className="text-sm text-destructive">{errors.store_description}</p>}
                    </div>

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {t('sellerReg.submitting')}
                        </>
                      ) : (
                        t('sellerReg.submit')
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default SellerRegistration;
