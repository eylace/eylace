import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, ShoppingCart, User, Menu, X, ChevronDown,
  MapPin, Heart, LogOut, Package, Settings, ShieldCheck, Store
} from 'lucide-react';
import { useSellerCheck } from '@/hooks/useSellerData';
import { Button } from '@/components/ui/button';
import { useMenuConfig } from '@/hooks/useMenuConfig';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCategories } from '@/hooks/useProducts';
import { useAdminCheck } from '@/hooks/useAdminData';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { SearchModal } from '@/components/search/SearchModal';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { useWebsiteSetup } from '@/hooks/useWebsiteSetup';
import { CurrencySwitcher } from '@/components/currency/CurrencySwitcher';
import { useDeliveryLocation } from '@/contexts/DeliveryLocationContext';
import { DeliveryLocationPicker } from '@/components/location/DeliveryLocationPicker';

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { getItemCount } = useCart();
  const { user, profile, signOut, loading } = useAuth();
  const cartItemCount = getItemCount();
  const { categories, isLoading: categoriesLoading } = useCategories();
  const { isAdmin } = useAdminCheck();
  const { seller: sellerProfile } = useSellerCheck();
  const { language, setLanguage, t } = useLanguage();
  const setup = useWebsiteSetup();
  const menuItems = useMenuConfig();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const { location: deliveryLocation, openPicker } = useDeliveryLocation();

  const handleSignOut = async () => { await signOut(); };
  const displayName = profile?.first_name || user?.email?.split('@')[0] || 'User';

  return (
    <header className={setup.headerStickyEnabled ? "sticky top-0 z-50" : "relative z-50"}>
      {setup.headerAnnouncementText?.trim() && (
        <div className="bg-accent text-accent-foreground text-xs text-center py-1.5 px-4">
          {setup.headerAnnouncementText}
        </div>
      )}
      <div className="bg-primary text-primary-foreground">
        <div className="container-main">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              {setup.logoUrl ? (
                <img
                  src={setup.logoUrl}
                  alt={setup.siteName || 'Eylace'}
                  className="h-9 w-auto max-w-[180px] object-contain"
                />
              ) : (
                <div className="text-2xl font-bold tracking-tight">
                  {setup.siteName ? (
                    <span>{setup.siteName}</span>
                  ) : (
                    <><span className="text-accent">Ey</span><span>lace</span></>
                  )}
                </div>
              )}
            </Link>

            <div
              onClick={openPicker}
              className="hidden md:flex items-center gap-2 text-sm cursor-pointer hover:text-accent transition-colors"
            >
              <MapPin className="h-4 w-4" />
              <div>
                <p className="text-xs text-primary-foreground/90">{t('header.deliverTo')}</p>
                <p className="font-medium">
                  {deliveryLocation
                    ? (language === 'bn'
                        ? `${deliveryLocation.upazilaBn}, ${deliveryLocation.districtBn}`
                        : `${deliveryLocation.upazila}, ${deliveryLocation.district}`)
                    : t('header.location')}
                </p>
              </div>
            </div>

            {setup.headerSearchEnabled && (
            <div className="hidden lg:flex flex-1 max-w-2xl mx-6">
              <div className="relative w-full flex">
                <div className="relative">
                  <button 
                    onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                    className="h-11 px-4 bg-secondary text-secondary-foreground rounded-l-lg flex items-center gap-2 hover:bg-secondary/80 transition-colors border-r border-border"
                  >
                    <span className="text-sm">{t('header.all')}</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  {isCategoriesOpen && (
                    <div className="absolute top-full left-0 mt-1 w-56 bg-card rounded-lg shadow-lg border border-border py-2 animate-slide-down z-50">
                      {categories.map((cat) => (
                        <Link key={cat.id} to={`/category/${cat.slug}`}
                          className="flex items-center gap-3 px-4 py-2 hover:bg-secondary transition-colors"
                          onClick={() => setIsCategoriesOpen(false)}>
                          <span>{cat.icon}</span>
                          <span className="text-sm">{cat.name}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={() => setIsSearchOpen(true)}
                  className="flex-1 h-11 px-4 bg-background text-left text-muted-foreground hover:text-foreground transition-colors">
                  {t('header.searchPlaceholder')}
                </button>
                <Button variant="accent" className="h-11 px-6 rounded-l-none rounded-r-lg" onClick={() => setIsSearchOpen(true)}>
                  <Search className="h-5 w-5" />
                </Button>
              </div>
            </div>
            )}

            <SearchModal open={isSearchOpen} onOpenChange={setIsSearchOpen} />
            <DeliveryLocationPicker />

            <div className="flex items-center gap-4">
              {/* Language Switcher */}
              {setup.headerLanguageSwitcher && (
              <div className="hidden lg:flex items-center gap-1">
                <button
                  onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-primary-foreground/10 transition-colors"
                >
                  <span className="text-lg">{language === 'bn' ? '🇧🇩' : '🇺🇸'}</span>
                  <span className="text-sm font-medium">{language === 'bn' ? 'বাংলা' : 'EN'}</span>
                </button>
              </div>
              )}


              {loading ? (
                <div className="hidden md:block h-5 w-20 bg-primary-foreground/20 rounded animate-pulse" />
              ) : user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger className="hidden md:flex flex-col items-start hover:text-accent transition-colors outline-none">
                    <span className="text-xs text-primary-foreground/90">{t('header.hello')}, {displayName}</span>
                    <span className="text-sm font-medium flex items-center gap-1">
                      {t('header.account')} <ChevronDown className="h-3 w-3" />
                    </span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link to="/account" className="flex items-center gap-2"><User className="h-4 w-4" />{t('header.myAccount')}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/account?tab=orders" className="flex items-center gap-2"><Package className="h-4 w-4" />{t('header.myOrders')}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/wishlist" className="flex items-center gap-2"><Heart className="h-4 w-4" />{t('header.wishlist')}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/settings" className="flex items-center gap-2"><Settings className="h-4 w-4" />{t('header.settings')}</Link>
                    </DropdownMenuItem>
                    {sellerProfile && (
                      <DropdownMenuItem asChild>
                        <Link to="/seller" className="flex items-center gap-2"><Store className="h-4 w-4" />Seller Dashboard</Link>
                      </DropdownMenuItem>
                    )}
                    {!sellerProfile && (
                      <DropdownMenuItem asChild>
                        <Link to="/sell" className="flex items-center gap-2"><Store className="h-4 w-4" />Become a Seller</Link>
                      </DropdownMenuItem>
                    )}
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" />{t('header.adminDashboard')}</Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                      <LogOut className="h-4 w-4 mr-2" />{t('header.signOut')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link to="/auth" className="hidden md:flex flex-col items-start hover:text-accent transition-colors">
                  <span className="text-xs text-primary-foreground/90">{t('header.signIn')}</span>
                  <span className="text-sm font-medium flex items-center gap-1">
                    {t('header.account')} <ChevronDown className="h-3 w-3" />
                  </span>
                </Link>
              )}

              <Link to="/account?tab=orders" className="hidden md:flex flex-col items-start hover:text-accent transition-colors">
                <span className="text-xs text-primary-foreground/90">{t('header.returns')}</span>
                <span className="text-sm font-medium">{t('header.orders')}</span>
              </Link>

              <div className="hidden md:block"><NotificationBell /></div>

              {setup.headerWishlistIconEnabled && (
              <Link to="/wishlist" className="hidden md:block relative hover:text-accent transition-colors">
                <Heart className="h-6 w-6" />
              </Link>
              )}

              {setup.headerCartIconEnabled && (

              <Link to="/cart" className="relative flex items-center gap-1 hover:text-accent transition-colors">
                <div className="relative">
                  <ShoppingCart className="h-7 w-7" />
                  {cartItemCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-accent text-accent-foreground text-xs font-bold">
                      {cartItemCount}
                    </Badge>
                  )}
                </div>
                <span className="hidden sm:inline text-sm font-medium">{t('header.cart')}</span>
              </Link>
              )}

              <button className="lg:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          <div className="lg:hidden pb-3">
            <button onClick={() => setIsSearchOpen(true)}
              className="w-full flex items-center gap-2 h-10 px-4 bg-background rounded-lg text-muted-foreground text-left">
              <Search className="h-5 w-5" />
              <span>{t('header.searchProducts')}</span>
            </button>
          </div>
        </div>
      </div>

      <nav className="bg-primary/90 text-primary-foreground border-t border-primary-foreground/10">
        <div className="container-main">
          <div className="flex items-center justify-between h-10">
            <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide">
              <button className="flex items-center gap-2 text-sm font-medium hover:text-accent transition-colors whitespace-nowrap">
                <Menu className="h-4 w-4" />{t('nav.allCategories')}
              </button>
              {menuItems.filter(m => m.isActive).sort((a, b) => a.sortOrder - b.sortOrder).map(item => {
                if (item.type === 'link') {
                  return (
                    <Link key={item.id} to={item.url} className="text-sm hover:text-accent transition-colors whitespace-nowrap">
                      {language === 'bn' && item.labelBn ? item.labelBn : item.label}
                    </Link>
                  );
                }
                return (
                  <div key={item.id} className="relative"
                    onMouseEnter={() => setOpenDropdown(item.id)}
                    onMouseLeave={() => setOpenDropdown(null)}
                  >
                    <button className="text-sm hover:text-accent transition-colors whitespace-nowrap flex items-center gap-1">
                      {language === 'bn' && item.labelBn ? item.labelBn : item.label}
                      <ChevronDown className="h-3 w-3" />
                    </button>
                    {openDropdown === item.id && item.children.length > 0 && (
                      <div className={`absolute top-full left-0 mt-0 bg-card text-card-foreground rounded-lg shadow-lg border border-border py-2 animate-slide-down z-50 ${item.type === 'mega' ? 'w-[400px] grid grid-cols-2 gap-0' : 'w-48'}`}>
                        {item.children.map(child => (
                          <Link key={child.id} to={child.url}
                            className="block px-4 py-2 text-sm hover:bg-secondary transition-colors"
                            onClick={() => setOpenDropdown(null)}
                          >
                            {language === 'bn' && child.labelBn ? child.labelBn : child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex-shrink-0 ml-4">
              <CurrencySwitcher />
            </div>
          </div>
        </div>
      </nav>

      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-[120px] bg-background z-40 animate-fade-in">
          <div className="container-main py-4">
            <div className="space-y-4">
              {/* Mobile Language Switcher */}
              <div className="flex gap-2 p-2">
                <button onClick={() => setLanguage('en')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${language === 'en' ? 'bg-accent text-accent-foreground' : 'bg-secondary text-foreground'}`}>
                  🇺🇸 English
                </button>
                <button onClick={() => setLanguage('bn')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${language === 'bn' ? 'bg-accent text-accent-foreground' : 'bg-secondary text-foreground'}`}>
                  🇧🇩 বাংলা
                </button>
              </div>

              <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
                <User className="h-8 w-8 text-muted-foreground" />
                <div>
                  {user ? (
                    <>
                      <p className="font-medium">{t('header.hello')}, {displayName}</p>
                      <button onClick={handleSignOut} className="text-sm text-destructive">{t('header.signOut')}</button>
                    </>
                  ) : (
                    <>
                      <p className="font-medium">{t('header.signIn')}</p>
                      <Link to="/auth" className="text-sm text-accent" onClick={() => setIsMenuOpen(false)}>
                        {t('header.signInOrCreate')}
                      </Link>
                    </>
                  )}
                </div>
              </div>

              {/* Seller Link - Mobile */}
              {user && (
                <div className="px-2">
                  {sellerProfile ? (
                    <Link to="/seller" className="flex items-center gap-3 px-3 py-2 hover:bg-secondary rounded-lg transition-colors"
                      onClick={() => setIsMenuOpen(false)}>
                      <Store className="h-5 w-5 text-accent" />
                      <span>Seller Dashboard</span>
                    </Link>
                  ) : (
                    <Link to="/sell" className="flex items-center gap-3 px-3 py-2 hover:bg-secondary rounded-lg transition-colors"
                      onClick={() => setIsMenuOpen(false)}>
                      <Store className="h-5 w-5 text-accent" />
                      <span>Become a Seller</span>
                    </Link>
                  )}
                </div>
              )}
              
              <div className="space-y-1">
                <h3 className="font-semibold text-sm text-muted-foreground px-2">{t('nav.shopByCategory')}</h3>
                {categories.map((cat) => (
                  <Link key={cat.id} to={`/category/${cat.slug}`}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-secondary rounded-lg transition-colors"
                    onClick={() => setIsMenuOpen(false)}>
                    <span className="text-xl">{cat.icon}</span>
                    <span>{cat.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
