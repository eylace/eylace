import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Search, Loader2, Plus, Trash2, UserCog, Users, Settings, ShoppingBag, Package, BarChart3, FileText, Megaphone, Lock, Truck, DollarSign, Star, Headphones, Store, ChevronDown, ChevronRight, Crown, Calculator } from 'lucide-react';
import { ACCOUNTING_PERMISSIONS } from '@/lib/accountingPermissions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface UserRole {
  id: string; user_id: string; role: AppRole; created_at: string; email?: string;
}

// Role hierarchy definition
interface RoleGroup {
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  roles: { value: AppRole; label: string; emoji: string; description: string }[];
}

const roleHierarchy: RoleGroup[] = [
  {
    label: 'Super Admin',
    icon: Crown,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-500/10',
    roles: [
      { value: 'super_admin', label: 'Super Admin', emoji: '👑', description: 'সব কিছুর উপর সম্পূর্ণ কন্ট্রোল' },
    ],
  },
  {
    label: 'Admin Team',
    icon: Shield,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    roles: [
      { value: 'admin', label: 'Admin', emoji: '🔴', description: 'সকল এডমিন ফিচারে অ্যাক্সেস' },
      { value: 'product_manager', label: 'Product Manager', emoji: '📦', description: 'প্রোডাক্ট ম্যানেজমেন্ট' },
      { value: 'order_manager', label: 'Order Manager', emoji: '📋', description: 'অর্ডার ফুলফিলমেন্ট' },
      { value: 'vendor_manager', label: 'Vendor Manager', emoji: '🏪', description: 'সেলার/ভেন্ডর তত্ত্বাবধান' },
      { value: 'customer_manager', label: 'Customer Manager', emoji: '👥', description: 'কাস্টমার সার্ভিস' },
      { value: 'content_manager', label: 'Content Manager', emoji: '📝', description: 'পেইজ, মিডিয়া, SEO' },
      { value: 'marketing_manager', label: 'Marketing Manager', emoji: '📢', description: 'ক্যাম্পেইন ও প্রমোশন' },
      { value: 'finance_manager', label: 'Finance Manager', emoji: '💰', description: 'পেআউট ও ট্রানজেকশন' },
      { value: 'support_manager', label: 'Support Manager', emoji: '🎧', description: 'সাপোর্ট টিকেট ম্যানেজমেন্ট' },
      { value: 'moderator', label: 'Moderator', emoji: '🔵', description: 'রিভিউ ও কন্টেন্ট মডারেশন' },
    ],
  },
  {
    label: 'Vendor / Seller',
    icon: Store,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    roles: [
      { value: 'vendor_admin', label: 'Vendor Admin', emoji: '🟣', description: 'ভেন্ডর প্যানেলে ফুল অ্যাক্সেস' },
      { value: 'vendor_product_manager', label: 'Vendor Product Mgr', emoji: '📦', description: 'ভেন্ডর প্রোডাক্ট ম্যানেজমেন্ট' },
      { value: 'vendor_inventory_manager', label: 'Inventory Manager', emoji: '📊', description: 'স্টক ও ইনভেন্টরি' },
      { value: 'vendor_order_manager', label: 'Vendor Order Mgr', emoji: '📋', description: 'ভেন্ডর অর্ডার ম্যানেজমেন্ট' },
      { value: 'vendor_staff', label: 'Vendor Staff', emoji: '👤', description: 'ভেন্ডর বেসিক স্টাফ' },
    ],
  },
  {
    label: 'Customer',
    icon: Users,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    roles: [
      { value: 'registered_customer', label: 'Registered Customer', emoji: '🟢', description: 'রেজিস্টার্ড কাস্টমার' },
      { value: 'premium_customer', label: 'Premium Customer', emoji: '⭐', description: 'প্রিমিয়াম সুবিধা প্রাপ্ত' },
      { value: 'guest_user', label: 'Guest User', emoji: '👻', description: 'অতিথি ইউজার' },
      { value: 'user', label: 'User', emoji: '🟢', description: 'বেসিক ইউজার রোল' },
    ],
  },
  {
    label: 'Delivery System',
    icon: Truck,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    roles: [
      { value: 'delivery_partner', label: 'Delivery Partner', emoji: '🚚', description: 'ডেলিভারি কোম্পানি' },
      { value: 'delivery_agent', label: 'Delivery Agent', emoji: '🏍️', description: 'ডেলিভারি এজেন্ট / রাইডার' },
      { value: 'warehouse_manager', label: 'Warehouse Manager', emoji: '🏭', description: 'ওয়্যারহাউস পরিচালনা' },
    ],
  },
  {
    label: 'Marketing & Growth',
    icon: Megaphone,
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10',
    roles: [
      { value: 'affiliate_marketer', label: 'Affiliate Marketer', emoji: '🔗', description: 'এফিলিয়েট কমিশন প্রোগ্রাম' },
      { value: 'influencer', label: 'Influencer', emoji: '🌟', description: 'ইনফ্লুয়েন্সার পার্টনারশিপ' },
      { value: 'campaign_manager', label: 'Campaign Manager', emoji: '📣', description: 'ক্যাম্পেইন পরিচালনা' },
    ],
  },
];

const allRoles = roleHierarchy.flatMap(g => g.roles);

const roleModules = [
  { module: 'Dashboard', icon: BarChart3, permissions: [
    { key: 'dashboard.view', label: 'View Dashboard', description: 'Access main dashboard analytics' },
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
    { key: 'orders.update', label: 'Update Status', description: 'Change order status' },
    { key: 'orders.dispatch', label: 'Dispatch to Courier', description: 'Send orders to shipping' },
    { key: 'orders.cancel', label: 'Cancel Orders', description: 'Cancel/refund orders' },
  ]},
  { module: 'Customers', icon: Users, permissions: [
    { key: 'customers.view', label: 'View Customers', description: 'See customer list' },
    { key: 'customers.manage', label: 'Manage Customers', description: 'Edit customer details' },
  ]},
  { module: 'Sellers', icon: UserCog, permissions: [
    { key: 'sellers.view', label: 'View Sellers', description: 'See seller listings' },
    { key: 'sellers.approve', label: 'Approve Sellers', description: 'Approve/reject applications' },
    { key: 'sellers.manage', label: 'Manage Sellers', description: 'Edit profiles & payouts' },
  ]},
  { module: 'Marketing', icon: Megaphone, permissions: [
    { key: 'marketing.view', label: 'View Campaigns', description: 'See marketing campaigns' },
    { key: 'marketing.manage', label: 'Manage Campaigns', description: 'Create/edit campaigns' },
  ]},
  { module: 'Content', icon: FileText, permissions: [
    { key: 'content.view', label: 'View Content', description: 'See pages, media, SEO' },
    { key: 'content.manage', label: 'Manage Content', description: 'Edit pages, upload media' },
  ]},
  { module: 'Finance', icon: DollarSign, permissions: [
    { key: 'finance.view', label: 'View Finance', description: 'See transactions' },
    { key: 'finance.manage', label: 'Manage Finance', description: 'Process payouts' },
  ]},
  { module: 'Accounting', icon: Calculator, permissions: ACCOUNTING_PERMISSIONS.map(p => ({ key: p.key, label: p.label, description: p.description })) },
  { module: 'Delivery', icon: Truck, permissions: [
    { key: 'delivery.view', label: 'View Deliveries', description: 'See shipments' },
    { key: 'delivery.manage', label: 'Manage Deliveries', description: 'Update tracking' },
    { key: 'delivery.warehouse', label: 'Warehouse Mgmt', description: 'Manage warehouse' },
  ]},
  { module: 'Settings', icon: Settings, permissions: [
    { key: 'settings.view', label: 'View Settings', description: 'See configuration' },
    { key: 'settings.manage', label: 'Manage Settings', description: 'Change settings' },
    { key: 'settings.roles', label: 'Manage Roles', description: 'Assign/remove roles' },
  ]},
];

const defaultRolePermissions: Record<string, string[]> = {
  super_admin: roleModules.flatMap(m => m.permissions.map(p => p.key)),
  admin: roleModules.flatMap(m => m.permissions.map(p => p.key)),
  moderator: ['dashboard.view', 'products.view', 'products.edit', 'orders.view', 'orders.update', 'customers.view', 'sellers.view', 'marketing.view', 'content.view'],
  product_manager: ['dashboard.view', 'products.view', 'products.create', 'products.edit', 'products.delete'],
  order_manager: ['dashboard.view', 'orders.view', 'orders.update', 'orders.dispatch', 'orders.cancel'],
  vendor_manager: ['dashboard.view', 'sellers.view', 'sellers.approve', 'sellers.manage'],
  customer_manager: ['dashboard.view', 'customers.view', 'customers.manage'],
  content_manager: ['dashboard.view', 'content.view', 'content.manage'],
  marketing_manager: ['dashboard.view', 'marketing.view', 'marketing.manage'],
  finance_manager: [
    'dashboard.view', 'finance.view', 'finance.manage',
    'accounting.overview', 'accounting.accounts.view',
    'accounting.transactions.view', 'accounting.transactions.manage',
    'accounting.invoices.view', 'accounting.invoices.manage',
    'accounting.bills.view', 'accounting.bills.manage',
    'accounting.reports.view', 'accounting.reports.export',
  ],
  support_manager: ['dashboard.view', 'orders.view', 'customers.view', 'customers.manage'],
  user: [],
};

const AdminUserRoles = () => {
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<AppRole>('user');
  const [adding, setAdding] = useState(false);
  const [activeTab, setActiveTab] = useState('users');
  const [permissionsMap, setPermissionsMap] = useState<Record<string, string[]>>(defaultRolePermissions);
  const [selectedRoleForPerms, setSelectedRoleForPerms] = useState<AppRole>('moderator');
  const [savingPerms, setSavingPerms] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({ 'Admin Team': true });
  const [userOverrides, setUserOverrides] = useState<Record<string, string[]>>({});
  const [savingOverrides, setSavingOverrides] = useState(false);
  const [overrideUserId, setOverrideUserId] = useState<string>('');

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

  const fetchUserOverrides = useCallback(async () => {
    const { data } = await supabase.from('system_settings').select('value').eq('key', 'user_permission_overrides').maybeSingle();
    if (data?.value && typeof data.value === 'object') {
      setUserOverrides(data.value as Record<string, string[]>);
    }
  }, []);

  useEffect(() => { fetchRoles(); fetchPermissions(); fetchUserOverrides(); }, [fetchRoles, fetchPermissions, fetchUserOverrides]);

  const toggleUserPermission = (userId: string, permKey: string) => {
    setUserOverrides(prev => {
      const current = prev[userId] || [];
      const updated = current.includes(permKey) ? current.filter(k => k !== permKey) : [...current, permKey];
      const next = { ...prev, [userId]: updated };
      if (updated.length === 0) delete next[userId];
      return next;
    });
  };

  const saveUserOverrides = async () => {
    setSavingOverrides(true);
    const { error } = await supabase.from('system_settings').upsert({
      key: 'user_permission_overrides', value: userOverrides as any, updated_at: new Date().toISOString(),
    }, { onConflict: 'key' });
    if (error) toast.error('Failed to save'); else toast.success('User permissions saved');
    setSavingOverrides(false);
  };

  const handleAddRole = async () => {
    if (!newEmail.trim()) return;
    if (!newPassword.trim() || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setAdding(true);
    try {
      // Step 1: Create user or update password via edge function
      const { data: pwResult, error: pwError } = await supabase.functions.invoke('admin-set-password', {
        body: { email: newEmail.trim(), password: newPassword }
      });
      if (pwError || !pwResult?.success) {
        toast.error(pwResult?.error || 'Failed to set password');
        setAdding(false);
        return;
      }

      const userId = pwResult.user_id;

      // Step 2: Check if role already assigned
      const { data: existing } = await supabase.from('user_roles').select('id').eq('user_id', userId).eq('role', newRole).maybeSingle();
      if (existing) { toast.error('User already has this role'); setAdding(false); return; }

      // Step 3: Assign role
      const { error } = await supabase.from('user_roles').insert({ user_id: userId, role: newRole });
      if (error) toast.error('Failed to add role');
      else {
        const action = pwResult.action === 'created' ? 'User created & role assigned' : 'Password updated & role assigned';
        toast.success(action);
        setNewEmail('');
        setNewPassword('');
        setAddOpen(false);
        fetchRoles();
      }
    } catch {
      toast.error('Something went wrong');
    }
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

  const getRoleInfo = (role: AppRole) => {
    const info = allRoles.find(r => r.value === role);
    const group = roleHierarchy.find(g => g.roles.some(r => r.value === role));
    return { info, group };
  };

  const getRoleBadge = (role: AppRole) => {
    const { group } = getRoleInfo(role);
    const info = allRoles.find(r => r.value === role);
    const colorMap: Record<string, string> = {
      'text-yellow-600': 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
      'text-red-500': 'bg-red-500/10 text-red-600 border-red-500/20',
      'text-purple-500': 'bg-purple-500/10 text-purple-600 border-purple-500/20',
      'text-green-500': 'bg-green-500/10 text-green-600 border-green-500/20',
      'text-orange-500': 'bg-orange-500/10 text-orange-600 border-orange-500/20',
      'text-pink-500': 'bg-pink-500/10 text-pink-600 border-pink-500/20',
    };
    const style = colorMap[group?.color || ''] || 'bg-muted text-muted-foreground';
    return <Badge className={cn('text-xs', style)}>{info?.emoji} {info?.label || role}</Badge>;
  };

  const toggleGroup = (label: string) => {
    setExpandedGroups(prev => ({ ...prev, [label]: !prev[label] }));
  };

  // Stats by group
  const groupStats = roleHierarchy.map(g => ({
    ...g,
    count: roles.filter(r => g.roles.some(gr => gr.value === r.role)).length,
  }));

  return (
    <AdminLayout titleKey="admin.title.userRoles" descriptionKey="admin.desc.userRoles">
      {/* Stats - Top Role Groups */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {groupStats.map((g) => (
          <Card key={g.label} className="border border-border">
            <CardContent className="p-3 flex items-center gap-2">
              <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center shrink-0', g.bgColor)}>
                <g.icon className={cn('h-4 w-4', g.color)} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground truncate">{g.label}</p>
                <p className="text-xl font-bold">{g.count}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="users" className="gap-2"><Users className="h-4 w-4" /> Users & Roles</TabsTrigger>
          <TabsTrigger value="hierarchy" className="gap-2"><Crown className="h-4 w-4" /> Role Hierarchy</TabsTrigger>
          <TabsTrigger value="permissions" className="gap-2"><Lock className="h-4 w-4" /> Permissions</TabsTrigger>
          <TabsTrigger value="user-permissions" className="gap-2"><UserCog className="h-4 w-4" /> User Permissions</TabsTrigger>
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
                  <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                    <DialogHeader><DialogTitle className="flex items-center gap-2"><UserCog className="h-5 w-5" /> Assign Role</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2"><Label>User Email</Label><Input placeholder="user@example.com" value={newEmail} onChange={e => setNewEmail(e.target.value)} /></div>
                      <div className="space-y-2"><Label>Password</Label><Input type="password" placeholder="Min 6 characters" value={newPassword} onChange={e => setNewPassword(e.target.value)} /><p className="text-[11px] text-muted-foreground">নতুন ইউজার হলে একাউন্ট তৈরি হবে। আগে থেকে থাকলে পাসওয়ার্ড আপডেট হবে।</p></div>
                      <div className="space-y-2">
                        <Label>Role</Label>
                        <Select value={newRole} onValueChange={v => setNewRole(v as AppRole)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent className="max-h-60">
                            {roleHierarchy.map(group => (
                              <div key={group.label}>
                                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">{group.label}</div>
                                {group.roles.map(r => (
                                  <SelectItem key={r.value} value={r.value}>
                                    {r.emoji} {r.label}
                                  </SelectItem>
                                ))}
                              </div>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {/* Role description */}
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-xs font-semibold mb-1">{allRoles.find(r => r.value === newRole)?.label}</p>
                        <p className="text-xs text-muted-foreground">{allRoles.find(r => r.value === newRole)?.description}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {(permissionsMap[newRole] || []).slice(0, 6).map(p => (
                            <Badge key={p} variant="outline" className="text-[10px]">{p.replace('.', ': ')}</Badge>
                          ))}
                          {(permissionsMap[newRole] || []).length > 6 && <Badge variant="outline" className="text-[10px]">+{(permissionsMap[newRole] || []).length - 6} more</Badge>}
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
                  <TableHeader><TableRow><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Group</TableHead><TableHead>Assigned</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {filtered.map(role => {
                      const { group } = getRoleInfo(role.role);
                      return (
                        <TableRow key={role.id}>
                          <TableCell className="font-medium">{role.email}</TableCell>
                          <TableCell>{getRoleBadge(role.role)}</TableCell>
                          <TableCell><span className="text-xs text-muted-foreground">{group?.label || '—'}</span></TableCell>
                          <TableCell className="text-sm text-muted-foreground">{new Date(role.created_at).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleRemoveRole(role.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {filtered.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No roles found</TableCell></TableRow>}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hierarchy Tab */}
        <TabsContent value="hierarchy">
          <div className="space-y-4">
            {roleHierarchy.map(group => {
              const GroupIcon = group.icon;
              const isExpanded = expandedGroups[group.label] ?? false;
              const groupUsers = roles.filter(r => group.roles.some(gr => gr.value === r.role));
              return (
                <Card key={group.label} className="border border-border overflow-hidden">
                  <Collapsible open={isExpanded} onOpenChange={() => toggleGroup(group.label)}>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', group.bgColor)}>
                              <GroupIcon className={cn('h-5 w-5', group.color)} />
                            </div>
                            <div>
                              <CardTitle className="text-base">{group.label}</CardTitle>
                              <CardDescription className="text-xs">{group.roles.length} roles · {groupUsers.length} users assigned</CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{groupUsers.length}</Badge>
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {group.roles.map(role => {
                            const usersWithRole = roles.filter(r => r.role === role.value);
                            return (
                              <div key={role.value} className="p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-medium text-sm">{role.emoji} {role.label}</span>
                                  <Badge variant="secondary" className="text-[10px]">{usersWithRole.length}</Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mb-2">{role.description}</p>
                                {usersWithRole.length > 0 && (
                                  <div className="space-y-1">
                                    {usersWithRole.slice(0, 3).map(u => (
                                      <p key={u.id} className="text-[10px] text-muted-foreground truncate">• {u.email}</p>
                                    ))}
                                    {usersWithRole.length > 3 && <p className="text-[10px] text-muted-foreground">+{usersWithRole.length - 3} more</p>}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              );
            })}
          </div>
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
                  <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-60">
                    {roleHierarchy.map(group => (
                      <div key={group.label}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">{group.label}</div>
                        {group.roles.map(r => (
                          <SelectItem key={r.value} value={r.value}>{r.emoji} {r.label}</SelectItem>
                        ))}
                      </div>
                    ))}
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
                              : [...new Set([...current, ...allKeys])]
                          }));
                        }}>
                          {mod.permissions.every(p => (permissionsMap[selectedRoleForPerms] || []).includes(p.key)) ? 'Disable All' : 'Enable All'}
                        </Button>
                      </div>
                      <div className="divide-y">
                        {mod.permissions.map(perm => {
                          const isActive = (permissionsMap[selectedRoleForPerms] || []).includes(perm.key);
                          return (
                            <div key={perm.key} className="p-3 flex items-center justify-between hover:bg-muted/20">
                              <div>
                                <p className="text-sm font-medium">{perm.label}</p>
                                <p className="text-xs text-muted-foreground">{perm.description}</p>
                              </div>
                              <Switch checked={isActive} onCheckedChange={() => togglePermission(selectedRoleForPerms, perm.key)} />
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

        {/* User Permissions Tab — per-user accounting overrides */}
        <TabsContent value="user-permissions">
          <Card className="border border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2"><UserCog className="h-5 w-5" /> Per-User Permission Overrides</CardTitle>
                <CardDescription>Grant additional accounting tab access to specific users (on top of their role).</CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <Select value={overrideUserId} onValueChange={setOverrideUserId}>
                  <SelectTrigger className="w-[260px]"><SelectValue placeholder="Select user..." /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    {[...new Map(roles.map(r => [r.user_id, r])).values()].map(r => (
                      <SelectItem key={r.user_id} value={r.user_id}>{r.email}</SelectItem>
                    ))}
                    {roles.length === 0 && <div className="px-2 py-3 text-xs text-muted-foreground">No users with roles yet</div>}
                  </SelectContent>
                </Select>
                <Button onClick={saveUserOverrides} disabled={savingOverrides} size="sm">
                  {savingOverrides && <Loader2 className="h-4 w-4 animate-spin mr-1" />} Save
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {!overrideUserId ? (
                <div className="text-center py-12 text-sm text-muted-foreground">Select a user to manage their accounting permissions.</div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-muted/30 border text-xs text-muted-foreground">
                    Overrides are <span className="font-medium text-foreground">additive</span> — they grant extra access without removing role-based defaults. Useful for giving select admins access to specific Accounting tabs.
                  </div>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="p-3 bg-muted/30 flex items-center gap-2">
                      <Calculator className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold text-sm">Accounting Tabs</span>
                      <Badge variant="outline" className="text-[10px]">{(userOverrides[overrideUserId] || []).filter(p => p.startsWith('accounting.')).length}/{ACCOUNTING_PERMISSIONS.length}</Badge>
                    </div>
                    <div className="divide-y">
                      {ACCOUNTING_PERMISSIONS.map(perm => {
                        const isActive = (userOverrides[overrideUserId] || []).includes(perm.key);
                        return (
                          <div key={perm.key} className="p-3 flex items-center justify-between hover:bg-muted/20">
                            <div>
                              <p className="text-sm font-medium">{perm.label}</p>
                              <p className="text-xs text-muted-foreground">{perm.description}</p>
                            </div>
                            <Switch checked={isActive} onCheckedChange={() => toggleUserPermission(overrideUserId, perm.key)} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
};

export default AdminUserRoles;
