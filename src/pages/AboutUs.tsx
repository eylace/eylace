import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Target, Eye, Award, ShoppingBag, Globe, Headphones, TrendingUp } from 'lucide-react';
import { SeoHead } from '@/components/seo/SeoHead';

const stats = [
  { icon: ShoppingBag, value: '50,000+', label: 'Products' },
  { icon: Users, value: '1M+', label: 'Happy Customers' },
  { icon: Globe, value: '64', label: 'Districts Covered' },
  { icon: Headphones, value: '24/7', label: 'Customer Support' },
];

const values = [
  { icon: Target, title: 'Our Mission', desc: 'To make quality products accessible to everyone across Bangladesh at the best prices, delivered right to their doorstep.' },
  { icon: Eye, title: 'Our Vision', desc: 'To become the most trusted and innovative e-commerce platform in South Asia, empowering both buyers and sellers.' },
  { icon: Award, title: 'Our Values', desc: 'Customer first, transparency, innovation, and sustainability guide everything we do at Eylace.' },
  { icon: TrendingUp, title: 'Our Growth', desc: 'From a small startup to serving millions — we continue to grow by listening to our customers and adapting fast.' },
];

const team = [
  { name: 'Ariful Islam', role: 'CEO & Founder', avatar: '👨‍💼' },
  { name: 'Nusrat Jahan', role: 'CTO', avatar: '👩‍💻' },
  { name: 'Rafiq Ahmed', role: 'Head of Operations', avatar: '👨‍🔧' },
  { name: 'Tasnim Akter', role: 'Head of Marketing', avatar: '👩‍🎨' },
];

const AboutUs = () => (
  <Layout>
    {/* Hero */}
    <section className="bg-primary text-primary-foreground py-16">
      <div className="container-main text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">About Eylace</h1>
        <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto">
          Bangladesh's trusted online marketplace — connecting millions of buyers with thousands of sellers since 2020.
        </p>
      </div>
    </section>

    {/* Stats */}
    <section className="container-main py-12">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map(({ icon: Icon, value, label }) => (
          <Card key={label} className="text-center">
            <CardContent className="pt-6">
              <Icon className="h-8 w-8 mx-auto mb-3 text-accent" />
              <p className="text-2xl font-bold text-foreground">{value}</p>
              <p className="text-sm text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>

    {/* Mission / Vision */}
    <section className="bg-muted/50 py-12">
      <div className="container-main">
        <h2 className="text-2xl font-bold text-foreground text-center mb-8">What Drives Us</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {values.map(({ icon: Icon, title, desc }) => (
            <Card key={title}>
              <CardContent className="pt-6 flex gap-4">
                <div className="p-3 bg-accent/10 rounded-lg h-fit"><Icon className="h-6 w-6 text-accent" /></div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{title}</h3>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>

    {/* Team */}
    <section className="container-main py-12">
      <h2 className="text-2xl font-bold text-foreground text-center mb-8">Our Leadership Team</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {team.map(({ name, role, avatar }) => (
          <Card key={name} className="text-center">
            <CardContent className="pt-6">
              <div className="text-4xl mb-3">{avatar}</div>
              <p className="font-semibold text-foreground">{name}</p>
              <p className="text-sm text-muted-foreground">{role}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>

    {/* Story */}
    <section className="bg-muted/50 py-12">
      <div className="container-main max-w-3xl text-center">
        <h2 className="text-2xl font-bold text-foreground mb-4">Our Story</h2>
        <p className="text-muted-foreground leading-relaxed">
          Eylace was born from a simple idea: everyone in Bangladesh deserves access to quality products at fair prices.
          Starting in 2020, we built a platform that empowers local sellers and brings convenience to every household.
          Today, we serve over a million customers across all 64 districts with a catalog of 50,000+ products —
          from electronics and fashion to home essentials and groceries. Our journey continues as we innovate
          to make online shopping faster, safer, and more enjoyable for everyone.
        </p>
      </div>
    </section>
  </Layout>
);

export default AboutUs;
