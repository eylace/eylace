import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Megaphone, Eye, MousePointer, Users, Send } from 'lucide-react';
import { toast } from 'sonner';

const packages = [
  { name: 'Starter', price: '৳5,000/mo', features: ['Banner ad on homepage', '50K impressions', 'Basic analytics'], popular: false },
  { name: 'Growth', price: '৳15,000/mo', features: ['Premium banner placement', '200K impressions', 'Category targeting', 'Detailed analytics'], popular: true },
  { name: 'Enterprise', price: 'Custom', features: ['Custom ad placements', 'Unlimited impressions', 'Dedicated manager', 'A/B testing', 'Priority support'], popular: false },
];

const stats = [
  { icon: Users, value: '1M+', label: 'Monthly Visitors' },
  { icon: Eye, value: '10M+', label: 'Page Views/Month' },
  { icon: MousePointer, value: '3.2%', label: 'Avg. CTR' },
];

const AdvertiseWithUs = () => {
  const [sending, setSending] = useState(false);
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => { setSending(false); toast.success('Inquiry sent! Our ad team will contact you soon.'); (e.target as HTMLFormElement).reset(); }, 1200);
  };

  return (
    <Layout>
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container-main text-center">
          <Megaphone className="h-12 w-12 mx-auto mb-4 text-accent" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Advertise With Us</h1>
          <p className="text-lg text-primary-foreground/80 max-w-xl mx-auto">Reach millions of active shoppers on Bangladesh's fastest-growing marketplace.</p>
        </div>
      </section>

      <section className="container-main py-12">
        <div className="grid sm:grid-cols-3 gap-6 max-w-2xl mx-auto mb-12">
          {stats.map(({ icon: Icon, value, label }) => (
            <Card key={label} className="text-center">
              <CardContent className="pt-6">
                <Icon className="h-7 w-7 mx-auto mb-2 text-accent" />
                <p className="text-2xl font-bold text-foreground">{value}</p>
                <p className="text-sm text-muted-foreground">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <h2 className="text-2xl font-bold text-foreground text-center mb-8">Advertising Packages</h2>
        <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {packages.map(pkg => (
            <Card key={pkg.name} className={pkg.popular ? 'border-accent border-2 relative' : ''}>
              {pkg.popular && <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground">Most Popular</Badge>}
              <CardContent className="pt-6 text-center">
                <h3 className="text-lg font-bold text-foreground">{pkg.name}</h3>
                <p className="text-2xl font-bold text-accent my-3">{pkg.price}</p>
                <ul className="text-sm text-muted-foreground space-y-2 mb-4">
                  {pkg.features.map(f => <li key={f}>✓ {f}</li>)}
                </ul>
                <Button variant={pkg.popular ? 'accent' : 'outline'} className="w-full">Get Started</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-muted/50 py-12">
        <div className="container-main">
          <Card className="max-w-2xl mx-auto">
            <CardHeader><CardTitle className="flex items-center gap-2"><Send className="h-5 w-5 text-accent" /> Contact Our Ad Team</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div><Label>Company Name</Label><Input required placeholder="Your company" /></div>
                  <div><Label>Email</Label><Input required type="email" placeholder="you@company.com" /></div>
                </div>
                <div><Label>Budget Range</Label><Input placeholder="e.g. ৳10,000 – ৳50,000/month" /></div>
                <div><Label>Message</Label><Textarea rows={4} placeholder="Tell us about your advertising goals…" /></div>
                <Button type="submit" className="w-full" disabled={sending}>{sending ? 'Sending…' : 'Send Inquiry'}</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </Layout>
  );
};

export default AdvertiseWithUs;
