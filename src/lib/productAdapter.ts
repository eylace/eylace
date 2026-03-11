import { DBProduct, DBCategory, DBSeller } from '@/hooks/useProducts';
import { Product, Category, Seller, ProductAttribute, ProductVariation, VariationOption } from '@/types';

const normalizeProductAttributes = (attributes: unknown): ProductAttribute[] | undefined => {
  if (Array.isArray(attributes)) {
    return attributes
      .filter((item): item is { name?: unknown; value?: unknown } => !!item && typeof item === 'object')
      .map((item) => ({
        name: String(item.name ?? '').trim(),
        value: String(item.value ?? '').trim(),
      }))
      .filter((item) => item.name.length > 0);
  }

  if (attributes && typeof attributes === 'object') {
    return Object.entries(attributes as Record<string, unknown>)
      .map(([name, value]) => ({
        name: String(name).trim(),
        value: String(value ?? '').trim(),
      }))
      .filter((item) => item.name.length > 0);
  }

  return undefined;
};

const normalizeVariations = (variations: unknown): ProductVariation[] | undefined => {
  if (!Array.isArray(variations) || variations.length === 0) return undefined;

  // Check if already in the expected format (has options as objects with id/value/stock)
  const first = variations[0];
  if (first?.options?.[0]?.id && first?.options?.[0]?.value !== undefined) {
    return variations as ProductVariation[];
  }

  // DB format: [{name: "black", options: ["S", "X", "XL", "M"]}, ...]
  // Each entry is a color with its available sizes
  const colorNames: string[] = [];
  const sizesByColor: Record<string, string[]> = {};

  for (const item of variations) {
    if (!item || typeof item !== 'object') continue;
    const colorName = String(item.name || '').trim();
    if (!colorName) continue;
    colorNames.push(colorName);
    const opts = Array.isArray(item.options) ? item.options.map((o: unknown) => String(o)) : [];
    sizesByColor[colorName] = opts;
  }

  if (colorNames.length === 0) return undefined;

  // Build color variation
  const colorVariation: ProductVariation = {
    id: 'color-variation',
    name: 'Color',
    type: 'color',
    options: colorNames.map((name, i) => ({
      id: `color-${i}`,
      value: name,
      stock: 99,
    })),
  };

  // Collect all unique sizes
  const allSizes = [...new Set(colorNames.flatMap(c => sizesByColor[c] || []))];

  const sizeVariation: ProductVariation = {
    id: 'size-variation',
    name: 'Size',
    type: 'size',
    options: allSizes.map((size, i) => ({
      id: `size-${i}`,
      value: size,
      stock: 99,
    })),
  };

  const result: ProductVariation[] = [colorVariation];
  if (allSizes.length > 0) {
    // Attach sizesByColor mapping for the selector
    (sizeVariation as any)._sizesByColor = sizesByColor;
    result.push(sizeVariation);
  }

  return result;
};

export const adaptDBProduct = (dbProduct: DBProduct): Product => {
  const category: Category = dbProduct.category ? {
    id: dbProduct.category.id,
    name: dbProduct.category.name,
    slug: dbProduct.category.slug,
    icon: dbProduct.category.icon || undefined,
    image: dbProduct.category.image || undefined,
  } : {
    id: 'unknown',
    name: 'Uncategorized',
    slug: 'uncategorized',
  };

  const seller: Seller = dbProduct.seller ? {
    id: dbProduct.seller.id,
    name: dbProduct.seller.name,
    slug: dbProduct.seller.slug,
    logo: dbProduct.seller.logo || undefined,
    rating: dbProduct.seller.rating || 0,
    isVerified: dbProduct.seller.is_verified || false,
    joinedAt: new Date(),
  } : {
    id: 'unknown',
    name: 'Unknown Seller',
    slug: 'unknown',
    rating: 0,
    isVerified: false,
    joinedAt: new Date(),
  };

  return {
    id: dbProduct.id,
    name: dbProduct.name,
    slug: dbProduct.slug,
    description: dbProduct.description || '',
    price: Number(dbProduct.price),
    originalPrice: dbProduct.original_price ? Number(dbProduct.original_price) : undefined,
    discount: dbProduct.discount || undefined,
    images: dbProduct.images || ['/placeholder.svg'],
    category,
    seller,
    rating: Number(dbProduct.rating) || 0,
    reviewCount: dbProduct.review_count || 0,
    stock: dbProduct.stock || 0,
    variations: normalizeVariations(dbProduct.variations),
    attributes: normalizeProductAttributes(dbProduct.attributes),
    isFlashSale: dbProduct.is_flash_sale || false,
    flashSaleEnds: dbProduct.flash_sale_ends ? new Date(dbProduct.flash_sale_ends) : undefined,
    isPrime: dbProduct.is_prime || false,
    isFreeShipping: dbProduct.is_free_shipping || false,
    createdAt: new Date(dbProduct.created_at),
    updatedAt: new Date(dbProduct.updated_at),
  };
};
 
 export const adaptDBProducts = (dbProducts: DBProduct[]): Product[] => {
   return dbProducts.map(adaptDBProduct);
 };
