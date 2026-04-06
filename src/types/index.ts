export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  images: string[];
  category: Category;
  subcategory?: string;
  seller: Seller;
  rating: number;
  reviewCount: number;
  stock: number;
  variations?: ProductVariation[];
  attributes?: ProductAttribute[];
  isFlashSale?: boolean;
  flashSaleEnds?: Date;
  isPrime?: boolean;
  isFreeShipping?: boolean;
  isDigital?: boolean;
  soldCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductVariation {
  id: string;
  name: string;
  type: 'color' | 'size' | 'style' | 'custom';
  options: VariationOption[];
}

export interface VariationOption {
  id: string;
  value: string;
  priceModifier?: number;
  stock: number;
  image?: string;
}

export interface ProductAttribute {
  name: string;
  value: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  image?: string;
  parent?: Category;
  children?: Category[];
}

export interface Seller {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  rating: number;
  isVerified: boolean;
  joinedAt: Date;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedVariations?: Record<string, string>;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
  createdAt: Date;
}

export type UserRole = 
  | 'super_admin'
  | 'admin'
  | 'product_manager'
  | 'order_manager'
  | 'account_manager'
  | 'support_manager'
  | 'seller'
  | 'delivery_company'
  | 'customer';

export interface FlashSale {
  id: string;
  name: string;
  products: Product[];
  startTime: Date;
  endTime: Date;
  isActive: boolean;
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  image: string;
  link: string;
  position: 'hero' | 'side' | 'inline';
}
