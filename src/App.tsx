import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { CompareProvider } from "@/contexts/CompareContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { DeliveryLocationProvider } from "@/contexts/DeliveryLocationContext";
import { CompareBar } from "@/components/compare/CompareBar";
import { CompareModal } from "@/components/compare/CompareModal";
import { lazy, Suspense } from "react";

// Critical pages - eager load
import Index from "./pages/Index";
import ProductDetail from "./pages/ProductDetail";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Lazy-loaded pages for performance
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Search = lazy(() => import("./pages/Search"));
const Category = lazy(() => import("./pages/Category"));
const Orders = lazy(() => import("./pages/Orders"));
const Settings = lazy(() => import("./pages/Settings"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Deals = lazy(() => import("./pages/Deals"));
const FlashSale = lazy(() => import("./pages/FlashSale"));
const Account = lazy(() => import("./pages/Account"));
const SellerDashboard = lazy(() => import("./pages/SellerDashboard"));
const SellerRegistration = lazy(() => import("./pages/SellerRegistration"));

// Admin pages - lazy loaded (rarely accessed by regular users)
const Admin = lazy(() => import("./pages/Admin"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminUserRoles = lazy(() => import("./pages/AdminUserRoles"));
const AdminOrders = lazy(() => import("./pages/AdminOrders"));
const AdminProducts = lazy(() => import("./pages/AdminProducts"));
const AdminReviews = lazy(() => import("./pages/AdminReviews"));
const AdminAllSellers = lazy(() => import("./pages/AdminAllSellers"));
const AdminAppliedSellers = lazy(() => import("./pages/AdminAppliedSellers"));
const AdminSellerRatings = lazy(() => import("./pages/AdminSellerRatings"));
const AdminSellerPayouts = lazy(() => import("./pages/AdminSellerPayouts"));
const AdminSellerPayoutRequests = lazy(() => import("./pages/AdminSellerPayoutRequests"));
const AdminSellerCommission = lazy(() => import("./pages/AdminSellerCommission"));
const AdminSellerBasedCommission = lazy(() => import("./pages/AdminSellerBasedCommission"));
const AdminCategoryBasedCommission = lazy(() => import("./pages/AdminCategoryBasedCommission"));
const AdminSellerPackages = lazy(() => import("./pages/AdminSellerPackages"));
const AdminSellerVerification = lazy(() => import("./pages/AdminSellerVerification"));
const AdminCoupons = lazy(() => import("./pages/AdminCoupons"));
const AdminCustomers = lazy(() => import("./pages/AdminCustomers"));
const AdminCouriers = lazy(() => import("./pages/AdminCouriers"));
const AdminCategories = lazy(() => import("./pages/AdminCategories"));
const AdminReportsPage = lazy(() => import("./pages/AdminReportsPage"));
const AdminTransactionsPage = lazy(() => import("./pages/AdminTransactionsPage"));
const AdminMarketingPage = lazy(() => import("./pages/AdminMarketingPage"));
const AdminMarketingFlashDeals = lazy(() => import("./pages/AdminMarketingFlashDeals"));
const AdminMarketingPopup = lazy(() => import("./pages/AdminMarketingPopup"));
const AdminMarketingCustomAlert = lazy(() => import("./pages/AdminMarketingCustomAlert"));
const AdminMarketingSellAlert = lazy(() => import("./pages/AdminMarketingSellAlert"));
const AdminMarketingEmailTemplates = lazy(() => import("./pages/AdminMarketingEmailTemplates"));
const AdminMarketingNewsletters = lazy(() => import("./pages/AdminMarketingNewsletters"));
const AdminMarketingNotification = lazy(() => import("./pages/AdminMarketingNotification"));
const AdminMarketingBulkSMS = lazy(() => import("./pages/AdminMarketingBulkSMS"));
const AdminMarketingSubscribers = lazy(() => import("./pages/AdminMarketingSubscribers"));
const AdminMarketingVisitors = lazy(() => import("./pages/AdminMarketingVisitors"));
const AdminFraudPage = lazy(() => import("./pages/AdminFraudPage"));
const AdminSettingsPage = lazy(() => import("./pages/AdminSettingsPage"));
const AdminPagesPage = lazy(() => import("./pages/AdminPagesPage"));
const AdminSEOPage = lazy(() => import("./pages/AdminSEOPage"));
const AdminMediaPage = lazy(() => import("./pages/AdminMediaPage"));
const AdminNotificationsPage = lazy(() => import("./pages/AdminNotificationsPage"));
const AdminAddProduct = lazy(() => import("./pages/AdminAddProduct"));
const AdminInHouseProducts = lazy(() => import("./pages/AdminInHouseProducts"));
const AdminSellerProducts = lazy(() => import("./pages/AdminSellerProducts"));
const AdminAddDigitalProduct = lazy(() => import("./pages/AdminAddDigitalProduct"));
const AdminBulkImport = lazy(() => import("./pages/AdminBulkImport"));
const AdminBulkExport = lazy(() => import("./pages/AdminBulkExport"));
const AdminBrands = lazy(() => import("./pages/AdminBrands"));
const AdminColors = lazy(() => import("./pages/AdminColors"));
const AdminAttributes = lazy(() => import("./pages/AdminAttributes"));
const AdminLabels = lazy(() => import("./pages/AdminLabels"));
const AdminWarranties = lazy(() => import("./pages/AdminWarranties"));
const AdminSizeGuides = lazy(() => import("./pages/AdminSizeGuides"));
const AdminCategoryDiscount = lazy(() => import("./pages/AdminCategoryDiscount"));
const AdminSmartBar = lazy(() => import("./pages/AdminSmartBar"));
const AdminWebsiteSetupPage = lazy(() => import("./pages/AdminWebsiteSetupPage"));
const AdminPreorderDashboard = lazy(() => import("./pages/AdminPreorderDashboard"));
const AdminPreorderAddProduct = lazy(() => import("./pages/AdminPreorderAddProduct"));
const AdminPreorderProducts = lazy(() => import("./pages/AdminPreorderProducts"));
const AdminPreorderOrders = lazy(() => import("./pages/AdminPreorderOrders"));
const AdminPreorderCommissions = lazy(() => import("./pages/AdminPreorderCommissions"));
const AdminPreorderSettings = lazy(() => import("./pages/AdminPreorderSettings"));
const AdminPreorderConversations = lazy(() => import("./pages/AdminPreorderConversations"));
const AdminPreorderQueries = lazy(() => import("./pages/AdminPreorderQueries"));
const AdminPreorderReviews = lazy(() => import("./pages/AdminPreorderReviews"));
const AdminPreorderFaqs = lazy(() => import("./pages/AdminPreorderFaqs"));
const AdminPreorderNotificationTypes = lazy(() => import("./pages/AdminPreorderNotificationTypes"));
const AdminOtpLoginConfig = lazy(() => import("./pages/AdminOtpLoginConfig"));
const AdminOtpConfigurations = lazy(() => import("./pages/AdminOtpConfigurations"));
const AdminOtpSmsTemplates = lazy(() => import("./pages/AdminOtpSmsTemplates"));
const AdminSystemUpdate = lazy(() => import("./pages/AdminSystemUpdate"));
const AdminSystemServerStatus = lazy(() => import("./pages/AdminSystemServerStatus"));
const AdminSystemSitemap = lazy(() => import("./pages/AdminSystemSitemap"));
const AdminShippingProviders = lazy(() => import("./pages/AdminShippingProviders"));
const AdminAIAnalyzer = lazy(() => import("./pages/AdminAIAnalyzer"));
const AdminAISettings = lazy(() => import("./pages/AdminAISettings"));
const AdminTrackingAnalytics = lazy(() => import("./pages/AdminTrackingAnalytics"));
const AdminMenuManager = lazy(() => import("./pages/AdminMenuManager"));
const AdminMarketingAds = lazy(() => import("./pages/AdminMarketingAds"));

const AIChatWidget = lazy(() => import("./components/chat/AIChatWidget").then(m => ({ default: m.AIChatWidget })));
const TrackingScriptInjector = lazy(() => import("./components/tracking/TrackingScriptInjector").then(m => ({ default: m.TrackingScriptInjector })));
const SourceCodeProtection = lazy(() => import("./components/security/SourceCodeProtection").then(m => ({ default: m.SourceCodeProtection })));

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
                <Route path="/orders" element={<Orders />} />
                <Route path="/settings" element={<Settings />} />
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
                <Route path="/admin/couriers" element={<AdminCouriers />} />
                <Route path="/admin/fraud" element={<AdminFraudPage />} />
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
                <Route path="/admin/media" element={<AdminMediaPage />} />
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
                <Route path="/admin/ai-analyzer" element={<AdminAIAnalyzer />} />
                <Route path="/admin/ai-settings" element={<AdminAISettings />} />
                <Route path="/admin/tracking" element={<AdminTrackingAnalytics />} />
                <Route path="/admin/menu-manager" element={<AdminMenuManager />} />
                <Route path="/admin/marketing/ads" element={<AdminMarketingAds />} />
                <Route path="/admin/pages" element={<AdminPagesPage />} />
                <Route path="/admin/seo" element={<AdminSEOPage />} />
                <Route path="/admin/user-roles" element={<AdminUserRoles />} />
                <Route path="/deals" element={<Deals />} />
                <Route path="/flash-sale" element={<FlashSale />} />
                <Route path="/seller" element={<SellerDashboard />} />
                <Route path="/sell" element={<SellerRegistration />} />
                {/* CMS Pages - all footer links */}
                <Route path="/about" element={<CmsPage />} />
                <Route path="/contact" element={<CmsPage />} />
                <Route path="/privacy" element={<CmsPage />} />
                <Route path="/terms" element={<CmsPage />} />
                <Route path="/cookies" element={<CmsPage />} />
                <Route path="/help" element={<CmsPage />} />
                <Route path="/returns" element={<CmsPage />} />
                <Route path="/shipping" element={<CmsPage />} />
                <Route path="/faq" element={<CmsPage />} />
                <Route path="/careers" element={<CmsPage />} />
                <Route path="/blog" element={<CmsPage />} />
                <Route path="/track-order" element={<CmsPage />} />
                <Route path="/seller-center" element={<CmsPage />} />
                <Route path="/seller-policies" element={<CmsPage />} />
                <Route path="/seller-support" element={<CmsPage />} />
                <Route path="/delivery-partner" element={<CmsPage />} />
                <Route path="/affiliate" element={<CmsPage />} />
                <Route path="/advertise" element={<CmsPage />} />
                <Route path="/sitemap" element={<CmsPage />} />
                <Route path="/page/:slug" element={<CmsPage />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              </Suspense>
              <Suspense fallback={null}>
                <AIChatWidget />
                <TrackingScriptInjector />
                <SourceCodeProtection />
              </Suspense>
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
