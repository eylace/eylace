import { useState, useEffect, useCallback } from 'react';
import { Loader2, CheckCircle, XCircle, Clock, Store, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { exportToCSV } from '@/lib/csvExport';

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
  const [selectedApps, setSelectedApps] = useState<Set<string>>(new Set());
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [bulkNotes, setBulkNotes] = useState('');
  const { t } = useLanguage();

  const pendingApps = applications.filter(a => a.status === 'pending');
  const selectedPendingCount = [...selectedApps].filter(id => pendingApps.some(a => a.id === id)).length;

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const { data: appsData } = await supabase.functions.invoke('admin-manage-sellers', { body: { action: 'list' } });
    if (appsData?.applications) setApplications(appsData.applications);
    const { data: settings } = await supabase.from('system_settings').select('value').eq('key', 'seller_registration_enabled').single();
    setRegistrationEnabled((settings?.value as any)?.enabled ?? true);
    setIsLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleSelect = (id: string) => {
    setSelectedApps(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAllPending = () => {
    if (selectedPendingCount === pendingApps.length && pendingApps.length > 0) {
      setSelectedApps(new Set());
    } else {
      setSelectedApps(new Set(pendingApps.map(a => a.id)));
    }
  };

  const handleBulkAction = async (action: 'bulk-approve' | 'bulk-reject') => {
    const pendingIds = [...selectedApps].filter(id => pendingApps.some(a => a.id === id));
    if (pendingIds.length === 0) return;
    setBulkProcessing(true);
    const { data, error } = await supabase.functions.invoke('admin-manage-sellers', {
      body: { action, applicationIds: pendingIds, adminNotes: bulkNotes || null },
    });
    if (error) {
      toast.error(`Failed to ${action.replace('bulk-', '')}`);
    } else {
      toast.success(`${data?.count || pendingIds.length} ${action === 'bulk-approve' ? 'approved' : 'rejected'}`);
      setSelectedApps(new Set());
      setBulkNotes('');
      await fetchData();
    }
    setBulkProcessing(false);
  };

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
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-lg">{t('admin.sellerApplications' as any)} ({applications.length})</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToCSV(
                applications.map(a => ({
                  store_name: a.store_name,
                  business_type: a.business_type || '',
                  phone: a.phone || '',
                  status: a.status,
                  description: a.store_description || '',
                  date: new Date(a.created_at).toLocaleDateString(),
                })),
                [
                  { key: 'store_name', label: 'Store Name' },
                  { key: 'business_type', label: 'Business Type' },
                  { key: 'phone', label: 'Phone' },
                  { key: 'status', label: 'Status' },
                  { key: 'description', label: 'Description' },
                  { key: 'date', label: 'Applied Date' },
                ],
                'seller-applications'
              )}
            >
              <Download className="h-4 w-4 mr-1" />
              CSV
            </Button>
          </div>
        </CardHeader>

        {/* Bulk Actions Bar */}
        {selectedPendingCount > 0 && (
          <div className="mx-4 mb-3 p-3 bg-accent/10 border border-accent/20 rounded-lg flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <span className="text-sm font-medium text-foreground">
              {selectedPendingCount} {t('admin.selected' as any) || 'selected'}
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <Textarea
                value={bulkNotes}
                onChange={(e) => setBulkNotes(e.target.value)}
                placeholder={t('admin.adminNotes' as any) || 'Admin notes (optional)'}
                className="h-8 min-h-[32px] text-xs w-48"
                maxLength={500}
              />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" className="text-xs gap-1 bg-green-600 hover:bg-green-700 text-white" disabled={bulkProcessing}>
                    {bulkProcessing ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                    {t('admin.approve' as any) || 'Approve'} ({selectedPendingCount})
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('admin.approveApplication' as any) || 'Approve Applications'}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {`Are you sure you want to approve ${selectedPendingCount} seller applications? Seller profiles will be created for each.`}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('admin.cancel' as any)}</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleBulkAction('bulk-approve')} className="bg-green-600 hover:bg-green-700 text-white">
                      {t('admin.approve' as any)}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="text-xs gap-1" disabled={bulkProcessing}>
                    {bulkProcessing ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
                    {t('admin.reject' as any) || 'Reject'} ({selectedPendingCount})
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('admin.rejectApplication' as any) || 'Reject Applications'}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {`Are you sure you want to reject ${selectedPendingCount} seller applications? This cannot be undone.`}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('admin.cancel' as any)}</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleBulkAction('bulk-reject')} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      {t('admin.reject' as any)}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => setSelectedApps(new Set())}>
                {t('admin.cancel' as any) || 'Cancel'}
              </Button>
            </div>
          </div>
        )}

        <CardContent>
          {applications.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">{t('admin.noApplications' as any)}</p>
          ) : (
            <>
              {/* Select All Pending */}
              {pendingApps.length > 0 && (
                <div className="flex items-center gap-2 mb-3 pb-3 border-b border-border">
                  <Checkbox
                    checked={selectedPendingCount === pendingApps.length && pendingApps.length > 0}
                    onCheckedChange={toggleSelectAllPending}
                    className="h-4 w-4"
                  />
                  <span className="text-xs text-muted-foreground">
                    {t('admin.selectAll' as any) || 'Select all'} pending ({pendingApps.length})
                  </span>
                </div>
              )}
              <div className="space-y-4">
                {applications.map((app) => {
                  const isPending = app.status === 'pending';
                  const isSelected = selectedApps.has(app.id);
                  return (
                    <div key={app.id} className={cn(
                      "flex flex-col sm:flex-row sm:items-start justify-between p-3 md:p-4 border rounded-lg gap-3 transition-colors",
                      isSelected && "border-accent/50 bg-accent/5"
                    )}>
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {isPending && (
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelect(app.id)}
                            className="h-4 w-4 mt-1 shrink-0"
                          />
                        )}
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
                      </div>
                      {isPending && (
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
                  );
                })}
              </div>
            </>
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
