import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Youtube, CreditCard, Shield, Truck, Headphones, Wallet, Banknote, Building2, Globe, Smartphone } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWebsiteSetup } from '@/hooks/useWebsiteSetup';

export const Footer = () => {
  const { t } = useLanguage();
  const setup = useWebsiteSetup();

  return (
    <footer className="bg-primary text-primary-foreground">
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
                  <p className="text-xs text-primary-foreground/70">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container-main py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          <div className="col-span-2 lg:col-span-1">
            <Link to="/" className="inline-block mb-4">
              <div className="text-2xl font-bold"><span className="text-accent">Ey</span><span>lace</span></div>
            </Link>
            <p className="text-sm text-primary-foreground/70 mb-4">{setup.footerAboutText || t('footer.aboutText')}</p>
            {setup.footerShowSocialLinks && (
            <div className="flex gap-3">
              {[Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
                <a key={i} href={setup.footerSocialLinks?.[i]?.url || '#'} target="_blank" rel="noopener noreferrer" className="p-2 bg-primary-foreground/10 rounded-lg hover:bg-accent transition-colors">
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
            )}
          </div>

          <div>
            <h3 className="font-semibold mb-4">{t('footer.customerService')}</h3>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li><Link to="/help" className="hover:text-accent transition-colors">{t('footer.helpCenter')}</Link></li>
              <li><Link to="/track-order" className="hover:text-accent transition-colors">{t('footer.trackOrder')}</Link></li>
              <li><Link to="/returns" className="hover:text-accent transition-colors">{t('footer.returnsRefunds')}</Link></li>
              <li><Link to="/shipping" className="hover:text-accent transition-colors">{t('footer.shippingInfo')}</Link></li>
              <li><Link to="/faq" className="hover:text-accent transition-colors">{t('footer.faq')}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">{t('footer.quickLinks')}</h3>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li><Link to="/about" className="hover:text-accent transition-colors">{t('footer.aboutUs')}</Link></li>
              <li><Link to="/contact" className="hover:text-accent transition-colors">{t('footer.contactUs')}</Link></li>
              <li><Link to="/careers" className="hover:text-accent transition-colors">{t('footer.careers')}</Link></li>
              <li><Link to="/blog" className="hover:text-accent transition-colors">{t('footer.blog')}</Link></li>
              <li><Link to="/sitemap" className="hover:text-accent transition-colors">{t('footer.sitemap')}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">{t('footer.sellOnEylace')}</h3>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li><Link to="/sell" className="hover:text-accent transition-colors">{t('footer.startSelling')}</Link></li>
              <li><Link to="/seller-center" className="hover:text-accent transition-colors">{t('footer.sellerCenter')}</Link></li>
              <li><Link to="/seller-policies" className="hover:text-accent transition-colors">{t('footer.sellerPolicies')}</Link></li>
              <li><Link to="/seller-support" className="hover:text-accent transition-colors">{t('footer.sellerSupport')}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">{t('footer.partners')}</h3>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li><Link to="/delivery-partner" className="hover:text-accent transition-colors">{t('footer.deliveryPartner')}</Link></li>
              <li><Link to="/affiliate" className="hover:text-accent transition-colors">{t('footer.affiliate')}</Link></li>
              <li><Link to="/advertise" className="hover:text-accent transition-colors">{t('footer.advertise')}</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-primary-foreground/10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-primary-foreground/70 mb-3">{t('footer.weAccept')}</p>
              <div className="flex flex-wrap items-center gap-3">
                {[
                  { name: 'Visa', icon: CreditCard, color: 'text-blue-400' },
                  { name: 'Mastercard', icon: CreditCard, color: 'text-red-400' },
                  { name: 'American Express', icon: CreditCard, color: 'text-sky-400' },
                  { name: 'UnionPay', icon: Globe, color: 'text-red-500' },
                  { name: 'bKash', icon: Wallet, color: 'text-pink-400' },
                  { name: 'Nagad', icon: Wallet, color: 'text-orange-400' },
                  { name: 'Rocket', icon: Building2, color: 'text-purple-400' },
                  { name: 'Upay', icon: Smartphone, color: 'text-green-400' },
                  { name: 'SSLCommerz', icon: Shield, color: 'text-emerald-400' },
                  { name: 'PayPal', icon: Globe, color: 'text-blue-300' },
                  { name: 'COD', icon: Banknote, color: 'text-yellow-400' },
                ].map(({ name, icon: Icon, color }) => (
                  <div key={name} className="p-2 bg-primary-foreground/10 rounded-md" title={name}>
                    <Icon className={`h-5 w-5 ${color}`} />
                  </div>
                ))}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-primary-foreground/70">{t('footer.downloadApp')}</p>
              <div className="flex gap-2 mt-2">
                <div className="px-3 py-1.5 bg-primary-foreground/10 rounded text-xs font-medium cursor-pointer hover:bg-primary-foreground/20 transition-colors">App Store</div>
                <div className="px-3 py-1.5 bg-primary-foreground/10 rounded text-xs font-medium cursor-pointer hover:bg-primary-foreground/20 transition-colors">Play Store</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-primary/50 border-t border-primary-foreground/10">
        <div className="container-main py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-primary-foreground/70">
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
