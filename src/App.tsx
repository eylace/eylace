import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { CompareProvider } from "@/contexts/CompareContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { DeliveryLocationProvider } from "@/contexts/DeliveryLocationContext";
import { CompareBar } from "@/components/compare/CompareBar";
import { CompareModal } from "@/components/compare/CompareModal";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { lazy, Suspense, useEffect, useState } from "react";

// Retry wrapper for lazy imports — handles stale chunk hashes after deploys.
// If a dynamic import fails (chunk no longer exists), reload the page once.
const lazyWithRetry = <T extends { default: React.ComponentType<any> }>(
  factory: () => Promise<T>
) =>
  lazy(async () => {
    const STORAGE_KEY = "lovable:chunk-reload";
    try {
      const mod = await factory();
      sessionStorage.removeItem(STORAGE_KEY);
      return mod;
    } catch (err: any) {
      const msg = String(err?.message || err);
      const isChunkError =
        msg.includes("Failed to fetch dynamically imported module") ||
        msg.includes("Importing a module script failed") ||
        msg.includes("error loading dynamically imported module");
      if (isChunkError && !sessionStorage.getItem(STORAGE_KEY)) {
        sessionStorage.setItem(STORAGE_KEY, "1");
        window.location.reload();
        // Return a never-resolving promise so Suspense keeps showing fallback until reload.
        return new Promise<T>(() => {});
      }
      throw err;
    }
  });

// Critical pages - eager load
import Index from "./pages/Index";
import ProductDetail from "./pages/ProductDetail";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import AdminMapsOrderData from "./pages/AdminMapsOrderData";

// Lazy-loaded pages for performance
const Cart = lazyWithRetry(() => import("./pages/Cart"));
const Checkout = lazyWithRetry(() => import("./pages/Checkout"));
const Search = lazyWithRetry(() => import("./pages/Search"));
const Category = lazyWithRetry(() => import("./pages/Category"));
const Orders = lazyWithRetry(() => import("./pages/Orders"));
const Settings = lazyWithRetry(() => import("./pages/Settings"));
const Wishlist = lazyWithRetry(() => import("./pages/Wishlist"));
const Deals = lazyWithRetry(() => import("./pages/Deals"));
const FlashSale = lazyWithRetry(() => import("./pages/FlashSale"));
const NewArrivals = lazyWithRetry(() => import("./pages/NewArrivals"));
const BestSellers = lazyWithRetry(() => import("./pages/BestSellers"));
const TrendingNow = lazyWithRetry(() => import("./pages/TrendingNow"));
const Account = lazyWithRetry(() => import("./pages/Account"));
const SellerDashboard = lazyWithRetry(() => import("./pages/SellerDashboard"));
const SellerRegistration = lazyWithRetry(() => import("./pages/SellerRegistration"));
const SellerCenter = lazyWithRetry(() => import("./pages/SellerCenter"));
const SellerPolicies = lazyWithRetry(() => import("./pages/SellerPolicies"));
const SellerSupport = lazyWithRetry(() => import("./pages/SellerSupport"));
const HelpCenter = lazyWithRetry(() => import("./pages/HelpCenter"));
const TrackOrder = lazyWithRetry(() => import("./pages/TrackOrder"));
const ReturnsRefunds = lazyWithRetry(() => import("./pages/ReturnsRefunds"));
const ShippingInfo = lazyWithRetry(() => import("./pages/ShippingInfo"));
const FAQ = lazyWithRetry(() => import("./pages/FAQ"));
const AboutUs = lazyWithRetry(() => import("./pages/AboutUs"));
const ContactUs = lazyWithRetry(() => import("./pages/ContactUs"));
const Careers = lazyWithRetry(() => import("./pages/Careers"));
const Blog = lazyWithRetry(() => import("./pages/Blog"));
const BlogEylaceVsDaraz = lazyWithRetry(() => import("./pages/BlogEylaceVsDaraz"));
const Sitemap = lazyWithRetry(() => import("./pages/Sitemap"));
const DeliveryPartner = lazyWithRetry(() => import("./pages/DeliveryPartner"));
const AffiliateProgram = lazyWithRetry(() => import("./pages/AffiliateProgram"));
const AdvertiseWithUs = lazyWithRetry(() => import("./pages/AdvertiseWithUs"));
const PrivacyPolicy = lazyWithRetry(() => import("./pages/PrivacyPolicy"));
const TermsConditions = lazyWithRetry(() => import("./pages/TermsConditions"));
const CookiePolicy = lazyWithRetry(() => import("./pages/CookiePolicy"));
// Admin pages - lazy loaded (rarely accessed by regular users)
const Admin = lazyWithRetry(() => import("./pages/Admin"));
const AdminLogin = lazyWithRetry(() => import("./pages/AdminLogin"));
const AdminUserRoles = lazyWithRetry(() => import("./pages/AdminUserRoles"));
const AdminOrders = lazyWithRetry(() => import("./pages/AdminOrders"));
const AdminProducts = lazyWithRetry(() => import("./pages/AdminProducts"));
const AdminReviews = lazyWithRetry(() => import("./pages/AdminReviews"));
const AdminAllSellers = lazyWithRetry(() => import("./pages/AdminAllSellers"));
const AdminAppliedSellers = lazyWithRetry(() => import("./pages/AdminAppliedSellers"));
const AdminSellerRatings = lazyWithRetry(() => import("./pages/AdminSellerRatings"));
const AdminSellerPayouts = lazyWithRetry(() => import("./pages/AdminSellerPayouts"));
const AdminSellerPayoutRequests = lazyWithRetry(() => import("./pages/AdminSellerPayoutRequests"));
const AdminSellerCommission = lazyWithRetry(() => import("./pages/AdminSellerCommission"));
const AdminSellerBasedCommission = lazyWithRetry(() => import("./pages/AdminSellerBasedCommission"));
const AdminCategoryBasedCommission = lazyWithRetry(() => import("./pages/AdminCategoryBasedCommission"));
const AdminSellerPackages = lazyWithRetry(() => import("./pages/AdminSellerPackages"));
const AdminSellerVerification = lazyWithRetry(() => import("./pages/AdminSellerVerification"));
const AdminCoupons = lazyWithRetry(() => import("./pages/AdminCoupons"));
const AdminCustomers = lazyWithRetry(() => import("./pages/AdminCustomers"));
const AdminCategories = lazyWithRetry(() => import("./pages/AdminCategories"));
const AdminReportsPage = lazyWithRetry(() => import("./pages/AdminReportsPage"));
const AdminTransactionsPage = lazyWithRetry(() => import("./pages/AdminTransactionsPage"));
const AdminMarketingPage = lazyWithRetry(() => import("./pages/AdminMarketingPage"));
const AdminMarketingFlashDeals = lazyWithRetry(() => import("./pages/AdminMarketingFlashDeals"));
const AdminMarketingPopup = lazyWithRetry(() => import("./pages/AdminMarketingPopup"));
const AdminMarketingCustomAlert = lazyWithRetry(() => import("./pages/AdminMarketingCustomAlert"));
const AdminMarketingSellAlert = lazyWithRetry(() => import("./pages/AdminMarketingSellAlert"));
const AdminMarketingEmailTemplates = lazyWithRetry(() => import("./pages/AdminMarketingEmailTemplates"));
const AdminMarketingNewsletters = lazyWithRetry(() => import("./pages/AdminMarketingNewsletters"));
const AdminMarketingNotification = lazyWithRetry(() => import("./pages/AdminMarketingNotification"));
const AdminMarketingBulkSMS = lazyWithRetry(() => import("./pages/AdminMarketingBulkSMS"));
const AdminMarketingSubscribers = lazyWithRetry(() => import("./pages/AdminMarketingSubscribers"));
const AdminMarketingVisitors = lazyWithRetry(() => import("./pages/AdminMarketingVisitors"));
const AdminFraudPage = lazyWithRetry(() => import("./pages/AdminFraudPage"));
const AdminIpBlock = lazyWithRetry(() => import("./pages/AdminIpBlock"));
const AdminSettingsPage = lazyWithRetry(() => import("./pages/AdminSettingsPage"));
const AdminPagesPage = lazyWithRetry(() => import("./pages/AdminPagesPage"));
const AdminSEOPage = lazyWithRetry(() => import("./pages/AdminSEOPage"));

const AdminNotificationsPage = lazyWithRetry(() => import("./pages/AdminNotificationsPage"));
const AdminAddProduct = lazyWithRetry(() => import("./pages/AdminAddProduct"));
const AdminInHouseProducts = lazyWithRetry(() => import("./pages/AdminInHouseProducts"));
const AdminSellerProducts = lazyWithRetry(() => import("./pages/AdminSellerProducts"));
const AdminAddDigitalProduct = lazyWithRetry(() => import("./pages/AdminAddDigitalProduct"));
const AdminBulkImport = lazyWithRetry(() => import("./pages/AdminBulkImport"));
const AdminBulkExport = lazyWithRetry(() => import("./pages/AdminBulkExport"));
const AdminBrands = lazyWithRetry(() => import("./pages/AdminBrands"));
const AdminColors = lazyWithRetry(() => import("./pages/AdminColors"));
const AdminAttributes = lazyWithRetry(() => import("./pages/AdminAttributes"));
const AdminLabels = lazyWithRetry(() => import("./pages/AdminLabels"));
const AdminWarranties = lazyWithRetry(() => import("./pages/AdminWarranties"));
const AdminSizeGuides = lazyWithRetry(() => import("./pages/AdminSizeGuides"));
const AdminCategoryDiscount = lazyWithRetry(() => import("./pages/AdminCategoryDiscount"));
const AdminSmartBar = lazyWithRetry(() => import("./pages/AdminSmartBar"));
const AdminWebsiteSetupPage = lazyWithRetry(() => import("./pages/AdminWebsiteSetupPage"));
const AdminPreorderDashboard = lazyWithRetry(() => import("./pages/AdminPreorderDashboard"));
const AdminPreorderAddProduct = lazyWithRetry(() => import("./pages/AdminPreorderAddProduct"));
const AdminPreorderProducts = lazyWithRetry(() => import("./pages/AdminPreorderProducts"));
const AdminPreorderOrders = lazyWithRetry(() => import("./pages/AdminPreorderOrders"));
const AdminPreorderCommissions = lazyWithRetry(() => import("./pages/AdminPreorderCommissions"));
const AdminPreorderSettings = lazyWithRetry(() => import("./pages/AdminPreorderSettings"));
const AdminPreorderConversations = lazyWithRetry(() => import("./pages/AdminPreorderConversations"));
const AdminPreorderQueries = lazyWithRetry(() => import("./pages/AdminPreorderQueries"));
const AdminPreorderReviews = lazyWithRetry(() => import("./pages/AdminPreorderReviews"));
const AdminPreorderFaqs = lazyWithRetry(() => import("./pages/AdminPreorderFaqs"));
const AdminPreorderNotificationTypes = lazyWithRetry(() => import("./pages/AdminPreorderNotificationTypes"));
const AdminOtpLoginConfig = lazyWithRetry(() => import("./pages/AdminOtpLoginConfig"));
const AdminOtpConfigurations = lazyWithRetry(() => import("./pages/AdminOtpConfigurations"));
const AdminOtpSmsTemplates = lazyWithRetry(() => import("./pages/AdminOtpSmsTemplates"));
const AdminSystemUpdate = lazyWithRetry(() => import("./pages/AdminSystemUpdate"));
const AdminSystemServerStatus = lazyWithRetry(() => import("./pages/AdminSystemServerStatus"));
const AdminSystemSitemap = lazyWithRetry(() => import("./pages/AdminSystemSitemap"));
const AdminShippingProviders = lazyWithRetry(() => import("./pages/AdminShippingProviders"));
const AdminCourierStatusMapping = lazyWithRetry(() => import("./pages/AdminCourierStatusMapping"));
const AdminCourierAdvancePayments = lazyWithRetry(() => import("./pages/AdminCourierAdvancePayments"));
const AdminPaymentGateways = lazyWithRetry(() => import("./pages/AdminPaymentGateways"));
const AdminAIAnalyzer = lazyWithRetry(() => import("./pages/AdminAIAnalyzer"));
const AdminAISettings = lazyWithRetry(() => import("./pages/AdminAISettings"));
const AdminTrackingAnalytics = lazyWithRetry(() => import("./pages/AdminTrackingAnalytics"));
const AdminMenuManager = lazyWithRetry(() => import("./pages/AdminMenuManager"));
const AdminIncompleteOrders = lazyWithRetry(() => import("./pages/AdminIncompleteOrders"));
const AdminPOS = lazyWithRetry(() => import("./pages/AdminPOS"));
const AdminMarketingAds = lazyWithRetry(() => import("./pages/AdminMarketingAds"));
const AdminAdsManager = lazyWithRetry(() => import("./pages/AdminAdsManager"));
const AdminReturnsRefunds = lazyWithRetry(() => import("./pages/AdminReturnsRefunds"));
const AdminAffiliateProgram = lazyWithRetry(() => import("./pages/AdminAffiliateProgram"));
const AdminUploadFiles = lazyWithRetry(() => import("./pages/AdminUploadFiles"));
const AdminSupportTickets = lazyWithRetry(() => import("./pages/AdminSupportTickets"));
const AdminSupportConversations = lazyWithRetry(() => import("./pages/AdminSupportConversations"));
const AdminSupportQueries = lazyWithRetry(() => import("./pages/AdminSupportQueries"));
const AdminSupportContacts = lazyWithRetry(() => import("./pages/AdminSupportContacts"));
const AdminAffiliateRegistration = lazyWithRetry(() => import("./pages/AdminAffiliateRegistration"));
const AdminAffiliateConfig = lazyWithRetry(() => import("./pages/AdminAffiliateConfig"));
const AdminAffiliateUsers = lazyWithRetry(() => import("./pages/AdminAffiliateUsers"));
const AdminAffiliateReferrals = lazyWithRetry(() => import("./pages/AdminAffiliateReferrals"));
const AdminAffiliateWithdrawals = lazyWithRetry(() => import("./pages/AdminAffiliateWithdrawals"));
const AdminAffiliateLogs = lazyWithRetry(() => import("./pages/AdminAffiliateLogs"));
const AdminClubPointConfig = lazyWithRetry(() => import("./pages/AdminClubPointConfig"));
const AdminClubPointProducts = lazyWithRetry(() => import("./pages/AdminClubPointProducts"));
const AdminClubPointUsers = lazyWithRetry(() => import("./pages/AdminClubPointUsers"));
const AdminBlogAddPost = lazyWithRetry(() => import("./pages/AdminBlogAddPost"));
const AdminBlogPosts = lazyWithRetry(() => import("./pages/AdminBlogPosts"));
const AdminBlogCategories = lazyWithRetry(() => import("./pages/AdminBlogCategories"));
const AdminRefundRequests = lazyWithRetry(() => import("./pages/AdminRefundRequests"));
const AdminRefundConfig = lazyWithRetry(() => import("./pages/AdminRefundConfig"));
const AdminRefundCategoryBased = lazyWithRetry(() => import("./pages/AdminRefundCategoryBased"));
const Categories = lazyWithRetry(() => import("./pages/Categories"));
const AdminStockManagement = lazyWithRetry(() => import("./pages/AdminStockManagement"));
const CmsPage = lazyWithRetry(() => import("./pages/CmsPage"));
const AdminAccounting = lazyWithRetry(() => import("./pages/AdminAccounting"));
const AdminCourierExpenses = lazyWithRetry(() => import("./pages/AdminCourierExpenses"));

const AIChatWidget = lazyWithRetry(() => import("./components/chat/AIChatWidget").then(m => ({ default: m.AIChatWidget })));
const TrackingScriptInjector = lazyWithRetry(() => import("./components/tracking/TrackingScriptInjector").then(m => ({ default: m.TrackingScriptInjector })));
const SourceCodeProtection = lazyWithRetry(() => import("./components/security/SourceCodeProtection").then(m => ({ default: m.SourceCodeProtection })));

// Defer rendering of non-critical widgets until the browser is idle / user
// interacts. This keeps them out of the initial render path so LCP/TBT
// stay low without removing functionality.
const DeferredMount = ({ children, delay = 2500 }: { children: React.ReactNode; delay?: number }) => {
  const [show, setShow] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const trigger = () => { if (!cancelled) setShow(true); };
    const w = window as any;
    const idleId = w.requestIdleCallback
      ? w.requestIdleCallback(trigger, { timeout: delay })
      : window.setTimeout(trigger, delay);
    const onInteract = () => trigger();
    window.addEventListener('scroll', onInteract, { once: true, passive: true });
    window.addEventListener('pointerdown', onInteract, { once: true });
    window.addEventListener('keydown', onInteract, { once: true });
    return () => {
      cancelled = true;
      if (w.cancelIdleCallback && typeof idleId === 'number') w.cancelIdleCallback(idleId);
      else clearTimeout(idleId as any);
      window.removeEventListener('scroll', onInteract);
      window.removeEventListener('pointerdown', onInteract);
      window.removeEventListener('keydown', onInteract);
    };
  }, [delay]);
  return show ? <>{children}</> : null;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - reduce refetches
      gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

// Capture referral code from URL
const ReferralCapture = () => {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      localStorage.setItem('affiliate_ref', JSON.stringify({ code: ref, expiry: Date.now() + 30 * 24 * 60 * 60 * 1000 }));
      // Track click
      fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/affiliate-manage?action=track-click`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        body: JSON.stringify({ referral_code: ref, landing_page: window.location.pathname }),
      }).catch(() => {});
    }
  }, []);
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
    <CurrencyProvider>
    <AuthProvider>
      <DeliveryLocationProvider>
      <CartProvider>
        <WishlistProvider>
          <CompareProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <CompareBar />
            <CompareModal />
            <BrowserRouter>
              <ReferralCapture />
              <ErrorBoundary>
              <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/account" element={<Account />} />
                <Route path="/product/:slug" element={<ProductDetail />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/search" element={<Search />} />
                <Route path="/category/:slug" element={<Category />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/settings" element={<Navigate to="/account?tab=settings" replace />} />
                <Route path="/wishlist" element={<Wishlist />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/admin/orders" element={<AdminOrders />} />
                <Route path="/admin/products" element={<AdminProducts />} />
                <Route path="/admin/products/add" element={<AdminAddProduct />} />
                <Route path="/admin/products/edit/:id" element={<AdminAddProduct />} />
                <Route path="/admin/products/in-house" element={<AdminInHouseProducts />} />
                <Route path="/admin/products/seller" element={<AdminSellerProducts />} />
                <Route path="/admin/products/digital/add" element={<AdminAddDigitalProduct />} />
                <Route path="/admin/products/bulk-import" element={<AdminBulkImport />} />
                <Route path="/admin/products/bulk-export" element={<AdminBulkExport />} />
                <Route path="/admin/products/brands" element={<AdminBrands />} />
                <Route path="/admin/products/colors" element={<AdminColors />} />
                <Route path="/admin/products/attributes" element={<AdminAttributes />} />
                <Route path="/admin/products/labels" element={<AdminLabels />} />
                <Route path="/admin/products/warranties" element={<AdminWarranties />} />
                <Route path="/admin/products/size-guides" element={<AdminSizeGuides />} />
                <Route path="/admin/products/category-discount" element={<AdminCategoryDiscount />} />
                <Route path="/admin/products/smart-bar" element={<AdminSmartBar />} />
                <Route path="/admin/categories" element={<AdminCategories />} />
                <Route path="/admin/customers" element={<AdminCustomers />} />
                <Route path="/admin/sellers" element={<AdminAllSellers />} />
                <Route path="/admin/sellers/applied" element={<AdminAppliedSellers />} />
                <Route path="/admin/sellers/ratings" element={<AdminSellerRatings />} />
                <Route path="/admin/sellers/payouts" element={<AdminSellerPayouts />} />
                <Route path="/admin/sellers/payout-requests" element={<AdminSellerPayoutRequests />} />
                <Route path="/admin/sellers/commission" element={<AdminSellerCommission />} />
                <Route path="/admin/sellers/seller-commission" element={<AdminSellerBasedCommission />} />
                <Route path="/admin/sellers/category-commission" element={<AdminCategoryBasedCommission />} />
                <Route path="/admin/sellers/packages" element={<AdminSellerPackages />} />
                <Route path="/admin/sellers/verification" element={<AdminSellerVerification />} />
                <Route path="/admin/reviews" element={<AdminReviews />} />
                <Route path="/admin/coupons" element={<AdminCoupons />} />
                <Route path="/admin/couriers" element={<Navigate to="/admin/shipping-providers" replace />} />
                <Route path="/admin/fraud" element={<AdminFraudPage />} />
                <Route path="/admin/ip-block" element={<AdminIpBlock />} />
                <Route path="/admin/transactions" element={<AdminTransactionsPage />} />
                <Route path="/admin/marketing" element={<AdminMarketingPage />} />
                <Route path="/admin/marketing/flash-deals" element={<AdminMarketingFlashDeals />} />
                <Route path="/admin/marketing/popup" element={<AdminMarketingPopup />} />
                <Route path="/admin/marketing/custom-alert" element={<AdminMarketingCustomAlert />} />
                <Route path="/admin/marketing/sell-alert" element={<AdminMarketingSellAlert />} />
                <Route path="/admin/marketing/email-templates" element={<AdminMarketingEmailTemplates />} />
                <Route path="/admin/marketing/newsletters" element={<AdminMarketingNewsletters />} />
                <Route path="/admin/marketing/notification" element={<AdminMarketingNotification />} />
                <Route path="/admin/marketing/bulk-sms" element={<AdminMarketingBulkSMS />} />
                <Route path="/admin/marketing/subscribers" element={<AdminMarketingSubscribers />} />
                <Route path="/admin/marketing/visitors" element={<AdminMarketingVisitors />} />
                <Route path="/admin/reports" element={<AdminReportsPage />} />
                
                <Route path="/admin/notifications" element={<AdminNotificationsPage />} />
                <Route path="/admin/settings" element={<AdminSettingsPage />} />
                <Route path="/admin/website-setup" element={<AdminWebsiteSetupPage />} />
                <Route path="/admin/preorder" element={<AdminPreorderDashboard />} />
                <Route path="/admin/preorder/add" element={<AdminPreorderAddProduct />} />
                <Route path="/admin/preorder/products" element={<AdminPreorderProducts />} />
                <Route path="/admin/preorder/orders" element={<AdminPreorderOrders />} />
                <Route path="/admin/preorder/commissions" element={<AdminPreorderCommissions />} />
                <Route path="/admin/preorder/settings" element={<AdminPreorderSettings />} />
                <Route path="/admin/preorder/conversations" element={<AdminPreorderConversations />} />
                <Route path="/admin/preorder/queries" element={<AdminPreorderQueries />} />
                <Route path="/admin/preorder/reviews" element={<AdminPreorderReviews />} />
                <Route path="/admin/preorder/faqs" element={<AdminPreorderFaqs />} />
                <Route path="/admin/preorder/notifications" element={<AdminPreorderNotificationTypes />} />
                <Route path="/admin/otp/login-config" element={<AdminOtpLoginConfig />} />
                <Route path="/admin/otp/configurations" element={<AdminOtpConfigurations />} />
                <Route path="/admin/otp/sms-templates" element={<AdminOtpSmsTemplates />} />
                <Route path="/admin/system/update" element={<AdminSystemUpdate />} />
                <Route path="/admin/system/server-status" element={<AdminSystemServerStatus />} />
                <Route path="/admin/system/sitemap" element={<AdminSystemSitemap />} />
                <Route path="/admin/shipping-providers" element={<AdminShippingProviders />} />
                <Route path="/admin/courier-status-mapping" element={<AdminCourierStatusMapping />} />
                <Route path="/admin/courier-advance-payments" element={<AdminCourierAdvancePayments />} />
                <Route path="/admin/payment-gateways" element={<AdminPaymentGateways />} />
                <Route path="/admin/ai-analyzer" element={<AdminAIAnalyzer />} />
                <Route path="/admin/ai-settings" element={<AdminAISettings />} />
                <Route path="/admin/tracking" element={<AdminTrackingAnalytics />} />
                <Route path="/admin/menu-manager" element={<AdminMenuManager />} />
                <Route path="/admin/incomplete-orders" element={<AdminIncompleteOrders />} />
                <Route path="/admin/pos" element={<AdminPOS />} />
                <Route path="/admin/maps-order-data" element={<AdminMapsOrderData />} />
                <Route path="/admin/marketing/ads" element={<AdminMarketingAds />} />
                <Route path="/admin/ads-manager" element={<AdminAdsManager />} />
                <Route path="/admin/returns" element={<AdminReturnsRefunds />} />
                <Route path="/admin/affiliate" element={<AdminAffiliateProgram />} />
                <Route path="/admin/upload-files" element={<AdminUploadFiles />} />
                <Route path="/admin/support/tickets" element={<AdminSupportTickets />} />
                <Route path="/admin/support/conversations" element={<AdminSupportConversations />} />
                <Route path="/admin/support/queries" element={<AdminSupportQueries />} />
                <Route path="/admin/support/contacts" element={<AdminSupportContacts />} />
                <Route path="/admin/affiliate/registration" element={<AdminAffiliateRegistration />} />
                <Route path="/admin/affiliate/config" element={<AdminAffiliateConfig />} />
                <Route path="/admin/affiliate/users" element={<AdminAffiliateUsers />} />
                <Route path="/admin/affiliate/referrals" element={<AdminAffiliateReferrals />} />
                <Route path="/admin/affiliate/withdrawals" element={<AdminAffiliateWithdrawals />} />
                <Route path="/admin/affiliate/logs" element={<AdminAffiliateLogs />} />
                <Route path="/admin/club-point/config" element={<AdminClubPointConfig />} />
                <Route path="/admin/club-point/products" element={<AdminClubPointProducts />} />
                <Route path="/admin/club-point/users" element={<AdminClubPointUsers />} />
                <Route path="/admin/blog/add" element={<AdminBlogAddPost />} />
                <Route path="/admin/blog/posts" element={<AdminBlogPosts />} />
                <Route path="/admin/blog/categories" element={<AdminBlogCategories />} />
                <Route path="/admin/refunds/requests" element={<AdminRefundRequests />} />
                <Route path="/admin/refunds/approved" element={<AdminRefundRequests />} />
                <Route path="/admin/refunds/rejected" element={<AdminRefundRequests />} />
                <Route path="/admin/refunds/config" element={<AdminRefundConfig />} />
                <Route path="/admin/refunds/category" element={<AdminRefundCategoryBased />} />
                <Route path="/admin/pages" element={<AdminPagesPage />} />
                <Route path="/admin/seo" element={<AdminSEOPage />} />
                <Route path="/admin/user-roles" element={<AdminUserRoles />} />
                <Route path="/admin/stock" element={<AdminStockManagement />} />
                <Route path="/admin/accounting" element={<AdminAccounting />} />
                <Route path="/admin/courier-expenses" element={<AdminCourierExpenses />} />
                <Route path="/deals" element={<Deals />} />
                <Route path="/flash-sale" element={<FlashSale />} />
                <Route path="/new-arrivals" element={<NewArrivals />} />
                <Route path="/best-sellers" element={<BestSellers />} />
                <Route path="/trending" element={<TrendingNow />} />
                <Route path="/seller" element={<SellerDashboard />} />
                <Route path="/sell" element={<SellerRegistration />} />
                {/* CMS Pages - all footer links */}
                <Route path="/about" element={<AboutUs />} />
                <Route path="/contact" element={<ContactUs />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsConditions />} />
                <Route path="/cookies" element={<CookiePolicy />} />
                <Route path="/help" element={<HelpCenter />} />
                <Route path="/returns" element={<ReturnsRefunds />} />
                <Route path="/shipping" element={<ShippingInfo />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/careers" element={<Careers />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/online-shopping-comparison-bangladesh" element={<BlogEylaceVsDaraz />} />
                <Route path="/track-order" element={<TrackOrder />} />
                <Route path="/seller-center" element={<SellerCenter />} />
                <Route path="/seller-policies" element={<SellerPolicies />} />
                <Route path="/seller-support" element={<SellerSupport />} />
                <Route path="/delivery-partner" element={<DeliveryPartner />} />
                <Route path="/affiliate" element={<AffiliateProgram />} />
                <Route path="/advertise" element={<AdvertiseWithUs />} />
                <Route path="/sitemap" element={<Sitemap />} />
                <Route path="/page/:slug" element={<CmsPage />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              </Suspense>
              </ErrorBoundary>
              <DeferredMount>
                <Suspense fallback={null}>
                  <AIChatWidget />
                  <TrackingScriptInjector />
                  <SourceCodeProtection />
                </Suspense>
              </DeferredMount>
            </BrowserRouter>
          </TooltipProvider>
          </CompareProvider>
        </WishlistProvider>
      </CartProvider>
      </DeliveryLocationProvider>
    </AuthProvider>
    </CurrencyProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
