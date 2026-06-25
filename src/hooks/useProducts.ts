import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DBProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  original_price: number | null;
  discount: number | null;
  images: string[];
  category_id: string | null;
  seller_id: string | null;
  rating: number | null;
  review_count: number | null;
  stock: number | null;
  variations: any;
  attributes: any;
  is_flash_sale: boolean | null;
  flash_sale_ends: string | null;
  is_prime: boolean | null;
  is_free_shipping: boolean | null;
  is_active: boolean | null;
  is_digital: boolean | null;
  sold_count?: number | null;
  created_at: string;
  updated_at: string;
  category?: DBCategory | null;
  seller?: DBSeller | null;
}

export interface DBCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  image: string | null;
  parent_id: string | null;
  sort_order: number | null;
}

export interface DBSeller {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  rating: number | null;
  is_verified: boolean | null;
}

interface UseProductsOptions {
  categorySlug?: string;
  limit?: number;
  flashSaleOnly?: boolean;
  searchQuery?: string;
}

export interface CategoryDiscount {
  category_id: string;
  discount_type: string;
  discount_value: number;
}

// ============================================================================
// Stale-while-revalidate cache for product lists & details.
// Returns cached data instantly on revisit, then silently refetches in the
// background to update. Massively improves perceived load time on the product
// listing and product detail pages.
// ============================================================================
const LIST_TTL = 60 * 1000; // 1 minute background refresh window
const DETAIL_TTL = 2 * 60 * 1000;

interface CacheEntry<T> {
  data: T;
  ts: number;
}
const productListCache = new Map<string, CacheEntry<DBProduct[]>>();
const productDetailCache = new Map<string, CacheEntry<DBProduct>>();
const inflight = new Map<string, Promise<any>>();

/**
 * Warm productDetailCache for a slug so subsequent navigation renders the
 * product page instantly. Safe to call repeatedly — dedupes via inflight
 * map and skips refetch when the cached entry is still fresh.
 */
export function prefetchProduct(slug: string): void {
  if (!slug) return;
  const c = productDetailCache.get(slug);
  if (c && Date.now() - c.ts < DETAIL_TTL) return;
  const inflightKey = `detail:${slug}`;
  if (inflight.has(inflightKey)) return;
  const promise = Promise.all([
    supabase
      .from('products_public')
      .select(`*, category:categories(*), seller:sellers(*)`)
      .eq('slug', slug)
      .single(),
    fetchCategoryDiscountsOnce(),
  ])
    .then(([{ data }, discounts]) => {
      if (!data) return;
      const [withDiscount] = applyCategoryDiscounts([data], discounts);
      productDetailCache.set(slug, { data: withDiscount || data, ts: Date.now() });
    })
    .catch(() => {
      /* swallow — prefetch is best-effort */
    })
    .finally(() => {
      inflight.delete(inflightKey);
    });
  inflight.set(inflightKey, promise);
}

// Singleton cache for category discounts
let categoryDiscountsCache: CategoryDiscount[] | null = null;
let categoryDiscountsFetchPromise: Promise<CategoryDiscount[]> | null = null;

const fetchCategoryDiscountsOnce = async (): Promise<CategoryDiscount[]> => {
  if (categoryDiscountsCache) return categoryDiscountsCache;
  if (categoryDiscountsFetchPromise) return categoryDiscountsFetchPromise;

  categoryDiscountsFetchPromise = (async () => {
    try {
      const { data, error } = await supabase
        .from('category_discounts')
        .select('category_id, discount_type, discount_value')
        .eq('is_active', true)
        .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString());
      if (!error && data) {
        categoryDiscountsCache = data;
        return data;
      }
      return [];
    } finally {
      setTimeout(() => { categoryDiscountsCache = null; categoryDiscountsFetchPromise = null; }, 2 * 60 * 1000);
    }
  })();

  return categoryDiscountsFetchPromise;
};

const applyCategoryDiscounts = (products: DBProduct[], discounts: CategoryDiscount[]): DBProduct[] => {
  if (discounts.length === 0) return products;
  const discountMap = new Map<string, CategoryDiscount>();
  for (const d of discounts) {
    // Keep the highest discount per category
    const existing = discountMap.get(d.category_id);
    if (!existing || d.discount_value > existing.discount_value) {
      discountMap.set(d.category_id, d);
    }
  }

  return products.map(p => {
    if (!p.category_id) return p;
    const catDiscount = discountMap.get(p.category_id);
    if (!catDiscount) return p;

    // Only apply if product doesn't already have a bigger discount
    let catDiscountPercent: number;
    if (catDiscount.discount_type === 'percentage') {
      catDiscountPercent = catDiscount.discount_value;
    } else {
      // fixed amount → convert to percentage based on price
      catDiscountPercent = p.price > 0 ? Math.round((catDiscount.discount_value / p.price) * 100) : 0;
    }

    const existingDiscount = p.discount || 0;
    if (catDiscountPercent > existingDiscount) {
      const newOriginalPrice = p.original_price || p.price;
      const newPrice = catDiscount.discount_type === 'percentage'
        ? Math.round(newOriginalPrice * (1 - catDiscount.discount_value / 100) * 100) / 100
        : Math.max(0, newOriginalPrice - catDiscount.discount_value);
      return {
        ...p,
        original_price: newOriginalPrice,
        price: newPrice,
        discount: catDiscountPercent,
      };
    }
    return p;
  });
};

export const useProducts = (options: UseProductsOptions = {}) => {
  // Stabilize options to prevent infinite re-renders
  const optKey = `${options.categorySlug || ''}_${options.limit || ''}_${options.flashSaleOnly || ''}_${options.searchQuery || ''}`;
  const cached = productListCache.get(optKey);
  const [products, setProducts] = useState<DBProduct[]>(cached?.data || []);
  const [isLoading, setIsLoading] = useState(!cached);
  const [error, setError] = useState<Error | null>(null);
  const stableOptions = useRef(options);
  stableOptions.current = options;

  const fetchProducts = useCallback(async () => {
    const opts = stableOptions.current;
    const cachedEntry = productListCache.get(optKey);
    const fresh = cachedEntry && Date.now() - cachedEntry.ts < LIST_TTL;
    if (cachedEntry) {
      setProducts(cachedEntry.data);
      setIsLoading(false);
      if (fresh) return; // skip refetch, data is fresh enough
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      let query = supabase
        .from('products_public')
        .select(`
          *,
          category:categories(*),
          seller:sellers(*)
        `)
        .eq('is_active', true);

      if (opts.categorySlug) {
        const { data: category } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', opts.categorySlug)
          .single();
        
        if (category) {
          query = query.eq('category_id', category.id);
        }
      }

      if (opts.flashSaleOnly) {
        query = query.eq('is_flash_sale', true);
        // Filter: only show flash sales that haven't ended yet
        query = query.or('flash_sale_ends.is.null,flash_sale_ends.gt.' + new Date().toISOString());
        // Filter: only show flash sales that have started (or have no start date)
        query = query.or('flash_sale_starts.is.null,flash_sale_starts.lte.' + new Date().toISOString());
      }

      if (opts.searchQuery) {
        query = query.ilike('name', `%${opts.searchQuery}%`);
      }

      if (opts.limit) {
        query = query.limit(opts.limit);
      }

      query = query.order('created_at', { ascending: false });

      // Deduplicate concurrent identical requests
      const inflightKey = `list:${optKey}`;
      let promise = inflight.get(inflightKey);
      if (!promise) {
        promise = Promise.all([query, fetchCategoryDiscountsOnce()]).finally(() => {
          inflight.delete(inflightKey);
        });
        inflight.set(inflightKey, promise);
      }
      const [{ data, error: fetchError }, categoryDiscounts] = await promise;

      if (fetchError) throw fetchError;
      const withDiscounts = applyCategoryDiscounts(data || [], categoryDiscounts);
      productListCache.set(optKey, { data: withDiscounts, ts: Date.now() });
      setProducts(withDiscounts);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching products:', err);
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optKey]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, isLoading, error, refetch: fetchProducts };
};

export const useProduct = (slug: string) => {
  const cached = slug ? productDetailCache.get(slug) : null;
  const [product, setProduct] = useState<DBProduct | null>(cached?.data || null);
  const [isLoading, setIsLoading] = useState(!cached);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;

    const fetchProduct = async () => {
      const c = productDetailCache.get(slug);
      const fresh = c && Date.now() - c.ts < DETAIL_TTL;
      if (c) {
        setProduct(c.data);
        setIsLoading(false);
        if (fresh) return;
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        const inflightKey = `detail:${slug}`;
        let promise = inflight.get(inflightKey);
        if (!promise) {
          promise = Promise.all([
            supabase
              .from('products_public')
              .select(`*, category:categories(*), seller:sellers(*)`)
              .eq('slug', slug)
              .single(),
            fetchCategoryDiscountsOnce(),
          ]).finally(() => { inflight.delete(inflightKey); });
          inflight.set(inflightKey, promise);
        }
        const [{ data, error: fetchError }, categoryDiscounts] = await promise;

        if (fetchError) throw fetchError;
        if (!cancelled) {
          const [withDiscount] = applyCategoryDiscounts(data ? [data] : [], categoryDiscounts);
          const finalProduct = withDiscount || data;
          if (finalProduct) {
            productDetailCache.set(slug, { data: finalProduct, ts: Date.now() });
          }
          setProduct(finalProduct);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error);
          console.error('Error fetching product:', err);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchProduct();
    return () => { cancelled = true; };
  }, [slug]);

  return { product, isLoading, error };
};

// Singleton cache for categories to avoid multiple fetches
let categoriesCache: DBCategory[] | null = null;
let categoriesFetchPromise: Promise<DBCategory[]> | null = null;

const fetchCategoriesOnce = async (): Promise<DBCategory[]> => {
  if (categoriesCache) return categoriesCache;
  if (categoriesFetchPromise) return categoriesFetchPromise;

  categoriesFetchPromise = (async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });
      if (!error && data) {
        categoriesCache = data;
        return data;
      }
      return [];
    } finally {
      setTimeout(() => { categoriesCache = null; categoriesFetchPromise = null; }, 5 * 60 * 1000);
    }
  })();

  return categoriesFetchPromise;
};

export const useCategories = () => {
  const [categories, setCategories] = useState<DBCategory[]>(categoriesCache || []);
  const [isLoading, setIsLoading] = useState(!categoriesCache);

  useEffect(() => {
    if (categoriesCache) {
      setCategories(categoriesCache);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    fetchCategoriesOnce().then((data) => {
      if (!cancelled) {
        setCategories(data);
        setIsLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  return { categories, isLoading };
};
