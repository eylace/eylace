import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Store, BarChart3, ShieldCheck, Headphones, UserPlus, Upload, TrendingUp, Shirt, Smartphone, ShoppingBasket, Gem, Home, Warehouse, Truck, Package, CheckCircle, X } from 'lucide-react';

const benefits = [
  { icon: Store, title: 'Massive Customer Base', desc: 'Reach millions of buyers and grow your sales effortlessly.' },
  { icon: BarChart3, title: 'Easy Dashboard', desc: 'Track orders, inventory & sales from a single dashboard.' },
  { icon: ShieldCheck, title: 'Secure Payments', desc: 'Get paid safely and on time directly to your account.' },
  { icon: Headphones, title: '24/7 Seller Support', desc: 'Our dedicated team is always here to help you succeed.' },
];

const steps = [
  { icon: UserPlus, step: '1', title: 'Register', desc: 'Create a free seller account in just a few minutes.' },
  { icon: Upload, step: '2', title: 'Upload Products', desc: 'List your products with images, descriptions & pricing.' },
  { icon: TrendingUp, step: '3', title: 'Start Selling', desc: 'Receive orders, ship products & start earning!' },
];

const categories = [
  { icon: Smartphone, name: 'Electronics' },
  { icon: Shirt, name: 'Fashion & Clothing' },
  { icon: ShoppingBasket, name: 'Grocery' },
  { icon: Gem, name: 'Beauty & Health' },
  { icon: Home, name: 'Home & Living' },
  { icon: Store, name: 'And More...' },
];

const comparisonFeatures = [
  { feature: 'Shipping & Delivery', fbe: 'Managed by Eylace', fbm: 'Managed by Seller' },
  { feature: 'Storage & Warehouse', fbe: 'Eylace Warehouse', fbm: 'Seller\'s Own' },
  { feature: 'Customer Service', fbe: 'Eylace Team', fbm: 'Managed by Seller' },
  { feature: 'Return Handling', fbe: 'Managed by Eylace', fbm: 'Managed by Seller' },
  { feature: 'Packaging', fbe: 'Eylace Standard', fbm: 'Own Branding' },
  { feature: 'Commission Rate', fbe: '15–20%', fbm: '5–10%' },
  { feature: 'Monthly Fee', fbe: '৳9,999', fbm: 'Free' },
  { feature: 'Prime Badge', fbe: true, fbm: false },
  { feature: 'Priority Ranking', fbe: true, fbm: false },
];

const SellerCenter = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-16">
        <div className="container-main text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Sell on Eylace</h1>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto mb-8 text-lg">
            Start your business on Bangladesh's fastest growing e-commerce platform.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold">
              <Link to="/sell">Register Now</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
              <Link to="/seller">Seller Dashboard</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Plan Comparison */}
      <section className="container-main py-16">
        <h2 className="text-2xl font-bold text-foreground text-center mb-3">Choose the Right Plan for You</h2>
        <p className="text-muted-foreground text-center mb-10 max-w-2xl mx-auto">
          Two fulfillment options just like Amazon — choose based on your business needs
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          {/* FBE Card */}
          <Card className="relative border-primary/30 hover:shadow-lg transition-shadow">
            <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4">Most Popular</Badge>
            <CardContent className="pt-8 pb-6">
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Warehouse className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground">FBE — Fulfilled by Eylace</h3>
                <p className="text-sm text-muted-foreground mt-1">Eylace manages everything for you</p>
              </div>
              <div className="bg-primary/5 rounded-lg p-4 text-center mb-5">
                <span className="text-2xl font-bold text-foreground">15–20%</span>
                <span className="text-sm text-muted-foreground block">Commission + ৳9,999/month</span>
              </div>
              <ul className="space-y-2">
                {['Warehouse Storage', 'Fast Shipping', 'Customer Service', 'Return Handling', 'Prime Badge'].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm"><CheckCircle className="h-4 w-4 text-primary shrink-0" />{f}</li>
                ))}
              </ul>
              <Button asChild className="w-full mt-6">
                <Link to="/sell">Start with FBE</Link>
              </Button>
            </CardContent>
          </Card>

          {/* FBM Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-8 pb-6">
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-3">
                  <Package className="h-7 w-7 text-accent" />
                </div>
                <h3 className="text-xl font-bold text-foreground">FBM — Fulfilled by Merchant</h3>
                <p className="text-sm text-muted-foreground mt-1">You manage everything yourself</p>
              </div>
              <div className="bg-accent/5 rounded-lg p-4 text-center mb-5">
                <span className="text-2xl font-bold text-foreground">5–10%</span>
                <span className="text-sm text-muted-foreground block">Commission + Free</span>
              </div>
              <ul className="space-y-2">
                {['Own Branding', 'Preferred Courier', 'Direct Communication', 'Lower Commission', 'No Monthly Fee'].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm"><CheckCircle className="h-4 w-4 text-accent shrink-0" />{f}</li>
                ))}
              </ul>
              <Button asChild variant="outline" className="w-full mt-6">
                <Link to="/sell">Start with FBM</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-semibold text-foreground">Feature</th>
                <th className="text-center py-3 px-4 font-semibold text-primary">FBE</th>
                <th className="text-center py-3 px-4 font-semibold text-accent">FBM</th>
              </tr>
            </thead>
            <tbody>
              {comparisonFeatures.map((row) => (
                <tr key={row.feature} className="border-b last:border-0">
                  <td className="py-3 px-4 text-foreground">{row.feature}</td>
                  <td className="py-3 px-4 text-center">
                    {typeof row.fbe === 'boolean' ? (
                      row.fbe ? <CheckCircle className="h-4 w-4 text-primary mx-auto" /> : <X className="h-4 w-4 text-muted-foreground mx-auto" />
                    ) : (
                      <span className="text-muted-foreground">{row.fbe}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {typeof row.fbm === 'boolean' ? (
                      row.fbm ? <CheckCircle className="h-4 w-4 text-accent mx-auto" /> : <X className="h-4 w-4 text-muted-foreground mx-auto" />
                    ) : (
                      <span className="text-muted-foreground">{row.fbm}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-muted py-16">
        <div className="container-main">
          <h2 className="text-2xl font-bold text-foreground text-center mb-10">Why Sell on Eylace?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((b) => (
              <Card key={b.title} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="pt-8 pb-6">
                  <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center">
                    <b.icon className="h-7 w-7 text-accent" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{b.title}</h3>
                  <p className="text-sm text-muted-foreground">{b.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="container-main py-16">
        <h2 className="text-2xl font-bold text-foreground text-center mb-10">How to Get Started?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {steps.map((s) => (
            <div key={s.step} className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold">
                {s.step}
              </div>
              <h3 className="font-semibold text-foreground mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="bg-muted py-16">
        <div className="container-main">
          <h2 className="text-2xl font-bold text-foreground text-center mb-10">Popular Seller Categories</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((c) => (
              <Card key={c.name} className="text-center hover:shadow-md transition-shadow cursor-default">
                <CardContent className="pt-6 pb-4">
                  <c.icon className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-sm font-medium text-foreground">{c.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-accent text-accent-foreground py-12">
        <div className="container-main text-center">
          <h2 className="text-2xl font-bold mb-4">Start Today — Completely Free!</h2>
          <p className="mb-6 text-accent-foreground/80">No setup fees. Register and start selling within minutes.</p>
          <Button asChild size="lg" variant="secondary" className="font-semibold">
            <Link to="/sell">Seller Registration</Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default SellerCenter;
