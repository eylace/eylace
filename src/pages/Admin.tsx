 import { useState } from 'react';
 import { Navigate } from 'react-router-dom';
 import { 
    Package, 
    MessageSquare, 
    Store,
    Tag,
    Loader2,
    ShieldAlert
  } from 'lucide-react';
 import { Layout } from '@/components/layout/Layout';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import { useAdminCheck } from '@/hooks/useAdminData';
 import { useAuth } from '@/contexts/AuthContext';
 import { AdminOrdersTab } from '@/components/admin/AdminOrdersTab';
 import { AdminReviewsTab } from '@/components/admin/AdminReviewsTab';
  import { AdminSellersTab } from '@/components/admin/AdminSellersTab';
  import { AdminCouponsTab } from '@/components/admin/AdminCouponsTab';
 
 const Admin = () => {
   const { user, loading: authLoading } = useAuth();
   const { isAdmin, isLoading: adminLoading } = useAdminCheck();
   const [activeTab, setActiveTab] = useState('orders');
 
   if (authLoading || adminLoading) {
     return (
       <Layout>
         <div className="container-main py-12 flex items-center justify-center min-h-[60vh]">
           <Loader2 className="h-8 w-8 animate-spin text-accent" />
         </div>
       </Layout>
     );
   }
 
   if (!user) {
     return <Navigate to="/auth" replace />;
   }
 
   if (!isAdmin) {
     return (
       <Layout>
         <div className="container-main py-12">
           <div className="max-w-md mx-auto text-center">
             <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
               <ShieldAlert className="h-8 w-8 text-destructive" />
             </div>
             <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
             <p className="text-muted-foreground">
               You don't have permission to access the admin dashboard.
             </p>
           </div>
         </div>
       </Layout>
     );
   }
 
   return (
     <Layout>
       <div className="container-main py-8">
         <div className="mb-8">
           <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
           <p className="text-muted-foreground">Manage orders, reviews, and more</p>
         </div>
 
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
           <TabsList className="grid w-full max-w-2xl grid-cols-4">
              <TabsTrigger value="orders" className="gap-2">
                <Package className="h-4 w-4" />
                Orders
              </TabsTrigger>
              <TabsTrigger value="reviews" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Reviews
              </TabsTrigger>
              <TabsTrigger value="sellers" className="gap-2">
                <Store className="h-4 w-4" />
                Sellers
              </TabsTrigger>
              <TabsTrigger value="coupons" className="gap-2">
                <Tag className="h-4 w-4" />
                Coupons
              </TabsTrigger>
             </TabsList>
 
            <TabsContent value="orders">
              <AdminOrdersTab />
            </TabsContent>
 
            <TabsContent value="reviews">
              <AdminReviewsTab />
            </TabsContent>

             <TabsContent value="sellers">
               <AdminSellersTab />
             </TabsContent>

             <TabsContent value="coupons">
               <AdminCouponsTab />
             </TabsContent>
          </Tabs>
       </div>
     </Layout>
   );
 };
 
 export default Admin;