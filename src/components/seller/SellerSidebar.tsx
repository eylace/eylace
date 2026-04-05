import {
  LayoutDashboard, Package, ShoppingCart, BarChart3, DollarSign,
  Star, Tag, Store, HelpCircle, LogOut, ShieldCheck,
} from 'lucide-react';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader,
  SidebarFooter, useSidebar,
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import type { SellerProfile } from '@/hooks/useSellerData';

const navItems = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'orders', label: 'Orders', icon: ShoppingCart },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'finance', label: 'Finance', icon: DollarSign },
  { id: 'reviews', label: 'Reviews', icon: Star },
  { id: 'promotions', label: 'Promotions', icon: Tag },
  { id: 'settings', label: 'Store Settings', icon: Store },
  { id: 'support', label: 'Support', icon: HelpCircle },
];

interface SellerSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  seller: SellerProfile;
}

export const SellerSidebar = ({ activeTab, onTabChange, seller }: SellerSidebarProps) => {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { signOut } = useAuth();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-border p-4">
        <div className="flex items-center gap-3">
          {seller.logo ? (
            <img src={seller.logo} alt={seller.name} className="w-9 h-9 rounded-lg object-cover" />
          ) : (
            <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center text-accent-foreground font-bold text-sm">
              {seller.name.charAt(0)}
            </div>
          )}
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{seller.name}</p>
              <div className="flex items-center gap-1">
                {seller.is_verified && (
                  <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 border-accent text-accent">
                    Verified
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onTabChange(item.id)}
                    isActive={activeTab === item.id}
                    tooltip={item.label}
                  >
                    <item.icon className="h-4 w-4" />
                    {!collapsed && <span>{item.label}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-destructive hover:text-destructive"
          onClick={() => signOut()}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>Sign Out</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
};
