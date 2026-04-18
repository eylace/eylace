import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

// All roles that can access the admin panel
export const ADMIN_PANEL_ROLES: AppRole[] = [
  'super_admin', 'admin', 'product_manager', 'order_manager',
  'vendor_manager', 'customer_manager', 'content_manager',
  'marketing_manager', 'finance_manager', 'support_manager', 'moderator',
];

// Permission keys mapped to each role (defines what sidebar sections they see)
export const ROLE_PERMISSION_MAP: Record<string, string[]> = {
  super_admin: ['*'], // all access
  admin: ['*'],
  product_manager: ['dashboard.view', 'products.view', 'products.create', 'products.edit', 'products.delete'],
  order_manager: ['dashboard.view', 'orders.view', 'orders.update', 'orders.dispatch', 'orders.cancel'],
  vendor_manager: ['dashboard.view', 'sellers.view', 'sellers.approve', 'sellers.manage'],
  customer_manager: ['dashboard.view', 'customers.view', 'customers.manage'],
  content_manager: ['dashboard.view', 'content.view', 'content.manage'],
  marketing_manager: ['dashboard.view', 'marketing.view', 'marketing.manage'],
  finance_manager: ['dashboard.view', 'finance.view', 'finance.manage'],
  support_manager: ['dashboard.view', 'orders.view', 'customers.view', 'customers.manage'],
  moderator: ['dashboard.view', 'products.view', 'products.edit', 'orders.view', 'orders.update', 'customers.view', 'sellers.view', 'marketing.view', 'content.view'],
};

// Maps sidebar sections to required permission prefixes
export const SECTION_PERMISSION_MAP: Record<string, string> = {
  main: 'dashboard',
  products: 'products',
  orders: 'orders',
  management: 'customers',
  sellers: 'sellers',
  marketing: 'marketing',
  operations: 'orders',
  preorder: 'orders',
  content: 'content',
  system: 'settings',
  websiteSetup: 'content',
  settings: 'settings',
  ai: 'products',
  otp: 'settings',
  tracking: 'dashboard',
};

export interface AdminOrder {
  id: string;
  order_number: string;
  user_id: string | null;
  status: string;
  total: number;
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  payment_method: string;
  shipping_address: any;
  guest_email?: string | null;
  guest_phone?: string | null;
  customer_ip?: string | null;
  carrier: string | null;
  tracking_number: string | null;
  estimated_delivery: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
  assigned_user_id?: string | null;
  assigned_user_name?: string | null;
  assigned_role?: string | null;
  assigned_at?: string | null;
  items?: AdminOrderItem[];
  profile?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone?: string | null;
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
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setIsAdmin(false);
        setUserRole(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ADMIN_PANEL_ROLES)
        .limit(1);

      const firstRole = data && data.length > 0 ? data[0] : null;
      setIsAdmin(!!firstRole && !error);
      setUserRole(firstRole?.role as AppRole || null);
      setIsLoading(false);
    };

    checkAdmin();
  }, [user]);

  // Check if the user's role has access to a specific section
  const hasAccess = useCallback((section: string): boolean => {
    if (!userRole) return false;
    const perms = ROLE_PERMISSION_MAP[userRole] || [];
    if (perms.includes('*')) return true;
    const requiredPrefix = SECTION_PERMISSION_MAP[section];
    if (!requiredPrefix) return false;
    return perms.some(p => p.startsWith(requiredPrefix));
  }, [userRole]);

  return { isAdmin, isLoading, userRole, hasAccess };
};

export const useAdminOrders = () => {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
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

  const deleteOrders = useCallback(async (orderIds: string[]) => {
    const ids = Array.from(new Set(orderIds.filter(Boolean)));

    if (ids.length === 0) {
      return { error: new Error('No orders selected'), deletedIds: [] as string[] };
    }

    const { data, error } = await supabase.functions.invoke('admin-delete-orders', {
      body: { orderIds: ids }
    });

    if (!error) {
      const deletedIds = Array.isArray(data?.deletedIds) ? data.deletedIds : ids;
      setOrders((currentOrders) => currentOrders.filter((order) => !deletedIds.includes(order.id)));
      return { error: null, deletedIds };
    }

    return { error, deletedIds: [] as string[] };
  }, []);

  return { orders, isLoading, refetch: fetchOrders, updateOrderStatus, deleteOrders };
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
