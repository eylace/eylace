import { useState, useEffect, useCallback } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link2, TrendingUp, DollarSign, Users, Share2, BarChart3, Loader2 } from 'lucide-react';
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

  const fetchStats = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/affiliate-manage?action=stats`,
        {
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );
      const data = await res.json();
      setAffiliateData(data);
    } catch { /* ignore */ }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const handleJoin = async () => {
    if (!user) { navigate('/auth'); return; }
    setJoining(true);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/affiliate-manage?action=join`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({}),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast.success('Application submitted! You will be notified once approved.');
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

  // Loading state
  if (loading && user) {
    return (
      <Layout>
        <div className="container-main py-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>
      </Layout>
    );
  }

  // Landing page (not logged in or not an affiliate)
  return (
    <Layout>
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container-main text-center">
          <Link2 className="h-12 w-12 mx-auto mb-4 text-accent" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Affiliate Program</h1>
          <p className="text-lg text-primary-foreground/80 max-w-xl mx-auto">Earn money by sharing products you love. Join thousands of affiliates earning with Eylace.</p>
          <Button size="lg" variant="accent" className="mt-6" onClick={handleJoin} disabled={joining}>
            {joining ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Joining...</> : "Join Now — It's Free"}
          </Button>
        </div>
      </section>

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
