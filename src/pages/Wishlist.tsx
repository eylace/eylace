import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2, Loader2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/products/ProductCard';
import { useAuth } from '@/contexts/AuthContext';
import { useWishlist } from '@/contexts/WishlistContext';

const Wishlist = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { items, isLoading } = useWishlist();

  if (authLoading || isLoading) {
    return (
      <Layout>
        <div className="container-main py-12 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="container-main py-16">
          <div className="text-center max-w-md mx-auto">
            <div className="w-20 h-20 mx-auto bg-secondary rounded-full flex items-center justify-center mb-4">
              <Heart className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Sign in to view your wishlist</h2>
            <p className="text-muted-foreground mb-6">
              Save your favorite items and access them from any device
            </p>
            <Link to="/auth">
              <Button variant="accent">Sign In</Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-main py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">My Wishlist</h1>
            <p className="text-muted-foreground mt-1">
              {items.length} {items.length === 1 ? 'item' : 'items'} saved
            </p>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-xl border border-border">
            <div className="w-20 h-20 mx-auto bg-secondary rounded-full flex items-center justify-center mb-4">
              <Heart className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Your wishlist is empty</h2>
            <p className="text-muted-foreground mb-6">
              Start adding products you love to your wishlist
            </p>
            <Link to="/">
              <Button variant="accent">Start Shopping</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {items.map((product) => (
              <ProductCard key={product.id} product={product} showWishlistButton />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Wishlist;
