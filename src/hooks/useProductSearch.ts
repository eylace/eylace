import { useState, useMemo, useCallback } from 'react';
import { Product, Category } from '@/types';
import { featuredProducts, categories } from '@/data/mockData';

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

  const updateFilter = useCallback(<K extends keyof SearchFilters>(
    key: K,
    value: SearchFilters[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const allProducts = featuredProducts;
  const allCategories = categories;

  const searchResults = useMemo(() => {
    let results = [...allProducts];

    // Text search
    if (filters.query) {
      const query = filters.query.toLowerCase();
      results = results.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.category.name.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (filters.category) {
      results = results.filter((p) => p.category.slug === filters.category);
    }

    // Price range
    if (filters.minPrice !== null) {
      results = results.filter((p) => p.price >= filters.minPrice!);
    }
    if (filters.maxPrice !== null) {
      results = results.filter((p) => p.price <= filters.maxPrice!);
    }

    // Rating filter
    if (filters.rating !== null) {
      results = results.filter((p) => p.rating >= filters.rating!);
    }

    // Stock filter
    if (filters.inStock) {
      results = results.filter((p) => p.stock > 0);
    }

    // Free shipping filter
    if (filters.freeShipping) {
      results = results.filter((p) => p.isFreeShipping);
    }

    // Prime filter
    if (filters.isPrime) {
      results = results.filter((p) => p.isPrime);
    }

    // Sorting
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
        // relevance - already sorted by search match
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
    categories: allCategories,
    priceRange,
  };
};
