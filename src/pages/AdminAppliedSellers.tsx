import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Loader2, CheckCircle, XCircle, Clock, Store, Eye, Phone, Building2, FileText, Calendar, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
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
  updated_at: string;
  fulfillment_type: string;
}

const AdminAppliedSellers = () => {
  const [applications, setApplications] = useState<SellerApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<SellerApplication | null>(null);
  const [actionDialog, setActionDialog] = useState<{ app: SellerApplication; action: 'approve' | 'reject' } | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const { data } = await supabase.functions.invoke('admin-manage-sellers', { body: { action: 'list' } });
    if (data?.applications) setApplications(data.applications);
    setIsLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAction = async () => {
    if (!actionDialog) return;
    setProcessing(true);
    const { error } = await supabase.functions.invoke('admin-manage-sellers', {
      body: { action: actionDialog.action, applicationId: actionDialog.app.id, adminNotes: adminNotes || null },
    });
    if (error) {
      toast.error(`Failed to ${actionDialog.action}`);
    } else {
      toast.success(actionDialog.action === 'approve' ? 'Seller approved successfully!' : 'Application rejected');
      setActionDialog(null);
      setAdminNotes('');
      setSelectedApp(null);
      await fetchData();
    }
    setProcessing(false);
  };

  const handleDelete = async (appId: string) => {
    setDeleting(appId);
    const { error } = await supabase.functions.invoke('admin-manage-sellers', {
      body: { action: 'delete-application', applicationId: appId },
    });
    if (error) {
      toast.error('Failed to delete application');
    } else {
      toast.success('Application deleted successfully');
      if (selectedApp?.id === appId) setSelectedApp(null);
      await fetchData();
    }
    setDeleting(null);
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected': return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default: return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  const DeleteButton = ({ app }: { app: SellerApplication }) => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1 text-destructive border-destructive/30 hover:bg-destructive/10" disabled={deleting === app.id}>
          {deleting === app.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Application</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to permanently delete the application from "{app.store_name}"? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => handleDelete(app.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  const pendingApps = applications.filter(a => a.status === 'pending');
  const otherApps = applications.filter(a => a.status !== 'pending');

  if (isLoading) return (
    <AdminLayout titleKey="admin.sellers.applied" descriptionKey="admin.sellers.appliedDesc">
      <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>
    </AdminLayout>
  );

  return (
    <AdminLayout titleKey="admin.sellers.applied" descriptionKey="admin.sellers.appliedDesc">
      <div className="space-y-6">
        {/* Pending Applications */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              Pending Applications ({pendingApps.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingApps.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No pending applications</p>
            ) : (
              <div className="space-y-3">
                {pendingApps.map(app => (
                  <div key={app.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-3 hover:bg-accent/5 transition-colors">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Store className="h-4 w-4 text-primary" />
                        <h3 className="font-semibold">{app.store_name}</h3>
                        {statusBadge(app.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                        {app.business_type && (
                          <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" />{app.business_type.replace('_', ' ')}</span>
                        )}
                        {app.phone && (
                          <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{app.phone}</span>
                        )}
                        <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{new Date(app.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0 flex-wrap">
                      <Button size="sm" variant="outline" className="gap-1" onClick={() => setSelectedApp(app)}>
                        <Eye className="h-3.5 w-3.5" /> View Details
                      </Button>
                      <Button size="sm" className="gap-1 bg-green-600 hover:bg-green-700 text-white" onClick={() => { setActionDialog({ app, action: 'approve' }); setAdminNotes(''); }}>
                        <CheckCircle className="h-3.5 w-3.5" /> Approve
                      </Button>
                      <Button size="sm" variant="destructive" className="gap-1" onClick={() => { setActionDialog({ app, action: 'reject' }); setAdminNotes(''); }}>
                        <XCircle className="h-3.5 w-3.5" /> Reject
                      </Button>
                      <DeleteButton app={app} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Processed Applications */}
        {otherApps.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Processed Applications ({otherApps.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {otherApps.map(app => (
                  <div key={app.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-3">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Store className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-medium">{app.store_name}</h3>
                        {statusBadge(app.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                        {app.business_type && <span className="capitalize">{app.business_type.replace('_', ' ')}</span>}
                        <span>{new Date(app.created_at).toLocaleDateString()}</span>
                        {app.admin_notes && <span className="italic">Note: {app.admin_notes}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" variant="ghost" onClick={() => setSelectedApp(app)}>
                        <Eye className="h-3.5 w-3.5 mr-1" /> View
                      </Button>
                      <DeleteButton app={app} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Detail View Dialog */}
      <Dialog open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" /> Seller Application Details
            </DialogTitle>
          </DialogHeader>
          {selectedApp && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Store Name</Label>
                  <p className="font-semibold">{selectedApp.store_name}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <div className="mt-0.5">{statusBadge(selectedApp.status)}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Business Type</Label>
                  <p className="capitalize">{selectedApp.business_type?.replace('_', ' ') || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Fulfillment</Label>
                  <p className="uppercase font-medium">{selectedApp.fulfillment_type}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Phone</Label>
                  <p>{selectedApp.phone || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Applied Date</Label>
                  <p>{new Date(selectedApp.created_at).toLocaleString()}</p>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-xs text-muted-foreground">Store Description</Label>
                <p className="text-sm mt-1 bg-muted/50 p-3 rounded-lg">
                  {selectedApp.store_description || 'No description provided'}
                </p>
              </div>

              {selectedApp.admin_notes && (
                <div>
                  <Label className="text-xs text-muted-foreground">Admin Notes</Label>
                  <p className="text-sm mt-1 bg-muted/50 p-3 rounded-lg italic">{selectedApp.admin_notes}</p>
                </div>
              )}

              <Separator />
              <div className="flex gap-2">
                {selectedApp.status === 'pending' && (
                  <>
                    <Button className="flex-1 gap-1 bg-green-600 hover:bg-green-700 text-white" onClick={() => { setActionDialog({ app: selectedApp, action: 'approve' }); setAdminNotes(''); }}>
                      <CheckCircle className="h-4 w-4" /> Approve Seller
                    </Button>
                    <Button variant="destructive" className="flex-1 gap-1" onClick={() => { setActionDialog({ app: selectedApp, action: 'reject' }); setAdminNotes(''); }}>
                      <XCircle className="h-4 w-4" /> Reject
                    </Button>
                  </>
                )}
                <DeleteButton app={selectedApp} />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve/Reject Confirmation Dialog */}
      <Dialog open={!!actionDialog} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog?.action === 'approve' ? 'Approve Seller Application' : 'Reject Seller Application'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {actionDialog?.action === 'approve'
                ? `Approve "${actionDialog?.app.store_name}" as a seller? A seller profile will be created and they will be able to list products.`
                : `Reject "${actionDialog?.app.store_name}"? This cannot be undone.`}
            </p>
            <div className="space-y-2">
              <Label>Admin Notes (optional)</Label>
              <Textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="Add a note..." maxLength={500} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>Cancel</Button>
            <Button onClick={handleAction} disabled={processing} variant={actionDialog?.action === 'approve' ? 'default' : 'destructive'}>
              {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {actionDialog?.action === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminAppliedSellers;
