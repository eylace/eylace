import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Store, BarChart3, ShieldCheck, Headphones, UserPlus, Upload, TrendingUp, Shirt, Smartphone, ShoppingBasket, Gem, Home } from 'lucide-react';

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

      {/* Benefits */}
      <section className="container-main py-16">
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
      </section>

      {/* How it works */}
      <section className="bg-muted py-16">
        <div className="container-main">
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
        </div>
      </section>

      {/* Categories */}
      <section className="container-main py-16">
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
