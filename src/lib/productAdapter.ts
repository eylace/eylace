 import { DBProduct, DBCategory, DBSeller } from '@/hooks/useProducts';
 import { Product, Category, Seller } from '@/types';
 
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
     variations: dbProduct.variations || undefined,
     attributes: dbProduct.attributes || undefined,
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