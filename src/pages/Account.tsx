import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User, MapPin, Package, Heart, Settings, Shield, CreditCard,
  Bell, ChevronRight, Loader2, Save, Camera, Mail, Phone,
  Calendar, Star, ShoppingBag, Clock, LogOut, Edit2, Check, X
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
import { useAuth } from '@/contexts/AuthContext';
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
    const [ordersRes, wishlistRes, reviewsRes, recentRes] = await Promise.all([
      supabase.from('orders').select('id', { count: 'exact', head: true }),
      supabase.from('wishlist').select('id', { count: 'exact', head: true }),
      supabase.from('product_reviews').select('id', { count: 'exact', head: true }),
      supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }).limit(3),
    ]);
    setOrderCount(ordersRes.count || 0);
    setWishlistCount(wishlistRes.count || 0);
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

  const initials = `${(profile?.first_name || '')[0] || ''}${(profile?.last_name || '')[0] || ''}`.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U';
  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'Customer';
  const memberSince = user?.created_at ? format(new Date(user.created_at), 'MMMM yyyy') : '';

  const statusColors: Record<string, string> = {
    pending: 'bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]',
    processing: 'bg-primary/10 text-primary',
    shipped: 'bg-[hsl(var(--prime))]/10 text-[hsl(var(--prime))]',
    delivered: 'bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]',
    cancelled: 'bg-destructive/10 text-destructive',
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
            <div className="h-32 bg-gradient-to-r from-primary to-primary/70" />
            <div className="px-6 pb-6 -mt-12">
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                <Avatar className="h-24 w-24 border-4 border-card shadow-lg">
                  <AvatarImage src="" />
                  <AvatarFallback className="text-2xl font-bold bg-accent text-accent-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 pt-2">
                  <h1 className="text-2xl font-bold">{fullName}</h1>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
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
                      Member since {memberSince}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { setActiveTab('profile'); setIsEditingProfile(true); }}>
                    <Edit2 className="h-3.5 w-3.5" /> Edit Profile
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive" onClick={handleSignOut}>
                    <LogOut className="h-3.5 w-3.5" /> Sign Out
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Orders', value: orderCount, icon: Package, color: 'text-primary', link: '/orders' },
              { label: 'Wishlist', value: wishlistCount, icon: Heart, color: 'text-destructive', link: '/wishlist' },
              { label: 'Reviews', value: reviewCount, icon: Star, color: 'text-[hsl(var(--rating))]', link: '#' },
              { label: 'Addresses', value: addressData.address ? 1 : 0, icon: MapPin, color: 'text-[hsl(var(--success))]', link: '#addresses' },
            ].map((stat) => (
              <Link key={stat.label} to={stat.link} className="bg-card rounded-xl border border-border p-4 hover:shadow-[var(--shadow-card-hover)] transition-all group">
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className={cn('h-5 w-5', stat.color)} />
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </Link>
            ))}
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-5 mb-6 h-auto">
              <TabsTrigger value="overview" className="gap-1.5 text-xs sm:text-sm py-2.5">
                <User className="h-4 w-4 hidden sm:block" /> Overview
              </TabsTrigger>
              <TabsTrigger value="profile" className="gap-1.5 text-xs sm:text-sm py-2.5">
                <Edit2 className="h-4 w-4 hidden sm:block" /> Profile
              </TabsTrigger>
              <TabsTrigger value="addresses" className="gap-1.5 text-xs sm:text-sm py-2.5">
                <MapPin className="h-4 w-4 hidden sm:block" /> Addresses
              </TabsTrigger>
              <TabsTrigger value="security" className="gap-1.5 text-xs sm:text-sm py-2.5">
                <Shield className="h-4 w-4 hidden sm:block" /> Security
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-1.5 text-xs sm:text-sm py-2.5 hidden lg:flex">
                <Bell className="h-4 w-4 hidden sm:block" /> Notifications
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Recent Orders */}
              <div className="bg-card rounded-xl border border-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Recent Orders</h2>
                  <Link to="/orders">
                    <Button variant="ghost" size="sm" className="gap-1 text-accent hover:text-accent">
                      View All <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
                {recentOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No orders yet</p>
                    <Link to="/">
                      <Button variant="accent" size="sm" className="mt-3">Start Shopping</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentOrders.map((order: any) => (
                      <Link key={order.id} to="/orders" className="flex items-center gap-4 p-3 rounded-lg hover:bg-secondary/50 transition-colors">
                        <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center shrink-0">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">Order #{order.order_number}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(order.created_at), 'MMM d, yyyy')} · {order.order_items?.length || 0} items
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'My Wishlist', desc: 'View saved products', icon: Heart, link: '/wishlist', color: 'text-destructive' },
                  { label: 'Order History', desc: 'Track all your orders', icon: Clock, link: '/orders', color: 'text-primary' },
                  { label: 'Account Settings', desc: 'Update personal info', icon: Settings, link: '#', onClick: () => setActiveTab('profile'), color: 'text-accent' },
                  { label: 'Sell on Eylace', desc: 'Start your own store', icon: ShoppingBag, link: '/sell', color: 'text-[hsl(var(--success))]' },
                ].map((item) => (
                  <Link
                    key={item.label}
                    to={item.link}
                    onClick={item.onClick}
                    className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border hover:shadow-[var(--shadow-card-hover)] transition-all"
                  >
                    <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
                      <item.icon className={cn('h-5 w-5', item.color)} />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
                  </Link>
                ))}
              </div>
            </TabsContent>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <div className="bg-card rounded-xl border border-border p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold">Personal Information</h2>
                  {!isEditingProfile ? (
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setIsEditingProfile(true)}>
                      <Edit2 className="h-3.5 w-3.5" /> Edit
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
                        <Label htmlFor="first_name">First Name</Label>
                        <Input id="first_name" value={profileData.first_name} onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })} placeholder="Enter first name" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last_name">Last Name</Label>
                        <Input id="last_name" value={profileData.last_name} onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })} placeholder="Enter last name" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" value={user.email || ''} disabled className="bg-secondary" />
                      <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input id="phone" type="tel" value={profileData.phone} onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })} placeholder="+880 1XXX-XXXXXX" />
                    </div>
                    <Separator />
                    <Button onClick={handleProfileSave} disabled={isSaving} className="gap-2">
                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Save Changes
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {[
                      { label: 'First Name', value: profile?.first_name || '—' },
                      { label: 'Last Name', value: profile?.last_name || '—' },
                      { label: 'Email', value: user.email || '—' },
                      { label: 'Phone', value: profile?.phone || '—' },
                    ].map((field) => (
                      <div key={field.label}>
                        <p className="text-sm text-muted-foreground mb-1">{field.label}</p>
                        <p className="font-medium">{field.value}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Addresses Tab */}
            <TabsContent value="addresses" className="space-y-6">
              <div className="bg-card rounded-xl border border-border p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold">Shipping Address</h2>
                  {!isEditingAddress ? (
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setIsEditingAddress(true)}>
                      <Edit2 className="h-3.5 w-3.5" /> Edit
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
                      <Label htmlFor="address">Street Address</Label>
                      <Input id="address" value={addressData.address} onChange={(e) => setAddressData({ ...addressData, address: e.target.value })} placeholder="Enter street address" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="apartment">Apartment, suite, etc. (optional)</Label>
                      <Input id="apartment" value={addressData.apartment} onChange={(e) => setAddressData({ ...addressData, apartment: e.target.value })} placeholder="Apt, Suite, Unit" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input id="city" value={addressData.city} onChange={(e) => setAddressData({ ...addressData, city: e.target.value })} placeholder="Enter city" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State / Division</Label>
                        <Input id="state" value={addressData.state} onChange={(e) => setAddressData({ ...addressData, state: e.target.value })} placeholder="Enter state" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="zip_code">ZIP / Postal Code</Label>
                        <Input id="zip_code" value={addressData.zip_code} onChange={(e) => setAddressData({ ...addressData, zip_code: e.target.value })} placeholder="Enter ZIP code" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country">Country</Label>
                        <Select value={addressData.country} onValueChange={(v) => setAddressData({ ...addressData, country: v })}>
                          <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
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
                      Save Address
                    </Button>
                  </div>
                ) : (
                  <div>
                    {addressData.address ? (
                      <div className="flex items-start gap-4 p-4 bg-secondary/50 rounded-lg">
                        <MapPin className="h-5 w-5 text-accent mt-0.5 shrink-0" />
                        <div>
                          <p className="font-medium">Default Shipping Address</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {[addressData.address, addressData.apartment, addressData.city, addressData.state, addressData.zip_code].filter(Boolean).join(', ')}
                          </p>
                          <p className="text-sm text-muted-foreground">{addressData.country}</p>
                        </div>
                        <Badge variant="outline" className="ml-auto shrink-0">Default</Badge>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground mb-3">No address saved yet</p>
                        <Button variant="outline" size="sm" onClick={() => setIsEditingAddress(true)}>
                          Add Address
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="space-y-6">
              <div className="bg-card rounded-xl border border-border p-6">
                <h2 className="text-lg font-semibold mb-6">Change Password</h2>
                <div className="space-y-4 max-w-md">
                  <div className="space-y-2">
                    <Label htmlFor="new_password">New Password</Label>
                    <Input
                      id="new_password"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      placeholder="Enter new password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm_password">Confirm Password</Label>
                    <Input
                      id="confirm_password"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      placeholder="Confirm new password"
                    />
                  </div>
                  <Button onClick={handlePasswordChange} disabled={isSaving || !passwordData.newPassword} className="gap-2">
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                    Update Password
                  </Button>
                </div>
              </div>

              <div className="bg-card rounded-xl border border-border p-6">
                <h2 className="text-lg font-semibold mb-4">Account Info</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Email</span>
                    <span className="font-medium">{user.email}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Account Created</span>
                    <span className="font-medium">{memberSince}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Last Sign In</span>
                    <span className="font-medium">{user.last_sign_in_at ? format(new Date(user.last_sign_in_at), 'MMM d, yyyy h:mm a') : '—'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-destructive/5 rounded-xl border border-destructive/20 p-6">
                <h2 className="text-lg font-semibold text-destructive mb-2">Danger Zone</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Once you sign out, you'll need to log in again to access your account.
                </p>
                <Button variant="destructive" size="sm" onClick={handleSignOut} className="gap-2">
                  <LogOut className="h-4 w-4" /> Sign Out of Account
                </Button>
              </div>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-6">
              <div className="bg-card rounded-xl border border-border p-6">
                <h2 className="text-lg font-semibold mb-6">Notification Preferences</h2>
                <div className="space-y-6">
                  {[
                    { title: 'Order Updates', desc: 'Get notified about order status changes', defaultChecked: true },
                    { title: 'Promotions & Deals', desc: 'Receive emails about sales and special offers', defaultChecked: false },
                    { title: 'Product Recommendations', desc: 'Get personalized product suggestions', defaultChecked: false },
                    { title: 'Review Reminders', desc: 'Reminders to review purchased products', defaultChecked: true },
                    { title: 'Wishlist Alerts', desc: 'Get notified when wishlist items go on sale', defaultChecked: true },
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
