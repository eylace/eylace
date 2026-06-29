import { useState, useEffect, useCallback } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link2, TrendingUp, DollarSign, Users, Share2, BarChart3, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AffiliateDashboard } from '@/components/affiliate/AffiliateDashboard';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

const benefits = [
  { icon: DollarSign, title: 'Up to 12% Commission', desc: 'Earn generous commissions on every sale made through your referral link.' },
  { icon: BarChart3, title: 'Real-time Dashboard', desc: 'Track clicks, conversions, and earnings with our affiliate dashboard.' },
  { icon: Share2, title: 'Easy Sharing Tools', desc: 'Get unique links, banners, and widgets to promote products effortlessly.' },
  { icon: TrendingUp, title: 'Monthly Payouts', desc: 'Reliable monthly payouts via bKash, bank transfer, or Nagad.' },
];

const howItWorks = [
  { num: '1', title: 'Sign Up', desc: 'Register for free and get approved quickly.' },
  { num: '2', title: 'Share Products', desc: 'Use your unique links to promote any product on Eylace.' },
  { num: '3', title: 'Earn Commission', desc: 'When someone buys through your link, you earn a commission.' },
];

const AffiliateProgram = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [affiliateData, setAffiliateData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const CHANNEL_OPTIONS = ['Facebook', 'Instagram', 'YouTube', 'TikTok', 'Blog', 'Email', 'WhatsApp', 'Telegram', 'Other'];
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    address: '',
    website: '',
    facebook: '',
    instagram: '',
    youtube: '',
    audience_size: '',
    marketing_channels: [] as string[],
    bio: '',
    payment_method: 'bkash',
    account_number: '',
    account_name: '',
    terms_accepted: false,
  });

  const toggleChannel = (c: string) =>
    setForm(f => ({
      ...f,
      marketing_channels: f.marketing_channels.includes(c)
        ? f.marketing_channels.filter(x => x !== c)
        : [...f.marketing_channels, c],
    }));

  const fetchStats = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      const { data, error } = await supabase.functions.invoke('affiliate-manage', {
        body: { action: 'stats' },
      });
      if (error) throw error;
      setAffiliateData(data);
    } catch { /* ignore */ }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const handleJoin = async () => {
    if (!user) { navigate('/auth'); return; }
    if (!showForm) { setShowForm(true); return; }
    if (!form.full_name || form.full_name.trim().length < 2) {
      toast.error('Please enter your full name'); return;
    }
    if (!form.phone || form.phone.trim().length < 6) {
      toast.error('Please enter a valid phone number'); return;
    }
    if (!form.terms_accepted) {
      toast.error('Please accept the affiliate terms'); return;
    }
    setJoining(true);
    try {
      const { data, error } = await supabase.functions.invoke('affiliate-manage', {
        body: {
          action: 'join',
          full_name: form.full_name.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          website: form.website.trim(),
          audience_size: form.audience_size,
          marketing_channels: form.marketing_channels,
          bio: form.bio.trim(),
          social_handles: {
            facebook: form.facebook.trim(),
            instagram: form.instagram.trim(),
            youtube: form.youtube.trim(),
          },
          payment_method: form.payment_method,
          payment_details: {
            account_number: form.account_number.trim(),
            account_name: form.account_name.trim(),
          },
          terms_accepted: form.terms_accepted,
        },
      });
      if (error) {
        let msg = 'Failed to join';
        try { const b = typeof error === 'object' && 'message' in error ? error.message : String(error); msg = b || msg; } catch {}
        throw new Error(msg);
      }
      if (data?.error) throw new Error(data.error);
      toast.success('Application submitted! You will be notified once approved.');
      setShowForm(false);
      fetchStats();
    } catch (err: any) {
      toast.error(err.message || 'Failed to join');
    } finally {
      setJoining(false);
    }
  };

  // Show dashboard if user is an affiliate
  if (user && !loading && affiliateData?.affiliate) {
    const aff = affiliateData.affiliate;

    if (aff.status === 'pending') {
      return (
        <Layout>
          <div className="container-main py-12 text-center">
            <Card className="max-w-md mx-auto">
              <CardContent className="pt-6 space-y-4">
                <Badge className="bg-yellow-100 text-yellow-800 text-sm">Pending Review</Badge>
                <h2 className="text-xl font-bold text-foreground">Application Under Review</h2>
                <p className="text-sm text-muted-foreground">Your affiliate application is being reviewed. You'll be notified once approved.</p>
                <p className="text-xs text-muted-foreground">Referral Code: <code className="font-mono text-accent">{aff.referral_code}</code></p>
              </CardContent>
            </Card>
          </div>
        </Layout>
      );
    }

    if (aff.status === 'rejected') {
      return (
        <Layout>
          <div className="container-main py-12 text-center">
            <Card className="max-w-md mx-auto">
              <CardContent className="pt-6 space-y-4">
                <Badge className="bg-red-100 text-red-800 text-sm">Rejected</Badge>
                <h2 className="text-xl font-bold text-foreground">Application Not Approved</h2>
                <p className="text-sm text-muted-foreground">Unfortunately, your affiliate application was not approved at this time.</p>
                {aff.admin_notes && <p className="text-xs text-muted-foreground border-t pt-2">Note: {aff.admin_notes}</p>}
              </CardContent>
            </Card>
          </div>
        </Layout>
      );
    }

    if (aff.status === 'approved') {
      return (
        <Layout>
          <div className="container-main py-8">
            <h1 className="text-2xl font-bold text-foreground mb-6">Affiliate Dashboard</h1>
            <AffiliateDashboard data={affiliateData} onRefresh={fetchStats} />
          </div>
        </Layout>
      );
    }
  }

  if (loading && user) {
    return (
      <Layout>
        <div className="container-main py-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container-main text-center">
          <Link2 className="h-12 w-12 mx-auto mb-4 text-accent" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Affiliate Program</h1>
          <p className="text-lg text-primary-foreground/80 max-w-xl mx-auto">Earn money by sharing products you love. Join thousands of affiliates earning with Eylace.</p>
          <Button size="lg" variant="accent" className="mt-6" onClick={handleJoin} disabled={joining}>
            {joining ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting...</> : showForm ? 'Submit Application' : "Apply Now — It's Free"}
          </Button>
        </div>
      </section>

      {user && showForm && (
        <section className="container-main py-10">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="pt-6 space-y-5">
              <div>
                <h2 className="text-xl font-bold text-foreground">Affiliate Application</h2>
                <p className="text-sm text-muted-foreground">Tell us about you so we can approve your account.</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Full Name *</Label>
                  <Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} placeholder="Your full name" />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone Number *</Label>
                  <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="01XXXXXXXXX" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Address</Label>
                <Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="City, country" />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Website / Blog</Label>
                  <Input value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} placeholder="https://..." />
                </div>
                <div className="space-y-1.5">
                  <Label>Estimated Audience Size</Label>
                  <Select value={form.audience_size} onValueChange={v => setForm({ ...form, audience_size: v })}>
                    <SelectTrigger><SelectValue placeholder="Select range" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="<1k">Less than 1,000</SelectItem>
                      <SelectItem value="1k-10k">1,000 – 10,000</SelectItem>
                      <SelectItem value="10k-50k">10,000 – 50,000</SelectItem>
                      <SelectItem value="50k-200k">50,000 – 200,000</SelectItem>
                      <SelectItem value=">200k">More than 200,000</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Facebook</Label>
                  <Input value={form.facebook} onChange={e => setForm({ ...form, facebook: e.target.value })} placeholder="@handle or URL" />
                </div>
                <div className="space-y-1.5">
                  <Label>Instagram</Label>
                  <Input value={form.instagram} onChange={e => setForm({ ...form, instagram: e.target.value })} placeholder="@handle" />
                </div>
                <div className="space-y-1.5">
                  <Label>YouTube</Label>
                  <Input value={form.youtube} onChange={e => setForm({ ...form, youtube: e.target.value })} placeholder="Channel URL" />
                </div>
              </div>

              <div>
                <Label>Primary Marketing Channels</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {CHANNEL_OPTIONS.map(c => {
                    const active = form.marketing_channels.includes(c);
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => toggleChannel(c)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                          active ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted-foreground hover:border-accent/50'
                        }`}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Tell us about your promotion strategy</Label>
                <Textarea
                  rows={3}
                  value={form.bio}
                  onChange={e => setForm({ ...form, bio: e.target.value })}
                  placeholder="How will you promote Eylace products?"
                />
              </div>

              <div className="border-t pt-4 space-y-4">
                <p className="text-sm font-semibold text-foreground">Payout Details</p>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label>Method</Label>
                    <Select value={form.payment_method} onValueChange={v => setForm({ ...form, payment_method: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bkash">bKash</SelectItem>
                        <SelectItem value="nagad">Nagad</SelectItem>
                        <SelectItem value="rocket">Rocket</SelectItem>
                        <SelectItem value="bank">Bank Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>{form.payment_method === 'bank' ? 'Account Number' : 'Mobile Number'}</Label>
                    <Input value={form.account_number} onChange={e => setForm({ ...form, account_number: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Account Holder Name</Label>
                    <Input value={form.account_name} onChange={e => setForm({ ...form, account_name: e.target.value })} />
                  </div>
                </div>
              </div>

              <label className="flex items-start gap-2 cursor-pointer">
                <Checkbox
                  checked={form.terms_accepted}
                  onCheckedChange={(v) => setForm({ ...form, terms_accepted: !!v })}
                />
                <span className="text-xs text-muted-foreground">
                  I accept the affiliate program terms. I will not use spam, misleading ads, or self-referrals. Eylace may revoke my account for violations.
                </span>
              </label>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowForm(false)} disabled={joining}>Cancel</Button>
                <Button variant="accent" onClick={handleJoin} disabled={joining} className="flex-1">
                  {joining ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting...</> : 'Submit Application'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      <section className="container-main py-12">
        <h2 className="text-2xl font-bold text-foreground text-center mb-8">Why Join?</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="text-center">
              <CardContent className="pt-6">
                <Icon className="h-8 w-8 mx-auto mb-3 text-accent" />
                <p className="font-semibold text-foreground mb-1">{title}</p>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-muted/50 py-12">
        <div className="container-main">
          <h2 className="text-2xl font-bold text-foreground text-center mb-8">How It Works</h2>
          <div className="grid sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {howItWorks.map(s => (
              <div key={s.num} className="text-center">
                <div className="w-12 h-12 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-lg font-bold mx-auto mb-3">{s.num}</div>
                <p className="font-semibold text-foreground mb-1">{s.title}</p>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-main py-12 text-center">
        <Card className="max-w-xl mx-auto">
          <CardContent className="pt-6">
            <Users className="h-10 w-10 mx-auto mb-3 text-accent" />
            <h3 className="text-xl font-bold text-foreground mb-2">5,000+ Active Affiliates</h3>
            <p className="text-sm text-muted-foreground mb-4">Join a community of creators, bloggers, and influencers earning with Eylace every day.</p>
            <Button size="lg" variant="accent" onClick={handleJoin} disabled={joining}>
              {joining ? 'Joining...' : 'Get Started'}
            </Button>
          </CardContent>
        </Card>
      </section>
    </Layout>
  );
};

export default AffiliateProgram;