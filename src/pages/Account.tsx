import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User, MapPin, Package, Heart, Settings, Shield, CreditCard,
  Bell, ChevronRight, Loader2, Save, Camera, Mail, Phone,
  Calendar, Star, ShoppingBag, Clock, LogOut, Edit2, Check, X,
  Gift, Award, Ticket, TrendingUp, Sparkles, Crown, Truck,
  BarChart3, Download, Eye, MessageSquare, RefreshCcw, Wallet,
  FileText, Tag, Copy, ChevronDown, ArrowUpRight, CircleDollarSign,
  Zap, BadgePercent, Receipt, HelpCircle, Store, ChevronUp,
  RotateCcw, XCircle
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { OrderTrackingTimeline } from '@/components/orders/OrderTrackingTimeline';
import { ReturnRequestModal } from '@/components/orders/ReturnRequestModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { z } from 'zod';
import { cn } from '@/lib/utils';

const profileSchema = z.object({
  first_name: z.string().trim().max(50).optional(),
  last_name: z.string().trim().max(50).optional(),
  phone: z.string().trim().max(20).optional(),
});

const addressSchema = z.object({
  address: z.string().trim().max(200).optional(),
  apartment: z.string().trim().max(50).optional(),
  city: z.string().trim().max(100).optional(),
  state: z.string().trim().max(100).optional(),
  zip_code: z.string().trim().max(20).optional(),
  country: z.string().trim().max(100).optional(),
});

const passwordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

const SIDEBAR_ITEMS = [
  { id: 'overview', icon: BarChart3, label: 'Dashboard' },
  { id: 'orders', icon: Package, label: 'My Orders' },
  { id: 'wishlist', icon: Heart, label: 'Wishlist' },
  { id: 'coupons', icon: Tag, label: 'My Coupons' },
  { id: 'wallet', icon: Wallet, label: 'Wallet & Points' },
  { id: 'profile', icon: User, label: 'Profile' },
  { id: 'addresses', icon: MapPin, label: 'Addresses' },
  { id: 'security', icon: Shield, label: 'Security' },
  { id: 'notifications', icon: Bell, label: 'Notifications' },
  { id: 'help', icon: HelpCircle, label: 'Help & Support' },
];

const Account = () => {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading, updateProfile, signOut } = useAuth();
  const { t } = useLanguage();
  const { items: wishlistItems } = useWishlist();
  const { formatPrice } = useCurrency();
  const [isSaving, setIsSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [orderCount, setOrderCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [orderFilter, setOrderFilter] = useState('all');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [trackingEvents, setTrackingEvents] = useState<Record<string, any[]>>({});
  const [totalSpent, setTotalSpent] = useState(0);
  const [cancellingOrder, setCancellingOrder] = useState<string | null>(null);
  const [returnModal, setReturnModal] = useState<{ orderId: string; orderNumber: string; items: any[] } | null>(null);
  const [monthlySpending, setMonthlySpending] = useState<{month: string; amount: number}[]>([]);

  const [profileData, setProfileData] = useState({ first_name: '', last_name: '', phone: '' });
  const [addressData, setAddressData] = useState({ address: '', apartment: '', city: '', state: '', zip_code: '', country: 'BD' });
  const [passwordData, setPasswordData] = useState({ newPassword: '', confirmPassword: '' });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) { navigate('/auth'); return; }
    if (profile) {
      setProfileData({ first_name: profile.first_name || '', last_name: profile.last_name || '', phone: profile.phone || '' });
      setAddressData({ address: profile.address || '', apartment: profile.apartment || '', city: profile.city || '', state: profile.state || '', zip_code: profile.zip_code || '', country: profile.country || 'BD' });
    }
  }, [user, profile, authLoading, navigate]);

  useEffect(() => {
    if (user) fetchAllData();
  }, [user]);

  const fetchAllData = async () => {
    const [ordersRes, reviewsRes, allOrdersRes, couponsRes] = await Promise.all([
      supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }).limit(5),
      supabase.from('product_reviews').select('id', { count: 'exact', head: true }),
      supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }),
      supabase.from('coupons').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(10),
    ]);

    setRecentOrders(ordersRes.data || []);
    setReviewCount(reviewsRes.count || 0);
    const orders = allOrdersRes.data || [];
    setAllOrders(orders);
    setOrderCount(orders.length);
    setCoupons(couponsRes.data || []);

    // Calculate spending
    const spent = orders.filter(o => o.status !== 'cancelled').reduce((sum: number, o: any) => sum + (o.total || 0), 0);
    setTotalSpent(spent);

    // Monthly spending for last 6 months
    const now = new Date();
    const monthly: {month: string; amount: number}[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = format(d, 'MMM yyyy');
      const monthOrders = orders.filter((o: any) => {
        const od = new Date(o.created_at);
        return od.getMonth() === d.getMonth() && od.getFullYear() === d.getFullYear() && o.status !== 'cancelled';
      });
      monthly.push({ month: format(d, 'MMM'), amount: monthOrders.reduce((s: number, o: any) => s + (o.total || 0), 0) });
    }
    setMonthlySpending(monthly);
  };

  const handleProfileSave = async () => {
    const v = profileSchema.safeParse(profileData);
    if (!v.success) { toast.error(v.error.errors[0].message); return; }
    setIsSaving(true);
    const { error } = await updateProfile(profileData);
    setIsSaving(false);
    error ? toast.error('Failed to update profile') : (toast.success('Profile updated!'), setIsEditingProfile(false));
  };

  const handleAddressSave = async () => {
    const v = addressSchema.safeParse(addressData);
    if (!v.success) { toast.error(v.error.errors[0].message); return; }
    setIsSaving(true);
    const { error } = await updateProfile(addressData);
    setIsSaving(false);
    error ? toast.error('Failed to update address') : (toast.success('Address updated!'), setIsEditingAddress(false));
  };

  const handlePasswordChange = async () => {
    const v = passwordSchema.safeParse(passwordData);
    if (!v.success) { toast.error(v.error.errors[0].message); return; }
    setIsSaving(true);
    const { error } = await supabase.auth.updateUser({ password: passwordData.newPassword });
    setIsSaving(false);
    error ? toast.error(error.message) : (toast.success('Password updated!'), setPasswordData({ newPassword: '', confirmPassword: '' }));
  };

  const toggleOrderTracking = useCallback(async (orderId: string) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
      return;
    }
    setExpandedOrderId(orderId);
    if (!trackingEvents[orderId]) {
      const { data } = await supabase
        .from('order_tracking_events')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });
      setTrackingEvents(prev => ({ ...prev, [orderId]: data || [] }));
    }
  }, [expandedOrderId, trackingEvents]);

  const handleSignOut = async () => { await signOut(); navigate('/'); };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error('Image must be under 2MB'); return; }
    setAvatarUploading(true);
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/avatar.${fileExt}`;
    await supabase.storage.from('avatars').remove([filePath]);
    const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
    if (uploadError) { toast.error('Failed to upload avatar'); setAvatarUploading(false); return; }
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
    const { error: updateError } = await updateProfile({ avatar_url: `${urlData.publicUrl}?t=${Date.now()}` } as any);
    setAvatarUploading(false);
    updateError ? toast.error('Failed to update profile') : toast.success('Avatar updated!');
  };

  const handleCopyCoupon = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Coupon "${code}" copied!`);
  };

  const handleCancelOrder = async (orderId: string) => {
    setCancellingOrder(orderId);
    const { data, error } = await supabase.rpc('user_cancel_order', { _order_id: orderId });
    setCancellingOrder(null);
    if (error || !data) {
      toast.error('Failed to cancel order');
      return;
    }
    toast.success('Order cancelled successfully');
    fetchAllData();
  };

  const initials = `${(profile?.first_name || '')[0] || ''}${(profile?.last_name || '')[0] || ''}`.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U';
  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'Customer';
  const memberSince = user?.created_at ? format(new Date(user.created_at), 'MMMM yyyy') : '';
  const memberLevel = orderCount >= 20 ? 'platinum' : orderCount >= 10 ? 'gold' : 'silver';
  const rewardPoints = orderCount * 50;
  const nextLevelPoints = memberLevel === 'silver' ? 500 : memberLevel === 'gold' ? 1000 : 2000;
  const progressToNext = Math.min((rewardPoints / nextLevelPoints) * 100, 100);

  const filteredOrders = useMemo(() => {
    if (orderFilter === 'all') return allOrders;
    return allOrders.filter(o => o.status === orderFilter);
  }, [allOrders, orderFilter]);

  const statusColors: Record<string, string> = {
    pending: 'bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/20',
    confirmed: 'bg-accent/10 text-accent border-accent/20',
    processing: 'bg-primary/10 text-primary border-primary/20',
    shipped: 'bg-[hsl(var(--prime))]/10 text-[hsl(var(--prime))] border-[hsl(var(--prime))]/20',
    out_for_delivery: 'bg-primary/10 text-primary border-primary/20',
    delivered: 'bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] border-[hsl(var(--success))]/20',
    cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
  };

  const levelConfig: Record<string, { gradient: string; label: string; icon: any }> = {
    silver: { gradient: 'from-slate-400 to-slate-500', label: 'Silver', icon: Award },
    gold: { gradient: 'from-amber-400 to-yellow-500', label: 'Gold', icon: Crown },
    platinum: { gradient: 'from-violet-500 to-purple-600', label: 'Platinum', icon: Sparkles },
  };

  const maxSpending = Math.max(...monthlySpending.map(m => m.amount), 1);

  if (authLoading) {
    return (<Layout><div className="container-main py-12 flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div></Layout>);
  }
  if (!user) return null;

  const LevelIcon = levelConfig[memberLevel].icon;

  return (
    <>
    <Layout>
      <div className="container-main py-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-6 space-y-4">
              {/* User Card */}
              <div className="bg-card rounded-2xl border border-border p-5 shadow-[var(--shadow-sm)]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative">
                    <Avatar className="h-14 w-14 border-2 border-accent/20">
                      <AvatarImage src={(profile as any)?.avatar_url || ''} />
                      <AvatarFallback className="text-lg font-bold bg-gradient-to-br from-accent to-accent/70 text-accent-foreground">{initials}</AvatarFallback>
                    </Avatar>
                    <button onClick={() => fileInputRef.current?.click()} disabled={avatarUploading}
                      className="absolute -bottom-1 -right-1 bg-accent text-accent-foreground rounded-full p-1.5 shadow-md hover:bg-accent/90 transition-all">
                      {avatarUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{fullName}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-gradient-to-r from-accent/5 to-primary/5 border border-accent/10">
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br text-white', levelConfig[memberLevel].gradient)}>
                    <LevelIcon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold">{levelConfig[memberLevel].label} Member</p>
                    <p className="text-[10px] text-muted-foreground">{rewardPoints} pts</p>
                  </div>
                </div>
              </div>

              {/* Nav */}
              <nav className="bg-card rounded-2xl border border-border py-2 shadow-[var(--shadow-sm)]">
                {SIDEBAR_ITEMS.map((item) => (
                  <button key={item.id} onClick={() => { setActiveSection(item.id); setMobileSidebarOpen(false); }}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all hover:bg-secondary/60',
                      activeSection === item.id ? 'text-accent font-semibold bg-accent/5 border-r-2 border-accent' : 'text-muted-foreground hover:text-foreground'
                    )}>
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                    {item.id === 'orders' && orderCount > 0 && <Badge variant="secondary" className="ml-auto text-[10px] h-5 px-1.5">{orderCount}</Badge>}
                    {item.id === 'wishlist' && wishlistItems.length > 0 && <Badge variant="secondary" className="ml-auto text-[10px] h-5 px-1.5">{wishlistItems.length}</Badge>}
                  </button>
                ))}
                <Separator className="my-2" />
                <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/5 transition-all">
                  <LogOut className="h-4 w-4" /> Sign Out
                </button>
              </nav>
            </div>
          </aside>

          {/* Mobile Nav */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border px-2 py-1.5 flex gap-1 overflow-x-auto">
            {SIDEBAR_ITEMS.slice(0, 5).map((item) => (
              <button key={item.id} onClick={() => setActiveSection(item.id)}
                className={cn('flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[10px] min-w-[60px] transition-all',
                  activeSection === item.id ? 'text-accent bg-accent/10 font-medium' : 'text-muted-foreground')}>
                <item.icon className="h-4 w-4" />
                <span>{item.label.split(' ').pop()}</span>
              </button>
            ))}
            <button onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[10px] min-w-[60px] text-muted-foreground">
              <ChevronDown className={cn("h-4 w-4 transition-transform", mobileSidebarOpen && "rotate-180")} />
              <span>More</span>
            </button>
          </div>

          {mobileSidebarOpen && (
            <div className="lg:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)}>
              <div className="absolute bottom-16 left-2 right-2 bg-card rounded-2xl border border-border p-3 shadow-xl" onClick={e => e.stopPropagation()}>
                <div className="grid grid-cols-3 gap-2">
                  {SIDEBAR_ITEMS.slice(5).map((item) => (
                    <button key={item.id} onClick={() => { setActiveSection(item.id); setMobileSidebarOpen(false); }}
                      className={cn('flex flex-col items-center gap-1 p-3 rounded-xl text-xs transition-all',
                        activeSection === item.id ? 'bg-accent/10 text-accent font-medium' : 'bg-secondary/50 text-muted-foreground')}>
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </button>
                  ))}
                  <button onClick={handleSignOut} className="flex flex-col items-center gap-1 p-3 rounded-xl text-xs text-destructive bg-destructive/5">
                    <LogOut className="h-5 w-5" /> Sign Out
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <main className="flex-1 min-w-0 pb-20 lg:pb-0">
            {/* ===== OVERVIEW ===== */}
            {activeSection === 'overview' && (
              <div className="space-y-6">
                {/* Welcome Banner */}
                <div className="relative bg-gradient-to-r from-primary via-primary/90 to-accent/70 rounded-2xl p-6 text-primary-foreground overflow-hidden">
                  <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0id2hpdGUiLz48L3N2Zz4=')]" />
                  <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-sm opacity-80">Welcome back,</p>
                      <h1 className="text-2xl font-bold mt-1">{fullName} 👋</h1>
                      <p className="text-sm opacity-70 mt-1">Member since {memberSince}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-3xl font-bold">{rewardPoints}</p>
                        <p className="text-xs opacity-80">Reward Points</p>
                      </div>
                      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center bg-white/20 backdrop-blur-sm')}>
                        <LevelIcon className="h-6 w-6" />
                      </div>
                    </div>
                  </div>
                  <div className="relative mt-4">
                    <div className="flex justify-between text-xs opacity-80 mb-1">
                      <span>{levelConfig[memberLevel].label}</span>
                      <span>{rewardPoints}/{nextLevelPoints}</span>
                    </div>
                    <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-white/80 rounded-full transition-all" style={{ width: `${progressToNext}%` }} />
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { label: 'Total Orders', value: orderCount, icon: Package, color: 'text-primary', bg: 'bg-primary/10', trend: '+12%' },
                    { label: 'Total Spent', value: `৳${totalSpent.toLocaleString()}`, icon: CircleDollarSign, color: 'text-accent', bg: 'bg-accent/10', trend: '' },
                    { label: 'Wishlist', value: wishlistItems.length, icon: Heart, color: 'text-destructive', bg: 'bg-destructive/10', trend: '' },
                    { label: 'Reviews', value: reviewCount, icon: Star, color: 'text-[hsl(var(--rating))]', bg: 'bg-[hsl(var(--rating))]/10', trend: '' },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-card rounded-xl border border-border p-4 hover:shadow-[var(--shadow-card)] transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', stat.bg)}>
                          <stat.icon className={cn('h-4.5 w-4.5', stat.color)} />
                        </div>
                        {stat.trend && <span className="text-xs text-[hsl(var(--success))] font-medium">{stat.trend}</span>}
                      </div>
                      <p className="text-xl font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Spending Chart */}
                <div className="bg-card rounded-xl border border-border p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Spending Overview</h3>
                    <span className="text-xs text-muted-foreground">Last 6 months</span>
                  </div>
                  <div className="flex items-end gap-2 h-32">
                    {monthlySpending.map((m, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[10px] font-medium text-muted-foreground">
                          {m.amount > 0 ? `৳${(m.amount / 1000).toFixed(1)}k` : ''}
                        </span>
                        <div className="w-full relative" style={{ height: '80px' }}>
                          <div
                            className={cn('absolute bottom-0 w-full rounded-t-md transition-all', i === monthlySpending.length - 1 ? 'bg-accent' : 'bg-primary/20')}
                            style={{ height: `${Math.max((m.amount / maxSpending) * 100, 4)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground">{m.month}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Orders + Quick Actions side by side */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Recent Orders */}
                  <div className="lg:col-span-2 bg-card rounded-xl border border-border p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">Recent Orders</h3>
                      <Button variant="ghost" size="sm" className="text-accent text-xs gap-1" onClick={() => setActiveSection('orders')}>
                        View All <ChevronRight className="h-3 w-3" />
                      </Button>
                    </div>
                    {recentOrders.length === 0 ? (
                      <div className="text-center py-8">
                        <ShoppingBag className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No orders yet</p>
                        <Link to="/"><Button variant="accent" size="sm" className="mt-3">Start Shopping</Button></Link>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {recentOrders.slice(0, 4).map((order: any) => (
                          <div key={order.id} onClick={() => setActiveSection('orders')}
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer border border-transparent hover:border-border">
                            <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center shrink-0">
                              <Package className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">#{order.order_number}</p>
                              <p className="text-xs text-muted-foreground">{format(new Date(order.created_at), 'MMM d, yyyy')}</p>
                            </div>
                            <div className="text-right">
                              <Badge variant="outline" className={cn('text-[10px] capitalize', statusColors[order.status])}>{order.status}</Badge>
                              <p className="text-sm font-semibold mt-1">৳{order.total?.toFixed(2)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="space-y-4">
                    <div className="bg-card rounded-xl border border-border p-5">
                      <h3 className="font-semibold mb-3 text-sm">Quick Actions</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { icon: Package, label: 'Orders', onClick: () => setActiveSection('orders'), bg: 'bg-primary/10', color: 'text-primary' },
                          { icon: Heart, label: 'Wishlist', onClick: () => navigate('/wishlist'), bg: 'bg-destructive/10', color: 'text-destructive' },
                          { icon: Tag, label: 'Coupons', onClick: () => setActiveSection('coupons'), bg: 'bg-accent/10', color: 'text-accent' },
                          { icon: Store, label: 'Sell', onClick: () => navigate('/sell'), bg: 'bg-[hsl(var(--success))]/10', color: 'text-[hsl(var(--success))]' },
                          { icon: MapPin, label: 'Address', onClick: () => setActiveSection('addresses'), bg: 'bg-[hsl(var(--prime))]/10', color: 'text-[hsl(var(--prime))]' },
                          { icon: Shield, label: 'Security', onClick: () => setActiveSection('security'), bg: 'bg-violet-500/10', color: 'text-violet-500' },
                        ].map((a) => (
                          <button key={a.label} onClick={a.onClick}
                            className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/60 transition-all text-center">
                            <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', a.bg)}>
                              <a.icon className={cn('h-4 w-4', a.color)} />
                            </div>
                            <span className="text-xs font-medium">{a.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Active Coupons Preview */}
                    {coupons.length > 0 && (
                      <div className="bg-gradient-to-br from-accent/5 to-primary/5 rounded-xl border border-accent/20 p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <BadgePercent className="h-4 w-4 text-accent" />
                          <h3 className="text-sm font-semibold">Available Coupons</h3>
                        </div>
                        <div className="space-y-2">
                          {coupons.slice(0, 2).map((c: any) => (
                            <div key={c.id} className="flex items-center justify-between p-2 bg-card rounded-lg border border-border">
                              <div>
                                <p className="text-xs font-bold font-mono text-accent">{c.code}</p>
                                <p className="text-[10px] text-muted-foreground">{c.discount_type === 'percentage' ? `${c.discount_value}% off` : `৳${c.discount_value} off`}</p>
                              </div>
                              <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => handleCopyCoupon(c.code)}>
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                        <Button variant="ghost" size="sm" className="w-full mt-2 text-xs text-accent" onClick={() => setActiveSection('coupons')}>
                          View All Coupons →
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ===== ORDERS ===== */}
            {activeSection === 'orders' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold">My Orders</h2>
                    <p className="text-sm text-muted-foreground">{orderCount} total orders</p>
                  </div>
                  <Select value={orderFilter} onValueChange={setOrderFilter}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Orders</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {filteredOrders.length === 0 ? (
                  <div className="text-center py-16 bg-card rounded-xl border border-border">
                    <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="font-medium">No orders found</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {orderFilter !== 'all' ? 'Try a different filter' : 'Start shopping to see your orders here'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredOrders.map((order: any) => (
                      <div key={order.id} className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-[var(--shadow-card)] transition-shadow">
                        <div className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
                                <Receipt className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="font-semibold text-sm">Order #{order.order_number}</p>
                                <p className="text-xs text-muted-foreground">{format(new Date(order.created_at), 'MMM d, yyyy · h:mm a')}</p>
                              </div>
                            </div>
                            <div className="text-right flex items-center gap-3">
                              <Badge variant="outline" className={cn('capitalize text-[10px]', statusColors[order.status])}>{order.status.replace('_', ' ')}</Badge>
                              <span className="font-bold">৳{order.total?.toFixed(2)}</span>
                            </div>
                          </div>
                          <Separator className="my-3" />
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex gap-4">
                              <span>Payment: <span className="font-medium text-foreground capitalize">{order.payment_method}</span></span>
                              {order.tracking_number && <span>Tracking: <span className="font-medium text-foreground">{order.tracking_number}</span></span>}
                            </div>
                            <button
                              onClick={() => toggleOrderTracking(order.id)}
                              className="text-accent font-medium hover:underline flex items-center gap-1"
                            >
                              {expandedOrderId === order.id ? 'Hide' : 'Track'}
                              {expandedOrderId === order.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                            </button>
                          </div>
                        </div>

                        {expandedOrderId === order.id && (
                          <div className="border-t border-border bg-secondary/20 p-4">
                            <OrderTrackingTimeline
                              status={order.status}
                              trackingNumber={order.tracking_number}
                              carrier={order.carrier}
                              estimatedDelivery={order.estimated_delivery}
                              shippedAt={order.shipped_at}
                              deliveredAt={order.delivered_at}
                              events={trackingEvents[order.id] || []}
                            />
                          </div>
                        )}

                        {/* Action Buttons */}
                        {(order.status === 'pending' || order.status === 'delivered') && (
                          <div className="border-t border-border p-3 flex flex-wrap gap-2">
                            {order.status === 'pending' && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive border-destructive/30 hover:bg-destructive/10"
                                onClick={() => handleCancelOrder(order.id)}
                                disabled={cancellingOrder === order.id}
                              >
                                {cancellingOrder === order.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                                ) : (
                                  <XCircle className="h-3.5 w-3.5 mr-1.5" />
                                )}
                                Cancel Order
                              </Button>
                            )}
                            {order.status === 'delivered' && order.order_items && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-accent border-accent/30 hover:bg-accent/10"
                                onClick={() => setReturnModal({
                                  orderId: order.id,
                                  orderNumber: order.order_number,
                                  items: order.order_items,
                                })}
                              >
                                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                                Request Return
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ===== WISHLIST ===== */}
            {activeSection === 'wishlist' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold">My Wishlist</h2>
                    <p className="text-sm text-muted-foreground">{wishlistItems.length} items saved</p>
                  </div>
                  <Link to="/wishlist"><Button variant="outline" size="sm" className="gap-1.5">View Full Page <ArrowUpRight className="h-3.5 w-3.5" /></Button></Link>
                </div>
                {wishlistItems.length === 0 ? (
                  <div className="text-center py-16 bg-card rounded-xl border border-border">
                    <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="font-medium">Your wishlist is empty</p>
                    <p className="text-sm text-muted-foreground mt-1">Save items you love to find them later</p>
                    <Link to="/"><Button variant="accent" size="sm" className="mt-4">Browse Products</Button></Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {wishlistItems.slice(0, 6).map((product: any) => (
                      <Link key={product.id} to={`/product/${product.slug}`}
                        className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-[var(--shadow-card)] transition-shadow group">
                        <div className="aspect-square bg-secondary overflow-hidden">
                          <img src={product.images?.[0] || '/placeholder.svg'} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        </div>
                        <div className="p-3">
                          <p className="text-sm font-medium truncate">{product.name}</p>
                          <p className="text-sm font-bold text-accent mt-1">৳{product.price}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
                {wishlistItems.length > 6 && (
                  <div className="text-center">
                    <Link to="/wishlist"><Button variant="outline" size="sm">View All {wishlistItems.length} Items</Button></Link>
                  </div>
                )}
              </div>
            )}

            {/* ===== COUPONS ===== */}
            {activeSection === 'coupons' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold">Available Coupons</h2>
                {coupons.length === 0 ? (
                  <div className="text-center py-16 bg-card rounded-xl border border-border">
                    <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="font-medium">No coupons available</p>
                    <p className="text-sm text-muted-foreground mt-1">Check back later for new offers</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {coupons.map((c: any) => (
                      <div key={c.id} className="bg-card rounded-xl border border-border overflow-hidden flex">
                        <div className="w-24 bg-gradient-to-b from-accent to-accent/80 flex items-center justify-center text-accent-foreground p-3 text-center">
                          <div>
                            <p className="text-2xl font-bold">{c.discount_type === 'percentage' ? `${c.discount_value}%` : `৳${c.discount_value}`}</p>
                            <p className="text-[10px] uppercase opacity-80">OFF</p>
                          </div>
                        </div>
                        <div className="flex-1 p-4 flex flex-col justify-between">
                          <div>
                            <p className="font-bold font-mono text-sm">{c.code}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{c.description || 'Use at checkout'}</p>
                            {c.min_order_amount && <p className="text-[10px] text-muted-foreground mt-1">Min order: ৳{c.min_order_amount}</p>}
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-[10px] text-muted-foreground">
                              {c.expires_at ? `Expires: ${format(new Date(c.expires_at), 'MMM d')}` : 'No expiry'}
                            </p>
                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => handleCopyCoupon(c.code)}>
                              <Copy className="h-3 w-3" /> Copy
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ===== WALLET & POINTS ===== */}
            {activeSection === 'wallet' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold">Wallet & Rewards</h2>
                <div className="bg-gradient-to-br from-accent/5 via-card to-primary/5 rounded-2xl border border-accent/20 p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className={cn('w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br text-white', levelConfig[memberLevel].gradient)}>
                      <LevelIcon className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{levelConfig[memberLevel].label} Member</h3>
                      <p className="text-muted-foreground">{rewardPoints} points • ৳{(rewardPoints * 0.1).toFixed(0)} redeemable</p>
                    </div>
                  </div>
                  <Progress value={progressToNext} className="h-3 mb-2" />
                  <p className="text-xs text-muted-foreground text-center">{nextLevelPoints - rewardPoints} points to next level</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-card rounded-xl border border-border p-5">
                    <h3 className="font-semibold mb-3">How to Earn</h3>
                    <div className="space-y-3">
                      {[
                        { icon: ShoppingBag, text: 'Place an order', points: '+50 pts' },
                        { icon: Star, text: 'Write a review', points: '+20 pts' },
                        { icon: MessageSquare, text: 'Refer a friend', points: '+100 pts' },
                      ].map((item) => (
                        <div key={item.text} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <item.icon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{item.text}</span>
                          </div>
                          <Badge variant="secondary" className="text-xs">{item.points}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-card rounded-xl border border-border p-5">
                    <h3 className="font-semibold mb-3">Member Benefits</h3>
                    <div className="space-y-3">
                      {[
                        { icon: Truck, text: 'Free Shipping', active: memberLevel !== 'silver' },
                        { icon: Sparkles, text: 'Exclusive Deals', active: true },
                        { icon: TrendingUp, text: 'Early Access', active: memberLevel === 'platinum' },
                        { icon: Shield, text: 'Priority Support', active: memberLevel !== 'silver' },
                      ].map((b) => (
                        <div key={b.text} className={cn('flex items-center gap-2', !b.active && 'opacity-40')}>
                          <b.icon className={cn('h-4 w-4', b.active ? 'text-accent' : 'text-muted-foreground')} />
                          <span className="text-sm">{b.text}</span>
                          {b.active && <Check className="h-3 w-3 text-accent ml-auto" />}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ===== PROFILE ===== */}
            {activeSection === 'profile' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold">Profile Information</h2>
                <div className="bg-card rounded-xl border border-border p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-semibold">Personal Details</h3>
                    {!isEditingProfile ? (
                      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setIsEditingProfile(true)}><Edit2 className="h-3.5 w-3.5" /> Edit</Button>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => setIsEditingProfile(false)}><X className="h-4 w-4" /></Button>
                    )}
                  </div>
                  {isEditingProfile ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>First Name</Label><Input value={profileData.first_name} onChange={e => setProfileData({...profileData, first_name: e.target.value})} /></div>
                        <div className="space-y-2"><Label>Last Name</Label><Input value={profileData.last_name} onChange={e => setProfileData({...profileData, last_name: e.target.value})} /></div>
                      </div>
                      <div className="space-y-2"><Label>Email</Label><Input value={user.email || ''} disabled className="bg-secondary" /><p className="text-xs text-muted-foreground">Email cannot be changed</p></div>
                      <div className="space-y-2"><Label>Phone</Label><Input type="tel" value={profileData.phone} onChange={e => setProfileData({...profileData, phone: e.target.value})} placeholder="+880 1XXX-XXXXXX" /></div>
                      <Separator />
                      <Button onClick={handleProfileSave} disabled={isSaving} className="gap-2">
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Changes
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {[
                        { label: 'First Name', value: profile?.first_name || '—', icon: User },
                        { label: 'Last Name', value: profile?.last_name || '—', icon: User },
                        { label: 'Email', value: user.email || '—', icon: Mail },
                        { label: 'Phone', value: profile?.phone || '—', icon: Phone },
                      ].map((f) => (
                        <div key={f.label} className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                            <f.icon className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">{f.label}</p>
                            <p className="font-medium text-sm">{f.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Linked Accounts */}
                <div className="bg-card rounded-xl border border-border p-6">
                  <h3 className="font-semibold mb-4">Linked Accounts</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                      <div className="flex items-center gap-3">
                        <svg className="h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                        <span className="text-sm font-medium">Google</span>
                      </div>
                      <Badge variant="outline" className="text-xs">{user.app_metadata?.provider === 'google' ? 'Connected' : 'Not linked'}</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                      <div className="flex items-center gap-3"><Phone className="h-5 w-5 text-accent" /><span className="text-sm font-medium">Phone</span></div>
                      <Badge variant="outline" className="text-xs">{profile?.phone ? 'Verified' : 'Not linked'}</Badge>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ===== ADDRESSES ===== */}
            {activeSection === 'addresses' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">My Addresses</h2>
                  {!isEditingAddress && <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setIsEditingAddress(true)}>
                    <Edit2 className="h-3.5 w-3.5" /> {addressData.address ? 'Edit' : 'Add Address'}
                  </Button>}
                </div>
                <div className="bg-card rounded-xl border border-border p-6">
                  {isEditingAddress ? (
                    <div className="space-y-4">
                      <div className="space-y-2"><Label>Street Address</Label><Input value={addressData.address} onChange={e => setAddressData({...addressData, address: e.target.value})} /></div>
                      <div className="space-y-2"><Label>Apartment (Optional)</Label><Input value={addressData.apartment} onChange={e => setAddressData({...addressData, apartment: e.target.value})} /></div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>City</Label><Input value={addressData.city} onChange={e => setAddressData({...addressData, city: e.target.value})} /></div>
                        <div className="space-y-2"><Label>State/Division</Label><Input value={addressData.state} onChange={e => setAddressData({...addressData, state: e.target.value})} /></div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Zip Code</Label><Input value={addressData.zip_code} onChange={e => setAddressData({...addressData, zip_code: e.target.value})} /></div>
                        <div className="space-y-2"><Label>Country</Label>
                          <Select value={addressData.country} onValueChange={v => setAddressData({...addressData, country: v})}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="BD">Bangladesh</SelectItem>
                              <SelectItem value="US">United States</SelectItem>
                              <SelectItem value="UK">United Kingdom</SelectItem>
                              <SelectItem value="IN">India</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleAddressSave} disabled={isSaving} className="gap-2">
                          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save Address
                        </Button>
                        <Button variant="ghost" onClick={() => setIsEditingAddress(false)}>Cancel</Button>
                      </div>
                    </div>
                  ) : addressData.address ? (
                    <div className="flex items-start gap-4 p-4 bg-secondary/50 rounded-xl">
                      <MapPin className="h-5 w-5 text-accent mt-0.5 shrink-0" />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">Default Shipping Address</p>
                          <Badge variant="outline" className="text-[10px]">Default</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {[addressData.address, addressData.apartment, addressData.city, addressData.state, addressData.zip_code].filter(Boolean).join(', ')}
                        </p>
                        <p className="text-sm text-muted-foreground">{addressData.country}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <MapPin className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                      <p className="font-medium">No address saved</p>
                      <p className="text-sm text-muted-foreground mt-1">Add your shipping address for faster checkout</p>
                      <Button variant="outline" size="sm" className="mt-4" onClick={() => setIsEditingAddress(true)}>Add Address</Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ===== SECURITY ===== */}
            {activeSection === 'security' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold">Security Settings</h2>
                <div className="bg-card rounded-xl border border-border p-6">
                  <h3 className="font-semibold mb-4">Change Password</h3>
                  <div className="space-y-4 max-w-md">
                    <div className="space-y-2"><Label>New Password</Label><Input type="password" value={passwordData.newPassword} onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})} /></div>
                    <div className="space-y-2"><Label>Confirm Password</Label><Input type="password" value={passwordData.confirmPassword} onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})} /></div>
                    <Button onClick={handlePasswordChange} disabled={isSaving || !passwordData.newPassword} className="gap-2">
                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />} Update Password
                    </Button>
                  </div>
                </div>

                <div className="bg-card rounded-xl border border-border p-6">
                  <h3 className="font-semibold mb-4">Account Information</h3>
                  <div className="space-y-3 text-sm">
                    {[
                      { label: 'Email', value: user.email },
                      { label: 'Account Created', value: memberSince },
                      { label: 'Last Sign In', value: user.last_sign_in_at ? format(new Date(user.last_sign_in_at), 'MMM d, yyyy h:mm a') : '—' },
                      { label: 'Member Level', value: levelConfig[memberLevel].label },
                    ].map((r) => (
                      <div key={r.label} className="flex justify-between py-2.5 border-b border-border last:border-0">
                        <span className="text-muted-foreground">{r.label}</span>
                        <span className="font-medium">{r.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-destructive/5 rounded-xl border border-destructive/20 p-6">
                  <h3 className="font-semibold text-destructive mb-2">Danger Zone</h3>
                  <p className="text-sm text-muted-foreground mb-4">Sign out of your account on this device.</p>
                  <Button variant="destructive" size="sm" onClick={handleSignOut} className="gap-2"><LogOut className="h-4 w-4" /> Sign Out</Button>
                </div>
              </div>
            )}

            {/* ===== NOTIFICATIONS ===== */}
            {activeSection === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold">Notification Preferences</h2>
                <div className="bg-card rounded-xl border border-border p-6">
                  <div className="space-y-6">
                    {[
                      { title: 'Order Updates', desc: 'Get notified about order status changes', defaultChecked: true },
                      { title: 'Promotions & Deals', desc: 'Receive exclusive offers and discounts', defaultChecked: false },
                      { title: 'Product Recommendations', desc: 'Personalized product suggestions', defaultChecked: false },
                      { title: 'Review Reminders', desc: 'Reminders to review purchased products', defaultChecked: true },
                      { title: 'Wishlist Alerts', desc: 'Price drops on wishlist items', defaultChecked: true },
                      { title: 'Flash Sale Alerts', desc: 'Get notified when flash sales start', defaultChecked: true },
                    ].map((pref) => (
                      <div key={pref.title} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{pref.title}</p>
                          <p className="text-xs text-muted-foreground">{pref.desc}</p>
                        </div>
                        <Switch defaultChecked={pref.defaultChecked} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ===== HELP ===== */}
            {activeSection === 'help' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold">Help & Support</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { icon: Package, title: 'Order Issues', desc: 'Problems with your order? Track, return or report.', link: '/orders' },
                    { icon: RefreshCcw, title: 'Returns & Refunds', desc: 'Learn about our return and refund policies.', link: '/returns' },
                    { icon: Truck, title: 'Shipping Info', desc: 'Delivery times, costs and tracking info.', link: '/shipping' },
                    { icon: HelpCircle, title: 'FAQ', desc: 'Find answers to commonly asked questions.', link: '/faq' },
                    { icon: MessageSquare, title: 'Contact Us', desc: 'Get in touch with our support team.', link: '/contact' },
                    { icon: FileText, title: 'Terms & Privacy', desc: 'Read our terms of service and privacy policy.', link: '/terms' },
                  ].map((item) => (
                    <Link key={item.title} to={item.link}
                      className="bg-card rounded-xl border border-border p-5 hover:shadow-[var(--shadow-card)] transition-shadow group flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0 group-hover:bg-accent/10 transition-colors">
                        <item.icon className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{item.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </Layout>

    {/* Return Request Modal */}
    {returnModal && user && (
      <ReturnRequestModal
        open={!!returnModal}
        onClose={() => setReturnModal(null)}
        orderId={returnModal.orderId}
        orderNumber={returnModal.orderNumber}
        orderItems={returnModal.items}
        userId={user.id}
        onSuccess={fetchAllData}
      />
    )}
    </>
  );
};
};

export default Account;
