import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  MessageSquare,
  Store,
  Tag,
  Settings,
  BarChart3,
  Truck,
  ShieldAlert,
  Megaphone,
  FileText,
  Globe,
  Layers,
  Image,
  Bell,
  CreditCard,
  ArrowLeft,
  LogOut,
  Shield,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { NavLink } from '@/components/NavLink';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import type { TranslationKey } from '@/i18n/translations';

export function AdminSidebar() {
  const { state } = useSidebar();
  const { signOut } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const currentPath = location.pathname;

  const mainItems = [
    { titleKey: 'admin.dashboard' as TranslationKey, url: '/admin', icon: LayoutDashboard },
    { titleKey: 'admin.orders' as TranslationKey, url: '/admin/orders', icon: ShoppingCart },
    { titleKey: 'admin.products' as TranslationKey, url: '/admin/products', icon: Package },
    { titleKey: 'admin.categories' as TranslationKey, url: '/admin/categories', icon: Layers },
  ];

  const managementItems = [
    { titleKey: 'admin.customers' as TranslationKey, url: '/admin/customers', icon: Users },
    { titleKey: 'admin.sellers' as TranslationKey, url: '/admin/sellers', icon: Store },
    { titleKey: 'admin.reviews' as TranslationKey, url: '/admin/reviews', icon: MessageSquare },
    { titleKey: 'admin.coupons' as TranslationKey, url: '/admin/coupons', icon: Tag },
  ];

  const operationsItems = [
    { titleKey: 'admin.courierManagement' as TranslationKey, url: '/admin/couriers', icon: Truck },
    { titleKey: 'admin.fraudDetection' as TranslationKey, url: '/admin/fraud', icon: ShieldAlert },
    { titleKey: 'admin.transactions' as TranslationKey, url: '/admin/transactions', icon: CreditCard },
  ];

  const contentItems = [
    { titleKey: 'admin.marketing' as TranslationKey, url: '/admin/marketing', icon: Megaphone },
    { titleKey: 'admin.reports' as TranslationKey, url: '/admin/reports', icon: BarChart3 },
    { titleKey: 'admin.mediaGallery' as TranslationKey, url: '/admin/media', icon: Image },
    { titleKey: 'admin.notifications' as TranslationKey, url: '/admin/notifications', icon: Bell },
  ];

  const systemItems = [
    { titleKey: 'admin.userRoles' as TranslationKey, url: '/admin/user-roles', icon: Shield },
    { titleKey: 'admin.settings' as TranslationKey, url: '/admin/settings', icon: Settings },
    { titleKey: 'admin.pages' as TranslationKey, url: '/admin/pages', icon: FileText },
    { titleKey: 'admin.seoAnalytics' as TranslationKey, url: '/admin/seo', icon: Globe },
  ];

  const isActive = (path: string) => {
    if (path === '/admin') return currentPath === '/admin';
    return currentPath.startsWith(path);
  };

  const renderGroup = (labelKey: TranslationKey, items: typeof mainItems) => (
    <SidebarGroup>
      <SidebarGroupLabel className="text-xs uppercase tracking-wider text-sidebar-foreground/50 font-semibold">
        {!collapsed && t(labelKey)}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const title = t(item.titleKey);
            return (
              <SidebarMenuItem key={item.titleKey}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive(item.url)}
                  tooltip={title}
                >
                  <NavLink
                    to={item.url}
                    end={item.url === '/admin'}
                    className="hover:bg-sidebar-accent/50"
                    activeClassName="bg-accent/10 text-accent font-medium border-r-2 border-accent"
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {!collapsed && <span>{title}</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-3">
        <Link to="/admin" className="flex items-center gap-2">
          {!collapsed ? (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center">
                <LayoutDashboard className="h-4 w-4 text-accent-foreground" />
              </div>
              <div>
                <h2 className="font-bold text-sm text-sidebar-foreground">Eylace Admin</h2>
                <p className="text-[10px] text-sidebar-foreground/50">{t('admin.managementPanel')}</p>
              </div>
            </div>
          ) : (
            <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center mx-auto">
              <LayoutDashboard className="h-4 w-4 text-accent-foreground" />
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="overflow-y-auto">
        {renderGroup('admin.group.main', mainItems)}
        {renderGroup('admin.group.management', managementItems)}
        {renderGroup('admin.group.operations', operationsItems)}
        {renderGroup('admin.group.content', contentItems)}
        {renderGroup('admin.group.system', systemItems)}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2 md:p-3 space-y-1">
        <SidebarMenuButton asChild>
          <Link to="/" className="flex items-center gap-2 text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground min-h-[40px]">
            <ArrowLeft className="h-4 w-4 shrink-0" />
            {!collapsed && <span>{t('admin.backToStore')}</span>}
          </Link>
        </SidebarMenuButton>
        <SidebarMenuButton
          onClick={async () => {
            await signOut();
            navigate('/admin/login');
          }}
          className="flex items-center gap-2 text-sm text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer min-h-[40px]"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>{t('admin.logout')}</span>}
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}
