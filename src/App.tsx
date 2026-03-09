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
import { CompareBar } from "@/components/compare/CompareBar";
import { CompareModal } from "@/components/compare/CompareModal";
import Index from "./pages/Index";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Auth from "./pages/Auth";
import Search from "./pages/Search";
import Category from "./pages/Category";
import Orders from "./pages/Orders";
import Settings from "./pages/Settings";
import Wishlist from "./pages/Wishlist";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";
import AdminUserRoles from "./pages/AdminUserRoles";
import AdminOrders from "./pages/AdminOrders";
import AdminProducts from "./pages/AdminProducts";
import AdminReviews from "./pages/AdminReviews";
import AdminAllSellers from "./pages/AdminAllSellers";
import AdminAppliedSellers from "./pages/AdminAppliedSellers";
import AdminSellerRatings from "./pages/AdminSellerRatings";
import AdminSellerPayouts from "./pages/AdminSellerPayouts";
import AdminSellerPayoutRequests from "./pages/AdminSellerPayoutRequests";
import AdminSellerCommission from "./pages/AdminSellerCommission";
import AdminSellerBasedCommission from "./pages/AdminSellerBasedCommission";
import AdminCategoryBasedCommission from "./pages/AdminCategoryBasedCommission";
import AdminSellerPackages from "./pages/AdminSellerPackages";
import AdminSellerVerification from "./pages/AdminSellerVerification";
import AdminCoupons from "./pages/AdminCoupons";
import AdminCustomers from "./pages/AdminCustomers";
import AdminCouriers from "./pages/AdminCouriers";
import AdminCategories from "./pages/AdminCategories";
import AdminReportsPage from "./pages/AdminReportsPage";
import AdminTransactionsPage from "./pages/AdminTransactionsPage";
import AdminMarketingPage from "./pages/AdminMarketingPage";
import AdminMarketingFlashDeals from "./pages/AdminMarketingFlashDeals";
import AdminMarketingPopup from "./pages/AdminMarketingPopup";
import AdminMarketingCustomAlert from "./pages/AdminMarketingCustomAlert";
import AdminMarketingSellAlert from "./pages/AdminMarketingSellAlert";
import AdminMarketingEmailTemplates from "./pages/AdminMarketingEmailTemplates";
import AdminMarketingNewsletters from "./pages/AdminMarketingNewsletters";
import AdminMarketingNotification from "./pages/AdminMarketingNotification";
import AdminMarketingBulkSMS from "./pages/AdminMarketingBulkSMS";
import AdminMarketingSubscribers from "./pages/AdminMarketingSubscribers";
import AdminMarketingVisitors from "./pages/AdminMarketingVisitors";
import AdminFraudPage from "./pages/AdminFraudPage";
import AdminSettingsPage from "./pages/AdminSettingsPage";
import AdminPagesPage from "./pages/AdminPagesPage";
import AdminSEOPage from "./pages/AdminSEOPage";
import AdminMediaPage from "./pages/AdminMediaPage";
import AdminNotificationsPage from "./pages/AdminNotificationsPage";
import Deals from "./pages/Deals";
import FlashSale from "./pages/FlashSale";
import SellerDashboard from "./pages/SellerDashboard";
import SellerRegistration from "./pages/SellerRegistration";
import Account from "./pages/Account";
// New product sub-pages
import AdminAddProduct from "./pages/AdminAddProduct";
import AdminInHouseProducts from "./pages/AdminInHouseProducts";
import AdminSellerProducts from "./pages/AdminSellerProducts";
import AdminAddDigitalProduct from "./pages/AdminAddDigitalProduct";
import AdminBulkImport from "./pages/AdminBulkImport";
import AdminBulkExport from "./pages/AdminBulkExport";
import AdminBrands from "./pages/AdminBrands";
import AdminColors from "./pages/AdminColors";
import AdminAttributes from "./pages/AdminAttributes";
import AdminLabels from "./pages/AdminLabels";
import AdminWarranties from "./pages/AdminWarranties";
import AdminSizeGuides from "./pages/AdminSizeGuides";
import AdminCategoryDiscount from "./pages/AdminCategoryDiscount";
import AdminSmartBar from "./pages/AdminSmartBar";
import AdminWebsiteSetupPage from "./pages/AdminWebsiteSetupPage";
// Preorder pages
import AdminPreorderDashboard from "./pages/AdminPreorderDashboard";
import AdminPreorderAddProduct from "./pages/AdminPreorderAddProduct";
import AdminPreorderProducts from "./pages/AdminPreorderProducts";
import AdminPreorderOrders from "./pages/AdminPreorderOrders";
import AdminPreorderCommissions from "./pages/AdminPreorderCommissions";
import AdminPreorderSettings from "./pages/AdminPreorderSettings";
import AdminPreorderConversations from "./pages/AdminPreorderConversations";
import AdminPreorderQueries from "./pages/AdminPreorderQueries";
import AdminPreorderReviews from "./pages/AdminPreorderReviews";
import AdminPreorderFaqs from "./pages/AdminPreorderFaqs";
import AdminPreorderNotificationTypes from "./pages/AdminPreorderNotificationTypes";
import AdminOtpLoginConfig from "./pages/AdminOtpLoginConfig";
import AdminOtpConfigurations from "./pages/AdminOtpConfigurations";
import AdminOtpSmsTemplates from "./pages/AdminOtpSmsTemplates";
import AdminSystemUpdate from "./pages/AdminSystemUpdate";
import AdminSystemServerStatus from "./pages/AdminSystemServerStatus";
import AdminSystemSitemap from "./pages/AdminSystemSitemap";
import AdminShippingProviders from "./pages/AdminShippingProviders";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <CompareProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <CompareBar />
            <CompareModal />
            <BrowserRouter>
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
                <Route path="/admin/pages" element={<AdminPagesPage />} />
                <Route path="/admin/seo" element={<AdminSEOPage />} />
                <Route path="/admin/user-roles" element={<AdminUserRoles />} />
                <Route path="/deals" element={<Deals />} />
                <Route path="/flash-sale" element={<FlashSale />} />
                <Route path="/seller" element={<SellerDashboard />} />
                <Route path="/sell" element={<SellerRegistration />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
          </CompareProvider>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
