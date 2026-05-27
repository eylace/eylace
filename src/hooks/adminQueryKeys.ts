import type { QueryKey } from '@tanstack/react-query';

/**
 * Centralized admin queryKey registry.
 * Always use these constants when calling useAdminQuery / invalidate so cross-page
 * mutations stay in sync.
 */
export const adminQueryKeys = {
  products: ['admin-products'] as const,
  digitalProducts: ['admin-digital-products'] as const,
  inhouseProducts: ['admin-inhouse-products'] as const,
  sellerProducts: ['admin-seller-products'] as const,
  categories: ['admin-categories'] as const,
  brands: ['admin-brands'] as const,
  attributes: ['admin-attributes'] as const,
  colors: ['admin-colors'] as const,
  labels: ['admin-labels'] as const,
  sizeGuides: ['admin-size-guides'] as const,
  stock: ['admin-stock'] as const,

  orders: ['admin-orders'] as const,
  incompleteOrders: ['admin-incomplete-orders'] as const,
  returns: ['admin-returns'] as const,
  refunds: ['admin-refunds'] as const,
  transactions: ['admin-transactions'] as const,

  customers: ['admin-customers'] as const,
  sellers: ['admin-sellers'] as const,
  allSellers: ['admin-all-sellers'] as const,
  appliedSellers: ['admin-applied-sellers'] as const,
  sellerPayouts: ['admin-seller-payouts'] as const,
  sellerPackages: ['admin-seller-packages'] as const,

  coupons: ['admin-coupons'] as const,
  flashDeals: ['admin-flash-deals'] as const,
  newsletters: ['admin-newsletters'] as const,
  subscribers: ['admin-subscribers'] as const,
  marketingPopup: ['admin-marketing-popup'] as const,

  reviews: ['admin-reviews'] as const,
  preorderReviews: ['admin-preorder-reviews'] as const,
  preorderProducts: ['admin-preorder-products'] as const,
  preorderOrders: ['admin-preorder-orders'] as const,

  supportTickets: ['admin-support-tickets'] as const,
  supportQueries: ['admin-support-queries'] as const,

  blogPosts: ['admin-blog-posts'] as const,
  blogCategories: ['admin-blog-categories'] as const,
  pages: ['admin-pages'] as const,

  websiteSetup: ['admin-website-setup'] as const,
  shippingProviders: ['admin-shipping-providers'] as const,
  paymentGateways: ['admin-payment-gateways'] as const,
  systemSettings: ['admin-system-settings'] as const,

  affiliateUsers: ['admin-affiliate-users'] as const,
  affiliateWithdrawals: ['admin-affiliate-withdrawals'] as const,
  affiliateReferrals: ['admin-affiliate-referrals'] as const,

  ipBlock: ['admin-ip-block'] as const,
  otpConfig: ['admin-otp-config'] as const,
} as const;

export type AdminDomain =
  | 'product'
  | 'order'
  | 'customer'
  | 'seller'
  | 'coupon'
  | 'review'
  | 'preorder'
  | 'support'
  | 'blog'
  | 'page'
  | 'website'
  | 'shipping'
  | 'payment'
  | 'affiliate'
  | 'marketing';

/**
 * Domain → which queryKeys to invalidate after a mutation in that domain.
 * Add cross-page dependencies here (e.g. product touches categories too).
 */
export const adminInvalidationMap: Record<AdminDomain, readonly QueryKey[]> = {
  product: [
    adminQueryKeys.products,
    adminQueryKeys.digitalProducts,
    adminQueryKeys.inhouseProducts,
    adminQueryKeys.sellerProducts,
    adminQueryKeys.stock,
    adminQueryKeys.categories,
  ],
  order: [
    adminQueryKeys.orders,
    adminQueryKeys.incompleteOrders,
    adminQueryKeys.transactions,
    adminQueryKeys.customers,
  ],
  customer: [adminQueryKeys.customers, adminQueryKeys.orders],
  seller: [
    adminQueryKeys.sellers,
    adminQueryKeys.allSellers,
    adminQueryKeys.appliedSellers,
    adminQueryKeys.sellerPayouts,
  ],
  coupon: [adminQueryKeys.coupons],
  review: [adminQueryKeys.reviews, adminQueryKeys.preorderReviews],
  preorder: [
    adminQueryKeys.preorderProducts,
    adminQueryKeys.preorderOrders,
    adminQueryKeys.preorderReviews,
  ],
  support: [adminQueryKeys.supportTickets, adminQueryKeys.supportQueries],
  blog: [adminQueryKeys.blogPosts, adminQueryKeys.blogCategories],
  page: [adminQueryKeys.pages],
  website: [adminQueryKeys.websiteSetup, adminQueryKeys.systemSettings],
  shipping: [adminQueryKeys.shippingProviders],
  payment: [adminQueryKeys.paymentGateways],
  affiliate: [
    adminQueryKeys.affiliateUsers,
    adminQueryKeys.affiliateWithdrawals,
    adminQueryKeys.affiliateReferrals,
  ],
  marketing: [
    adminQueryKeys.newsletters,
    adminQueryKeys.subscribers,
    adminQueryKeys.flashDeals,
    adminQueryKeys.marketingPopup,
  ],
};