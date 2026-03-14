 import { useState, useEffect, useCallback } from 'react';
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
 
 export const useProducts = (options: UseProductsOptions = {}) => {
   const [products, setProducts] = useState<DBProduct[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState<Error | null>(null);
 
   const fetchProducts = useCallback(async () => {
     setIsLoading(true);
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
 
       if (options.categorySlug) {
         const { data: category } = await supabase
           .from('categories')
           .select('id')
           .eq('slug', options.categorySlug)
           .single();
         
         if (category) {
           query = query.eq('category_id', category.id);
         }
       }
 
       if (options.flashSaleOnly) {
         query = query.eq('is_flash_sale', true);
       }
 
       if (options.searchQuery) {
         query = query.ilike('name', `%${options.searchQuery}%`);
       }
 
       if (options.limit) {
         query = query.limit(options.limit);
       }
 
       query = query.order('created_at', { ascending: false });
 
       const { data, error: fetchError } = await query;
 
       if (fetchError) throw fetchError;
       setProducts(data || []);
     } catch (err) {
       setError(err as Error);
       console.error('Error fetching products:', err);
     } finally {
       setIsLoading(false);
     }
   }, [options.categorySlug, options.limit, options.flashSaleOnly, options.searchQuery]);
 
   useEffect(() => {
     fetchProducts();
   }, [fetchProducts]);
 
   return { products, isLoading, error, refetch: fetchProducts };
 };
 
 export const useProduct = (slug: string) => {
   const [product, setProduct] = useState<DBProduct | null>(null);
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState<Error | null>(null);
 
   useEffect(() => {
     const fetchProduct = async () => {
       setIsLoading(true);
       setError(null);
 
       try {
          const { data, error: fetchError } = await supabase
            .from('products_public')
            .select(`
              *,
              category:categories(*),
              seller:sellers(*)
            `)
            .eq('slug', slug)
            .single();
 
         if (fetchError) throw fetchError;
         setProduct(data);
       } catch (err) {
         setError(err as Error);
         console.error('Error fetching product:', err);
       } finally {
         setIsLoading(false);
       }
     };
 
     if (slug) {
       fetchProduct();
     }
   }, [slug]);
 
   return { product, isLoading, error };
 };
 
 export const useCategories = () => {
   const [categories, setCategories] = useState<DBCategory[]>([]);
   const [isLoading, setIsLoading] = useState(true);
 
   useEffect(() => {
     const fetchCategories = async () => {
       const { data, error } = await supabase
         .from('categories')
         .select('*')
         .order('sort_order', { ascending: true });
 
       if (!error && data) {
         setCategories(data);
       }
       setIsLoading(false);
     };
 
     fetchCategories();
   }, []);
 
   return { categories, isLoading };
 };