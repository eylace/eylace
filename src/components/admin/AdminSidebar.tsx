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
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation, Link } from 'react-router-dom';
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

const mainItems = [
  { title: 'Dashboard', url: '/admin', icon: LayoutDashboard },
  { title: 'Orders', url: '/admin/orders', icon: ShoppingCart },
  { title: 'Products', url: '/admin/products', icon: Package },
  { title: 'Categories', url: '/admin/categories', icon: Layers },
];

const managementItems = [
  { title: 'Customers', url: '/admin/customers', icon: Users },
  { title: 'Sellers', url: '/admin/sellers', icon: Store },
  { title: 'Reviews', url: '/admin/reviews', icon: MessageSquare },
  { title: 'Coupons', url: '/admin/coupons', icon: Tag },
];

const operationsItems = [
  { title: 'Courier Management', url: '/admin/couriers', icon: Truck },
  { title: 'Fraud Detection', url: '/admin/fraud', icon: ShieldAlert },
  { title: 'Transactions', url: '/admin/transactions', icon: CreditCard },
];

const contentItems = [
  { title: 'Marketing', url: '/admin/marketing', icon: Megaphone },
  { title: 'Reports', url: '/admin/reports', icon: BarChart3 },
  { title: 'Media Gallery', url: '/admin/media', icon: Image },
  { title: 'Notifications', url: '/admin/notifications', icon: Bell },
];

const systemItems = [
  { title: 'Settings', url: '/admin/settings', icon: Settings },
  { title: 'Pages', url: '/admin/pages', icon: FileText },
  { title: 'SEO & Analytics', url: '/admin/seo', icon: Globe },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => {
    if (path === '/admin') return currentPath === '/admin';
    return currentPath.startsWith(path);
  };

  const renderGroup = (label: string, items: typeof mainItems) => (
    <SidebarGroup>
      <SidebarGroupLabel className="text-xs uppercase tracking-wider text-sidebar-foreground/50 font-semibold">
        {!collapsed && label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                isActive={isActive(item.url)}
                tooltip={item.title}
              >
                <NavLink
                  to={item.url}
                  end={item.url === '/admin'}
                  className="hover:bg-sidebar-accent/50"
                  activeClassName="bg-accent/10 text-accent font-medium border-r-2 border-accent"
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
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
                <p className="text-[10px] text-sidebar-foreground/50">Management Panel</p>
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
        {renderGroup('Main', mainItems)}
        {renderGroup('Management', managementItems)}
        {renderGroup('Operations', operationsItems)}
        {renderGroup('Content', contentItems)}
        {renderGroup('System', systemItems)}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <SidebarMenuButton asChild>
          <Link to="/" className="flex items-center gap-2 text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground">
            <ArrowLeft className="h-4 w-4" />
            {!collapsed && <span>Back to Store</span>}
          </Link>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}
