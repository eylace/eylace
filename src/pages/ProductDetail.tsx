import { useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Star, 
  Heart, 
  Share2, 
  ShoppingCart, 
  Zap, 
  Truck, 
  Shield, 
  RotateCcw,
  Check,
  MessageCircle,
  ChevronRight,
   Package,
   Store,
   GitCompareArrows,
   Download
 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
 import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ImageGallery } from '@/components/products/ImageGallery';
import { VariationSelector } from '@/components/products/VariationSelector';
import { QuantitySelector } from '@/components/products/QuantitySelector';
import { ReviewsSection } from '@/components/products/ReviewsSection';
import { ProductCard } from '@/components/products/ProductCard';
 import { useProduct, useProducts } from '@/hooks/useProducts';
 import { adaptDBProduct, adaptDBProducts } from '@/lib/productAdapter';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCompare } from '@/contexts/CompareContext';
import { useCurrency } from '@/contexts/CurrencyContext';
 import { Loader2 } from 'lucide-react';

const ProductDetail = () => {
  const { slug } = useParams();
  const [quantity, setQuantity] = useState(1);
  const [selectedVariations, setSelectedVariations] = useState<Record<string, string>>({});
  const { addItem } = useCart();
  const { user } = useAuth();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlist();
  const { addItem: addToCompare, removeItem: removeFromCompare, isInCompare } = useCompare();
   
   const { product: dbProduct, isLoading, error } = useProduct(slug || '');
   const { products: relatedDbProducts, isLoading: relatedLoading } = useProducts({ limit: 5 });
   
   const product = dbProduct ? adaptDBProduct(dbProduct) : null;
   const relatedProducts = adaptDBProducts(relatedDbProducts);

   const handleDigitalDownload = useCallback(async () => {
     if (!user) {
       toast.error('Please log in to download');
       return;
     }
     if (!product) return;
     try {
       const { data, error } = await supabase.functions.invoke('get-digital-download', {
         body: { product_id: product.id },
       });
       if (error) throw error;
       if (data?.download_url) {
         window.open(data.download_url, '_blank');
         toast.success('Download started!');
       } else {
         toast.error(data?.error || 'Download not available');
       }
     } catch (err: any) {
       toast.error(err?.message || 'You need to purchase this product first');
     }
   }, [user, product]);

   if (isLoading) {
     return (
       <Layout>
         <div className="container-main py-16 flex items-center justify-center">
           <Loader2 className="h-8 w-8 animate-spin text-accent" />
         </div>
       </Layout>
     );
   }
 
   if (!product) {
     return (
       <Layout>
         <div className="container-main py-16 text-center">
           <h1 className="text-2xl font-bold mb-4">Product not found</h1>
           <Button variant="accent" onClick={() => window.location.href = '/'}>
             Back to Home
           </Button>
         </div>
       </Layout>
     );
   }
 
  const isWishlisted = isInWishlist(product.id);
  const hasDiscount = product.discount && product.discount > 0;
  const isOutOfStock = product.stock === 0;
  const savings = product.originalPrice 
    ? (product.originalPrice - product.price) * quantity 
    : 0;
  const specificationAttributes = Array.isArray(product.attributes) ? product.attributes : [];

  const handleWishlistToggle = () => {
    if (isWishlisted) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  const handleAddToCart = () => {
    addItem(product, quantity, selectedVariations);
    toast.success('Added to cart!', {
      description: `${quantity}x ${product.name}`,
    });
  };

  const handleBuyNow = () => {
    addItem(product, quantity, selectedVariations);
    toast.success('Redirecting to checkout...', {
      description: 'Your order is being prepared',
    });
    // In real app, navigate to checkout
    window.location.href = '/checkout';
  };

   const handleBookNow = () => {
     toast.info('Product added to your booking', {
       description: 'You will be notified when available',
     });
   };


  return (
    <Layout>
      <div className="container-main py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-accent transition-colors">Home</Link>
          <ChevronRight className="h-4 w-4" />
          <Link to={`/category/${product.category.slug}`} className="hover:text-accent transition-colors">
            {product.category.name}
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground truncate">{product.name}</span>
        </nav>

        {/* Main Product Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Image Gallery */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <ImageGallery images={product.images} productName={product.name} />
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {product.isFlashSale && (
                <Badge className="badge-flash flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  Flash Sale
                </Badge>
              )}
              {product.isPrime && (
                <Badge className="badge-prime">Prime</Badge>
              )}
              {product.isFreeShipping && (
                <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                  Free Shipping
                </Badge>
              )}
            </div>

            {/* Title */}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
                {product.name}
              </h1>
              
              {/* Rating & Reviews */}
              <div className="flex flex-wrap items-center gap-4 mt-3">
                <div className="flex items-center gap-1">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i}
                        className={cn(
                          "h-4 w-4",
                          i < Math.floor(product.rating) 
                            ? "fill-rating text-rating" 
                            : "fill-muted text-muted"
                        )}
                      />
                    ))}
                  </div>
                  <span className="font-medium text-foreground">{product.rating}</span>
                </div>
                <a href="#reviews" className="text-sm text-accent hover:underline">
                  {product.reviewCount.toLocaleString()} reviews
                </a>
                <span className="text-sm text-muted-foreground">
                  5,000+ sold
                </span>
              </div>
            </div>

            <Separator />

            {/* Price */}
            <div className="space-y-2">
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-3xl md:text-4xl font-bold text-foreground">
                  ${product.price.toFixed(2)}
                </span>
                {hasDiscount && product.originalPrice && (
                  <>
                    <span className="text-xl text-muted-foreground line-through">
                      ${product.originalPrice.toFixed(2)}
                    </span>
                    <Badge className="badge-flash text-sm">
                      {product.discount}% OFF
                    </Badge>
                  </>
                )}
              </div>
              {savings > 0 && (
                <p className="text-success font-medium">
                  You save: ${savings.toFixed(2)}
                </p>
              )}
            </div>

            <Separator />

            {/* Variations */}
            {product.variations && product.variations.length > 0 && (
              <>
                <VariationSelector
                  variations={product.variations}
                  selectedVariations={selectedVariations}
                  onSelect={setSelectedVariations}
                />
                <Separator />
              </>
            )}

            {/* Quantity */}
            <div className="space-y-3">
              <h3 className="font-medium text-foreground">Quantity</h3>
              <div className="flex items-center gap-4">
                <QuantitySelector 
                  value={quantity}
                  onChange={setQuantity}
                  max={product.stock || 99}
                />
                <span className="text-sm text-muted-foreground">
                  {product.stock > 0 ? (
                    <span className="text-success">
                      <Check className="h-4 w-4 inline mr-1" />
                      {product.stock} in stock
                    </span>
                  ) : (
                    <span className="text-destructive">Out of Stock</span>
                  )}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {isOutOfStock ? (
                <Button 
                  variant="book-now" 
                  size="xl" 
                  className="w-full"
                  onClick={handleBookNow}
                >
                  <Package className="h-5 w-5 mr-2" />
                  Book Now - Get Notified
                </Button>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    size="xl" 
                    className="w-full"
                    onClick={handleAddToCart}
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Add to Cart
                  </Button>
                  <Button 
                    variant="buy-now" 
                    size="xl" 
                    className="w-full"
                    onClick={handleBuyNow}
                  >
                    <Zap className="h-5 w-5 mr-2" />
                    Buy Now
                  </Button>
                </div>
              )}

               {/* Digital Download Button */}
               {product.isDigital && user && (
                 <Button 
                   variant="outline" 
                   size="xl" 
                   className="w-full border-accent text-accent hover:bg-accent hover:text-accent-foreground"
                   onClick={handleDigitalDownload}
                 >
                   <Download className="h-5 w-5 mr-2" />
                   Download Digital Product
                 </Button>
               )}

               {/* Secondary Actions */}
              <div className="flex gap-3">
                <Button 
                  variant="ghost" 
                  className="flex-1"
                  onClick={handleWishlistToggle}
                >
                  <Heart className={cn(
                    "h-5 w-5 mr-2",
                    isWishlisted && "fill-destructive text-destructive"
                  )} />
                  {isWishlisted ? 'Saved' : 'Wishlist'}
                </Button>
                <Button
                  variant="ghost"
                  className={cn("flex-1", isInCompare(product.id) && "text-accent")}
                  onClick={() => isInCompare(product.id) ? removeFromCompare(product.id) : addToCompare(product)}
                >
                  <GitCompareArrows className="h-5 w-5 mr-2" />
                  {isInCompare(product.id) ? 'Comparing' : 'Compare'}
                </Button>
                <Button variant="ghost" className="flex-1">
                  <Share2 className="h-5 w-5 mr-2" />
                  Share
                </Button>
              </div>

              {/* WhatsApp */}
              <Button 
                variant="outline" 
                className="w-full border-success text-success hover:bg-success hover:text-success-foreground"
              >
                <MessageCircle className="h-5 w-5 mr-2" />
                Chat with Seller on WhatsApp
              </Button>
            </div>

            <Separator />

            {/* Delivery & Services */}
            <div className="space-y-4">
              <h3 className="font-medium text-foreground">Delivery & Services</h3>
              <div className="grid gap-3">
                <div className="flex items-start gap-3 p-3 bg-secondary/50 rounded-lg">
                  <Truck className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Free Delivery</p>
                    <p className="text-sm text-muted-foreground">Estimated delivery: 3-5 business days</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-secondary/50 rounded-lg">
                  <RotateCcw className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Easy Returns</p>
                    <p className="text-sm text-muted-foreground">30-day return policy</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-secondary/50 rounded-lg">
                  <Shield className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">2 Year Warranty</p>
                    <p className="text-sm text-muted-foreground">Official manufacturer warranty</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Seller Info */}
            <div className="p-4 bg-card border border-border rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center">
                    <Store className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{product.seller.name}</span>
                      {product.seller.isVerified && (
                        <Check className="h-4 w-4 text-prime" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Star className="h-3 w-3 fill-rating text-rating" />
                      <span>{product.seller.rating} seller rating</span>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Visit Store
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <Tabs defaultValue="description" className="mb-12">
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
            <TabsTrigger 
              value="description"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent"
            >
              Description
            </TabsTrigger>
            <TabsTrigger 
              value="specifications"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent"
            >
              Specifications
            </TabsTrigger>
            <TabsTrigger 
              value="reviews"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent"
            >
              Reviews ({product.reviewCount.toLocaleString()})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="description" className="pt-6">
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-line text-muted-foreground leading-relaxed">
                {product.description}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="specifications" className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {specificationAttributes.map((attr, i) => (
                <div 
                  key={i}
                  className={cn(
                    "flex justify-between py-3 px-4 rounded-lg",
                    i % 2 === 0 ? "bg-secondary/50" : "bg-transparent"
                  )}
                >
                   <span className="text-muted-foreground">{attr.name}</span>
                   <span className="font-medium text-foreground">{attr.value}</span>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="reviews" id="reviews" className="pt-6">
            <ReviewsSection 
              productId={product.id}
              productName={product.name}
              rating={product.rating}
              reviewCount={product.reviewCount}
            />
          </TabsContent>
        </Tabs>

        {/* Related Products */}
        <section className="mb-12">
          <h2 className="text-xl md:text-2xl font-bold text-foreground mb-6">
            Related Products
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
             {relatedProducts.slice(0, 5).map((p) => (
               <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>

        {/* Recently Viewed */}
        <section>
          <h2 className="text-xl md:text-2xl font-bold text-foreground mb-6">
            Recently Viewed
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
             {relatedProducts.slice(0, 5).map((p) => (
               <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default ProductDetail;
