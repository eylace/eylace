import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Youtube, Linkedin, CreditCard, Shield, Truck, Headphones, MessageCircle } from 'lucide-react';
import paymentMethodsImg from '@/assets/payment-methods.png';
import googlePlayBadge from '@/assets/google-play-badge.png';
import appStoreBadge from '@/assets/app-store-badge.png';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWebsiteSetup } from '@/hooks/useWebsiteSetup';

const socialIconMap: Record<string, React.ElementType> = {
  facebook: Facebook,
  twitter: Twitter,
  instagram: Instagram,
  youtube: Youtube,
  linkedin: Linkedin,
  tiktok: MessageCircle,
  whatsapp: MessageCircle,
};

const defaultColumns = [
  { title: 'Customer Service', links: [
    { label: 'Help Center', url: '/help' },
    { label: 'Track Order', url: '/track-order' },
    { label: 'Returns & Refunds', url: '/returns' },
    { label: 'Shipping Info', url: '/shipping' },
    { label: 'FAQ', url: '/faq' },
  ]},
  { title: 'Quick Links', links: [
    { label: 'About Us', url: '/about' },
    { label: 'Contact Us', url: '/contact' },
    { label: 'Careers', url: '/careers' },
    { label: 'Blog', url: '/blog' },
    { label: 'Sitemap', url: '/sitemap' },
  ]},
  { title: 'Sell on Eylace', links: [
    { label: 'Start Selling', url: '/sell' },
    { label: 'Seller Center', url: '/seller-center' },
    { label: 'Seller Policies', url: '/seller-policies' },
    { label: 'Seller Support', url: '/seller-support' },
  ]},
  { title: 'Partners', links: [
    { label: 'Delivery Partner', url: '/delivery-partner' },
    { label: 'Affiliate Program', url: '/affiliate' },
    { label: 'Advertise With Us', url: '/advertise' },
  ]},
];

const defaultSocialLinks = [
  { platform: 'facebook', url: '#' },
  { platform: 'twitter', url: '#' },
  { platform: 'instagram', url: '#' },
  { platform: 'youtube', url: '#' },
];

export const Footer = () => {
  const { t } = useLanguage();
  const setup = useWebsiteSetup();

  const columns = setup.footerColumns && setup.footerColumns.length > 0 ? setup.footerColumns : defaultColumns;
  const socialLinks = setup.footerSocialLinks && setup.footerSocialLinks.length > 0 ? setup.footerSocialLinks : defaultSocialLinks;

  return (
    <footer className="bg-primary text-primary-foreground">
      {/* Features Bar */}
      {setup.footerShowFeaturesBar !== false && (
        <div className="border-b border-primary-foreground/10">
          <div className="container-main py-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { icon: Truck, title: t('footer.freeDelivery'), desc: t('footer.freeDeliveryDesc') },
                { icon: Shield, title: t('footer.securePayment'), desc: t('footer.securePaymentDesc') },
                { icon: CreditCard, title: t('footer.easyReturns'), desc: t('footer.easyReturnsDesc') },
                { icon: Headphones, title: t('footer.support247'), desc: t('footer.supportDesc') },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-center gap-3">
                  <div className="p-3 bg-primary-foreground/10 rounded-lg"><Icon className="h-6 w-6 text-accent" /></div>
                  <div>
                    <p className="font-semibold text-sm">{title}</p>
                    <p className="text-xs text-primary-foreground/90">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="container-main py-12">
        <div className={`grid grid-cols-2 md:grid-cols-4 lg:grid-cols-${Math.min(columns.length + 1, 6)} gap-8`}>
          {/* About / Logo Column */}
          <div className="col-span-2 lg:col-span-1">
            <Link to="/" className="inline-block mb-4">
              <div className="text-2xl font-bold"><span className="text-accent">Ey</span><span>lace</span></div>
            </Link>
            <p className="text-sm text-primary-foreground/90 mb-4">{setup.footerAboutText || t('footer.aboutText')}</p>
            {setup.footerShowSocialLinks !== false && (
              <div className="flex gap-3">
                {socialLinks.map((sl, i) => {
                  const Icon = socialIconMap[sl.platform] || Facebook;
                  return (
                    <a key={i} href={sl.url || '#'} target="_blank" rel="noopener noreferrer" className="p-2 bg-primary-foreground/10 rounded-lg hover:bg-accent transition-colors">
                      <Icon className="h-5 w-5" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Dynamic Columns */}
          {columns.map((col, ci) => (
            <div key={ci}>
              <h3 className="font-semibold mb-4">{col.title}</h3>
              <ul className="space-y-2 text-sm text-primary-foreground/90">
                {col.links.map((link, li) => (
                  <li key={li}>
                    {link.url.startsWith('http') ? (
                      <a href={link.url} target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">{link.label}</a>
                    ) : (
                      <Link to={link.url} className="hover:text-accent transition-colors">{link.label}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Payment & Download App */}
        {(setup.footerShowPaymentIcons !== false || setup.footerShowDownloadApp !== false) && (
          <div className="mt-12 pt-8 border-t border-primary-foreground/10">
            <div className="flex flex-wrap items-center justify-between gap-6">
              {setup.footerShowPaymentIcons !== false && (
                <div className="flex-1">
                  <p className="text-sm text-primary-foreground/90 mb-3">{t('footer.weAccept')}</p>
                  <img src={paymentMethodsImg} alt="Accepted payment methods" className="h-8 w-auto object-contain" />
                </div>
              )}
              {setup.footerShowDownloadApp !== false && (
                <div className="text-right">
                  <p className="text-sm text-primary-foreground/90">{t('footer.downloadApp')}</p>
                  <div className="flex gap-2 mt-2">
                    <a href={setup.footerAppStoreUrl || '#'} className="block hover:opacity-80 transition-opacity">
                      <img src={appStoreBadge} alt="Download on App Store" className="h-12 w-[135px] object-contain" />
                    </a>
                    <a href={setup.footerGooglePlayUrl || '#'} className="block hover:opacity-80 transition-opacity">
                      <img src={googlePlayBadge} alt="Get it on Google Play" className="h-12 w-[135px] object-contain" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="bg-primary/50 border-t border-primary-foreground/10">
        <div className="container-main py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-primary-foreground/90">
            <p>{setup.footerCopyright || t('footer.copyright')}</p>
            <div className="flex gap-4">
              <Link to="/privacy" className="hover:text-accent transition-colors">{t('footer.privacy')}</Link>
              <Link to="/terms" className="hover:text-accent transition-colors">{t('footer.terms')}</Link>
              <Link to="/cookies" className="hover:text-accent transition-colors">{t('footer.cookies')}</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
