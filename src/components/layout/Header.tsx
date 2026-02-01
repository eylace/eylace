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
  Heart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { categories } from '@/data/mockData';
import { useCart } from '@/contexts/CartContext';

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const { getItemCount } = useCart();
  const cartItemCount = getItemCount();

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
                    <div className="absolute top-full left-0 mt-1 w-56 bg-card rounded-lg shadow-lg border border-border py-2 animate-slide-down">
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
                <Input
                  type="text"
                  placeholder="Search for products, brands and more..."
                  className="flex-1 h-11 rounded-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <Button 
                  variant="accent"
                  className="h-11 px-6 rounded-l-none rounded-r-lg"
                >
                  <Search className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
              {/* Language/Region */}
              <div className="hidden lg:flex items-center gap-1 cursor-pointer hover:text-accent transition-colors">
                <span className="text-lg">🇧🇩</span>
                <span className="text-sm font-medium">EN</span>
                <ChevronDown className="h-4 w-4" />
              </div>

              {/* Account */}
              <Link to="/account" className="hidden md:flex flex-col items-start hover:text-accent transition-colors">
                <span className="text-xs text-primary-foreground/70">Hello, Sign in</span>
                <span className="text-sm font-medium flex items-center gap-1">
                  Account <ChevronDown className="h-3 w-3" />
                </span>
              </Link>

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
            <div className="relative flex">
              <Input
                type="text"
                placeholder="Search products..."
                className="flex-1 h-10 rounded-r-none"
              />
              <Button variant="accent" className="h-10 px-4 rounded-l-none">
                <Search className="h-5 w-5" />
              </Button>
            </div>
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
                  <p className="font-medium">Hello, Sign in</p>
                  <Link to="/login" className="text-sm text-accent">
                    Sign in or Create Account
                  </Link>
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
