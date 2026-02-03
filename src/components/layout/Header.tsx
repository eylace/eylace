import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  ShoppingCart, 
  User, 
  Menu, 
  X, 
  ChevronDown,
  MapPin,
  Heart,
  LogOut,
  Package,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { categories } from '@/data/mockData';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { SearchModal } from '@/components/search/SearchModal';

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { getItemCount } = useCart();
  const { user, profile, signOut, loading } = useAuth();
  const cartItemCount = getItemCount();

  const handleSignOut = async () => {
    await signOut();
  };

  const displayName = profile?.first_name || user?.email?.split('@')[0] || 'User';

  return (
    <header className="sticky top-0 z-50">
      {/* Top Bar */}
      <div className="bg-primary text-primary-foreground">
        <div className="container-main">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="text-2xl font-bold tracking-tight">
                <span className="text-accent">Shop</span>
                <span>Hub</span>
              </div>
            </Link>

            {/* Delivery Location */}
            <div className="hidden md:flex items-center gap-2 text-sm cursor-pointer hover:text-accent transition-colors">
              <MapPin className="h-4 w-4" />
              <div>
                <p className="text-xs text-primary-foreground/70">Deliver to</p>
                <p className="font-medium">Dhaka 1200</p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="hidden lg:flex flex-1 max-w-2xl mx-6">
              <div className="relative w-full flex">
                <div className="relative">
                  <button 
                    onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                    className="h-11 px-4 bg-secondary text-secondary-foreground rounded-l-lg flex items-center gap-2 hover:bg-secondary/80 transition-colors border-r border-border"
                  >
                    <span className="text-sm">All</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  {isCategoriesOpen && (
                    <div className="absolute top-full left-0 mt-1 w-56 bg-card rounded-lg shadow-lg border border-border py-2 animate-slide-down z-50">
                      {categories.map((cat) => (
                        <Link
                          key={cat.id}
                          to={`/category/${cat.slug}`}
                          className="flex items-center gap-3 px-4 py-2 hover:bg-secondary transition-colors"
                          onClick={() => setIsCategoriesOpen(false)}
                        >
                          <span>{cat.icon}</span>
                          <span className="text-sm">{cat.name}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="flex-1 h-11 px-4 bg-background text-left text-muted-foreground hover:text-foreground transition-colors"
                >
                  Search for products, brands and more...
                </button>
                <Button 
                  variant="accent"
                  className="h-11 px-6 rounded-l-none rounded-r-lg"
                  onClick={() => setIsSearchOpen(true)}
                >
                  <Search className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Search Modal */}
            <SearchModal open={isSearchOpen} onOpenChange={setIsSearchOpen} />

            {/* Right Actions */}
            <div className="flex items-center gap-4">
              {/* Language/Region */}
              <div className="hidden lg:flex items-center gap-1 cursor-pointer hover:text-accent transition-colors">
                <span className="text-lg">🇧🇩</span>
                <span className="text-sm font-medium">EN</span>
                <ChevronDown className="h-4 w-4" />
              </div>

              {/* Account */}
              {loading ? (
                <div className="hidden md:block h-5 w-20 bg-primary-foreground/20 rounded animate-pulse" />
              ) : user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger className="hidden md:flex flex-col items-start hover:text-accent transition-colors outline-none">
                    <span className="text-xs text-primary-foreground/70">Hello, {displayName}</span>
                    <span className="text-sm font-medium flex items-center gap-1">
                      Account <ChevronDown className="h-3 w-3" />
                    </span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link to="/account" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        My Account
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/orders" className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        My Orders
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/wishlist" className="flex items-center gap-2">
                        <Heart className="h-4 w-4" />
                        Wishlist
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/settings" className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link to="/auth" className="hidden md:flex flex-col items-start hover:text-accent transition-colors">
                  <span className="text-xs text-primary-foreground/70">Hello, Sign in</span>
                  <span className="text-sm font-medium flex items-center gap-1">
                    Account <ChevronDown className="h-3 w-3" />
                  </span>
                </Link>
              )}

              {/* Orders */}
              <Link to="/orders" className="hidden md:flex flex-col items-start hover:text-accent transition-colors">
                <span className="text-xs text-primary-foreground/70">Returns</span>
                <span className="text-sm font-medium">& Orders</span>
              </Link>

              {/* Wishlist */}
              <Link to="/wishlist" className="hidden md:block relative hover:text-accent transition-colors">
                <Heart className="h-6 w-6" />
              </Link>

              {/* Cart */}
              <Link to="/cart" className="relative flex items-center gap-1 hover:text-accent transition-colors">
                <div className="relative">
                  <ShoppingCart className="h-7 w-7" />
                  {cartItemCount > 0 && (
                    <Badge 
                      className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-accent text-accent-foreground text-xs font-bold"
                    >
                      {cartItemCount}
                    </Badge>
                  )}
                </div>
                <span className="hidden sm:inline text-sm font-medium">Cart</span>
              </Link>

              {/* Mobile Menu Toggle */}
              <button 
                className="lg:hidden p-2"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Search */}
          <div className="lg:hidden pb-3">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="w-full flex items-center gap-2 h-10 px-4 bg-background rounded-lg text-muted-foreground text-left"
            >
              <Search className="h-5 w-5" />
              <span>Search products...</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <nav className="bg-primary/90 text-primary-foreground border-t border-primary-foreground/10">
        <div className="container-main">
          <div className="flex items-center gap-6 h-10 overflow-x-auto scrollbar-hide">
            <button className="flex items-center gap-2 text-sm font-medium hover:text-accent transition-colors whitespace-nowrap">
              <Menu className="h-4 w-4" />
              All Categories
            </button>
            <Link to="/deals" className="text-sm hover:text-accent transition-colors whitespace-nowrap">
              Today's Deals
            </Link>
            <Link to="/flash-sale" className="text-sm hover:text-accent transition-colors whitespace-nowrap flex items-center gap-1">
              <span className="bg-accent text-accent-foreground text-xs px-1.5 py-0.5 rounded font-bold">⚡</span>
              Flash Sale
            </Link>
            <Link to="/new-arrivals" className="text-sm hover:text-accent transition-colors whitespace-nowrap">
              New Arrivals
            </Link>
            <Link to="/best-sellers" className="text-sm hover:text-accent transition-colors whitespace-nowrap">
              Best Sellers
            </Link>
            <Link to="/sell" className="text-sm hover:text-accent transition-colors whitespace-nowrap">
              Sell on ShopHub
            </Link>
            <Link to="/help" className="text-sm hover:text-accent transition-colors whitespace-nowrap">
              Help & Support
            </Link>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-[120px] bg-background z-40 animate-fade-in">
          <div className="container-main py-4">
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
                <User className="h-8 w-8 text-muted-foreground" />
                <div>
                  {user ? (
                    <>
                      <p className="font-medium">Hello, {displayName}</p>
                      <button 
                        onClick={handleSignOut}
                        className="text-sm text-destructive"
                      >
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="font-medium">Hello, Sign in</p>
                      <Link to="/auth" className="text-sm text-accent" onClick={() => setIsMenuOpen(false)}>
                        Sign in or Create Account
                      </Link>
                    </>
                  )}
                </div>
              </div>
              
              <div className="space-y-1">
                <h3 className="font-semibold text-sm text-muted-foreground px-2">Shop by Category</h3>
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/category/${cat.slug}`}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-secondary rounded-lg transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
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
