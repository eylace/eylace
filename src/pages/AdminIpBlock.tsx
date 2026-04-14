import { useState, useEffect, useCallback } from 'react';
import { Shield, Plus, Trash2, Search, Ban, Loader2 } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface BlockedIp {
  id: string;
  ip_address: string;
  reason: string | null;
  blocked_by: string | null;
  created_at: string;
}

const AdminIpBlock = () => {
  const [blockedIps, setBlockedIps] = useState<BlockedIp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newIp, setNewIp] = useState('');
  const [newReason, setNewReason] = useState('');
  const [adding, setAdding] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchBlockedIps = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await (supabase as any)
      .from('blocked_ips')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setBlockedIps(data);
    setIsLoading(false);
  }, []);

  useEffect(() => { fetchBlockedIps(); }, [fetchBlockedIps]);

  const filteredIps = blockedIps.filter(ip =>
    ip.ip_address.includes(searchQuery) ||
    (ip.reason || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAdd = async () => {
    if (!newIp.trim()) { toast.error('IP address is required'); return; }
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(newIp.trim())) { toast.error('Please enter a valid IPv4 address'); return; }
    
    setAdding(true);
    const { error } = await (supabase as any)
      .from('blocked_ips')
      .insert({ ip_address: newIp.trim(), reason: newReason.trim() || null });
    
    if (error) {
      if (error.message?.includes('duplicate') || error.code === '23505') {
        toast.error('This IP is already blocked');
      } else {
        toast.error('Failed to block IP');
      }
    } else {
      toast.success(`IP ${newIp.trim()} blocked successfully`);
      setNewIp('');
      setNewReason('');
      setShowAddDialog(false);
      await fetchBlockedIps();
    }
    setAdding(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const { error } = await (supabase as any)
      .from('blocked_ips')
      .delete()
      .eq('id', deleteId);
    
    if (error) {
      toast.error('Failed to unblock IP');
    } else {
      toast.success('IP unblocked successfully');
      setBlockedIps(prev => prev.filter(ip => ip.id !== deleteId));
    }
    setDeleteId(null);
    setDeleting(false);
  };

  const handleBlockIpFromOrder = async (ipAddress: string) => {
    setNewIp(ipAddress);
    setNewReason('');
    setShowAddDialog(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6 text-destructive" />
              IP Block Management
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Block suspicious IP addresses from placing orders
            </p>
          </div>
          <Button onClick={() => { setNewIp(''); setNewReason(''); setShowAddDialog(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Block New IP
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <Ban className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{blockedIps.length}</p>
                <p className="text-xs text-muted-foreground">Total Blocked IPs</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {blockedIps.filter(ip => {
                    const d = new Date(ip.created_at);
                    const now = new Date();
                    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                  }).length}
                </p>
                <p className="text-xs text-muted-foreground">Blocked This Month</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">Active</p>
                <p className="text-xs text-muted-foreground">Protection Status</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by IP or reason..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Table */}
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs">IP Address</TableHead>
                  <TableHead className="text-xs">Reason</TableHead>
                  <TableHead className="text-xs">Blocked Date</TableHead>
                  <TableHead className="text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : filteredIps.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                      {searchQuery ? 'No blocked IPs match your search' : 'No blocked IPs yet'}
                    </TableCell>
                  </TableRow>
                ) : filteredIps.map(ip => (
                  <TableRow key={ip.id}>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {ip.ip_address}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {ip.reason || '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(ip.created_at), 'MMM d, yyyy hh:mm a')}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(ip.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ban className="h-5 w-5 text-destructive" />
              Block IP Address
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>IP Address</Label>
              <Input
                placeholder="e.g. 192.168.1.100"
                value={newIp}
                onChange={e => setNewIp(e.target.value)}
                className="font-mono"
              />
            </div>
            <div>
              <Label>Reason (optional)</Label>
              <Textarea
                placeholder="e.g. Repeated fake orders, suspicious activity..."
                value={newReason}
                onChange={e => setNewReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={adding} variant="destructive">
              {adding && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Block IP
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unblock this IP?</AlertDialogTitle>
            <AlertDialogDescription>
              This IP address will be able to place orders again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Unblock
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminIpBlock;
