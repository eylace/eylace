import { X, Star, Check, Minus, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCompare } from '@/contexts/CompareContext';
import { useCart } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export const CompareModal = () => {
  const { items, removeItem, isOpen, setIsOpen, clearAll } = useCompare();
  const { addItem: addToCart } = useCart();

  if (!isOpen || items.length < 2) return null;

  const specs = new Set<string>();
  items.forEach(p => p.attributes?.forEach(a => specs.add(a.name)));
  const allSpecs = Array.from(specs);

  const getSpec = (product: typeof items[0], specName: string) => {
    return product.attributes?.find(a => a.name === specName)?.value;
  };

  const handleAddToCart = (product: typeof items[0]) => {
    addToCart(product, 1);
    toast.success('Added to cart!', { description: product.name });
  };

  // Find best values for highlighting
  const bestPrice = Math.min(...items.map(p => p.price));
  const bestRating = Math.max(...items.map(p => p.rating));

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" onClick={() => setIsOpen(false)}>
      <div
        className="fixed inset-4 md:inset-8 bg-card rounded-2xl border border-border shadow-xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-xl font-bold">Product Comparison</h2>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={clearAll}>Clear All</Button>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-secondary rounded-lg">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="min-w-[600px]">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="sticky left-0 bg-card p-4 text-left text-sm font-semibold text-muted-foreground w-36 min-w-[144px]">
                    Product
                  </th>
                  {items.map(product => (
                    <th key={product.id} className="p-4 text-center min-w-[200px]">
                      <div className="relative">
                        <button
                          onClick={() => removeItem(product.id)}
                          className="absolute -top-1 -right-1 p-1 bg-secondary rounded-full hover:bg-destructive hover:text-destructive-foreground transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                        <Link to={`/product/${product.slug}`} onClick={() => setIsOpen(false)}>
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-32 h-32 object-cover rounded-xl mx-auto mb-3 hover:scale-105 transition-transform"
                          />
                          <p className="font-semibold text-sm line-clamp-2 hover:text-accent transition-colors">
                            {product.name}
                          </p>
                        </Link>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {/* Price */}
                <tr className="bg-secondary/30">
                  <td className="sticky left-0 bg-secondary/30 p-4 font-medium text-sm">Price</td>
                  {items.map(product => (
                    <td key={product.id} className="p-4 text-center">
                      <span className={cn(
                        "text-xl font-bold",
                        product.price === bestPrice && "text-success"
                      )}>
                        ৳{product.price.toFixed(2)}
                      </span>
                      {product.originalPrice && (
                        <span className="block text-sm text-muted-foreground line-through">
                          ${product.originalPrice.toFixed(2)}
                        </span>
                      )}
                      {product.discount && product.discount > 0 && (
                        <Badge className="mt-1 bg-destructive/10 text-destructive text-xs">
                          -{product.discount}% OFF
                        </Badge>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Rating */}
                <tr>
                  <td className="sticky left-0 bg-card p-4 font-medium text-sm">Rating</td>
                  {items.map(product => (
                    <td key={product.id} className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
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
                        <span className={cn(
                          "font-semibold text-sm",
                          product.rating === bestRating && "text-success"
                        )}>
                          {product.rating}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {product.reviewCount.toLocaleString()} reviews
                      </p>
                    </td>
                  ))}
                </tr>

                {/* Stock */}
                <tr className="bg-secondary/30">
                  <td className="sticky left-0 bg-secondary/30 p-4 font-medium text-sm">Availability</td>
                  {items.map(product => (
                    <td key={product.id} className="p-4 text-center">
                      {product.stock > 0 ? (
                        <span className="inline-flex items-center gap-1 text-success text-sm font-medium">
                          <Check className="h-4 w-4" /> In Stock ({product.stock})
                        </span>
                      ) : (
                        <span className="text-destructive text-sm font-medium">Out of Stock</span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Category */}
                <tr>
                  <td className="sticky left-0 bg-card p-4 font-medium text-sm">Category</td>
                  {items.map(product => (
                    <td key={product.id} className="p-4 text-center text-sm">
                      {product.category.name}
                    </td>
                  ))}
                </tr>

                {/* Seller */}
                <tr className="bg-secondary/30">
                  <td className="sticky left-0 bg-secondary/30 p-4 font-medium text-sm">Seller</td>
                  {items.map(product => (
                    <td key={product.id} className="p-4 text-center text-sm">
                      <span>{product.seller.name}</span>
                      {product.seller.isVerified && (
                        <Check className="h-3.5 w-3.5 text-prime inline ml-1" />
                      )}
                    </td>
                  ))}
                </tr>

                {/* Shipping */}
                <tr>
                  <td className="sticky left-0 bg-card p-4 font-medium text-sm">Free Shipping</td>
                  {items.map(product => (
                    <td key={product.id} className="p-4 text-center">
                      {product.isFreeShipping ? (
                        <Check className="h-5 w-5 text-success mx-auto" />
                      ) : (
                        <Minus className="h-5 w-5 text-muted-foreground mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>

                {/* Dynamic Specs */}
                {allSpecs.map((spec, i) => (
                  <tr key={spec} className={i % 2 === 0 ? 'bg-secondary/30' : ''}>
                    <td className={cn("sticky left-0 p-4 font-medium text-sm", i % 2 === 0 ? 'bg-secondary/30' : 'bg-card')}>
                      {spec}
                    </td>
                    {items.map(product => (
                      <td key={product.id} className="p-4 text-center text-sm">
                        {getSpec(product, spec) || <Minus className="h-4 w-4 text-muted-foreground mx-auto" />}
                      </td>
                    ))}
                  </tr>
                ))}

                {/* Add to Cart */}
                <tr>
                  <td className="sticky left-0 bg-card p-4 font-medium text-sm">Action</td>
                  {items.map(product => (
                    <td key={product.id} className="p-4 text-center">
                      <Button
                        variant="accent"
                        size="sm"
                        disabled={product.stock === 0}
                        onClick={() => handleAddToCart(product)}
                        className="gap-1.5"
                      >
                        <ShoppingCart className="h-4 w-4" />
                        Add to Cart
                      </Button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};
