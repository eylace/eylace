import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Search, Loader2, Plus, Trash2, UserCog, Users, Settings, Eye, Edit, ShoppingBag, Package, BarChart3, FileText, Megaphone, Lock } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface UserRole {
  id: string; user_id: string; role: AppRole; created_at: string; email?: string;
}

interface RolePermission {
  module: string;
  icon: React.ElementType;
  permissions: { key: string; label: string; description: string; }[];
}

const roleModules: RolePermission[] = [
  { module: 'Dashboard', icon: BarChart3, permissions: [
    { key: 'dashboard.view', label: 'View Dashboard', description: 'Access main dashboard with analytics' },
    { key: 'dashboard.reports', label: 'Export Reports', description: 'Download CSV/PDF reports' },
  ]},
  { module: 'Products', icon: ShoppingBag, permissions: [
    { key: 'products.view', label: 'View Products', description: 'See product listings' },
    { key: 'products.create', label: 'Create Products', description: 'Add new products' },
    { key: 'products.edit', label: 'Edit Products', description: 'Modify existing products' },
    { key: 'products.delete', label: 'Delete Products', description: 'Remove products' },
  ]},
  { module: 'Orders', icon: Package, permissions: [
    { key: 'orders.view', label: 'View Orders', description: 'See all orders' },
    { key: 'orders.update', label: 'Update Status', description: 'Change order status & tracking' },
    { key: 'orders.dispatch', label: 'Dispatch to Courier', description: 'Send orders to shipping providers' },
    { key: 'orders.cancel', label: 'Cancel Orders', description: 'Cancel/refund orders' },
  ]},
  { module: 'Customers', icon: Users, permissions: [
    { key: 'customers.view', label: 'View Customers', description: 'See customer list' },
    { key: 'customers.manage', label: 'Manage Customers', description: 'Edit customer details' },
  ]},
  { module: 'Sellers', icon: UserCog, permissions: [
    { key: 'sellers.view', label: 'View Sellers', description: 'See seller listings' },
    { key: 'sellers.approve', label: 'Approve Sellers', description: 'Approve/reject seller applications' },
    { key: 'sellers.manage', label: 'Manage Sellers', description: 'Edit seller profiles & payouts' },
  ]},
  { module: 'Marketing', icon: Megaphone, permissions: [
    { key: 'marketing.view', label: 'View Campaigns', description: 'See marketing campaigns' },
    { key: 'marketing.manage', label: 'Manage Campaigns', description: 'Create/edit campaigns, coupons, flash deals' },
  ]},
  { module: 'Content', icon: FileText, permissions: [
    { key: 'content.view', label: 'View Content', description: 'See pages, media, SEO' },
    { key: 'content.manage', label: 'Manage Content', description: 'Edit pages, upload media' },
  ]},
  { module: 'Settings', icon: Settings, permissions: [
    { key: 'settings.view', label: 'View Settings', description: 'See system configuration' },
    { key: 'settings.manage', label: 'Manage Settings', description: 'Change system settings' },
    { key: 'settings.roles', label: 'Manage Roles', description: 'Assign/remove user roles' },
  ]},
];

const defaultRolePermissions: Record<string, string[]> = {
  admin: roleModules.flatMap(m => m.permissions.map(p => p.key)),
  moderator: [
    'dashboard.view', 'products.view', 'products.edit', 'orders.view', 'orders.update',
    'customers.view', 'sellers.view', 'marketing.view', 'content.view',
  ],
  user: [],
};

const AdminUserRoles = () => {
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<AppRole>('user');
  const [adding, setAdding] = useState(false);
  const [activeTab, setActiveTab] = useState('users');
  const [permissionsMap, setPermissionsMap] = useState<Record<string, string[]>>(defaultRolePermissions);
  const [selectedRoleForPerms, setSelectedRoleForPerms] = useState<AppRole>('moderator');
  const [savingPerms, setSavingPerms] = useState(false);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('user_roles').select('*').order('created_at', { ascending: false });
    if (data && !error) {
      const userIds = [...new Set(data.map(r => r.user_id))];
      const { data: profiles } = await supabase.from('profiles').select('user_id, email').in('user_id', userIds);
      const emailMap: Record<string, string> = {};
      profiles?.forEach(p => { if (p.email) emailMap[p.user_id] = p.email; });
      setRoles(data.map(r => ({ ...r, email: emailMap[r.user_id] || 'N/A' })));
    }
    setLoading(false);
  }, []);

  const fetchPermissions = useCallback(async () => {
    const { data } = await supabase.from('system_settings').select('value').eq('key', 'role_permissions').single();
    if (data?.value && typeof data.value === 'object') {
      setPermissionsMap({ ...defaultRolePermissions, ...(data.value as Record<string, string[]>) });
    }
  }, []);

  useEffect(() => { fetchRoles(); fetchPermissions(); }, [fetchRoles, fetchPermissions]);

  const handleAddRole = async () => {
    if (!newEmail.trim()) return;
    setAdding(true);
    const { data: profile } = await supabase.from('profiles').select('user_id').eq('email', newEmail.trim()).single();
    if (!profile) { toast.error('User not found with this email'); setAdding(false); return; }
    const { data: existing } = await supabase.from('user_roles').select('id').eq('user_id', profile.user_id).eq('role', newRole).single();
    if (existing) { toast.error('User already has this role'); setAdding(false); return; }
    const { error } = await supabase.from('user_roles').insert({ user_id: profile.user_id, role: newRole });
    if (error) toast.error('Failed to add role');
    else { toast.success('Role assigned'); setNewEmail(''); setAddOpen(false); fetchRoles(); }
    setAdding(false);
  };

  const handleRemoveRole = async (roleId: string) => {
    const { error } = await supabase.from('user_roles').delete().eq('id', roleId);
    if (error) toast.error('Failed to remove role');
    else { toast.success('Role removed'); fetchRoles(); }
  };

  const togglePermission = (role: AppRole, permKey: string) => {
    setPermissionsMap(prev => {
      const current = prev[role] || [];
      const updated = current.includes(permKey) ? current.filter(k => k !== permKey) : [...current, permKey];
      return { ...prev, [role]: updated };
    });
  };

  const savePermissions = async () => {
    setSavingPerms(true);
    const { error } = await supabase.from('system_settings').upsert({
      key: 'role_permissions', value: permissionsMap as any, updated_at: new Date().toISOString(),
    }, { onConflict: 'key' });
    if (error) toast.error('Failed to save');
    else toast.success('Permissions saved');
    setSavingPerms(false);
  };

  const filtered = roles.filter(r =>
    (r.email || '').toLowerCase().includes(search.toLowerCase()) || r.role.toLowerCase().includes(search.toLowerCase())
  );

  const getRoleBadge = (role: AppRole) => {
    const styles: Record<string, string> = {
      admin: 'bg-red-500/10 text-red-600 border-red-500/20',
      moderator: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      user: 'bg-green-500/10 text-green-600 border-green-500/20',
    };
    return <Badge className={cn('text-xs', styles[role] || '')}>{role}</Badge>;
  };

  const roleStats = {
    admin: roles.filter(r => r.role === 'admin').length,
    moderator: roles.filter(r => r.role === 'moderator').length,
    user: roles.filter(r => r.role === 'user').length,
  };

  return (
    <AdminLayout titleKey="admin.title.userRoles" descriptionKey="admin.desc.userRoles">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Users', value: roles.length, icon: Users, color: 'text-primary' },
          { label: 'Admins', value: roleStats.admin, icon: Shield, color: 'text-red-500' },
          { label: 'Moderators', value: roleStats.moderator, icon: UserCog, color: 'text-blue-500' },
          { label: 'Users', value: roleStats.user, icon: Users, color: 'text-green-500' },
        ].map((s, i) => (
          <Card key={i} className="border border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', s.color === 'text-primary' ? 'bg-primary/10' : s.color === 'text-red-500' ? 'bg-red-500/10' : s.color === 'text-blue-500' ? 'bg-blue-500/10' : 'bg-green-500/10')}>
                <s.icon className={cn('h-5 w-5', s.color)} />
              </div>
              <div><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-2xl font-bold">{s.value}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="users" className="gap-2"><Users className="h-4 w-4" /> Users & Roles</TabsTrigger>
          <TabsTrigger value="permissions" className="gap-2"><Lock className="h-4 w-4" /> Permissions</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card className="border border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base"><Shield className="h-5 w-5" /> User Roles ({filtered.length})</CardTitle>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-56" />
                </div>
                <Dialog open={addOpen} onOpenChange={setAddOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Role</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle className="flex items-center gap-2"><UserCog className="h-5 w-5" /> Assign Role</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2"><Label>User Email</Label><Input placeholder="user@example.com" value={newEmail} onChange={e => setNewEmail(e.target.value)} /></div>
                      <div className="space-y-2">
                        <Label>Role</Label>
                        <Select value={newRole} onValueChange={v => setNewRole(v as AppRole)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">🔴 Admin — Full access</SelectItem>
                            <SelectItem value="moderator">🔵 Moderator — Limited access</SelectItem>
                            <SelectItem value="user">🟢 User — Basic access</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {/* Show what this role can do */}
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-xs font-semibold mb-2">This role can access:</p>
                        <div className="flex flex-wrap gap-1">
                          {(permissionsMap[newRole] || []).slice(0, 8).map(p => (
                            <Badge key={p} variant="outline" className="text-[10px]">{p.replace('.', ': ')}</Badge>
                          ))}
                          {(permissionsMap[newRole] || []).length > 8 && <Badge variant="outline" className="text-[10px]">+{(permissionsMap[newRole] || []).length - 8} more</Badge>}
                          {(permissionsMap[newRole] || []).length === 0 && <span className="text-[10px] text-muted-foreground">No special permissions</span>}
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                      <Button onClick={handleAddRole} disabled={adding}>{adding && <Loader2 className="h-4 w-4 animate-spin mr-1" />} Assign</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>
              ) : (
                <Table>
                  <TableHeader><TableRow><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Permissions</TableHead><TableHead>Assigned</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {filtered.map(role => (
                      <TableRow key={role.id}>
                        <TableCell className="font-medium">{role.email}</TableCell>
                        <TableCell>{getRoleBadge(role.role)}</TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground">{(permissionsMap[role.role] || []).length} permissions</span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{new Date(role.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleRemoveRole(role.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filtered.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No roles found</TableCell></TableRow>}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions">
          <Card className="border border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2"><Lock className="h-5 w-5" /> Role Permissions</CardTitle>
                <CardDescription>Configure what each role can access</CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <Select value={selectedRoleForPerms} onValueChange={v => setSelectedRoleForPerms(v as AppRole)}>
                  <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">🔴 Admin</SelectItem>
                    <SelectItem value="moderator">🔵 Moderator</SelectItem>
                    <SelectItem value="user">🟢 User</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={savePermissions} disabled={savingPerms} size="sm">
                  {savingPerms ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null} Save
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {roleModules.map(mod => {
                  const ModIcon = mod.icon;
                  const activeCount = mod.permissions.filter(p => (permissionsMap[selectedRoleForPerms] || []).includes(p.key)).length;
                  return (
                    <div key={mod.module} className="border rounded-lg overflow-hidden">
                      <div className="p-3 bg-muted/30 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ModIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold text-sm">{mod.module}</span>
                          <Badge variant="outline" className="text-[10px]">{activeCount}/{mod.permissions.length}</Badge>
                        </div>
                        <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => {
                          const allKeys = mod.permissions.map(p => p.key);
                          const current = permissionsMap[selectedRoleForPerms] || [];
                          const allActive = allKeys.every(k => current.includes(k));
                          setPermissionsMap(prev => ({
                            ...prev,
                            [selectedRoleForPerms]: allActive
                              ? current.filter(k => !allKeys.includes(k))
                              : [...new Set([...current, ...allKeys])],
                          }));
                        }}>
                          {mod.permissions.every(p => (permissionsMap[selectedRoleForPerms] || []).includes(p.key)) ? 'Deselect All' : 'Select All'}
                        </Button>
                      </div>
                      <div className="divide-y">
                        {mod.permissions.map(perm => {
                          const active = (permissionsMap[selectedRoleForPerms] || []).includes(perm.key);
                          return (
                            <div key={perm.key} className="p-3 flex items-center justify-between hover:bg-muted/20 transition-colors">
                              <div>
                                <p className="text-sm font-medium">{perm.label}</p>
                                <p className="text-xs text-muted-foreground">{perm.description}</p>
                              </div>
                              <Switch checked={active} onCheckedChange={() => togglePermission(selectedRoleForPerms, perm.key)} />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
};

export default AdminUserRoles;
