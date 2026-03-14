import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MenuItem {
  id: string;
  label: string;
  labelBn: string;
  url: string;
  type: 'link' | 'dropdown' | 'mega';
  isActive: boolean;
  sortOrder: number;
  children: MenuItem[];
}

const defaultMenu: MenuItem[] = [
  { id: '1', label: "Today's Deals", labelBn: 'আজকের ডিল', url: '/deals', type: 'link', isActive: true, sortOrder: 0, children: [] },
  { id: '2', label: 'Flash Sale', labelBn: 'ফ্ল্যাশ সেল', url: '/flash-sale', type: 'link', isActive: true, sortOrder: 1, children: [] },
  { id: '3', label: 'New Arrivals', labelBn: 'নতুন পণ্য', url: '/new-arrivals', type: 'link', isActive: true, sortOrder: 2, children: [] },
  { id: '4', label: 'Best Sellers', labelBn: 'বেস্ট সেলার', url: '/best-sellers', type: 'link', isActive: true, sortOrder: 3, children: [] },
  { id: '5', label: 'Sell on Eylace', labelBn: 'Eylace-এ বিক্রি করুন', url: '/sell', type: 'link', isActive: true, sortOrder: 4, children: [] },
  { id: '6', label: 'Help & Support', labelBn: 'সাহায্য ও সহায়তা', url: '/help', type: 'link', isActive: true, sortOrder: 5, children: [] },
];

let cachedMenu: MenuItem[] | null = null;
let menuListeners: Array<(m: MenuItem[]) => void> = [];
let menuLoaded = false;
let menuLoading = false;

const notifyMenuListeners = (m: MenuItem[]) => {
  cachedMenu = m;
  menuListeners.forEach(fn => fn(m));
};

const fetchMenu = async () => {
  menuLoading = true;
  const { data } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'menu_config_v1')
    .maybeSingle();
  if (data?.value && Array.isArray(data.value)) {
    notifyMenuListeners(data.value as any);
  } else {
    notifyMenuListeners(defaultMenu);
  }
  menuLoaded = true;
  menuLoading = false;
};

const loadMenu = () => {
  if (menuLoaded || menuLoading) return;
  fetchMenu();
};

export const invalidateMenuCache = () => {
  menuLoaded = false;
  menuLoading = false;
  cachedMenu = null;
  fetchMenu();
};

export function useMenuConfig(): MenuItem[] {
  const [menu, setMenu] = useState<MenuItem[]>(cachedMenu || defaultMenu);

  useEffect(() => {
    menuListeners.push(setMenu);
    loadMenu();
    if (cachedMenu) setMenu(cachedMenu);
    return () => {
      menuListeners = menuListeners.filter(fn => fn !== setMenu);
    };
  }, []);

  return menu;
}
