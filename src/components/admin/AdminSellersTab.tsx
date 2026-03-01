import { useState, useEffect, useCallback } from 'react';
import { Loader2, CheckCircle, XCircle, Clock, Store, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SellerApplication {
  id: string;
  user_id: string;
  store_name: string;
  store_description: string | null;
  phone: string | null;
  business_type: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

export const AdminSellersTab = () => {
  const [applications, setApplications] = useState<SellerApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const [togglingRegistration, setTogglingRegistration] = useState(false);
  const [actionDialog, setActionDialog] = useState<{ app: SellerApplication; action: 'approve' | 'reject' } | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);

    // Fetch applications via edge function (admin access)
    const { data: appsData } = await supabase.functions.invoke('admin-manage-sellers', {
      body: { action: 'list' },
    });

    if (appsData?.applications) {
      setApplications(appsData.applications);
    }

    // Fetch registration toggle
    const { data: settings } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'seller_registration_enabled')
      .single();

    setRegistrationEnabled((settings?.value as any)?.enabled ?? true);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleRegistration = async () => {
    setTogglingRegistration(true);
    const newValue = !registrationEnabled;

    const { error } = await supabase
      .from('system_settings')
      .update({ value: { enabled: newValue }, updated_at: new Date().toISOString() })
      .eq('key', 'seller_registration_enabled');

    if (error) {
      toast.error('Failed to update setting');
    } else {
      setRegistrationEnabled(newValue);
      toast.success(`Seller registration ${newValue ? 'enabled' : 'disabled'}`);
    }
    setTogglingRegistration(false);
  };

  const handleAction = async () => {
    if (!actionDialog) return;
    setProcessing(true);

    const { error } = await supabase.functions.invoke('admin-manage-sellers', {
      body: {
        action: actionDialog.action,
        applicationId: actionDialog.app.id,
        adminNotes: adminNotes || null,
      },
    });

    if (error) {
      toast.error(`Failed to ${actionDialog.action} application`);
    } else {
      toast.success(`Application ${actionDialog.action}d successfully`);
      setActionDialog(null);
      setAdminNotes('');
      await fetchData();
    }
    setProcessing(false);
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Registration Toggle */}
      <Card>
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <Store className="h-5 w-5 text-muted-foreground" />
            <div>
              <Label className="text-base font-medium">Seller Registration</Label>
              <p className="text-sm text-muted-foreground">
                {registrationEnabled ? 'New sellers can apply' : 'Registration is closed'}
              </p>
            </div>
          </div>
          <Switch
            checked={registrationEnabled}
            onCheckedChange={toggleRegistration}
            disabled={togglingRegistration}
          />
        </CardContent>
      </Card>

      {/* Applications List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Seller Applications ({applications.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No applications yet</p>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => (
                <div key={app.id} className="flex items-start justify-between p-4 border border-border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{app.store_name}</h3>
                      {statusBadge(app.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {app.business_type && <span className="capitalize">{app.business_type.replace('_', ' ')}</span>}
                      {app.phone && <span> • {app.phone}</span>}
                    </p>
                    {app.store_description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{app.store_description}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Applied {new Date(app.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  {app.status === 'pending' && (
                    <div className="flex gap-2 ml-4 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 border-green-500/30 hover:bg-green-500/10"
                        onClick={() => { setActionDialog({ app, action: 'approve' }); setAdminNotes(''); }}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive border-destructive/30 hover:bg-destructive/10"
                        onClick={() => { setActionDialog({ app, action: 'reject' }); setAdminNotes(''); }}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={!!actionDialog} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog?.action === 'approve' ? 'Approve' : 'Reject'} Application
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {actionDialog?.action === 'approve'
                ? `Approve "${actionDialog?.app.store_name}" as a seller? A seller profile will be created automatically.`
                : `Reject "${actionDialog?.app.store_name}"?`}
            </p>
            <div className="space-y-2">
              <Label>Admin Notes (optional)</Label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add a note for the applicant..."
                maxLength={500}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>Cancel</Button>
            <Button
              onClick={handleAction}
              disabled={processing}
              variant={actionDialog?.action === 'approve' ? 'default' : 'destructive'}
            >
              {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {actionDialog?.action === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
