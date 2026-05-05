import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Loader2, Plus, Trash2, History, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Mapping {
  id?: string;
  provider: string;
  courier_status: string;
  internal_status: string;
  timeline_description: string | null;
  is_terminal: boolean;
}

interface AuditRow {
  id: string;
  mapping_id: string | null;
  action: string;
  before_data: any;
  after_data: any;
  changed_by_email: string | null;
  created_at: string;
}

const PROVIDERS = ['pathao', 'steadfast', 'shiprocket', 'redx', 'carrybee'];
const INTERNAL_STATUSES = [
  'pending', 'confirmed', 'processing', 'sent_to_courier',
  'shipped', 'out_for_delivery', 'delivered', 'returned', 'cancelled', 'failed',
];

const AdminCourierStatusMapping = () => {
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('mappings');

  const load = async () => {
    setLoading(true);
    const [{ data: m }, { data: a }] = await Promise.all([
      supabase.from('courier_status_mapping').select('*').order('provider').order('courier_status'),
      supabase.from('courier_status_mapping_audit').select('*').order('created_at', { ascending: false }).limit(100),
    ]);
    setMappings((m as any) || []);
    setAudit((a as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateRow = (idx: number, key: keyof Mapping, value: any) => {
    setMappings(prev => prev.map((r, i) => i === idx ? { ...r, [key]: value } : r));
  };

  const addRow = () => {
    setMappings(prev => [...prev, { provider: 'pathao', courier_status: '', internal_status: 'pending', timeline_description: '', is_terminal: false }]);
  };

  const removeRow = async (row: Mapping, idx: number) => {
    if (row.id) {
      const { error } = await supabase.from('courier_status_mapping').delete().eq('id', row.id);
      if (error) { toast.error(error.message); return; }
    }
    setMappings(prev => prev.filter((_, i) => i !== idx));
    toast.success('Mapping removed');
    load();
  };

  const saveAll = async () => {
    setSaving(true);
    let okCount = 0, errCount = 0;
    for (const row of mappings) {
      if (!row.courier_status?.trim() || !row.internal_status?.trim()) continue;
      const payload = {
        provider: row.provider.trim().toLowerCase(),
        courier_status: row.courier_status.trim(),
        internal_status: row.internal_status.trim(),
        timeline_description: row.timeline_description || null,
        is_terminal: !!row.is_terminal,
      };
      const { error } = row.id
        ? await supabase.from('courier_status_mapping').update(payload).eq('id', row.id)
        : await supabase.from('courier_status_mapping').insert(payload);
      if (error) { errCount++; console.error(error); } else okCount++;
    }
    setSaving(false);
    if (errCount === 0) toast.success(`Saved ${okCount} mapping(s)`);
    else toast.error(`${errCount} failed, ${okCount} saved`);
    load();
  };

  return (
    <AdminLayout title="Courier Status Mapping" description="Map external courier statuses to internal order lifecycle states. All changes are audited.">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="mappings">Mappings</TabsTrigger>
          <TabsTrigger value="audit"><History className="h-4 w-4 mr-1" /> Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="mappings">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Status Mappings</CardTitle>
                <CardDescription>Edit live — webhook events use these rules to update order timelines.</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={addRow}><Plus className="h-4 w-4 mr-1" /> Add</Button>
                <Button size="sm" onClick={saveAll} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />} Save All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Provider</TableHead>
                      <TableHead>Courier Status</TableHead>
                      <TableHead>Internal Status</TableHead>
                      <TableHead>Timeline Description</TableHead>
                      <TableHead>Terminal</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mappings.map((row, idx) => (
                      <TableRow key={row.id || `new-${idx}`}>
                        <TableCell>
                          <Select value={row.provider} onValueChange={(v) => updateRow(idx, 'provider', v)}>
                            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                            <SelectContent>{PROVIDERS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell><Input value={row.courier_status} onChange={(e) => updateRow(idx, 'courier_status', e.target.value)} placeholder="e.g. delivered" /></TableCell>
                        <TableCell>
                          <Select value={row.internal_status} onValueChange={(v) => updateRow(idx, 'internal_status', v)}>
                            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                            <SelectContent>{INTERNAL_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell><Input value={row.timeline_description ?? ''} onChange={(e) => updateRow(idx, 'timeline_description', e.target.value)} placeholder="Shown on order timeline" /></TableCell>
                        <TableCell><Switch checked={!!row.is_terminal} onCheckedChange={(v) => updateRow(idx, 'is_terminal', v)} /></TableCell>
                        <TableCell><Button variant="ghost" size="icon" onClick={() => removeRow(row, idx)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                      </TableRow>
                    ))}
                    {mappings.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No mappings yet — click Add.</TableCell></TableRow>}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>Audit Log</CardTitle>
              <CardDescription>Last 100 changes — who edited what and when.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Changed by</TableHead>
                    <TableHead>Before</TableHead>
                    <TableHead>After</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {audit.map(a => (
                    <TableRow key={a.id}>
                      <TableCell className="whitespace-nowrap text-xs">{new Date(a.created_at).toLocaleString()}</TableCell>
                      <TableCell><Badge variant="outline">{a.action}</Badge></TableCell>
                      <TableCell className="text-xs">{a.changed_by_email || '—'}</TableCell>
                      <TableCell><pre className="text-[10px] max-w-[18rem] overflow-x-auto">{a.before_data ? JSON.stringify(a.before_data, null, 1) : '—'}</pre></TableCell>
                      <TableCell><pre className="text-[10px] max-w-[18rem] overflow-x-auto">{a.after_data ? JSON.stringify(a.after_data, null, 1) : '—'}</pre></TableCell>
                    </TableRow>
                  ))}
                  {audit.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No changes yet.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
};

export default AdminCourierStatusMapping;