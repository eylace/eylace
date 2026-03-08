import { useState, useEffect, useCallback } from 'react';
import { Loader2, CheckCircle, XCircle, Clock, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface SellerApplication {
  id: string; user_id: string; store_name: string; store_description: string | null;
  phone: string | null; business_type: string | null; status: string; admin_notes: string | null; created_at: string;
}

export const AdminSellersTab = () => {
  const [applications, setApplications] = useState<SellerApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const [togglingRegistration, setTogglingRegistration] = useState(false);
  const [actionDialog, setActionDialog] = useState<{ app: SellerApplication; action: 'approve' | 'reject' } | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const { t } = useLanguage();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const { data: appsData } = await supabase.functions.invoke('admin-manage-sellers', { body: { action: 'list' } });
    if (appsData?.applications) setApplications(appsData.applications);
    const { data: settings } = await supabase.from('system_settings').select('value').eq('key', 'seller_registration_enabled').single();
    setRegistrationEnabled((settings?.value as any)?.enabled ?? true);
    setIsLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleRegistration = async () => {
    setTogglingRegistration(true);
    const newValue = !registrationEnabled;
    const { error } = await supabase.from('system_settings').update({ value: { enabled: newValue }, updated_at: new Date().toISOString() }).eq('key', 'seller_registration_enabled');
    if (error) { toast.error('Failed to update'); } else { setRegistrationEnabled(newValue); toast.success(`Seller registration ${newValue ? 'enabled' : 'disabled'}`); }
    setTogglingRegistration(false);
  };

  const handleAction = async () => {
    if (!actionDialog) return;
    setProcessing(true);
    const { error } = await supabase.functions.invoke('admin-manage-sellers', {
      body: { action: actionDialog.action, applicationId: actionDialog.app.id, adminNotes: adminNotes || null },
    });
    if (error) { toast.error(`Failed to ${actionDialog.action}`); } else { toast.success('Done'); setActionDialog(null); setAdminNotes(''); await fetchData(); }
    setProcessing(false);
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle className="h-3 w-3 mr-1" />{t('admin.approved' as any)}</Badge>;
      case 'rejected': return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />{t('admin.rejected' as any)}</Badge>;
      default: return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />{t('admin.pending' as any)}</Badge>;
    }
  };

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <Store className="h-5 w-5 text-muted-foreground" />
            <div>
              <Label className="text-base font-medium">{t('admin.sellerRegistration' as any)}</Label>
              <p className="text-sm text-muted-foreground">
                {registrationEnabled ? t('admin.newSellersCanApply' as any) : t('admin.registrationClosed' as any)}
              </p>
            </div>
          </div>
          <Switch checked={registrationEnabled} onCheckedChange={toggleRegistration} disabled={togglingRegistration} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('admin.sellerApplications' as any)} ({applications.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">{t('admin.noApplications' as any)}</p>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => (
                <div key={app.id} className="flex flex-col sm:flex-row sm:items-start justify-between p-3 md:p-4 border border-border rounded-lg gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground text-sm md:text-base">{app.store_name}</h3>
                      {statusBadge(app.status)}
                    </div>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      {app.business_type && <span className="capitalize">{app.business_type.replace('_', ' ')}</span>}
                      {app.phone && <span> • {app.phone}</span>}
                    </p>
                    {app.store_description && <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">{app.store_description}</p>}
                    <p className="text-xs text-muted-foreground">{t('admin.applied' as any)} {new Date(app.created_at).toLocaleDateString()}</p>
                  </div>
                  {app.status === 'pending' && (
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" variant="outline" className="text-green-600 border-green-500/30 hover:bg-green-500/10 text-xs md:text-sm" onClick={() => { setActionDialog({ app, action: 'approve' }); setAdminNotes(''); }}>
                        <CheckCircle className="h-3.5 w-3.5 mr-1" />{t('admin.approve' as any)}
                      </Button>
                      <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10 text-xs md:text-sm" onClick={() => { setActionDialog({ app, action: 'reject' }); setAdminNotes(''); }}>
                        <XCircle className="h-3.5 w-3.5 mr-1" />{t('admin.reject' as any)}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!actionDialog} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog?.action === 'approve' ? t('admin.approveApplication' as any) : t('admin.rejectApplication' as any)}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {actionDialog?.action === 'approve'
                ? `${t('admin.approve' as any)} "${actionDialog?.app.store_name}"?`
                : `${t('admin.reject' as any)} "${actionDialog?.app.store_name}"?`}
            </p>
            <div className="space-y-2">
              <Label>{t('admin.adminNotes' as any)}</Label>
              <Textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder={t('admin.addNote' as any)} maxLength={500} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>{t('admin.cancel' as any)}</Button>
            <Button onClick={handleAction} disabled={processing} variant={actionDialog?.action === 'approve' ? 'default' : 'destructive'}>
              {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {actionDialog?.action === 'approve' ? t('admin.approve' as any) : t('admin.reject' as any)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
