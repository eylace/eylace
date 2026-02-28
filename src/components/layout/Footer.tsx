import { Link } from 'react-router-dom';
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Youtube,
  CreditCard,
  Shield,
  Truck,
  Headphones
} from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      {/* Trust Signals */}
      <div className="border-b border-primary-foreground/10">
        <div className="container-main py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary-foreground/10 rounded-lg">
                <Truck className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="font-semibold text-sm">Free Delivery</p>
                <p className="text-xs text-primary-foreground/70">On orders over $50</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary-foreground/10 rounded-lg">
                <Shield className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="font-semibold text-sm">Secure Payment</p>
                <p className="text-xs text-primary-foreground/70">100% protected</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary-foreground/10 rounded-lg">
                <CreditCard className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="font-semibold text-sm">Easy Returns</p>
                <p className="text-xs text-primary-foreground/70">30 day returns</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary-foreground/10 rounded-lg">
                <Headphones className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="font-semibold text-sm">24/7 Support</p>
                <p className="text-xs text-primary-foreground/70">Dedicated support</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container-main py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {/* About */}
          <div className="col-span-2 lg:col-span-1">
            <Link to="/" className="inline-block mb-4">
              <div className="text-2xl font-bold">
                <span className="text-accent">Ey</span>
                <span>lace</span>
              </div>
            </Link>
            <p className="text-sm text-primary-foreground/70 mb-4">
              Your one-stop destination for everything you need. Quality products, great prices, and exceptional service.
            </p>
            <div className="flex gap-3">
              <a href="#" className="p-2 bg-primary-foreground/10 rounded-lg hover:bg-accent transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="p-2 bg-primary-foreground/10 rounded-lg hover:bg-accent transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="p-2 bg-primary-foreground/10 rounded-lg hover:bg-accent transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="p-2 bg-primary-foreground/10 rounded-lg hover:bg-accent transition-colors">
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="font-semibold mb-4">Customer Service</h3>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li><Link to="/help" className="hover:text-accent transition-colors">Help Center</Link></li>
              <li><Link to="/track-order" className="hover:text-accent transition-colors">Track Order</Link></li>
              <li><Link to="/returns" className="hover:text-accent transition-colors">Returns & Refunds</Link></li>
              <li><Link to="/shipping" className="hover:text-accent transition-colors">Shipping Info</Link></li>
              <li><Link to="/faq" className="hover:text-accent transition-colors">FAQ</Link></li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li><Link to="/about" className="hover:text-accent transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-accent transition-colors">Contact Us</Link></li>
              <li><Link to="/careers" className="hover:text-accent transition-colors">Careers</Link></li>
              <li><Link to="/blog" className="hover:text-accent transition-colors">Blog</Link></li>
              <li><Link to="/sitemap" className="hover:text-accent transition-colors">Sitemap</Link></li>
            </ul>
          </div>

          {/* Sell on Eylace */}
          <div>
            <h3 className="font-semibold mb-4">Sell on Eylace</h3>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li><Link to="/sell" className="hover:text-accent transition-colors">Start Selling</Link></li>
              <li><Link to="/seller-center" className="hover:text-accent transition-colors">Seller Center</Link></li>
              <li><Link to="/seller-policies" className="hover:text-accent transition-colors">Seller Policies</Link></li>
              <li><Link to="/seller-support" className="hover:text-accent transition-colors">Seller Support</Link></li>
            </ul>
          </div>

          {/* Delivery Partners */}
          <div>
            <h3 className="font-semibold mb-4">Partners</h3>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li><Link to="/delivery-partner" className="hover:text-accent transition-colors">Become a Delivery Partner</Link></li>
              <li><Link to="/affiliate" className="hover:text-accent transition-colors">Affiliate Program</Link></li>
              <li><Link to="/advertise" className="hover:text-accent transition-colors">Advertise</Link></li>
            </ul>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="mt-12 pt-8 border-t border-primary-foreground/10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-primary-foreground/70 mb-3">We Accept</p>
              <div className="flex flex-wrap gap-2">
                {['Visa', 'Mastercard', 'bKash', 'Nagad', 'Rocket', 'SSLCommerz', 'COD'].map((method) => (
                  <div 
                    key={method}
                    className="px-3 py-1.5 bg-primary-foreground/10 rounded text-xs font-medium"
                  >
                    {method}
                  </div>
                ))}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-primary-foreground/70">Download Our App</p>
              <div className="flex gap-2 mt-2">
                <div className="px-3 py-1.5 bg-primary-foreground/10 rounded text-xs font-medium cursor-pointer hover:bg-primary-foreground/20 transition-colors">
                  App Store
                </div>
                <div className="px-3 py-1.5 bg-primary-foreground/10 rounded text-xs font-medium cursor-pointer hover:bg-primary-foreground/20 transition-colors">
                  Play Store
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-primary/50 border-t border-primary-foreground/10">
        <div className="container-main py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-primary-foreground/70">
            <p>© 2024 Eylace. All rights reserved.</p>
            <div className="flex gap-4">
              <Link to="/privacy" className="hover:text-accent transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-accent transition-colors">Terms of Service</Link>
              <Link to="/cookies" className="hover:text-accent transition-colors">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
