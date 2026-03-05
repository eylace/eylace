import { Link } from 'react-router-dom';
import { ShoppingCart, ChevronRight, ArrowLeft, Package } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { CartItemComponent } from '@/components/cart/CartItem';
import { CartSummary } from '@/components/cart/CartSummary';
import { ProductCard } from '@/components/products/ProductCard';
import { useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { featuredProducts } from '@/data/mockData';

const Cart = () => {
  const { items, clearCart, getItemCount } = useCart();
  const itemCount = getItemCount();
  const { t } = useLanguage();

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container-main py-12">
          <div className="max-w-md mx-auto text-center space-y-6">
            <div className="w-24 h-24 mx-auto bg-secondary rounded-full flex items-center justify-center">
              <ShoppingCart className="h-12 w-12 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">{t('cart.empty')}</h1>
            <p className="text-muted-foreground">{t('cart.emptyDesc')}</p>
            <Button variant="accent" size="lg" asChild>
              <Link to="/"><Package className="h-5 w-5 mr-2" />{t('cart.startShopping')}</Link>
            </Button>
          </div>
          <section className="mt-16">
            <h2 className="text-xl font-bold text-foreground mb-6">{t('cart.recommended')}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {featuredProducts.slice(0, 5).map((product) => (<ProductCard key={product.id} product={product} />))}
            </div>
          </section>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-main py-6">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-accent transition-colors">{t('cart.home')}</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{t('cart.title')}</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            {t('cart.title')}
            <span className="text-lg font-normal text-muted-foreground ml-2">
              ({itemCount} {itemCount === 1 ? t('cart.item') : t('cart.items')})
            </span>
          </h1>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link to="/"><ArrowLeft className="h-4 w-4 mr-2" />{t('cart.continueShopping')}</Link>
            </Button>
            <Button variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={clearCart}>
              {t('cart.clearCart')}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item, index) => (
              <CartItemComponent key={`${item.product.id}-${JSON.stringify(item.selectedVariations)}-${index}`} item={item} />
            ))}
          </div>
          <div><CartSummary /></div>
        </div>

        <section className="mt-16">
          <h2 className="text-xl font-bold text-foreground mb-6">{t('cart.youMayAlsoLike')}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {featuredProducts.slice(2, 7).map((product) => (<ProductCard key={product.id} product={product} />))}
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Cart;
