import { Layout } from '@/components/layout/Layout';
import { SeoHead } from '@/components/seo/SeoHead';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, ArrowRight } from 'lucide-react';

const rows: { feature: string; eylace: string; daraz: string; winner: 'eylace' | 'daraz' | 'tie' }[] = [
  { feature: 'Cash on Delivery (COD)', eylace: 'Available nationwide', daraz: 'Available nationwide', winner: 'tie' },
  { feature: 'Advance bKash discount', eylace: '5% off on prepaid bKash', daraz: 'Occasional bank offers only', winner: 'eylace' },
  { feature: 'Delivery time (nationwide)', eylace: '3–5 days across Bangladesh', daraz: '3–7 days, longer outside Dhaka', winner: 'eylace' },
  { feature: 'Same-day delivery (Dhaka)', eylace: 'Select products in Dhaka', daraz: 'Daraz Mart only', winner: 'tie' },
  { feature: 'Local payment methods', eylace: 'bKash, Nagad, Rocket, Cards, COD', daraz: 'bKash, Nagad, Cards, COD', winner: 'tie' },
  { feature: 'Multi-vendor marketplace', eylace: 'Yes — verified Bangladeshi sellers', daraz: 'Yes — large seller base', winner: 'daraz' },
  { feature: 'Customer support', eylace: 'Live chat, WhatsApp, phone & email', daraz: 'In-app chat & ticket system', winner: 'eylace' },
  { feature: 'Return window', eylace: '24-hour easy returns with countdown', daraz: '7-day return on eligible items', winner: 'daraz' },
  { feature: 'Language', eylace: 'English & Bangla (বাংলা)', daraz: 'English & Bangla', winner: 'tie' },
  { feature: 'Flash sales & deals', eylace: 'Daily flash sales + coupons', daraz: '11.11, 12.12 mega campaigns', winner: 'tie' },
];

const Cell = ({ winner, side, text }: { winner: 'eylace' | 'daraz' | 'tie'; side: 'eylace' | 'daraz'; text: string }) => {
  const isWinner = winner === side;
  return (
    <td className={`p-4 align-top text-sm ${isWinner ? 'bg-accent/10 font-medium text-foreground' : 'text-muted-foreground'}`}>
      <div className="flex items-start gap-2">
        {isWinner ? <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" /> : <span className="h-4 w-4 shrink-0" />}
        <span>{text}</span>
      </div>
    </td>
  );
};

const BlogEylaceVsDaraz = () => {
  const path = '/blog/online-shopping-comparison-bangladesh';
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Eylace vs Daraz: Best Online Shopping in Bangladesh (2026)',
      description: 'Side-by-side comparison of Eylace and Daraz — delivery speed, payment options, customer support, and returns for shoppers in Bangladesh.',
      datePublished: '2026-06-06',
      author: { '@type': 'Organization', name: 'Eylace' },
      publisher: { '@type': 'Organization', name: 'Eylace' },
      mainEntityOfPage: `https://eylace.lovable.app${path}`,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://eylace.lovable.app/' },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://eylace.lovable.app/blog' },
        { '@type': 'ListItem', position: 3, name: 'Eylace vs Daraz', item: `https://eylace.lovable.app${path}` },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Which is the best online shopping site in Bangladesh?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Eylace and Daraz are two of the most popular online shopping platforms in Bangladesh. Eylace offers a 5% discount on advance bKash payments, 3–5 day nationwide delivery, and multi-channel support (live chat, WhatsApp, phone). Daraz has a larger seller base and a 7-day return window. The right choice depends on whether you prioritise faster prepaid discounts and local support (Eylace) or catalogue size and mega-campaigns (Daraz).',
          },
        },
        {
          '@type': 'Question',
          name: 'Is Daraz BD safe for online shopping?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes, Daraz BD is a legitimate platform owned by Alibaba Group. Eylace is also a verified Bangladeshi marketplace with cash on delivery and buyer protection — both are safe when you order from verified sellers and inspect the product before paying.',
          },
        },
        {
          '@type': 'Question',
          name: 'Does Eylace deliver outside Dhaka?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes — Eylace delivers nationwide across all 64 districts of Bangladesh in 3–5 days, with cash on delivery available everywhere.',
          },
        },
      ],
    },
  ];

  return (
    <Layout>
      <SeoHead
        title="Eylace vs Daraz: Best Online Shopping in Bangladesh (2026)"
        description="Compare Eylace and Daraz BD side-by-side — delivery speed, payment methods, bKash discounts, returns and customer support for online shopping in Bangladesh."
        path={path}
        type="article"
        jsonLd={jsonLd}
      />

      <article>
        <header className="bg-primary text-primary-foreground py-16">
          <div className="container-main">
            <nav className="text-sm text-primary-foreground/70 mb-4">
              <Link to="/" className="hover:text-accent">Home</Link> <span className="mx-2">/</span>
              <Link to="/blog" className="hover:text-accent">Blog</Link> <span className="mx-2">/</span>
              <span>Eylace vs Daraz</span>
            </nav>
            <h1 className="text-3xl md:text-5xl font-bold mb-4 max-w-3xl">
              Eylace vs Daraz: Best Online Shopping in Bangladesh (2026)
            </h1>
            <p className="text-lg text-primary-foreground/80 max-w-2xl">
              A head-to-head comparison of the two biggest online shopping platforms in Bangladesh —
              delivery, payments, returns and customer support, with no fluff.
            </p>
          </div>
        </header>

        <section className="container-main py-12 prose-content">
          <p className="text-base text-muted-foreground max-w-3xl">
            Online shopping in Bangladesh has exploded over the last few years, and two names dominate the
            conversation: <strong className="text-foreground">Eylace</strong> and{' '}
            <strong className="text-foreground">Daraz BD</strong>. Both deliver nationwide, both accept
            bKash, Nagad and cash on delivery, and both run regular flash sales. So which one should you
            actually use? We compared them on the things real shoppers care about.
          </p>

          <h2 className="text-2xl font-bold text-foreground mt-10 mb-4">Quick comparison</h2>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full border-collapse">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">Feature</th>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">Eylace</th>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">Daraz BD</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.feature} className="border-t border-border">
                    <td className="p-4 text-sm font-medium text-foreground align-top">{r.feature}</td>
                    <Cell winner={r.winner} side="eylace" text={r.eylace} />
                    <Cell winner={r.winner} side="daraz" text={r.daraz} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="text-2xl font-bold text-foreground mt-12 mb-4">Delivery speed</h2>
          <p className="text-muted-foreground max-w-3xl">
            Eylace delivers across all 64 districts of Bangladesh in <strong className="text-foreground">3–5 days</strong>,
            with cash on delivery available everywhere. Daraz typically delivers in 3–7 days; outside Dhaka,
            customers often report delays during mega-campaign weeks like 11.11 and 12.12. For everyday orders,
            Eylace is the faster and more predictable choice.
          </p>

          <h2 className="text-2xl font-bold text-foreground mt-10 mb-4">Payments &amp; bKash discount</h2>
          <p className="text-muted-foreground max-w-3xl">
            Both platforms accept bKash, Nagad, Rocket, debit/credit cards and COD. The big difference: Eylace
            offers a permanent <strong className="text-foreground">5% discount on advance bKash payments</strong>,
            while Daraz only runs bank/wallet discounts during specific campaigns. If you pay digitally, Eylace
            saves you money on every order.
          </p>

          <h2 className="text-2xl font-bold text-foreground mt-10 mb-4">Customer support</h2>
          <p className="text-muted-foreground max-w-3xl">
            Eylace runs <strong className="text-foreground">live chat, WhatsApp, phone and email support</strong>{' '}
            in both English and Bangla. Daraz handles most queries through in-app chat and a ticketing system.
            If you prefer talking to a real person on WhatsApp or phone, Eylace wins here.
          </p>

          <h2 className="text-2xl font-bold text-foreground mt-10 mb-4">Returns &amp; refunds</h2>
          <p className="text-muted-foreground max-w-3xl">
            Daraz offers a longer 7-day return window on many categories, while Eylace gives you a focused{' '}
            <strong className="text-foreground">24-hour easy return</strong> with a visible countdown timer in
            your order details. If you tend to inspect orders immediately, Eylace's flow is smoother; if you
            need more time, Daraz's window is longer.
          </p>

          <h2 className="text-2xl font-bold text-foreground mt-10 mb-4">Catalogue &amp; sellers</h2>
          <p className="text-muted-foreground max-w-3xl">
            Daraz has the larger overall catalogue thanks to its bigger seller base and Alibaba supply chain.
            Eylace focuses on <strong className="text-foreground">verified Bangladeshi sellers</strong> with
            stricter quality control, which means fewer duplicate listings and clearer warranty terms on
            electronics and fashion.
          </p>

          <h2 className="text-2xl font-bold text-foreground mt-10 mb-4">Which one should you pick?</h2>
          <div className="grid sm:grid-cols-2 gap-4 max-w-3xl mt-4">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-bold text-foreground mb-2">Choose Eylace if…</h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex gap-2"><Check className="h-4 w-4 text-accent shrink-0 mt-0.5" /> You want a 5% bKash discount on every prepaid order</li>
                  <li className="flex gap-2"><Check className="h-4 w-4 text-accent shrink-0 mt-0.5" /> You value fast 3–5 day nationwide delivery</li>
                  <li className="flex gap-2"><Check className="h-4 w-4 text-accent shrink-0 mt-0.5" /> You prefer live human support on WhatsApp or phone</li>
                  <li className="flex gap-2"><Check className="h-4 w-4 text-accent shrink-0 mt-0.5" /> You shop from verified Bangladeshi sellers</li>
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-bold text-foreground mb-2">Choose Daraz if…</h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex gap-2"><Check className="h-4 w-4 text-accent shrink-0 mt-0.5" /> You want the widest possible catalogue</li>
                  <li className="flex gap-2"><Check className="h-4 w-4 text-accent shrink-0 mt-0.5" /> You like waiting for 11.11 / 12.12 mega-campaigns</li>
                  <li className="flex gap-2"><Check className="h-4 w-4 text-accent shrink-0 mt-0.5" /> You need a longer 7-day return window</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <h2 className="text-2xl font-bold text-foreground mt-12 mb-4">Frequently asked questions</h2>
          <div className="space-y-6 max-w-3xl">
            <div>
              <h3 className="font-semibold text-foreground mb-1">Which is the best online shopping site in Bangladesh?</h3>
              <p className="text-sm text-muted-foreground">
                Eylace and Daraz are the two most popular platforms. Eylace wins on prepaid bKash discounts,
                delivery speed and live support; Daraz wins on catalogue size and return window length.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Is Daraz BD safe for online shopping?</h3>
              <p className="text-sm text-muted-foreground">
                Yes. Daraz is owned by Alibaba Group and is a legitimate platform. Eylace is also a verified
                Bangladeshi marketplace with buyer protection and cash on delivery.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Does Eylace deliver outside Dhaka?</h3>
              <p className="text-sm text-muted-foreground">
                Yes — Eylace delivers to all 64 districts of Bangladesh in 3–5 days, with COD available
                nationwide.
              </p>
            </div>
          </div>

          <div className="mt-12 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl font-bold mb-1">Ready to shop on Eylace?</h3>
              <p className="text-primary-foreground/80 text-sm">
                Get 5% off on advance bKash payments, free 3–5 day delivery nationwide and cash on delivery.
              </p>
            </div>
            <Button asChild size="lg" variant="secondary">
              <Link to="/">Start shopping <ArrowRight className="h-4 w-4 ml-2" /></Link>
            </Button>
          </div>
        </section>
      </article>
    </Layout>
  );
};

export default BlogEylaceVsDaraz;