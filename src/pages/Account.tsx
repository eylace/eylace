import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User, MapPin, Package, Heart, Settings, Shield, CreditCard,
  Bell, ChevronRight, Loader2, Save, Camera, Mail, Phone,
  Calendar, Star, ShoppingBag, Clock, LogOut, Edit2, Check, X, Upload,
  Gift, Award, Ticket, TrendingUp, Sparkles, Crown, Truck
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
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

const Account = () => {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading, updateProfile, signOut } = useAuth();
  const { t } = useLanguage();
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [orderCount, setOrderCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  const [profileData, setProfileData] = useState({
    first_name: '', last_name: '', phone: '',
  });
  const [addressData, setAddressData] = useState({
    address: '', apartment: '', city: '', state: '', zip_code: '', country: 'BD',
  });
  const [passwordData, setPasswordData] = useState({
    newPassword: '', confirmPassword: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }
    if (profile) {
      setProfileData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || '',
      });
      setAddressData({
        address: profile.address || '',
        apartment: profile.apartment || '',
        city: profile.city || '',
        state: profile.state || '',
        zip_code: profile.zip_code || '',
        country: profile.country || 'BD',
      });
    }
  }, [user, profile, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    const [ordersRes, reviewsRes, recentRes] = await Promise.all([
      supabase.from('orders').select('id', { count: 'exact', head: true }),
      supabase.from('product_reviews').select('id', { count: 'exact', head: true }),
      supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }).limit(5),
    ]);
    setOrderCount(ordersRes.count || 0);
    setReviewCount(reviewsRes.count || 0);
    setRecentOrders(recentRes.data || []);
  };

  const handleProfileSave = async () => {
    const validation = profileSchema.safeParse(profileData);
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }
    setIsSaving(true);
    const { error } = await updateProfile(profileData);
    setIsSaving(false);
    if (error) {
      toast.error('Failed to update profile');
    } else {
      toast.success('Profile updated successfully');
      setIsEditingProfile(false);
    }
  };

  const handleAddressSave = async () => {
    const validation = addressSchema.safeParse(addressData);
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }
    setIsSaving(true);
    const { error } = await updateProfile(addressData);
    setIsSaving(false);
    if (error) {
      toast.error('Failed to update address');
    } else {
      toast.success('Address updated successfully');
      setIsEditingAddress(false);
    }
  };

  const handlePasswordChange = async () => {
    const validation = passwordSchema.safeParse(passwordData);
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }
    setIsSaving(true);
    const { error } = await supabase.auth.updateUser({ password: passwordData.newPassword });
    setIsSaving(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Password updated successfully');
      setPasswordData({ newPassword: '', confirmPassword: '' });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initials = `${(profile?.first_name || '')[0] || ''}${(profile?.last_name || '')[0] || ''}`.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U';
  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'Customer';
  const memberSince = user?.created_at ? format(new Date(user.created_at), 'MMMM yyyy') : '';

  // Calculate member level based on order count
  const memberLevel = orderCount >= 20 ? 'platinum' : orderCount >= 10 ? 'gold' : 'silver';
  const rewardPoints = orderCount * 50; // 50 points per order
  const nextLevelPoints = memberLevel === 'silver' ? 500 : memberLevel === 'gold' ? 1000 : 2000;
  const progressToNext = Math.min((rewardPoints / nextLevelPoints) * 100, 100);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2MB');
      return;
    }

    setAvatarUploading(true);
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/avatar.${fileExt}`;

    await supabase.storage.from('avatars').remove([filePath]);

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast.error('Failed to upload avatar');
      setAvatarUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
    const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    const { error: updateError } = await updateProfile({ avatar_url: avatarUrl } as any);
    setAvatarUploading(false);

    if (updateError) {
      toast.error('Failed to update profile');
    } else {
      toast.success('Avatar updated!');
    }
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]',
    processing: 'bg-primary/10 text-primary',
    shipped: 'bg-[hsl(var(--prime))]/10 text-[hsl(var(--prime))]',
    delivered: 'bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]',
    cancelled: 'bg-destructive/10 text-destructive',
  };

  const levelColors: Record<string, string> = {
    silver: 'from-slate-300 to-slate-400',
    gold: 'from-amber-400 to-yellow-500',
    platinum: 'from-violet-400 to-purple-500',
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="container-main py-12 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      </Layout>
    );
  }

  if (!user) return null;

  return (
    <Layout>
      <div className="container-main py-8">
        <div className="max-w-5xl mx-auto">
          {/* Profile Hero */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden mb-8">
            <div className="h-36 bg-gradient-to-r from-primary via-primary/80 to-accent/60 relative">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9zdmc+')] opacity-40" />
            </div>
            <div className="px-6 pb-6 -mt-14">
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                <div className="relative">
                  <Avatar className="h-28 w-28 border-4 border-card shadow-xl ring-2 ring-accent/20">
                    <AvatarImage src={(profile as any)?.avatar_url || ''} />
                    <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-accent to-accent/70 text-accent-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={avatarUploading}
                    className="absolute bottom-1 right-1 bg-accent text-accent-foreground rounded-full p-2 shadow-lg hover:bg-accent/90 transition-all hover:scale-105"
                  >
                    {avatarUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </div>
                <div className="flex-1 pt-2">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold">{fullName}</h1>
                    <Badge className={cn('text-xs font-medium text-white bg-gradient-to-r', levelColors[memberLevel])}>
                      <Crown className="h-3 w-3 mr-1" />
                      {t(`account.${memberLevel}`)}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" />
                      {user.email}
                    </span>
                    {profile?.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5" />
                        {profile.phone}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {t('account.memberSince')} {memberSince}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { setActiveTab('profile'); setIsEditingProfile(true); }}>
                    <Edit2 className="h-3.5 w-3.5" /> {t('account.editProfile')}
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive" onClick={handleSignOut}>
                    <LogOut className="h-3.5 w-3.5" /> {t('account.signOut')}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: t('account.totalOrders'), value: orderCount, icon: Package, color: 'text-primary', bg: 'bg-primary/10', link: '/orders' },
              { label: t('account.rewardPoints'), value: rewardPoints, icon: Gift, color: 'text-accent', bg: 'bg-accent/10', link: '#' },
              { label: t('account.reviews'), value: reviewCount, icon: Star, color: 'text-[hsl(var(--rating))]', bg: 'bg-[hsl(var(--rating))]/10', link: '#' },
              { label: t('account.addresses'), value: addressData.address ? 1 : 0, icon: MapPin, color: 'text-[hsl(var(--success))]', bg: 'bg-[hsl(var(--success))]/10', link: '#addresses' },
            ].map((stat) => (
              <Link key={stat.label} to={stat.link} className="bg-card rounded-xl border border-border p-5 hover:shadow-[var(--shadow-card-hover)] transition-all group">
                <div className="flex items-center justify-between mb-3">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', stat.bg)}>
                    <stat.icon className={cn('h-5 w-5', stat.color)} />
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </Link>
            ))}
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 mb-6 h-auto">
              <TabsTrigger value="overview" className="gap-1.5 text-xs sm:text-sm py-2.5">
                <User className="h-4 w-4 hidden sm:block" /> {t('account.overview')}
              </TabsTrigger>
              <TabsTrigger value="profile" className="gap-1.5 text-xs sm:text-sm py-2.5">
                <Edit2 className="h-4 w-4 hidden sm:block" /> {t('account.profile')}
              </TabsTrigger>
              <TabsTrigger value="addresses" className="gap-1.5 text-xs sm:text-sm py-2.5">
                <MapPin className="h-4 w-4 hidden sm:block" /> {t('account.addresses')}
              </TabsTrigger>
              <TabsTrigger value="rewards" className="gap-1.5 text-xs sm:text-sm py-2.5">
                <Gift className="h-4 w-4 hidden sm:block" /> {t('account.rewardPoints')}
              </TabsTrigger>
              <TabsTrigger value="security" className="gap-1.5 text-xs sm:text-sm py-2.5">
                <Shield className="h-4 w-4 hidden sm:block" /> {t('account.security')}
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-1.5 text-xs sm:text-sm py-2.5">
                <Bell className="h-4 w-4 hidden sm:block" /> {t('account.notifications')}
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Reward Points Summary */}
              <div className="bg-gradient-to-r from-accent/5 via-accent/10 to-primary/5 rounded-xl border border-accent/20 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-accent/15 rounded-xl flex items-center justify-center">
                      <Sparkles className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{t('account.rewardPoints')}</h3>
                      <p className="text-sm text-muted-foreground">{t('account.earnMore')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-accent">{rewardPoints}</p>
                    <p className="text-xs text-muted-foreground">{t('account.pointsBalance')}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{t(`account.${memberLevel}`)}</span>
                    <span>{rewardPoints}/{nextLevelPoints}</span>
                  </div>
                  <Progress value={progressToNext} className="h-2" />
                </div>
              </div>

              {/* Recent Orders */}
              <div className="bg-card rounded-xl border border-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">{t('account.recentOrders')}</h2>
                  <Link to="/orders">
                    <Button variant="ghost" size="sm" className="gap-1 text-accent hover:text-accent">
                      {t('account.viewAll')} <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
                {recentOrders.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground font-medium mb-1">{t('account.noOrders')}</p>
                    <p className="text-sm text-muted-foreground mb-4">{t('account.earnMore')}</p>
                    <Link to="/">
                      <Button variant="accent" size="sm">{t('account.startShopping')}</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentOrders.map((order: any) => (
                      <Link key={order.id} to="/orders" className="flex items-center gap-4 p-4 rounded-xl hover:bg-secondary/50 transition-colors border border-transparent hover:border-border">
                        <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center shrink-0">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">Order #{order.order_number}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(order.created_at), 'MMM d, yyyy')} · {order.order_items?.length || 0} {t('common.items')}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className={cn('capitalize text-xs', statusColors[order.status])}>
                            {order.status}
                          </Badge>
                          <p className="text-sm font-semibold mt-1">৳{order.total.toFixed(2)}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Links */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { label: t('account.myWishlist'), desc: t('account.viewSavedProducts'), icon: Heart, link: '/wishlist', color: 'text-destructive', bg: 'bg-destructive/10' },
                  { label: t('account.orderHistory'), desc: t('account.trackAllOrders'), icon: Clock, link: '/orders', color: 'text-primary', bg: 'bg-primary/10' },
                  { label: t('account.accountSettings'), desc: t('account.updatePersonalInfo'), icon: Settings, link: '#', onClick: () => setActiveTab('profile'), color: 'text-accent', bg: 'bg-accent/10' },
                  { label: t('account.sellOnEylace'), desc: t('account.startYourStore'), icon: ShoppingBag, link: '/sell', color: 'text-[hsl(var(--success))]', bg: 'bg-[hsl(var(--success))]/10' },
                  { label: t('account.supportTickets'), desc: t('account.noTickets'), icon: Ticket, link: '#', color: 'text-[hsl(var(--warning))]', bg: 'bg-[hsl(var(--warning))]/10' },
                  { label: t('account.memberBenefits'), desc: t('account.exclusiveDeals'), icon: Award, link: '#', onClick: () => setActiveTab('rewards'), color: 'text-violet-500', bg: 'bg-violet-500/10' },
                ].map((item) => (
                  <Link
                    key={item.label}
                    to={item.link}
                    onClick={item.onClick}
                    className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border hover:shadow-[var(--shadow-card-hover)] transition-all group"
                  >
                    <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', item.bg)}>
                      <item.icon className={cn('h-5 w-5', item.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{item.label}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.desc}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ))}
              </div>
            </TabsContent>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <div className="bg-card rounded-xl border border-border p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold">{t('account.personalInfo')}</h2>
                  {!isEditingProfile ? (
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setIsEditingProfile(true)}>
                      <Edit2 className="h-3.5 w-3.5" /> {t('account.edit')}
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setIsEditingProfile(false)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {isEditingProfile ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first_name">{t('account.firstName')}</Label>
                        <Input id="first_name" value={profileData.first_name} onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })} placeholder={t('account.firstName')} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last_name">{t('account.lastName')}</Label>
                        <Input id="last_name" value={profileData.last_name} onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })} placeholder={t('account.lastName')} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">{t('account.email')}</Label>
                      <Input id="email" value={user.email || ''} disabled className="bg-secondary" />
                      <p className="text-xs text-muted-foreground">{t('account.emailCannotChange')}</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">{t('account.phoneNumber')}</Label>
                      <Input id="phone" type="tel" value={profileData.phone} onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })} placeholder="+880 1XXX-XXXXXX" />
                    </div>
                    <Separator />
                    <Button onClick={handleProfileSave} disabled={isSaving} className="gap-2">
                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      {t('account.saveChanges')}
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {[
                      { label: t('account.firstName'), value: profile?.first_name || '—' },
                      { label: t('account.lastName'), value: profile?.last_name || '—' },
                      { label: t('account.email'), value: user.email || '—' },
                      { label: t('account.phoneNumber'), value: profile?.phone || '—' },
                    ].map((field) => (
                      <div key={field.label}>
                        <p className="text-sm text-muted-foreground mb-1">{field.label}</p>
                        <p className="font-medium">{field.value}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Linked Accounts */}
              <div className="bg-card rounded-xl border border-border p-6">
                <h2 className="text-lg font-semibold mb-4">{t('account.linkedAccounts')}</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <div className="flex items-center gap-3">
                      <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                      <span className="text-sm font-medium">Google</span>
                    </div>
                    <Badge variant="outline" className="text-xs">{user.app_metadata?.provider === 'google' ? t('account.googleLinked') : 'Not linked'}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-accent" />
                      <span className="text-sm font-medium">{t('auth.phoneNumber')}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">{profile?.phone ? t('account.phoneLinked') : 'Not linked'}</Badge>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Addresses Tab */}
            <TabsContent value="addresses" className="space-y-6">
              <div className="bg-card rounded-xl border border-border p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold">{t('account.shippingAddress')}</h2>
                  {!isEditingAddress ? (
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setIsEditingAddress(true)}>
                      <Edit2 className="h-3.5 w-3.5" /> {t('account.edit')}
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm" onClick={() => setIsEditingAddress(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {isEditingAddress ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="address">{t('account.streetAddress')}</Label>
                      <Input id="address" value={addressData.address} onChange={(e) => setAddressData({ ...addressData, address: e.target.value })} placeholder={t('account.streetAddress')} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="apartment">{t('account.apartmentOptional')}</Label>
                      <Input id="apartment" value={addressData.apartment} onChange={(e) => setAddressData({ ...addressData, apartment: e.target.value })} placeholder="Apt, Suite, Unit" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">{t('account.city')}</Label>
                        <Input id="city" value={addressData.city} onChange={(e) => setAddressData({ ...addressData, city: e.target.value })} placeholder={t('account.city')} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">{t('account.stateDivision')}</Label>
                        <Input id="state" value={addressData.state} onChange={(e) => setAddressData({ ...addressData, state: e.target.value })} placeholder={t('account.stateDivision')} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="zip_code">{t('account.zipCode')}</Label>
                        <Input id="zip_code" value={addressData.zip_code} onChange={(e) => setAddressData({ ...addressData, zip_code: e.target.value })} placeholder={t('account.zipCode')} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country">{t('account.country')}</Label>
                        <Select value={addressData.country} onValueChange={(v) => setAddressData({ ...addressData, country: v })}>
                          <SelectTrigger><SelectValue placeholder={t('account.country')} /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="BD">Bangladesh</SelectItem>
                            <SelectItem value="US">United States</SelectItem>
                            <SelectItem value="UK">United Kingdom</SelectItem>
                            <SelectItem value="IN">India</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Separator />
                    <Button onClick={handleAddressSave} disabled={isSaving} className="gap-2">
                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      {t('account.saveAddress')}
                    </Button>
                  </div>
                ) : (
                  <div>
                    {addressData.address ? (
                      <div className="flex items-start gap-4 p-4 bg-secondary/50 rounded-xl">
                        <MapPin className="h-5 w-5 text-accent mt-0.5 shrink-0" />
                        <div>
                          <p className="font-medium">{t('account.defaultShipping')}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {[addressData.address, addressData.apartment, addressData.city, addressData.state, addressData.zip_code].filter(Boolean).join(', ')}
                          </p>
                          <p className="text-sm text-muted-foreground">{addressData.country}</p>
                        </div>
                        <Badge variant="outline" className="ml-auto shrink-0">{t('account.default')}</Badge>
                      </div>
                    ) : (
                      <div className="text-center py-10">
                        <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <MapPin className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground mb-3">{t('account.noAddressSaved')}</p>
                        <Button variant="outline" size="sm" onClick={() => setIsEditingAddress(true)}>
                          {t('account.addAddress')}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Rewards Tab */}
            <TabsContent value="rewards" className="space-y-6">
              <div className="bg-gradient-to-br from-accent/5 via-card to-primary/5 rounded-xl border border-accent/20 p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className={cn('w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br', levelColors[memberLevel])}>
                    <Crown className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{t(`account.${memberLevel}`)} {t('account.accountLevel')}</h2>
                    <p className="text-muted-foreground">{rewardPoints} {t('account.pointsBalance')}</p>
                  </div>
                </div>
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('account.redeemableValue')}</span>
                    <span className="font-semibold text-accent">৳{(rewardPoints * 0.1).toFixed(0)}</span>
                  </div>
                  <Progress value={progressToNext} className="h-3" />
                  <p className="text-xs text-muted-foreground text-center">
                    {nextLevelPoints - rewardPoints} points to next level
                  </p>
                </div>
              </div>

              <div className="bg-card rounded-xl border border-border p-6">
                <h3 className="font-semibold mb-4">{t('account.memberBenefits')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { icon: Truck, text: t('account.freeShipping'), active: memberLevel !== 'silver' },
                    { icon: Sparkles, text: t('account.exclusiveDeals'), active: true },
                    { icon: TrendingUp, text: t('account.earlyAccess'), active: memberLevel === 'platinum' },
                    { icon: Shield, text: t('account.prioritySupport'), active: memberLevel !== 'silver' },
                  ].map((benefit) => (
                    <div key={benefit.text} className={cn('flex items-center gap-3 p-3 rounded-lg', benefit.active ? 'bg-accent/5 border border-accent/20' : 'bg-secondary/50 opacity-60')}>
                      <benefit.icon className={cn('h-5 w-5', benefit.active ? 'text-accent' : 'text-muted-foreground')} />
                      <span className="text-sm font-medium">{benefit.text}</span>
                      {benefit.active && <Check className="h-4 w-4 text-accent ml-auto" />}
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="space-y-6">
              <div className="bg-card rounded-xl border border-border p-6">
                <h2 className="text-lg font-semibold mb-6">{t('account.changePassword')}</h2>
                <div className="space-y-4 max-w-md">
                  <div className="space-y-2">
                    <Label htmlFor="new_password">{t('account.newPassword')}</Label>
                    <Input
                      id="new_password"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      placeholder={t('account.newPassword')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm_password">{t('account.confirmPassword')}</Label>
                    <Input
                      id="confirm_password"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      placeholder={t('account.confirmPassword')}
                    />
                  </div>
                  <Button onClick={handlePasswordChange} disabled={isSaving || !passwordData.newPassword} className="gap-2">
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                    {t('account.updatePassword')}
                  </Button>
                </div>
              </div>

              <div className="bg-card rounded-xl border border-border p-6">
                <h2 className="text-lg font-semibold mb-4">{t('account.accountInfo')}</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-3 border-b border-border">
                    <span className="text-muted-foreground">{t('account.email')}</span>
                    <span className="font-medium">{user.email}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-border">
                    <span className="text-muted-foreground">{t('account.accountCreated')}</span>
                    <span className="font-medium">{memberSince}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-border">
                    <span className="text-muted-foreground">{t('account.lastSignIn')}</span>
                    <span className="font-medium">{user.last_sign_in_at ? format(new Date(user.last_sign_in_at), 'MMM d, yyyy h:mm a') : '—'}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-border">
                    <span className="text-muted-foreground">{t('account.accountLevel')}</span>
                    <Badge className={cn('text-xs font-medium text-white bg-gradient-to-r', levelColors[memberLevel])}>
                      <Crown className="h-3 w-3 mr-1" />
                      {t(`account.${memberLevel}`)}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="bg-destructive/5 rounded-xl border border-destructive/20 p-6">
                <h2 className="text-lg font-semibold text-destructive mb-2">{t('account.dangerZone')}</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('account.signOutDesc')}
                </p>
                <Button variant="destructive" size="sm" onClick={handleSignOut} className="gap-2">
                  <LogOut className="h-4 w-4" /> {t('account.signOutOfAccount')}
                </Button>
              </div>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-6">
              <div className="bg-card rounded-xl border border-border p-6">
                <h2 className="text-lg font-semibold mb-6">{t('account.notificationPrefs')}</h2>
                <div className="space-y-6">
                  {[
                    { title: t('account.orderUpdates'), desc: t('account.orderUpdatesDesc'), defaultChecked: true },
                    { title: t('account.promotionsDeals'), desc: t('account.promotionsDesc'), defaultChecked: false },
                    { title: t('account.productRecommendations'), desc: t('account.productRecommendationsDesc'), defaultChecked: false },
                    { title: t('account.reviewReminders'), desc: t('account.reviewRemindersDesc'), defaultChecked: true },
                    { title: t('account.wishlistAlerts'), desc: t('account.wishlistAlertsDesc'), defaultChecked: true },
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
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default Account;
