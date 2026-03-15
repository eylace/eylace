 import { useState, useEffect, useCallback } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/contexts/AuthContext';
 
 export interface AdminOrder {
   id: string;
   order_number: string;
   user_id: string;
   status: string;
   total: number;
   subtotal: number;
   shipping: number;
   tax: number;
   discount: number;
   payment_method: string;
   shipping_address: any;
   carrier: string | null;
   tracking_number: string | null;
   estimated_delivery: string | null;
   shipped_at: string | null;
   delivered_at: string | null;
   created_at: string;
   updated_at: string;
   items?: AdminOrderItem[];
   profile?: {
     first_name: string | null;
     last_name: string | null;
     email: string | null;
   };
 }
 
 export interface AdminOrderItem {
   id: string;
   product_name: string;
   product_image: string | null;
   quantity: number;
   price: number;
   variations: any;
 }
 
 export interface AdminReview {
   id: string;
   user_id: string;
   product_id: string;
   rating: number;
   title: string;
   content: string;
   images: string[];
   verified_purchase: boolean | null;
   helpful_count: number | null;
   created_at: string;
   user_email?: string;
 }
 
 export const useAdminCheck = () => {
   const { user } = useAuth();
   const [isAdmin, setIsAdmin] = useState(false);
   const [isLoading, setIsLoading] = useState(true);
 
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const { data, error } = await supabase
         .from('user_roles')
         .select('role')
         .eq('user_id', user.id)
         .eq('role', 'admin')
         .single();
 
       setIsAdmin(!!data && !error);
       setIsLoading(false);
     };
 
     checkAdmin();
   }, [user]);
 
   return { isAdmin, isLoading };
 };
 
 export const useAdminOrders = () => {
   const [orders, setOrders] = useState<AdminOrder[]>([]);
   const [isLoading, setIsLoading] = useState(true);
 
   const fetchOrders = useCallback(async () => {
     setIsLoading(true);
 
     // Use service role through edge function for admin access
     const { data, error } = await supabase.functions.invoke('admin-get-orders');
 
     if (!error && data?.orders) {
       setOrders(data.orders);
     }
     setIsLoading(false);
   }, []);
 
   useEffect(() => {
     fetchOrders();
   }, [fetchOrders]);
 
   const updateOrderStatus = async (
     orderId: string, 
     status: string, 
     trackingInfo?: { carrier?: string; tracking_number?: string }
   ) => {
     const { error } = await supabase.functions.invoke('admin-update-order', {
       body: { orderId, status, ...trackingInfo }
     });
 
     if (!error) {
       await fetchOrders();
     }
 
     return { error };
   };
 
   return { orders, isLoading, refetch: fetchOrders, updateOrderStatus };
 };
 
 export const useAdminReviews = () => {
   const [reviews, setReviews] = useState<AdminReview[]>([]);
   const [isLoading, setIsLoading] = useState(true);
 
   const fetchReviews = useCallback(async () => {
     setIsLoading(true);
 
     const { data, error } = await supabase
       .from('product_reviews')
       .select('*')
       .order('created_at', { ascending: false });
 
     if (!error && data) {
       setReviews(data);
     }
     setIsLoading(false);
   }, []);
 
   useEffect(() => {
     fetchReviews();
   }, [fetchReviews]);
 
   const deleteReview = async (reviewId: string) => {
     const { error } = await supabase.functions.invoke('admin-delete-review', {
       body: { reviewId }
     });
 
     if (!error) {
       await fetchReviews();
     }
 
     return { error };
   };
 
   return { reviews, isLoading, refetch: fetchReviews, deleteReview };
 };