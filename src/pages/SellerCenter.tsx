import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Store, BarChart3, ShieldCheck, Headphones, UserPlus, Upload, TrendingUp, Shirt, Smartphone, ShoppingBasket, Gem, Home, Warehouse, Truck, Package, CheckCircle, X } from 'lucide-react';

const benefits = [
  { icon: Store, title: 'বিশাল কাস্টমার বেস', desc: 'লক্ষাধিক ক্রেতার কাছে আপনার পণ্য পৌঁছে দিন সহজেই।' },
  { icon: BarChart3, title: 'সহজ ড্যাশবোর্ড', desc: 'অর্ডার, স্টক ও বিক্রি ট্র্যাক করুন এক জায়গা থেকে।' },
  { icon: ShieldCheck, title: 'নিরাপদ পেমেন্ট', desc: 'সময়মতো নিরাপদে পেমেন্ট পান আপনার অ্যাকাউন্টে।' },
  { icon: Headphones, title: '২৪/৭ সেলার সাপোর্ট', desc: 'যেকোনো সমস্যায় আমাদের ডেডিকেটেড টিম পাশে আছে।' },
];

const steps = [
  { icon: UserPlus, step: '১', title: 'রেজিস্টার করুন', desc: 'বিনামূল্যে সেলার অ্যাকাউন্ট খুলুন মাত্র কয়েক মিনিটে।' },
  { icon: Upload, step: '২', title: 'প্রোডাক্ট আপলোড', desc: 'ছবি, বর্ণনা ও মূল্য সহ আপনার পণ্য তালিকাভুক্ত করুন।' },
  { icon: TrendingUp, step: '৩', title: 'বিক্রি শুরু', desc: 'অর্ডার পান, শিপ করুন এবং আয় করুন!' },
];

const categories = [
  { icon: Smartphone, name: 'ইলেকট্রনিক্স' },
  { icon: Shirt, name: 'ফ্যাশন ও পোশাক' },
  { icon: ShoppingBasket, name: 'গ্রোসারি' },
  { icon: Gem, name: 'বিউটি ও হেলথ' },
  { icon: Home, name: 'হোম ও লিভিং' },
  { icon: Store, name: 'আরও অনেক...' },
];

const comparisonFeatures = [
  { feature: 'শিপিং ও ডেলিভারি', fbe: 'Eylace পরিচালিত', fbm: 'সেলার নিজে করবে' },
  { feature: 'স্টোরেজ ও ওয়্যারহাউস', fbe: 'Eylace ওয়্যারহাউস', fbm: 'সেলারের নিজস্ব' },
  { feature: 'কাস্টমার সার্ভিস', fbe: 'Eylace টিম', fbm: 'সেলার নিজে' },
  { feature: 'রিটার্ন হ্যান্ডলিং', fbe: 'Eylace পরিচালিত', fbm: 'সেলার নিজে' },
  { feature: 'প্যাকেজিং', fbe: 'Eylace স্ট্যান্ডার্ড', fbm: 'নিজস্ব ব্র্যান্ডিং' },
  { feature: 'কমিশন রেট', fbe: '১৫–২০%', fbm: '৫–১০%' },
  { feature: 'মাসিক ফি', fbe: '৳৯৯৯', fbm: 'বিনামূল্যে' },
  { feature: 'Prime ব্যাজ', fbe: true, fbm: false },
  { feature: 'অগ্রাধিকার র‍্যাংকিং', fbe: true, fbm: false },
];

const SellerCenter = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-16">
        <div className="container-main text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Eylace-এ বিক্রি করুন</h1>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto mb-8 text-lg">
            বাংলাদেশের সবচেয়ে দ্রুত বর্ধনশীল ই-কমার্স প্ল্যাটফর্মে আপনার ব্যবসা শুরু করুন।
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold">
              <Link to="/sell">এখনই রেজিস্টার করুন</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
              <Link to="/seller">সেলার ড্যাশবোর্ড</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Plan Comparison */}
      <section className="container-main py-16">
        <h2 className="text-2xl font-bold text-foreground text-center mb-3">আপনার জন্য সঠিক প্ল্যান বেছে নিন</h2>
        <p className="text-muted-foreground text-center mb-10 max-w-2xl mx-auto">
          Amazon-এর মতো দুটি ফুলফিলমেন্ট অপশন — আপনার ব্যবসার প্রয়োজন অনুযায়ী নির্বাচন করুন
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          {/* FBE Card */}
          <Card className="relative border-primary/30 hover:shadow-lg transition-shadow">
            <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4">সবচেয়ে জনপ্রিয়</Badge>
            <CardContent className="pt-8 pb-6">
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Warehouse className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground">FBE — Fulfilled by Eylace</h3>
                <p className="text-sm text-muted-foreground mt-1">Eylace সব ম্যানেজ করবে</p>
              </div>
              <div className="bg-primary/5 rounded-lg p-4 text-center mb-5">
                <span className="text-2xl font-bold text-foreground">১৫–২০%</span>
                <span className="text-sm text-muted-foreground block">কমিশন + ৳৯৯৯/মাস</span>
              </div>
              <ul className="space-y-2">
                {['ওয়্যারহাউস স্টোরেজ', 'দ্রুত শিপিং', 'কাস্টমার সার্ভিস', 'রিটার্ন হ্যান্ডলিং', 'Prime ব্যাজ'].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm"><CheckCircle className="h-4 w-4 text-primary shrink-0" />{f}</li>
                ))}
              </ul>
              <Button asChild className="w-full mt-6">
                <Link to="/sell">FBE দিয়ে শুরু করুন</Link>
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
                <p className="text-sm text-muted-foreground mt-1">আপনি নিজে ম্যানেজ করবেন</p>
              </div>
              <div className="bg-accent/5 rounded-lg p-4 text-center mb-5">
                <span className="text-2xl font-bold text-foreground">৫–১০%</span>
                <span className="text-sm text-muted-foreground block">কমিশন + বিনামূল্যে</span>
              </div>
              <ul className="space-y-2">
                {['নিজস্ব ব্র্যান্ডিং', 'পছন্দের কুরিয়ার', 'সরাসরি যোগাযোগ', 'কম কমিশন', 'কোনো ফি নেই'].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm"><CheckCircle className="h-4 w-4 text-accent shrink-0" />{f}</li>
                ))}
              </ul>
              <Button asChild variant="outline" className="w-full mt-6">
                <Link to="/sell">FBM দিয়ে শুরু করুন</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-semibold text-foreground">ফিচার</th>
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
          <h2 className="text-2xl font-bold text-foreground text-center mb-10">কেন Eylace-এ বিক্রি করবেন?</h2>
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
        <h2 className="text-2xl font-bold text-foreground text-center mb-10">কিভাবে শুরু করবেন?</h2>
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
          <h2 className="text-2xl font-bold text-foreground text-center mb-10">জনপ্রিয় সেলার ক্যাটাগরি</h2>
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
          <h2 className="text-2xl font-bold mb-4">আজই শুরু করুন — সম্পূর্ণ বিনামূল্যে!</h2>
          <p className="mb-6 text-accent-foreground/80">কোনো সেটআপ ফি নেই। রেজিস্ট্রেশন করুন এবং মিনিটের মধ্যে বিক্রি শুরু করুন।</p>
          <Button asChild size="lg" variant="secondary" className="font-semibold">
            <Link to="/sell">সেলার রেজিস্ট্রেশন</Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default SellerCenter;
