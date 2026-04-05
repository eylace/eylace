import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useSellerCheck, useSellerProducts, useSellerOrders } from '@/hooks/useSellerData';
import { SellerLayout } from '@/components/seller/SellerLayout';
import { SellerOverview } from '@/components/seller/SellerOverview';
import { SellerOrdersTab } from '@/components/seller/SellerOrdersTab';
import { SellerAnalytics } from '@/components/seller/SellerAnalytics';
import { SellerFinanceTab } from '@/components/seller/SellerFinanceTab';
import { SellerReviewsTab } from '@/components/seller/SellerReviewsTab';
import { SellerPromotionsTab } from '@/components/seller/SellerPromotionsTab';
import { SellerStoreSettings } from '@/components/seller/SellerStoreSettings';
import { SellerSupportTab } from '@/components/seller/SellerSupportTab';
import { SellerProductsTab } from '@/components/seller/SellerProductsTab';
import { SellerFraudCheckTab } from '@/components/seller/SellerFraudCheckTab';

const SellerDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { seller, isLoading: sellerLoading } = useSellerCheck();
  const { products, isLoading: productsLoading, toggleProductActive, refetch } = useSellerProducts(seller?.id);
  const { orders, isLoading: ordersLoading } = useSellerOrders(seller?.id);
  const [activeTab, setActiveTab] = useState('overview');

  if (authLoading || sellerLoading) {
    return (
      <Layout>
        <div className="container-main py-12 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      </Layout>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  if (!seller) {
    return (
      <Layout>
        <div className="container-main py-12">
          <div className="max-w-md mx-auto text-center">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Seller Access Only</h1>
            <p className="text-muted-foreground">You need a seller account to access this dashboard.</p>
          </div>
        </div>
      </Layout>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <SellerOverview orders={orders} products={products} onNavigate={setActiveTab} />;
      case 'products':
        return (
          <SellerProductsTab
            products={products}
            isLoading={productsLoading}
            toggleProductActive={toggleProductActive}
            refetch={refetch}
            sellerId={seller.id}
          />
        );
      case 'orders':
        return <SellerOrdersTab orders={orders} isLoading={ordersLoading} />;
      case 'analytics':
        return <SellerAnalytics orders={orders} products={products} />;
      case 'finance':
        return <SellerFinanceTab orders={orders} />;
      case 'reviews':
        return <SellerReviewsTab sellerId={seller.id} />;
      case 'promotions':
        return <SellerPromotionsTab />;
      case 'fraud-check':
        return <SellerFraudCheckTab sellerId={seller.id} />;
      case 'settings':
        return <SellerStoreSettings seller={seller} onUpdate={refetch} />;
      case 'support':
        return <SellerSupportTab />;
      default:
        return <SellerOverview orders={orders} products={products} onNavigate={setActiveTab} />;
    }
  };

  return (
    <SellerLayout activeTab={activeTab} onTabChange={setActiveTab} seller={seller}>
      {renderContent()}
    </SellerLayout>
  );
};

export default SellerDashboard;
