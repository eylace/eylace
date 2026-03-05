import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import {
  Truck,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Globe,
  Clock,
} from 'lucide-react';

interface Courier {
  id: string;
  name: string;
  code: string;
  logo: string | null;
  tracking_url_template: string | null;
  is_active: boolean;
  delivery_zones: any;
  estimated_days_min: number;
  estimated_days_max: number;
  base_cost: number;
}

const emptyCourier = {
  name: '', code: '', logo: '', tracking_url_template: '',
  is_active: true, delivery_zones: '[]',
  estimated_days_min: '1', estimated_days_max: '7', base_cost: '0',
};

const AdminCouriers = () => {
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editCourier, setEditCourier] = useState<Courier | null>(null);
  const [form, setForm] = useState(emptyCourier);
  const [saving, setSaving] = useState(false);

  const fetchCouriers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('couriers')
      .select('*')
      .order('name');
    if (!error && data) setCouriers(data as any);
    setLoading(false);
  };

  useEffect(() => { fetchCouriers(); }, []);

  const openNew = () => {
    setEditCourier(null);
    setForm(emptyCourier);
    setFormOpen(true);
  };

  const openEdit = (c: Courier) => {
    setEditCourier(c);
    setForm({
      name: c.name,
      code: c.code,
      logo: c.logo || '',
      tracking_url_template: c.tracking_url_template || '',
      is_active: c.is_active,
      delivery_zones: JSON.stringify(c.delivery_zones || []),
      estimated_days_min: String(c.estimated_days_min),
      estimated_days_max: String(c.estimated_days_max),
      base_cost: String(c.base_cost),
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.code) {
      toast.error('Name and code are required');
      return;
    }
    setSaving(true);

    let zones;
    try { zones = JSON.parse(form.delivery_zones); } catch { zones = []; }

    const payload = {
      name: form.name,
      code: form.code,
      logo: form.logo || null,
      tracking_url_template: form.tracking_url_template || null,
      is_active: form.is_active,
      delivery_zones: zones,
      estimated_days_min: parseInt(form.estimated_days_min) || 1,
      estimated_days_max: parseInt(form.estimated_days_max) || 7,
      base_cost: parseFloat(form.base_cost) || 0,
    };

    let error;
    if (editCourier) {
      ({ error } = await supabase.from('couriers').update(payload).eq('id', editCourier.id));
    } else {
      ({ error } = await supabase.from('couriers').insert(payload));
    }

    if (error) {
      toast.error('Failed to save: ' + error.message);
    } else {
      toast.success(editCourier ? 'Courier updated!' : 'Courier added!');
      setFormOpen(false);
      fetchCouriers();
    }
    setSaving(false);
  };

  const deleteCourier = async (id: string) => {
    const { error } = await supabase.from('couriers').delete().eq('id', id);
    if (!error) {
      toast.success('Courier deleted');
      fetchCouriers();
    } else {
      toast.error('Delete failed');
    }
  };

  return (
    <AdminLayout title="Courier Management" description="Manage shipping carriers, tracking and delivery zones">
      <Card className="border border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Truck className="h-5 w-5" />
            Shipping Carriers ({couriers.length})
          </CardTitle>
          <Button onClick={openNew} size="sm" className="gap-1">
            <Plus className="h-4 w-4" /> Add Courier
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Carrier</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Delivery Time</TableHead>
                  <TableHead>Base Cost</TableHead>
                  <TableHead>Tracking</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {couriers.map(c => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {c.logo ? (
                          <img src={c.logo} alt={c.name} className="h-8 w-8 rounded object-contain" />
                        ) : (
                          <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                            <Truck className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <span className="font-medium text-sm">{c.name}</span>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{c.code}</Badge></TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {c.estimated_days_min}-{c.estimated_days_max} days
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-medium">${c.base_cost}</TableCell>
                    <TableCell>
                      {c.tracking_url_template ? (
                        <Badge variant="secondary" className="text-xs gap-1">
                          <Globe className="h-3 w-3" /> Enabled
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={c.is_active ? 'bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]' : 'bg-muted text-muted-foreground'}>
                        {c.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Courier</AlertDialogTitle>
                              <AlertDialogDescription>Delete "{c.name}"? This cannot be undone.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteCourier(c.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {couriers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No couriers configured yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Courier Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editCourier ? 'Edit Courier' : 'Add New Courier'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="FedEx" />
              </div>
              <div>
                <Label>Code *</Label>
                <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="fedex" />
              </div>
            </div>
            <div>
              <Label>Logo URL</Label>
              <Input value={form.logo} onChange={e => setForm(f => ({ ...f, logo: e.target.value }))} placeholder="https://..." />
            </div>
            <div>
              <Label>Tracking URL Template</Label>
              <Input
                value={form.tracking_url_template}
                onChange={e => setForm(f => ({ ...f, tracking_url_template: e.target.value }))}
                placeholder="https://tracking.example.com/?id={tracking_number}"
              />
              <p className="text-xs text-muted-foreground mt-1">Use {'{tracking_number}'} as placeholder</p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Min Days</Label>
                <Input type="number" value={form.estimated_days_min} onChange={e => setForm(f => ({ ...f, estimated_days_min: e.target.value }))} />
              </div>
              <div>
                <Label>Max Days</Label>
                <Input type="number" value={form.estimated_days_max} onChange={e => setForm(f => ({ ...f, estimated_days_max: e.target.value }))} />
              </div>
              <div>
                <Label>Base Cost ($)</Label>
                <Input type="number" value={form.base_cost} onChange={e => setForm(f => ({ ...f, base_cost: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Delivery Zones (JSON)</Label>
              <Input value={form.delivery_zones} onChange={e => setForm(f => ({ ...f, delivery_zones: e.target.value }))} placeholder='["Dhaka", "Chittagong"]' />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editCourier ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminCouriers;
