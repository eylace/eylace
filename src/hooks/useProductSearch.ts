import { useState, useMemo, useCallback } from 'react';
import { Product } from '@/types';
import { useProducts, useCategories } from '@/hooks/useProducts';
import { adaptDBProducts } from '@/lib/productAdapter';

export interface SearchFilters {
  query: string;
  category: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  rating: number | null;
  inStock: boolean;
  freeShipping: boolean;
  isPrime: boolean;
  sortBy: 'relevance' | 'price-asc' | 'price-desc' | 'rating' | 'newest';
}

const defaultFilters: SearchFilters = {
  query: '',
  category: null,
  minPrice: null,
  maxPrice: null,
  rating: null,
  inStock: false,
  freeShipping: false,
  isPrime: false,
  sortBy: 'relevance',
};

export const useProductSearch = () => {
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);
  const { categories: dbCategories, isLoading: categoriesLoading } = useCategories();
  const { products: dbProducts, isLoading: productsLoading } = useProducts({});

  const updateFilter = useCallback(<K extends keyof SearchFilters>(
    key: K,
    value: SearchFilters[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const allProducts = useMemo(() => adaptDBProducts(dbProducts), [dbProducts]);

  const categories = useMemo(() => {
    return dbCategories.map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      icon: c.icon || undefined,
      image: c.image || undefined,
    }));
  }, [dbCategories]);

  const searchResults = useMemo(() => {
    let results = [...allProducts];

    if (filters.query) {
      const query = filters.query.toLowerCase();
      results = results.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.category.name.toLowerCase().includes(query)
      );
    }

    if (filters.category) {
      results = results.filter((p) => p.category.slug === filters.category);
    }

    if (filters.minPrice !== null) {
      results = results.filter((p) => p.price >= filters.minPrice!);
    }
    if (filters.maxPrice !== null) {
      results = results.filter((p) => p.price <= filters.maxPrice!);
    }

    if (filters.rating !== null) {
      results = results.filter((p) => p.rating >= filters.rating!);
    }

    if (filters.inStock) {
      results = results.filter((p) => p.stock > 0);
    }

    if (filters.freeShipping) {
      results = results.filter((p) => p.isFreeShipping);
    }

    if (filters.isPrime) {
      results = results.filter((p) => p.isPrime);
    }

    switch (filters.sortBy) {
      case 'price-asc':
        results.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        results.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        results.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        break;
      default:
        break;
    }

    return results;
  }, [filters, allProducts]);

  const autocompleteResults = useMemo(() => {
    if (!filters.query || filters.query.length < 2) return [];
    const query = filters.query.toLowerCase();
    return allProducts
      .filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.category.name.toLowerCase().includes(query)
      )
      .slice(0, 6);
  }, [filters.query, allProducts]);

  const priceRange = useMemo(() => {
    if (allProducts.length === 0) return { min: 0, max: 1000 };
    const prices = allProducts.map((p) => p.price);
    return {
      min: Math.floor(Math.min(...prices)),
      max: Math.ceil(Math.max(...prices)),
    };
  }, [allProducts]);

  return {
    filters,
    updateFilter,
    resetFilters,
    searchResults,
    autocompleteResults,
    categories,
    priceRange,
    isLoading: productsLoading || categoriesLoading,
  };
};
