import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Star, Heart, Share2, ShoppingCart, Zap, Truck, Shield, RotateCcw,
  Check, MessageCircle, ChevronRight, Package, Store, GitCompareArrows, Download, Phone
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
import { ProductGrid } from '@/components/products/ProductGrid';
import { RecommendedSidebar } from '@/components/products/RecommendedSidebar';
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
import { useLanguage } from '@/contexts/LanguageContext';
import { useWebsiteSetup } from '@/hooks/useWebsiteSetup';
import { setBuyNowCheckoutItem } from '@/lib/checkoutSession';
import { getProductFeatureImage } from '@/lib/productImage';
import { Loader2 } from 'lucide-react';
import DOMPurify from 'dompurify';

// Inject/update a meta tag in <head>
const setMeta = (selector: string, attrs: Record<string, string>) => {
  let el = document.head.querySelector<HTMLMetaElement | HTMLLinkElement>(selector);
  if (!el) {
    const tagName = selector.startsWith('link') ? 'link' : 'meta';
    el = document.createElement(tagName) as any;
    document.head.appendChild(el);
  }
  Object.entries(attrs).forEach(([k, v]) => el!.setAttribute(k, v));
  return el;
};

const ProductDetail = () => {
  const { slug } = useParams();
  const [quantity, setQuantity] = useState(1);
  const [selectedVariations, setSelectedVariations] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState('description');
  const { addItem } = useCart();
  const { user } = useAuth();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlist();
  const { addItem: addToCompare, removeItem: removeFromCompare, isInCompare } = useCompare();
  const { formatPrice } = useCurrency();
  const { t } = useLanguage();
  const websiteSetup = useWebsiteSetup();
  const location = useLocation();
  const navigate = useNavigate();
  const reviewsRef = useRef<HTMLDivElement>(null);
  const [liveReviewStats, setLiveReviewStats] = useState<{ averageRating: number; totalReviews: number } | null>(null);
   
  const { product: dbProduct, isLoading, error } = useProduct(slug || '');
  const product = dbProduct ? adaptDBProduct(dbProduct) : null;
  const { products: relatedDbProducts } = useProducts({
    categorySlug: product?.category?.slug,
    limit: 10,
  });
  const relatedProducts = adaptDBProducts(relatedDbProducts).filter((p) => p.id !== product?.id);

  // === Variant resolution ====================================================
  // When the customer picks a Color/Size combination, look up the matching
  // variant row (authored in the admin/seller editor) and override price,
  // stock and the lead gallery image. This makes per-variant images and
  // prices appear instantly on the product page.
  const matchedVariant = (() => {
    if (!product?.variantRows || product.variantRows.length === 0) return undefined;
    const sel = selectedVariations || {};
    return product.variantRows.find(r =>
      Object.entries(r.combination).every(([k, v]) => sel[k] === v),
    );
  })();

  const variantPrice = matchedVariant && matchedVariant.price !== '' && matchedVariant.price !== null
    ? Number(matchedVariant.price) || undefined
    : undefined;
  const variantStock = matchedVariant && matchedVariant.stock !== '' && matchedVariant.stock !== null
    ? Number(matchedVariant.stock)
    : undefined;
  const galleryImages = (() => {
    if (!product) return [] as string[];
    if (matchedVariant?.image) {
      // Put the variant's hero image first, keep the rest as fallbacks
      return Array.from(new Set([matchedVariant.image, ...(product.images || [])]));
    }
    return Array.from(new Set([getProductFeatureImage(product), ...(product.images || [])]));
  })();

  const displayRating = liveReviewStats?.averageRating ?? product?.rating ?? 0;
  const displayReviewCount = liveReviewStats?.totalReviews ?? product?.reviewCount ?? 0;

  useEffect(() => {
    setLiveReviewStats(null);
  }, [slug]);

  // === SEO: inject meta tags + JSON-LD structured data ===
  useEffect(() => {
    if (!product) return;
    const cleanDesc = (product.description || '').replace(/<[^>]*>/g, '').trim();
    // Variant-aware title (e.g. "Shirt — Red, M | Shop")
    const variantSuffix = Object.values(selectedVariations || {}).filter(Boolean).join(', ');
    const baseName = variantSuffix ? `${product.name} — ${variantSuffix}` : product.name;
    const title = product.metaTitle || `${baseName} | ${product.category?.name || 'Shop'}`;
    const description = product.metaDescription || product.shortDescription || cleanDesc.slice(0, 160) || `Buy ${product.name} online.`;
    const keywords = product.metaKeywords || (product.tags || []).join(', ') || product.name;
    // Best-available image: explicit meta image → first product image → first video thumbnail (if exposed via attributes)
    const fallbackVideoThumb = (product as any)?.attributes?.video_thumbnails?.[0] || '';
    const image = product.metaImage || getProductFeatureImage(product, '') || fallbackVideoThumb || '';
    const url = product.canonicalUrl || `${window.location.origin}/product/${product.slug}`;

    document.title = title;
    setMeta('meta[name="description"]', { name: 'description', content: description });
    setMeta('meta[name="keywords"]', { name: 'keywords', content: keywords });
    setMeta('link[rel="canonical"]', { rel: 'canonical', href: url });
    // Open Graph
    setMeta('meta[property="og:title"]', { property: 'og:title', content: title });
    setMeta('meta[property="og:description"]', { property: 'og:description', content: description });
    setMeta('meta[property="og:type"]', { property: 'og:type', content: 'product' });
    setMeta('meta[property="og:url"]', { property: 'og:url', content: url });
    if (image) setMeta('meta[property="og:image"]', { property: 'og:image', content: image });
    // Twitter
    setMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: image ? 'summary_large_image' : 'summary' });
    setMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: title });
    setMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: description });
    if (image) setMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: image });

    // JSON-LD structured data
    let ld = document.getElementById('product-jsonld') as HTMLScriptElement | null;
    if (!ld) {
      ld = document.createElement('script');
      ld.id = 'product-jsonld';
      ld.type = 'application/ld+json';
      document.head.appendChild(ld);
    }
    ld.textContent = JSON.stringify({
      '@context': 'https://schema.org/',
      '@type': 'Product',
      name: baseName,
      description,
      image: image ? [image, ...(product.images || []).slice(0, 4)] : product.images,
      sku: product.id,
      brand: product.seller?.name ? { '@type': 'Brand', name: product.seller.name } : undefined,
      aggregateRating: displayReviewCount > 0 ? {
        '@type': 'AggregateRating',
        ratingValue: displayRating,
        reviewCount: displayReviewCount,
      } : undefined,
      offers: {
        '@type': 'Offer',
        url,
        priceCurrency: 'BDT',
        price: product.price,
        availability: (product.stock ?? 0) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        itemCondition: 'https://schema.org/NewCondition',
      },
    });

    return () => {
      // Reset title on unmount
      document.title = 'Eylace';
    };
  }, [product, displayRating, displayReviewCount, selectedVariations]);

  // Auto-switch to reviews tab and scroll when #reviews hash is present
  useEffect(() => {
    if (location.hash === '#reviews' && product) {
      setActiveTab('reviews');
      setTimeout(() => {
        reviewsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  }, [location.hash, product]);

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
          <h1 className="text-2xl font-bold mb-4">{t('product.notFound')}</h1>
          <Button variant="accent" onClick={() => window.location.href = '/'}>
            {t('product.backToHome')}
          </Button>
        </div>
      </Layout>
    );
  }

  const isWishlisted = isInWishlist(product.id);
  const hasDiscount = product.discount && product.discount > 0;
  // Effective stock: when a variant is selected, use that variant's stock;
  // otherwise fall back to the parent product stock.
  const hasVariantSelection = !!matchedVariant;
  const variantPickRequired = !!product.variations && product.variations.length > 0 && !hasVariantSelection;
  const effectiveStock = hasVariantSelection
    ? (typeof variantStock === 'number' ? variantStock : (product.stock ?? 0))
    : (product.stock ?? 0);
  const isOutOfStock = effectiveStock === 0;
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
    toast.success(t('product.addedToCart'), {
      description: `${quantity}x ${product.name}`,
    });
  };

  const handleBuyNow = () => {
    setBuyNowCheckoutItem({ product, quantity, selectedVariations });
    toast.success(t('product.redirectCheckout'), {
      description: 'Your order is being prepared',
    });
    navigate('/checkout?source=buy-now');
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
          <Link to="/" className="hover:text-accent transition-colors">{t('common.home')}</Link>
          <ChevronRight className="h-4 w-4" />
          <Link to={`/category/${product.category.slug}`} className="hover:text-accent transition-colors">
            {product.category.name}
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground truncate">{product.name}</span>
        </nav>

        {/* Main Product Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_340px] gap-8 mb-12">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <ImageGallery images={galleryImages} productName={product.name} />
          </div>

          <div className="space-y-6 min-w-0">
            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {product.isFlashSale && (
                <Badge className="badge-flash flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  {t('product.flashSale')}
                </Badge>
              )}
              {product.isPrime && (
                <Badge className="badge-prime">Prime</Badge>
              )}
              {product.isFreeShipping && (
                <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                  {t('product.freeShipping')}
                </Badge>
              )}
            </div>

            {/* Title */}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
                {product.name}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 mt-3">
                <div className="flex items-center gap-1">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i}
                        className={cn(
                          "h-4 w-4",
                            i < Math.floor(displayRating) 
                            ? "fill-rating text-rating" 
                            : "fill-muted text-muted"
                        )}
                      />
                    ))}
                  </div>
                  <span className="font-medium text-foreground">{displayRating.toFixed(1)}</span>
                </div>
                <a href="#reviews" className="text-sm text-accent hover:underline">
                  {displayReviewCount.toLocaleString()} {t('product.reviews')}
                </a>
                {(product.soldCount ?? 0) > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {(product.soldCount ?? 0).toLocaleString()} {t('product.sold')}
                  </span>
                )}
              </div>
            </div>

            <Separator />

            {/* Price */}
            <div className="space-y-2">
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-3xl md:text-4xl font-bold text-foreground">
                  {formatPrice(variantPrice ?? product.price)}
                </span>
                {hasDiscount && product.originalPrice && (
                  <>
                    <span className="text-xl text-muted-foreground line-through">
                      {formatPrice(product.originalPrice)}
                    </span>
                    <Badge className="badge-flash text-sm">
                      {product.discount}% {t('common.off')}
                    </Badge>
                  </>
                )}
              </div>
              {savings > 0 && (
                <p className="text-success font-medium">
                  {t('product.youSave')} {formatPrice(savings)}
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
              <h2 className="text-base font-medium text-foreground">{t('product.quantity')}</h2>
              <div className="flex items-center gap-4">
                <QuantitySelector 
                  value={quantity}
                  onChange={setQuantity}
                  max={Math.max(1, effectiveStock || 99)}
                />
                <span className="text-sm text-muted-foreground">
                  {effectiveStock > 0 ? (
                    <span className="text-success">
                      <Check className="h-4 w-4 inline mr-1" />
                      {effectiveStock} {t('product.inStock')}
                      {hasVariantSelection && (
                        <span className="ml-1 text-xs text-muted-foreground">
                          ({Object.values(selectedVariations).filter(Boolean).join(' / ')})
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-destructive font-medium">
                      {t('product.outOfStock')}
                      {hasVariantSelection && (
                        <span className="ml-1 text-xs">
                          ({Object.values(selectedVariations).filter(Boolean).join(' / ')})
                        </span>
                      )}
                    </span>
                  )}
                </span>
              </div>
              {variantPickRequired && (
                <p className="text-xs text-muted-foreground">
                  Please select a variation to see availability.
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {isOutOfStock ? (
                <Button 
                  variant="book-now" 
                  size="xl" 
                  className="w-full"
                  onClick={handleBookNow}
                  disabled={variantPickRequired}
                >
                  <Package className="h-5 w-5 mr-2" />
                  {t('product.bookNow')}
                </Button>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    size="xl" 
                    className="w-full"
                    onClick={handleAddToCart}
                    disabled={variantPickRequired || isOutOfStock}
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    {t('product.addToCart')}
                  </Button>
                  <Button 
                    variant="buy-now" 
                    size="xl" 
                    className="w-full"
                    onClick={handleBuyNow}
                    disabled={variantPickRequired || isOutOfStock}
                  >
                    <Zap className="h-5 w-5 mr-2" />
                    {t('product.buyNow')}
                  </Button>
               </div>
              )}

              {product.isDigital && user && (
                <Button 
                  variant="outline" 
                  size="xl" 
                  className="w-full border-accent text-accent hover:bg-accent hover:text-accent-foreground"
                  onClick={handleDigitalDownload}
                >
                  <Download className="h-5 w-5 mr-2" />
                  {t('product.downloadDigital')}
                </Button>
              )}

              {/* Call & WhatsApp CTA Buttons */}
              {(websiteSetup.ctaCallEnabled || websiteSetup.ctaWhatsappEnabled) && (
                <div
                  data-testid="cta-buttons"
                  className="grid grid-cols-2 gap-2 sm:gap-3 min-h-[3rem]"
                >
                  {websiteSetup.ctaCallEnabled && websiteSetup.ctaCallNumber && (
                    <Button
                      type="button"
                      variant="outline"
                      size="xl"
                      data-testid="cta-call"
                      aria-label={`${t('product.callNow')} ${websiteSetup.ctaCallNumber}`}
                      className="w-full min-w-0 min-h-12 px-2 sm:px-4 bg-primary/10 border-primary text-primary hover:bg-primary hover:text-primary-foreground touch-manipulation select-none"
                      onClick={() => window.open(`tel:${websiteSetup.ctaCallNumber}`, '_self')}
                    >
                      <Phone className="h-5 w-5 mr-1.5 sm:mr-2 flex-shrink-0" aria-hidden="true" />
                      <span className="truncate">{t('product.callNow')}</span>
                    </Button>
                  )}
                  {websiteSetup.ctaWhatsappEnabled && websiteSetup.ctaWhatsappNumber && (
                    <Button
                      type="button"
                      variant="outline"
                      size="xl"
                      data-testid="cta-whatsapp"
                      aria-label={t('product.whatsapp')}
                      className="w-full min-w-0 min-h-12 px-2 sm:px-4 bg-success/10 border-success text-success hover:bg-success hover:text-success-foreground touch-manipulation select-none"
                      onClick={(e) => {
                        const btn = e.currentTarget;
                        if (btn.dataset.busy === '1') return;
                        btn.dataset.busy = '1';
                        const num = websiteSetup.ctaWhatsappNumber.replace(/^0/, '88');
                        const msg = `${t('product.whatsappInquiry')}: ${product.name}`;
                        const url = `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
                        window.open(url, '_blank', 'noopener,noreferrer');
                        setTimeout(() => { btn.dataset.busy = '0'; }, 800);
                      }}
                    >
                      <MessageCircle className="h-5 w-5 mr-1.5 sm:mr-2 flex-shrink-0" aria-hidden="true" />
                      <span className="truncate">{t('product.whatsapp')}</span>
                    </Button>
                  )}
                </div>
              )}

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
                  {isWishlisted ? t('product.saved') : t('product.wishlist')}
                </Button>
                <Button
                  variant="ghost"
                  className={cn("flex-1", isInCompare(product.id) && "text-accent")}
                  onClick={() => isInCompare(product.id) ? removeFromCompare(product.id) : addToCompare(product)}
                >
                  <GitCompareArrows className="h-5 w-5 mr-2" />
                  {isInCompare(product.id) ? t('product.comparing') : t('product.compare')}
                </Button>
                <Button variant="ghost" className="flex-1">
                  <Share2 className="h-5 w-5 mr-2" />
                  {t('product.share')}
                </Button>
              </div>
            </div>

            <Separator />

            {/* Delivery & Services */}
            <div className="space-y-4">
              <h3 className="font-medium text-foreground">{t('product.deliveryServices')}</h3>
              <div className="grid gap-3">
                <div className="flex items-start gap-3 p-3 bg-secondary/50 rounded-lg">
                  <Truck className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">{t('product.freeDelivery')}</p>
                    <p className="text-sm text-muted-foreground">{t('product.estimatedDelivery')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-secondary/50 rounded-lg">
                  <RotateCcw className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">{t('product.easyReturns')}</p>
                    <p className="text-sm text-muted-foreground">{t('product.returnPolicy')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-secondary/50 rounded-lg">
                  <Shield className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">{t('product.warranty')}</p>
                    <p className="text-sm text-muted-foreground">{t('product.warrantyDesc')}</p>
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
                      <span>{product.seller.rating} {t('product.sellerRating')}</span>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  {t('product.visitStore')}
                </Button>
              </div>
            </div>
          </div>

          {/* Recommended Sidebar (same-category picks) */}
          <div className="hidden xl:block">
            <RecommendedSidebar
              categorySlug={product.category?.slug}
              excludeProductId={product.id}
            />
          </div>
        </div>

        {/* Tabs Section */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-12">
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent" ref={reviewsRef}>
            <TabsTrigger 
              value="description"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent"
            >
              {t('product.description')}
            </TabsTrigger>
            <TabsTrigger 
              value="specifications"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent"
            >
              {t('product.specifications')}
            </TabsTrigger>
            <TabsTrigger 
              value="reviews"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent"
            >
              {t('product.reviews')} ({displayReviewCount.toLocaleString()})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="description" className="pt-6">
            <div className="prose prose-sm sm:prose-base max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-a:text-accent prose-li:text-muted-foreground prose-blockquote:border-accent prose-blockquote:text-foreground prose-code:text-accent prose-img:rounded-lg">
              {product.description && /<[a-z][\s\S]*>/i.test(product.description) ? (
                <div
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(product.description, {
                      ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling', 'target'],
                      FORBID_TAGS: ['iframe', 'object', 'embed', 'script', 'style'],
                    }),
                  }}
                />
              ) : (
                <p className="whitespace-pre-line text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              )}
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
              rating={displayRating}
              reviewCount={displayReviewCount}
              onStatsChange={setLiveReviewStats}
            />
          </TabsContent>
        </Tabs>

        {/* Related Products */}
        <section className="mb-12">
          <h2 className="text-xl md:text-2xl font-bold text-foreground mb-6">
            {t('product.relatedProducts')}
          </h2>
          <ProductGrid>
            {relatedProducts.slice(0, 5).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </ProductGrid>
        </section>

        {/* Recently Viewed */}
        <section>
          <h2 className="text-xl md:text-2xl font-bold text-foreground mb-6">
            {t('product.recentlyViewed')}
          </h2>
          <ProductGrid>
            {relatedProducts.slice(0, 5).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </ProductGrid>
        </section>
      </div>
    </Layout>
  );
};

export default ProductDetail;
