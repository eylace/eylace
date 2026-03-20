import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';

const sections = [
  { title: 'Shopping', links: [
    { to: '/', label: 'Home' }, { to: '/deals', label: 'Deals' }, { to: '/flash-sale', label: 'Flash Sale' },
    { to: '/new-arrivals', label: 'New Arrivals' }, { to: '/best-sellers', label: 'Best Sellers' }, { to: '/trending', label: 'Trending Now' },
  ]},
  { title: 'Customer Service', links: [
    { to: '/help', label: 'Help Center' }, { to: '/track-order', label: 'Track Order' }, { to: '/returns', label: 'Returns & Refunds' },
    { to: '/shipping', label: 'Shipping Info' }, { to: '/faq', label: 'FAQ' },
  ]},
  { title: 'My Account', links: [
    { to: '/account', label: 'My Account' }, { to: '/orders', label: 'My Orders' }, { to: '/wishlist', label: 'Wishlist' },
    { to: '/cart', label: 'Cart' }, { to: '/settings', label: 'Settings' },
  ]},
  { title: 'Sell on Eylace', links: [
    { to: '/sell', label: 'Start Selling' }, { to: '/seller-center', label: 'Seller Center' },
    { to: '/seller-policies', label: 'Seller Policies' }, { to: '/seller-support', label: 'Seller Support' },
  ]},
  { title: 'Partners', links: [
    { to: '/delivery-partner', label: 'Delivery Partner' }, { to: '/affiliate', label: 'Affiliate Program' }, { to: '/advertise', label: 'Advertise With Us' },
  ]},
  { title: 'Company', links: [
    { to: '/about', label: 'About Us' }, { to: '/contact', label: 'Contact Us' }, { to: '/careers', label: 'Careers' }, { to: '/blog', label: 'Blog' },
  ]},
  { title: 'Legal', links: [
    { to: '/privacy', label: 'Privacy Policy' }, { to: '/terms', label: 'Terms & Conditions' }, { to: '/cookies', label: 'Cookie Policy' },
  ]},
];

const Sitemap = () => (
  <Layout>
    <section className="bg-primary text-primary-foreground py-16">
      <div className="container-main text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Sitemap</h1>
        <p className="text-lg text-primary-foreground/80">All pages on Eylace at a glance.</p>
      </div>
    </section>

    <section className="container-main py-12">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {sections.map(s => (
          <div key={s.title}>
            <h2 className="font-bold text-foreground mb-3 text-lg">{s.title}</h2>
            <ul className="space-y-2">
              {s.links.map(l => (
                <li key={l.to}><Link to={l.to} className="text-sm text-muted-foreground hover:text-accent transition-colors">{l.label}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  </Layout>
);

export default Sitemap;
