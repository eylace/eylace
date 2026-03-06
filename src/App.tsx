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
import AdminSellers from "./pages/AdminSellers";
import AdminCoupons from "./pages/AdminCoupons";
import AdminCustomers from "./pages/AdminCustomers";
import {
  AdminFraud,
  AdminTransactions,
  AdminMarketing,
  AdminReports,
  AdminMedia,
  AdminNotifications,
  AdminSettings as AdminSettingsPage,
  AdminPages,
  AdminSEO,
} from "./pages/AdminComingSoon";
import AdminCouriers from "./pages/AdminCouriers";
import AdminCategories from "./pages/AdminCategories";
import Deals from "./pages/Deals";
import FlashSale from "./pages/FlashSale";
import SellerDashboard from "./pages/SellerDashboard";
import SellerRegistration from "./pages/SellerRegistration";
import Account from "./pages/Account";

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
                <Route path="/admin/categories" element={<AdminCategories />} />
                <Route path="/admin/customers" element={<AdminCustomers />} />
                <Route path="/admin/sellers" element={<AdminSellers />} />
                <Route path="/admin/reviews" element={<AdminReviews />} />
                <Route path="/admin/coupons" element={<AdminCoupons />} />
                <Route path="/admin/couriers" element={<AdminCouriers />} />
                <Route path="/admin/fraud" element={<AdminFraud />} />
                <Route path="/admin/transactions" element={<AdminTransactions />} />
                <Route path="/admin/marketing" element={<AdminMarketing />} />
                <Route path="/admin/reports" element={<AdminReports />} />
                <Route path="/admin/media" element={<AdminMedia />} />
                <Route path="/admin/notifications" element={<AdminNotifications />} />
                <Route path="/admin/settings" element={<AdminSettingsPage />} />
                <Route path="/admin/pages" element={<AdminPages />} />
                <Route path="/admin/seo" element={<AdminSEO />} />
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
