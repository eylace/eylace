import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SellerProfile {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  rating: number | null;
  is_verified: boolean | null;
  user_id: string | null;
}

export interface SellerProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  original_price: number | null;
  stock: number | null;
  images: string[];
  is_active: boolean | null;
  rating: number | null;
  review_count: number | null;
  created_at: string;
  category?: { name: string } | null;
}

export interface SellerOrder {
  id: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
  carrier?: string | null;
  tracking_number?: string | null;
  customer_phone?: string | null;
  assigned_role?: string | null;
  assigned_user_name?: string | null;
  items: {
    id: string;
    product_name: string;
    product_image: string | null;
    quantity: number;
    price: number;
  }[];
}

export const useSellerCheck = () => {
  const { user } = useAuth();
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      if (!user) {
        setSeller(null);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('sellers')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data && !error) {
        setSeller(data);
      }
      setIsLoading(false);
    };

    check();
  }, [user]);

  return { seller, isLoading };
};

export const useSellerProducts = (sellerId: string | undefined) => {
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    if (!sellerId) return;
    setIsLoading(true);

    const { data, error } = await supabase
      .from('products')
      .select('id, name, slug, price, original_price, stock, images, is_active, rating, review_count, created_at, description, category_id, category:categories(name)')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setProducts(data as any);
    }
    setIsLoading(false);
  }, [sellerId]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const toggleProductActive = async (productId: string, isActive: boolean) => {
    const { error } = await supabase
      .from('products')
      .update({ is_active: isActive })
      .eq('id', productId);

    if (!error) await fetchProducts();
    return { error };
  };

  return { products, isLoading, refetch: fetchProducts, toggleProductActive };
};

export const useSellerOrders = (sellerId: string | undefined) => {
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    if (!sellerId) return;
    setIsLoading(true);

    // Get product IDs belonging to this seller
    const { data: sellerProducts } = await supabase
      .from('products')
      .select('id')
      .eq('seller_id', sellerId);

    if (!sellerProducts?.length) {
      setOrders([]);
      setIsLoading(false);
      return;
    }

    const productIds = sellerProducts.map(p => p.id);

    // Get order items for seller's products
    const { data: orderItems, error } = await supabase
      .from('order_items')
      .select('*, order:orders(id, order_number, status, total, created_at, carrier, tracking_number, guest_phone, shipping_address, assigned_role, assigned_user_name, user_id)')
      .in('product_id', productIds)
      .order('created_at', { ascending: false });

    if (!error && orderItems) {
      const userIds = Array.from(new Set(orderItems.map((it: any) => it.order?.user_id).filter(Boolean)));
      let phoneMap = new Map<string, string | null>();
      if (userIds.length) {
        const { data: profiles } = await supabase.from('profiles').select('user_id, phone').in('user_id', userIds);
        phoneMap = new Map((profiles || []).map((p: any) => [p.user_id, p.phone]));
      }

      // Group by order
      const orderMap = new Map<string, SellerOrder>();
      for (const item of orderItems) {
        const order = (item as any).order;
        if (!order) continue;
        const phone = phoneMap.get(order.user_id) || order.guest_phone || order.shipping_address?.phone || null;
        if (!orderMap.has(order.id)) {
          orderMap.set(order.id, {
            id: order.id,
            order_number: order.order_number,
            status: order.status,
            total: order.total,
            created_at: order.created_at,
            carrier: order.carrier,
            tracking_number: order.tracking_number,
            customer_phone: phone,
            assigned_role: order.assigned_role,
            assigned_user_name: order.assigned_user_name,
            items: [],
          });
        }
        orderMap.get(order.id)!.items.push({
          id: item.id,
          product_name: item.product_name,
          product_image: item.product_image,
          quantity: item.quantity,
          price: item.price,
        });
      }
      setOrders(Array.from(orderMap.values()));
    }
    setIsLoading(false);
  }, [sellerId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { orders, isLoading, refetch: fetchOrders };
};
