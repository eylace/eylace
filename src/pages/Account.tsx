import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  User, MapPin, Package, Heart, Settings, Shield, CreditCard,
  Bell, ChevronRight, Loader2, Save, Camera, Mail, Phone,
  Calendar, Star, ShoppingBag, Clock, LogOut, Edit2, Check, X,
  Gift, Award, Ticket, TrendingUp, Sparkles, Crown, Truck,
  BarChart3, Download, Eye, MessageSquare, RefreshCcw, Wallet,
  FileText, Tag, Copy, ChevronDown, ArrowUpRight, CircleDollarSign,
  Zap, BadgePercent, Receipt, HelpCircle, Store, ChevronUp, Link2,
  Globe, Palette, Activity, CheckCircle2, AlertCircle,
  RotateCcw, XCircle
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { OrderTrackingTimeline } from '@/components/orders/OrderTrackingTimeline';
import { ReturnRequestModal } from '@/components/orders/ReturnRequestModal';
import { ReturnReceipt } from '@/components/orders/ReturnReceipt';
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

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isUuidLike = (value: string) => UUID_REGEX.test(value);

const SIDEBAR_ITEMS = [
  { id: 'overview', icon: BarChart3, label: 'Dashboard' },
  { id: 'orders', icon: Package, label: 'My Orders' },
  { id: 'reviews', icon: Star, label: 'My Reviews' },
  { id: 'returns', icon: RotateCcw, label: 'Returns & Cancellations' },
  { id: 'wishlist', icon: Heart, label: 'Wishlist' },
  { id: 'coupons', icon: Tag, label: 'My Coupons' },
  { id: 'wallet', icon: Wallet, label: 'Wallet & Points' },
  { id: 'affiliate', icon: Link2, label: 'Affiliate' },
  { id: 'profile', icon: User, label: 'Profile' },
  { id: 'addresses', icon: MapPin, label: 'Addresses' },
  { id: 'settings', icon: Settings, label: 'Settings' },
  { id: 'help', icon: HelpCircle, label: 'Help & Support' },
];

const Account = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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
  const [affiliateData, setAffiliateData] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<{type: string; title: string; time: string; icon: any; color: string}[]>([]);
  const [myReviews, setMyReviews] = useState<any[]>([]);
  const [returnRequests, setReturnRequests] = useState<any[]>([]);
  const [cancelledOrders, setCancelledOrders] = useState<any[]>([]);
  const [productSlugMap, setProductSlugMap] = useState<Record<string, string>>({});

  const [profileData, setProfileData] = useState({ first_name: '', last_name: '', phone: '' });
  const [addressData, setAddressData] = useState({ address: '', apartment: '', city: '', state: '', zip_code: '', country: 'BD' });
  const [passwordData, setPasswordData] = useState({ newPassword: '', confirmPassword: '' });
  const [notifPrefs, setNotifPrefs] = useState({
    orderUpdates: true, promotions: false, recommendations: false,
    reviewReminders: true, wishlistAlerts: true, flashSaleAlerts: true,
  });

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
    const tab = searchParams.get('tab');
    if (tab && SIDEBAR_ITEMS.some(item => item.id === tab)) {
      setActiveSection(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) fetchAllData();
  }, [user]);

  // Realtime subscription for return_requests updates
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('customer-return-requests')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'return_requests', filter: `user_id=eq.${user.id}` },
        () => {
          // Re-fetch return requests when any change happens
          supabase.from('return_requests')
            .select('*, order_id, return_tracking_number')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .then(({ data }) => {
              if (data) setReturnRequests(data);
            });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Realtime subscription for user's own product reviews
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('customer-my-reviews')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'product_reviews', filter: `user_id=eq.${user.id}` },
        () => {
          fetchAllData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchAllData = async () => {
    const [allOrdersRes, couponsRes, affRes, myReviewsRes, returnsRes] = await Promise.all([
      supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }),
      supabase.from('coupons').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(10),
      supabase.from('affiliates').select('*').eq('user_id', user!.id).maybeSingle(),
      supabase.from('product_reviews').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }),
      supabase.from('return_requests').select('*, order_id, return_tracking_number').eq('user_id', user!.id).order('created_at', { ascending: false }),
    ]);

    const orders = allOrdersRes.data || [];
    const rawReviews = myReviewsRes.data || [];

    setRecentOrders(orders.slice(0, 5));
    setAllOrders(orders);
    setOrderCount(orders.length);
    setReviewCount(rawReviews.length);
    setCoupons(couponsRes.data || []);
    setAffiliateData(affRes.data);
    setReturnRequests(returnsRes.data || []);
    setCancelledOrders(orders.filter((o: any) => o.status === 'cancelled'));

    // Build product map for order-review navigation + My Reviews listing
    const orderProductRefs = orders
      .flatMap((o: any) => (o.order_items || []).map((i: any) => String(i.product_id || '')))
      .filter(Boolean);
    const reviewProductRefs = rawReviews
      .map((review: any) => String(review.product_id || ''))
      .filter(Boolean);

    const uniqueProductRefs = [...new Set([...orderProductRefs, ...reviewProductRefs])];
    const uuidRefs = uniqueProductRefs.filter(isUuidLike);
    const slugRefs = uniqueProductRefs.filter((ref) => !isUuidLike(ref));

    const productQueries: any[] = [];
    if (uuidRefs.length > 0) {
      productQueries.push(
        supabase
          .from('products_public')
          .select('id, slug, name, images')
          .in('id', uuidRefs),
      );
    }
    if (slugRefs.length > 0) {
      productQueries.push(
        supabase
          .from('products_public')
          .select('id, slug, name, images')
          .in('slug', slugRefs),
      );
    }

    const productResults = await Promise.all(productQueries);
    const productRows = productResults.flatMap((res: any) => res?.data || []);

    const productByRef: Record<string, any> = {};
    productRows.forEach((product: any) => {
      productByRef[String(product.id)] = product;
      if (product.slug) {
        productByRef[String(product.slug)] = product;
      }
    });

    const slugMap: Record<string, string> = {};
    uniqueProductRefs.forEach((ref) => {
      const mapped = productByRef[ref];
      if (mapped?.slug) {
        slugMap[ref] = mapped.slug;
      } else if (!isUuidLike(ref)) {
        slugMap[ref] = ref;
      }
    });
    setProductSlugMap(slugMap);

    const enrichedMyReviews = rawReviews.map((review: any) => ({
      ...review,
      product: productByRef[String(review.product_id)] || null,
    }));
    setMyReviews(enrichedMyReviews);

    if (uniqueProductRefs.length === 0) {
      setProductSlugMap({});
      setMyReviews(rawReviews);
    }

    // Calculate spending
    const spent = orders.filter(o => o.status !== 'cancelled').reduce((sum: number, o: any) => sum + (o.total || 0), 0);
    setTotalSpent(spent);

    // Monthly spending for last 6 months
    const now = new Date();
    const monthly: {month: string; amount: number}[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthOrders = orders.filter((o: any) => {
        const od = new Date(o.created_at);
        return od.getMonth() === d.getMonth() && od.getFullYear() === d.getFullYear() && o.status !== 'cancelled';
      });
      monthly.push({ month: format(d, 'MMM'), amount: monthOrders.reduce((s: number, o: any) => s + (o.total || 0), 0) });
    }
    setMonthlySpending(monthly);

    // Build recent activity
    const activity: {type: string; title: string; time: string; icon: any; color: string}[] = [];
    orders.slice(0, 3).forEach((o: any) => {
      activity.push({ type: 'order', title: `Order #${o.order_number} ${o.status}`, time: o.created_at, icon: Package, color: 'text-primary' });
    });
    activity.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    setRecentActivity(activity.slice(0, 5));
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

  const accountCompletionItems = useMemo(() => [
    { label: 'Name', done: !!(profile?.first_name && profile?.last_name) },
    { label: 'Phone', done: !!profile?.phone },
    { label: 'Address', done: !!profile?.address },
    { label: 'Avatar', done: !!(profile as any)?.avatar_url },
  ], [profile]);
  const accountCompletion = Math.round((accountCompletionItems.filter(i => i.done).length / accountCompletionItems.length) * 100);

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

                  {/* Quick Actions + Account Completion */}
                  <div className="space-y-4">
                    {/* Account Completion */}
                    {accountCompletion < 100 && (
                      <div className="bg-card rounded-xl border border-border p-5">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-sm">Complete Your Profile</h3>
                          <span className="text-xs font-bold text-accent">{accountCompletion}%</span>
                        </div>
                        <Progress value={accountCompletion} className="h-2 mb-3" />
                        <div className="space-y-1.5">
                          {accountCompletionItems.map(item => (
                            <div key={item.label} className="flex items-center gap-2 text-xs">
                              {item.done ? <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(var(--success))]" /> : <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />}
                              <span className={cn(item.done ? 'text-muted-foreground line-through' : 'text-foreground')}>{item.label}</span>
                            </div>
                          ))}
                        </div>
                        <Button variant="outline" size="sm" className="w-full mt-3 text-xs" onClick={() => setActiveSection('profile')}>
                          Complete Now
                        </Button>
                      </div>
                    )}

                    <div className="bg-card rounded-xl border border-border p-5">
                      <h3 className="font-semibold mb-3 text-sm">Quick Actions</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { icon: Package, label: 'Orders', onClick: () => setActiveSection('orders'), bg: 'bg-primary/10', color: 'text-primary' },
                          { icon: Heart, label: 'Wishlist', onClick: () => navigate('/wishlist'), bg: 'bg-destructive/10', color: 'text-destructive' },
                          { icon: Tag, label: 'Coupons', onClick: () => setActiveSection('coupons'), bg: 'bg-accent/10', color: 'text-accent' },
                          { icon: Link2, label: 'Affiliate', onClick: () => setActiveSection('affiliate'), bg: 'bg-[hsl(var(--success))]/10', color: 'text-[hsl(var(--success))]' },
                          { icon: MapPin, label: 'Address', onClick: () => setActiveSection('addresses'), bg: 'bg-[hsl(var(--prime))]/10', color: 'text-[hsl(var(--prime))]' },
                          { icon: Settings, label: 'Settings', onClick: () => setActiveSection('settings'), bg: 'bg-violet-500/10', color: 'text-violet-500' },
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

                    {/* Affiliate Quick Card */}
                    <div className="bg-gradient-to-br from-accent/5 to-primary/5 rounded-xl border border-accent/20 p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <Link2 className="h-4 w-4 text-accent" />
                        <h3 className="text-sm font-semibold">Affiliate Program</h3>
                      </div>
                      {affiliateData?.status === 'approved' ? (
                        <div>
                          <p className="text-xs text-muted-foreground">Earnings: <span className="font-bold text-accent">৳{(affiliateData.total_earnings || 0).toFixed(0)}</span></p>
                          <Button variant="outline" size="sm" className="w-full mt-2 text-xs" onClick={() => setActiveSection('affiliate')}>
                            View Dashboard →
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs text-muted-foreground">Earn commissions by sharing products</p>
                          <Button variant="outline" size="sm" className="w-full mt-2 text-xs" onClick={() => navigate('/affiliate')}>
                            {affiliateData?.status === 'pending' ? 'Application Pending' : 'Join Now →'}
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Recent Activity */}
                    {recentActivity.length > 0 && (
                      <div className="bg-card rounded-xl border border-border p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <Activity className="h-4 w-4 text-muted-foreground" />
                          <h3 className="text-sm font-semibold">Recent Activity</h3>
                        </div>
                        <div className="space-y-3">
                          {recentActivity.map((act, i) => (
                            <div key={i} className="flex items-start gap-2.5">
                              <act.icon className={cn('h-3.5 w-3.5 mt-0.5 shrink-0', act.color)} />
                              <div className="min-w-0">
                                <p className="text-xs font-medium truncate">{act.title}</p>
                                <p className="text-[10px] text-muted-foreground">{format(new Date(act.time), 'MMM d, h:mm a')}</p>
                              </div>
                            </div>
                          ))}
                        </div>
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
                    {filteredOrders.map((order: any) => {
                      const isExpanded = expandedOrderId === order.id;
                      const hasReturnRequest = returnRequests.some((r: any) => r.order_id === order.id);

                      return (
                        <div key={order.id} className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-[var(--shadow-card)] transition-shadow">
                          {/* Order Header - Clickable */}
                          <button
                            onClick={() => toggleOrderTracking(order.id)}
                            className="w-full p-4 text-left hover:bg-secondary/30 transition-colors"
                          >
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
                              <div className="flex items-center gap-3">
                                <Badge variant="outline" className={cn('capitalize text-[10px]', statusColors[order.status])}>{order.status.replace('_', ' ')}</Badge>
                                <span className="font-bold">৳{order.total?.toFixed(2)}</span>
                                {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                              </div>
                            </div>
                            {/* Items Preview */}
                            {!isExpanded && order.order_items && (
                              <div className="flex items-center gap-2 mt-3">
                                {order.order_items.slice(0, 3).map((item: any) => (
                                  <img key={item.id} src={item.product_image || '/placeholder.svg'} alt="" className="w-10 h-10 rounded-md object-cover border border-border" />
                                ))}
                                {order.order_items.length > 3 && (
                                  <span className="text-xs text-muted-foreground">+{order.order_items.length - 3} more</span>
                                )}
                                <span className="text-xs text-muted-foreground ml-auto">{order.order_items.length} item{order.order_items.length > 1 ? 's' : ''}</span>
                              </div>
                            )}
                          </button>

                          {/* Expanded Order Details */}
                          {isExpanded && (
                            <div className="border-t border-border">
                              {/* Order Items */}
                              <div className="p-4 space-y-3">
                                <h4 className="text-sm font-semibold flex items-center gap-2">
                                  <Package className="h-4 w-4 text-muted-foreground" /> Order Items
                                </h4>
                                {(order.order_items || []).map((item: any) => (
                                  <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50">
                                    <img src={item.product_image || '/placeholder.svg'} alt={item.product_name} className="w-14 h-14 rounded-lg object-cover border border-border" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate">{item.product_name}</p>
                                      <p className="text-xs text-muted-foreground">Qty: {item.quantity} · ৳{Number(item.price).toFixed(2)} each</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <p className="text-sm font-bold">৳{(item.price * item.quantity).toFixed(2)}</p>
                                      {order.status === 'delivered' && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="text-[hsl(var(--rating))] text-xs h-7 px-2 mt-1"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const productRef = String(item.product_id || '');
                                            const slug = productSlugMap[productRef] || (!isUuidLike(productRef) ? productRef : '');
                                            if (slug) {
                                              navigate(`/product/${slug}#reviews`);
                                              return;
                                            }
                                            toast.error('Product not found');
                                          }}
                                        >
                                          <Star className="h-3 w-3 mr-1" /> Review
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Order Summary */}
                              <div className="px-4 pb-4">
                                <div className="bg-secondary/20 rounded-lg p-3 space-y-1.5 text-sm">
                                  <div className="flex justify-between text-muted-foreground">
                                    <span>Subtotal</span><span>৳{order.subtotal?.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between text-muted-foreground">
                                    <span>Shipping</span><span>৳{order.shipping?.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between text-muted-foreground">
                                    <span>Tax</span><span>৳{order.tax?.toFixed(2)}</span>
                                  </div>
                                  {order.discount > 0 && (
                                    <div className="flex justify-between text-[hsl(var(--success))]">
                                      <span>Discount</span><span>-৳{order.discount?.toFixed(2)}</span>
                                    </div>
                                  )}
                                  <Separator />
                                  <div className="flex justify-between font-bold">
                                    <span>Total</span><span>৳{order.total?.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between text-xs text-muted-foreground pt-1">
                                    <span>Payment: <span className="capitalize">{order.payment_method}</span></span>
                                    {order.tracking_number && <span>Tracking: {order.tracking_number}</span>}
                                  </div>
                                </div>
                              </div>

                              {/* Tracking Timeline */}
                              <div className="border-t border-border bg-secondary/10 p-4">
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

                              {/* Action Buttons */}
                              <div className="border-t border-border p-3 flex flex-wrap gap-2">
                                {/* Download Invoice - always available */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-[hsl(var(--success))] border-[hsl(var(--success))]/30 hover:bg-[hsl(var(--success))]/10"
                                  onClick={() => {
                                    const invoiceHtml = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Invoice #${order.order_number}</title>
<style>
body{font-family:Arial,sans-serif;margin:0;padding:40px;color:#333}
.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:30px;border-bottom:3px solid #f60;padding-bottom:20px}
.logo{font-size:24px;font-weight:bold;color:#f60}
.invoice-title{text-align:right}
.invoice-title h1{margin:0;font-size:28px;color:#333}
.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:30px}
.info-box h3{margin:0 0 8px;font-size:13px;color:#888;text-transform:uppercase}
.info-box p{margin:2px 0;font-size:14px}
table{width:100%;border-collapse:collapse;margin-bottom:30px}
th{background:#f8f8f8;padding:10px 12px;text-align:left;font-size:13px;border-bottom:2px solid #eee}
td{padding:10px 12px;border-bottom:1px solid #eee;font-size:14px}
.text-right{text-align:right}
.summary{margin-left:auto;width:280px}
.summary .row{display:flex;justify-content:space-between;padding:6px 0;font-size:14px}
.summary .total{border-top:2px solid #333;font-weight:bold;font-size:16px;padding-top:8px;margin-top:4px}
.footer{text-align:center;margin-top:40px;padding-top:20px;border-top:1px solid #eee;font-size:12px;color:#888}
</style></head><body>
<div class="header"><div class="logo">Grand Mall Emporium</div><div class="invoice-title"><h1>INVOICE</h1><p>#${order.order_number}</p><p>${format(new Date(order.created_at), 'MMMM d, yyyy')}</p></div></div>
<div class="info-grid"><div class="info-box"><h3>Order Info</h3><p>Status: ${order.status}</p><p>Payment: ${order.payment_method}</p>${order.tracking_number ? `<p>Tracking: ${order.tracking_number}</p>` : ''}</div><div class="info-box"><h3>Customer</h3><p>${profile?.first_name || ''} ${profile?.last_name || ''}</p><p>${user?.email || ''}</p>${profile?.phone ? `<p>${profile.phone}</p>` : ''}</div></div>
<table><thead><tr><th>Product</th><th class="text-right">Qty</th><th class="text-right">Price</th><th class="text-right">Total</th></tr></thead><tbody>
${(order.order_items || []).map((item: any) => `<tr><td>${item.product_name}</td><td class="text-right">${item.quantity}</td><td class="text-right">৳${Number(item.price).toFixed(2)}</td><td class="text-right">৳${(item.price * item.quantity).toFixed(2)}</td></tr>`).join('')}
</tbody></table>
<div class="summary"><div class="row"><span>Subtotal</span><span>৳${order.subtotal?.toFixed(2)}</span></div><div class="row"><span>Shipping</span><span>৳${order.shipping?.toFixed(2)}</span></div><div class="row"><span>Tax</span><span>৳${order.tax?.toFixed(2)}</span></div>${order.discount > 0 ? `<div class="row" style="color:green"><span>Discount</span><span>-৳${order.discount?.toFixed(2)}</span></div>` : ''}<div class="row total"><span>Total</span><span>৳${order.total?.toFixed(2)}</span></div></div>
<div class="footer"><p>Thank you for shopping with Grand Mall Emporium!</p><p>This is a computer-generated invoice.</p></div>
</body></html>`;
                                    const blob = new Blob([invoiceHtml], { type: 'text/html' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `invoice-${order.order_number}.html`;
                                    a.click();
                                    URL.revokeObjectURL(url);
                                    toast.success('Invoice downloaded!');
                                  }}
                                >
                                  <Download className="h-3.5 w-3.5 mr-1.5" />
                                  Download Invoice
                                </Button>

                                {/* Cancel - only pending */}
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

                                {/* Buy Again - delivered */}
                                {order.status === 'delivered' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-primary border-primary/30 hover:bg-primary/10"
                                    onClick={() => {
                                      if (order.order_items?.[0]) {
                                        navigate(`/product/${order.order_items[0].product_id}`);
                                      }
                                    }}
                                  >
                                    <RefreshCcw className="h-3.5 w-3.5 mr-1.5" />
                                    Buy Again
                                  </Button>
                                )}

                                {/* Return Order - only delivered & no existing return */}
                                {order.status === 'delivered' && !hasReturnRequest && order.order_items && (
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
                                    Return Order
                                  </Button>
                                )}

                                {/* Show return status if exists */}
                                {hasReturnRequest && (
                                  <Badge variant="outline" className="text-xs bg-accent/5 text-accent border-accent/20">
                                    <RotateCcw className="h-3 w-3 mr-1" />
                                    Return Requested
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ===== MY REVIEWS ===== */}
            {activeSection === 'reviews' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold">My Reviews</h2>
                  <p className="text-sm text-muted-foreground">{myReviews.length} reviews written</p>
                </div>

                {myReviews.length === 0 ? (
                  <div className="text-center py-16 bg-card rounded-xl border border-border">
                    <Star className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="font-medium">No reviews yet</p>
                    <p className="text-sm text-muted-foreground mt-1">Purchase and review products to see them here</p>
                    <Link to="/"><Button variant="accent" size="sm" className="mt-4">Browse Products</Button></Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myReviews.map((review: any) => {
                      const product = review.product;
                      const productRef = String(review.product_id || '');
                      const productSlug = product?.slug || productSlugMap[productRef] || (!isUuidLike(productRef) ? productRef : '');
                      const productLink = productSlug ? `/product/${productSlug}#reviews` : '';
                      return (
                        <div key={review.id} className="bg-card rounded-xl border border-border p-4 hover:shadow-[var(--shadow-card)] transition-shadow">
                          <div className="flex items-start gap-4">
                            {product?.images?.[0] && productLink && (
                              <Link to={productLink} className="shrink-0">
                                <img src={product.images[0]} alt={product.name} className="w-16 h-16 rounded-lg object-cover border border-border" />
                              </Link>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  {productLink ? (
                                    <Link to={productLink} className="font-semibold text-sm hover:text-accent transition-colors line-clamp-1">
                                      {product?.name || review.title || 'Product'}
                                    </Link>
                                  ) : (
                                    <p className="font-semibold text-sm line-clamp-1">{product?.name || review.title || 'Product'}</p>
                                  )}
                                  <div className="flex items-center gap-1 mt-1">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                      <Star key={i} className={cn('h-3.5 w-3.5', i < review.rating ? 'text-[hsl(var(--rating))] fill-[hsl(var(--rating))]' : 'text-muted-foreground/30')} />
                                    ))}
                                    <span className="text-xs text-muted-foreground ml-1">{review.rating}/5</span>
                                  </div>
                                </div>
                                <span className="text-[10px] text-muted-foreground shrink-0">
                                  {format(new Date(review.created_at), 'MMM d, yyyy')}
                                </span>
                              </div>
                              {review.title && <p className="font-medium text-sm mt-2">{review.title}</p>}
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{review.content}</p>
                              {review.images && review.images.length > 0 && (
                                <div className="flex gap-2 mt-2">
                                  {review.images.slice(0, 4).map((img: string, i: number) => (
                                    <img key={i} src={img} alt="" className="w-12 h-12 rounded-md object-cover border border-border" />
                                  ))}
                                </div>
                              )}
                              <div className="flex items-center gap-3 mt-2">
                                {review.verified_purchase && (
                                  <Badge variant="outline" className="text-[10px] text-[hsl(var(--success))] border-[hsl(var(--success))]/30">
                                    <CheckCircle2 className="h-2.5 w-2.5 mr-1" /> Verified Purchase
                                  </Badge>
                                )}
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                  <TrendingUp className="h-2.5 w-2.5" /> {review.helpful_count || 0} found helpful
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ===== RETURNS & CANCELLATIONS ===== */}
            {activeSection === 'returns' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold">Returns & Cancellations</h2>
                  <p className="text-sm text-muted-foreground">{returnRequests.length} return requests · {cancelledOrders.length} cancelled orders</p>
                </div>

                {/* Return Requests */}
                <div>
                  <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <RotateCcw className="h-4 w-4 text-accent" /> Return Requests
                  </h3>
                  {returnRequests.length === 0 ? (
                    <div className="text-center py-10 bg-card rounded-xl border border-border">
                      <RotateCcw className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                      <p className="font-medium text-sm">No return requests</p>
                      <p className="text-xs text-muted-foreground mt-1">Return requests will appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {returnRequests.map((req: any) => {
                        const returnStatusColors: Record<string, string> = {
                          pending: 'bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]',
                          under_review: 'bg-primary/10 text-primary',
                          approved: 'bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]',
                          rejected: 'bg-destructive/10 text-destructive',
                          refunded: 'bg-accent/10 text-accent',
                        };
                        return (
                          <div key={req.id} className="bg-card rounded-xl border border-border p-4 hover:shadow-[var(--shadow-card)] transition-shadow">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
                                  <RotateCcw className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div>
                                  <p className="font-semibold text-sm">Order #{req.orders?.order_number || '—'}</p>
                                  <p className="text-xs text-muted-foreground">{format(new Date(req.created_at), 'MMM d, yyyy')}</p>
                                </div>
                              </div>
                              <Badge variant="outline" className={cn('text-[10px] capitalize', returnStatusColors[req.status] || '')}>
                                {req.status?.replace('_', ' ')}
                              </Badge>
                            </div>

                            {/* Return Tracking Number */}
                            {req.return_tracking_number && (
                              <div className="bg-accent/5 border border-accent/20 rounded-lg p-3 mb-3 flex items-center justify-between">
                                <div>
                                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Tracking Number</p>
                                  <code className="text-sm font-bold text-accent">{req.return_tracking_number}</code>
                                </div>
                                <div className="flex gap-1">
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { navigator.clipboard.writeText(req.return_tracking_number); toast.success('Copied!'); }}>
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                  <ReturnReceipt
                                    trackingNumber={req.return_tracking_number}
                                    orderNumber={req.orders?.order_number || ''}
                                    reason={req.reason}
                                    description={req.description}
                                    refundMethod={req.refund_method}
                                    refundAmount={req.refund_amount}
                                    status={req.status}
                                    createdAt={req.created_at}
                                  />
                                </div>
                              </div>
                            )}
                            <div className="bg-secondary/30 rounded-lg p-3 space-y-1.5">
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Reason</span>
                                <span className="font-medium capitalize">{req.reason?.replace(/_/g, ' ')}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Refund Method</span>
                                <span className="font-medium capitalize">{req.refund_method || '—'}</span>
                              </div>
                              {req.refund_amount && (
                                <div className="flex justify-between text-xs">
                                  <span className="text-muted-foreground">Refund Amount</span>
                                  <span className="font-bold text-[hsl(var(--success))]">৳{req.refund_amount}</span>
                                </div>
                              )}
                              {req.description && (
                                <p className="text-xs text-muted-foreground pt-1 border-t border-border mt-1">{req.description}</p>
                              )}
                            </div>
                            {/* Progress tracker */}
                            {(() => {
                              const isRejected = req.status === 'rejected';
                              const steps = isRejected
                                ? ['pending', 'approved', 'rejected']
                                : ['pending', 'approved', 'refunded'];
                              const stepLabels = isRejected
                                ? ['Requested', 'Approved', 'Rejected']
                                : ['Requested', 'Approved', 'Refunded'];
                              const currentIdx = steps.indexOf(req.status);
                              return (
                                <>
                                  <div className="flex items-center gap-1 mt-3">
                                    {steps.map((step, i) => {
                                      const isActive = i <= currentIdx;
                                      return (
                                        <div key={step} className="flex-1 flex items-center gap-1">
                                          <div className={cn(
                                            'w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 transition-colors',
                                            isRejected && step === 'rejected' ? 'bg-destructive text-destructive-foreground' :
                                            isActive ? 'bg-accent text-accent-foreground' : 'bg-secondary text-muted-foreground'
                                          )}>
                                            {isRejected && step === 'rejected' ? <X className="h-3 w-3" /> :
                                             isActive ? <CheckCircle2 className="h-3 w-3" /> : i + 1}
                                          </div>
                                          {i < steps.length - 1 && (
                                            <div className={cn('h-0.5 flex-1 rounded transition-colors', isActive && i < currentIdx ? 'bg-accent' : 'bg-border')} />
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                  <div className="flex justify-between text-[9px] text-muted-foreground mt-1 px-1">
                                    {stepLabels.map((label) => (
                                      <span key={label}>{label}</span>
                                    ))}
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Cancelled Orders */}
                <div>
                  <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-destructive" /> Cancelled Orders
                  </h3>
                  {cancelledOrders.length === 0 ? (
                    <div className="text-center py-10 bg-card rounded-xl border border-border">
                      <XCircle className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                      <p className="font-medium text-sm">No cancelled orders</p>
                      <p className="text-xs text-muted-foreground mt-1">Cancelled orders will appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {cancelledOrders.map((order: any) => (
                        <div key={order.id} className="bg-card rounded-xl border border-border p-4 hover:shadow-[var(--shadow-card)] transition-shadow">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
                                <XCircle className="h-4 w-4 text-destructive" />
                              </div>
                              <div>
                                <p className="font-semibold text-sm">Order #{order.order_number}</p>
                                <p className="text-xs text-muted-foreground">{format(new Date(order.created_at), 'MMM d, yyyy')}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge variant="outline" className="text-[10px] text-destructive border-destructive/30">Cancelled</Badge>
                              <p className="text-sm font-bold mt-1">৳{order.total?.toFixed(2)}</p>
                            </div>
                          </div>
                          {order.order_items && order.order_items.length > 0 && (
                            <div className="mt-3 space-y-1.5">
                              {order.order_items.slice(0, 3).map((item: any) => (
                                <div key={item.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span className="w-1 h-1 rounded-full bg-muted-foreground shrink-0" />
                                  <span className="truncate">{item.product_name} × {item.quantity}</span>
                                  <span className="ml-auto shrink-0 font-medium">৳{(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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

            {/* ===== AFFILIATE ===== */}
            {activeSection === 'affiliate' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold">Affiliate Program</h2>
                    <p className="text-sm text-muted-foreground">Earn commissions by sharing products</p>
                  </div>
                  <Link to="/affiliate"><Button variant="outline" size="sm" className="gap-1.5">Full Dashboard <ArrowUpRight className="h-3.5 w-3.5" /></Button></Link>
                </div>

                {affiliateData?.status === 'approved' ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      {[
                        { label: 'Total Clicks', value: affiliateData.total_clicks || 0, color: 'text-primary' },
                        { label: 'Conversions', value: affiliateData.total_conversions || 0, color: 'text-[hsl(var(--success))]' },
                        { label: 'Earnings', value: `৳${(affiliateData.total_earnings || 0).toFixed(0)}`, color: 'text-accent' },
                        { label: 'Pending', value: `৳${((affiliateData.total_earnings || 0) - (affiliateData.total_paid || 0)).toFixed(0)}`, color: 'text-[hsl(var(--warning))]' },
                      ].map(s => (
                        <div key={s.label} className="bg-card rounded-xl border border-border p-4 text-center">
                          <p className={cn('text-xl font-bold', s.color)}>{s.value}</p>
                          <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                        </div>
                      ))}
                    </div>
                    <div className="bg-card rounded-xl border border-border p-5">
                      <h3 className="font-semibold mb-2">Your Referral Code</h3>
                      <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                        <code className="text-lg font-mono font-bold text-accent flex-1">{affiliateData.referral_code}</code>
                        <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}?ref=${affiliateData.referral_code}`); toast.success('Link copied!'); }}>
                          <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy Link
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">Commission Rate: {affiliateData.commission_rate}%</p>
                    </div>
                  </div>
                ) : affiliateData?.status === 'pending' ? (
                  <div className="bg-card rounded-xl border border-border p-8 text-center">
                    <Clock className="h-10 w-10 text-[hsl(var(--warning))] mx-auto mb-3" />
                    <h3 className="font-semibold">Application Under Review</h3>
                    <p className="text-sm text-muted-foreground mt-1">Your affiliate application is being reviewed.</p>
                  </div>
                ) : (
                  <div className="bg-card rounded-xl border border-border p-8 text-center">
                    <Link2 className="h-10 w-10 text-accent mx-auto mb-3" />
                    <h3 className="font-semibold">Join Our Affiliate Program</h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">Earn up to 12% commission by sharing products you love.</p>
                    <Link to="/affiliate"><Button variant="accent" size="sm" className="mt-4">Join Now — It's Free</Button></Link>
                  </div>
                )}
              </div>
            )}

            {/* ===== SETTINGS (Security + Notifications combined) ===== */}
            {activeSection === 'settings' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold">Settings</h2>

                {/* Security */}
                <div className="bg-card rounded-xl border border-border p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Shield className="h-5 w-5 text-accent" />
                    <h3 className="font-semibold">Security</h3>
                  </div>
                  <div className="space-y-4 max-w-md">
                    <div className="space-y-2"><Label>New Password</Label><Input type="password" value={passwordData.newPassword} onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})} /></div>
                    <div className="space-y-2"><Label>Confirm Password</Label><Input type="password" value={passwordData.confirmPassword} onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})} /></div>
                    <Button onClick={handlePasswordChange} disabled={isSaving || !passwordData.newPassword} className="gap-2">
                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />} Update Password
                    </Button>
                  </div>
                </div>

                {/* Notification Preferences */}
                <div className="bg-card rounded-xl border border-border p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Bell className="h-5 w-5 text-accent" />
                    <h3 className="font-semibold">Notification Preferences</h3>
                  </div>
                  <div className="space-y-5">
                    {[
                      { key: 'orderUpdates', title: 'Order Updates', desc: 'Get notified about order status changes' },
                      { key: 'promotions', title: 'Promotions & Deals', desc: 'Receive exclusive offers and discounts' },
                      { key: 'recommendations', title: 'Product Recommendations', desc: 'Personalized product suggestions' },
                      { key: 'reviewReminders', title: 'Review Reminders', desc: 'Reminders to review purchased products' },
                      { key: 'wishlistAlerts', title: 'Wishlist Alerts', desc: 'Price drops on wishlist items' },
                      { key: 'flashSaleAlerts', title: 'Flash Sale Alerts', desc: 'Get notified when flash sales start' },
                    ].map((pref) => (
                      <div key={pref.key} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{pref.title}</p>
                          <p className="text-xs text-muted-foreground">{pref.desc}</p>
                        </div>
                        <Switch
                          checked={(notifPrefs as any)[pref.key]}
                          onCheckedChange={(v) => setNotifPrefs(prev => ({ ...prev, [pref.key]: v }))}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Account Info */}
                <div className="bg-card rounded-xl border border-border p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <User className="h-5 w-5 text-accent" />
                    <h3 className="font-semibold">Account Information</h3>
                  </div>
                  <div className="space-y-3 text-sm">
                    {[
                      { label: 'Email', value: user.email },
                      { label: 'Account Created', value: memberSince },
                      { label: 'Last Sign In', value: user.last_sign_in_at ? format(new Date(user.last_sign_in_at), 'MMM d, yyyy h:mm a') : '—' },
                      { label: 'Member Level', value: levelConfig[memberLevel].label },
                      { label: 'Profile Completion', value: `${accountCompletion}%` },
                    ].map((r) => (
                      <div key={r.label} className="flex justify-between py-2.5 border-b border-border last:border-0">
                        <span className="text-muted-foreground">{r.label}</span>
                        <span className="font-medium">{r.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="bg-destructive/5 rounded-xl border border-destructive/20 p-6">
                  <h3 className="font-semibold text-destructive mb-2">Danger Zone</h3>
                  <p className="text-sm text-muted-foreground mb-4">Sign out of your account on this device.</p>
                  <Button variant="destructive" size="sm" onClick={handleSignOut} className="gap-2"><LogOut className="h-4 w-4" /> Sign Out</Button>
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

export default Account;
