import { useState } from 'react';
import {
  LayoutDashboard, Package, ShoppingCart, Users, MessageSquare, Store, Tag, Settings,
  BarChart3, Truck, ShieldAlert, Megaphone, FileText, Globe, Layers, Image, Bell, Ban,
  CreditCard, ArrowLeft, LogOut, Shield, ChevronDown, ChevronRight, RefreshCw, Server, Map,
  Home, Upload, Download, Palette, Ruler, ShieldCheck, Sparkles, Percent, Type, Box,
  Monitor, PanelTop, Paintbrush, Lock, LayoutTemplate, CalendarClock, ClipboardList,
  MessagesSquare, HelpCircle, BellRing, Star, DollarSign, Wallet, UserCheck,
  Zap, MousePointerClick, AlertTriangle, ShoppingBag, Mail, Newspaper, UsersRound, Eye, Smartphone, Boxes,
  Brain, Activity, LayoutList, Megaphone as MegaphoneIcon, RotateCcw, Link2,
  UploadCloud, LifeBuoy, Ticket, MessageCircle, Contact, Award, PenSquare, FolderOpen, BookOpen,
  Receipt, Undo2, FileCheck, FolderCog,
  Calculator,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { NavLink } from '@/components/NavLink';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar,
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { TranslationKey } from '@/i18n/translations';

interface NavItem {
  titleKey: string;
  url: string;
  icon: React.ElementType;
  children?: NavItem[];
}

interface AdminSidebarProps {
  hasAccess?: (section: string) => boolean;
}

export function AdminSidebar({ hasAccess }: AdminSidebarProps) {
  const { state } = useSidebar();
  const { signOut } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const currentPath = location.pathname;

  const canAccess = (section: string) => !hasAccess || hasAccess(section);

  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['products']));

  const toggleSection = (key: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const productItems: NavItem[] = [
    { titleKey: 'admin.addProduct', url: '/admin/products/add', icon: Package },
    { titleKey: 'admin.allProducts', url: '/admin/products', icon: Box },
    { titleKey: 'admin.inHouseProducts', url: '/admin/products/in-house', icon: Home },
    { titleKey: 'admin.customers', url: '/admin/customers', icon: Users },
    { titleKey: 'admin.addDigitalProduct', url: '/admin/products/digital/add', icon: Upload },
    { titleKey: 'admin.sellerProducts', url: '/admin/products/seller', icon: Store },
    { titleKey: 'admin.bulkImport', url: '/admin/products/bulk-import', icon: Upload },
    { titleKey: 'admin.bulkExport', url: '/admin/products/bulk-export', icon: Download },
    { titleKey: 'admin.categories', url: '/admin/categories', icon: Layers },
    { titleKey: 'admin.categoryDiscount', url: '/admin/products/category-discount', icon: Percent },
    { titleKey: 'admin.brands', url: '/admin/products/brands', icon: Sparkles },
    { titleKey: 'admin.customLabels', url: '/admin/products/labels', icon: Type },
    { titleKey: 'admin.attributes', url: '/admin/products/attributes', icon: Tag },
    { titleKey: 'admin.colors', url: '/admin/products/colors', icon: Palette },
    { titleKey: 'admin.sizeGuide', url: '/admin/products/size-guides', icon: Ruler },
    { titleKey: 'admin.warranty', url: '/admin/products/warranties', icon: ShieldCheck },
    { titleKey: 'admin.smartBar', url: '/admin/products/smart-bar', icon: Megaphone },
    { titleKey: 'admin.reviews', url: '/admin/reviews', icon: MessageSquare },
  ];

  const aiItems: NavItem[] = [
    { titleKey: 'admin.ai.settings', url: '/admin/ai-settings', icon: Settings },
    { titleKey: 'admin.ai.analyzer', url: '/admin/ai-analyzer', icon: BarChart3 },
  ];

  const mainItems = [
    { titleKey: 'admin.dashboard' as TranslationKey, url: '/admin', icon: LayoutDashboard },
  ];

  const orderItems: NavItem[] = [
    { titleKey: 'admin.orders' as TranslationKey, url: '/admin/orders', icon: ShoppingCart },
    { titleKey: 'admin.incomplete.title' as TranslationKey, url: '/admin/incomplete-orders', icon: AlertTriangle },
    { titleKey: 'admin.mapsOrderData' as TranslationKey, url: '/admin/maps-order-data', icon: Map },
  ];

  const sellerItems: NavItem[] = [
    { titleKey: 'admin.sellers.all', url: '/admin/sellers', icon: Store },
    { titleKey: 'admin.sellers.applied', url: '/admin/sellers/applied', icon: ClipboardList },
    { titleKey: 'admin.sellers.ratings', url: '/admin/sellers/ratings', icon: Star },
    { titleKey: 'admin.sellers.payouts', url: '/admin/sellers/payouts', icon: DollarSign },
    { titleKey: 'admin.sellers.payoutRequests', url: '/admin/sellers/payout-requests', icon: Wallet },
    { titleKey: 'admin.sellers.commission', url: '/admin/sellers/commission', icon: Percent },
    { titleKey: 'admin.sellers.sellerCommission', url: '/admin/sellers/seller-commission', icon: Store },
    { titleKey: 'admin.sellers.categoryCommission', url: '/admin/sellers/category-commission', icon: Layers },
    { titleKey: 'admin.sellers.packages', url: '/admin/sellers/packages', icon: Package },
    { titleKey: 'admin.sellers.verification', url: '/admin/sellers/verification', icon: UserCheck },
  ];

  const otpItems: NavItem[] = [
    { titleKey: 'admin.otp.loginConfig', url: '/admin/otp/login-config', icon: Smartphone },
    { titleKey: 'admin.otp.configurations', url: '/admin/otp/configurations', icon: Settings },
    { titleKey: 'admin.otp.smsTemplates', url: '/admin/otp/sms-templates', icon: MessageSquare },
  ];

  const stockItems: NavItem[] = [
    { titleKey: 'All Stock Products', url: '/admin/stock', icon: Boxes },
  ];

  const managementItems = [
    { titleKey: 'admin.customers' as TranslationKey, url: '/admin/customers', icon: Users },
    { titleKey: 'admin.coupons' as TranslationKey, url: '/admin/coupons', icon: Tag },
  ];

  const operationsItems = [
    { titleKey: 'admin.courierManagement' as TranslationKey, url: '/admin/shipping-providers', icon: Truck },
    { titleKey: 'admin.returnsRefunds' as TranslationKey, url: '/admin/returns', icon: RotateCcw },
    { titleKey: 'admin.fraudDetection' as TranslationKey, url: '/admin/fraud', icon: ShieldAlert },
    { titleKey: 'admin.transactions' as TranslationKey, url: '/admin/transactions', icon: CreditCard },
    { titleKey: 'admin.paymentGateways' as TranslationKey, url: '/admin/payment-gateways', icon: Wallet },
    { titleKey: 'IP Block' as TranslationKey, url: '/admin/ip-block', icon: Ban },
  ];

  const marketingItems: NavItem[] = [
    { titleKey: 'admin.marketing.flashDeals', url: '/admin/marketing/flash-deals', icon: Zap },
    { titleKey: 'admin.marketing.popup', url: '/admin/marketing/popup', icon: MousePointerClick },
    { titleKey: 'admin.marketing.customAlert', url: '/admin/marketing/custom-alert', icon: AlertTriangle },
    { titleKey: 'admin.marketing.sellAlert', url: '/admin/marketing/sell-alert', icon: ShoppingBag },
    { titleKey: 'admin.marketing.emailTemplates', url: '/admin/marketing/email-templates', icon: Mail },
    { titleKey: 'admin.marketing.newsletters', url: '/admin/marketing/newsletters', icon: Newspaper },
    { titleKey: 'admin.marketing.notification', url: '/admin/marketing/notification', icon: Bell },
    { titleKey: 'admin.marketing.bulkSMS', url: '/admin/marketing/bulk-sms', icon: MessageSquare },
    { titleKey: 'admin.marketing.subscribers', url: '/admin/marketing/subscribers', icon: UsersRound },
    { titleKey: 'admin.marketing.visitors', url: '/admin/marketing/visitors', icon: Eye },
    { titleKey: 'admin.marketing.ads', url: '/admin/marketing/ads', icon: LayoutList },
    { titleKey: 'admin.marketing.affiliate', url: '/admin/affiliate', icon: Link2 },
  ];

  const uploadMediaItem = { titleKey: 'Upload Media' as TranslationKey, url: '/admin/upload-files', icon: UploadCloud };

  const supportItems: NavItem[] = [
    { titleKey: 'Tickets', url: '/admin/support/tickets', icon: Ticket },
    { titleKey: 'Product Conversations', url: '/admin/support/conversations', icon: MessageCircle },
    { titleKey: 'Product Queries', url: '/admin/support/queries', icon: HelpCircle },
    { titleKey: 'Contacts', url: '/admin/support/contacts', icon: Contact },
  ];

  const affiliateItems: NavItem[] = [
    { titleKey: 'Registration Form', url: '/admin/affiliate/registration', icon: FileText },
    { titleKey: 'Configurations', url: '/admin/affiliate/config', icon: Settings },
    { titleKey: 'Affiliate Users', url: '/admin/affiliate/users', icon: Users },
    { titleKey: 'Referral Users', url: '/admin/affiliate/referrals', icon: UsersRound },
    { titleKey: 'Withdraw Requests', url: '/admin/affiliate/withdrawals', icon: Wallet },
    { titleKey: 'Affiliate Logs', url: '/admin/affiliate/logs', icon: Activity },
  ];

  const clubPointItems: NavItem[] = [
    { titleKey: 'Club Point Config', url: '/admin/club-point/config', icon: Settings },
    { titleKey: 'Set Product Point', url: '/admin/club-point/products', icon: Award },
    { titleKey: 'User Points', url: '/admin/club-point/users', icon: Users },
  ];

  const blogItems: NavItem[] = [
    { titleKey: 'Add New Post', url: '/admin/blog/add', icon: PenSquare },
    { titleKey: 'All Posts', url: '/admin/blog/posts', icon: FolderOpen },
    { titleKey: 'Categories', url: '/admin/blog/categories', icon: BookOpen },
  ];

  const refundItems: NavItem[] = [
    { titleKey: 'Refund Requests', url: '/admin/refunds/requests', icon: Receipt },
    { titleKey: 'Approved Refunds', url: '/admin/refunds/approved', icon: FileCheck },
    { titleKey: 'Rejected Refunds', url: '/admin/refunds/rejected', icon: Undo2 },
    { titleKey: 'Refund Configuration', url: '/admin/refunds/config', icon: FolderCog },
    { titleKey: 'Category Based Refund', url: '/admin/refunds/category', icon: Layers },
  ];

  const accountingItems: NavItem[] = [
    { titleKey: 'Overview', url: '/admin/accounting?tab=overview', icon: LayoutDashboard },
    { titleKey: 'Chart of Accounts', url: '/admin/accounting?tab=accounts', icon: FolderOpen },
    { titleKey: 'Transactions', url: '/admin/accounting?tab=transactions', icon: Activity },
    { titleKey: 'Invoices', url: '/admin/accounting?tab=invoices', icon: Receipt },
    { titleKey: 'Bills', url: '/admin/accounting?tab=bills', icon: FileText },
    { titleKey: 'Reports', url: '/admin/accounting?tab=reports', icon: BarChart3 },
    { titleKey: 'Courier Expenses', url: '/admin/courier-expenses', icon: Truck },
  ];

  const contentItems = [
    { titleKey: 'admin.reports' as TranslationKey, url: '/admin/reports', icon: BarChart3 },
    { titleKey: 'admin.trackingAnalytics' as TranslationKey, url: '/admin/tracking', icon: Activity },
    { titleKey: 'admin.notifications' as TranslationKey, url: '/admin/notifications', icon: Bell },
  ];

  const systemItems = [
    { titleKey: 'admin.userRoles' as TranslationKey, url: '/admin/user-roles', icon: Shield },
    { titleKey: 'admin.pages' as TranslationKey, url: '/admin/pages', icon: FileText },
    { titleKey: 'admin.seoAnalytics' as TranslationKey, url: '/admin/seo', icon: Globe },
    { titleKey: 'admin.system.update' as TranslationKey, url: '/admin/system/update', icon: RefreshCw },
    { titleKey: 'admin.system.serverStatus' as TranslationKey, url: '/admin/system/server-status', icon: Server },
    { titleKey: 'admin.system.sitemap' as TranslationKey, url: '/admin/system/sitemap', icon: Map },
  ];

  const websiteSetupItems: NavItem[] = [
    { titleKey: 'admin.websiteSetup.menuManager' as TranslationKey, url: '/admin/menu-manager', icon: LayoutList },
    { titleKey: 'admin.websiteSetup.homepage' as TranslationKey, url: '/admin/website-setup?tab=homepage', icon: Home },
    { titleKey: 'admin.websiteSetup.homepageSettings' as TranslationKey, url: '/admin/website-setup?tab=homepage-settings', icon: LayoutTemplate },
    { titleKey: 'admin.websiteSetup.font' as TranslationKey, url: '/admin/website-setup?tab=font', icon: Type },
    { titleKey: 'admin.websiteSetup.auth' as TranslationKey, url: '/admin/website-setup?tab=auth', icon: Lock },
    { titleKey: 'admin.websiteSetup.header' as TranslationKey, url: '/admin/website-setup?tab=header', icon: PanelTop },
    { titleKey: 'admin.websiteSetup.headerSettings' as TranslationKey, url: '/admin/website-setup?tab=header-settings', icon: Settings },
    { titleKey: 'admin.websiteSetup.topbar' as TranslationKey, url: '/admin/website-setup?tab=topbar', icon: Monitor },
    { titleKey: 'admin.websiteSetup.footer' as TranslationKey, url: '/admin/website-setup?tab=footer', icon: Layers },
    { titleKey: 'admin.websiteSetup.pages' as TranslationKey, url: '/admin/website-setup?tab=pages', icon: FileText },
    { titleKey: 'admin.websiteSetup.appearance' as TranslationKey, url: '/admin/website-setup?tab=appearance', icon: Paintbrush },
  ];

  const preorderItems: NavItem[] = [
    { titleKey: 'admin.preorder.dashboard', url: '/admin/preorder', icon: LayoutDashboard },
    { titleKey: 'admin.preorder.addProduct', url: '/admin/preorder/add', icon: Package },
    { titleKey: 'admin.preorder.products', url: '/admin/preorder/products', icon: Box },
    { titleKey: 'admin.preorder.orders', url: '/admin/preorder/orders', icon: ShoppingCart },
    { titleKey: 'admin.preorder.commissions', url: '/admin/preorder/commissions', icon: CreditCard },
    { titleKey: 'admin.preorder.settings', url: '/admin/preorder/settings', icon: Settings },
    { titleKey: 'admin.preorder.conversations', url: '/admin/preorder/conversations', icon: MessagesSquare },
    { titleKey: 'admin.preorder.queries', url: '/admin/preorder/queries', icon: ClipboardList },
    { titleKey: 'admin.preorder.reviews', url: '/admin/preorder/reviews', icon: MessageSquare },
    { titleKey: 'admin.preorder.faqs', url: '/admin/preorder/faqs', icon: HelpCircle },
    { titleKey: 'admin.preorder.notifications', url: '/admin/preorder/notifications', icon: BellRing },
  ];

  const settingsItems: NavItem[] = [
    { titleKey: 'admin.settings.business' as TranslationKey, url: '/admin/settings?tab=business', icon: Home },
    { titleKey: 'admin.settings.features' as TranslationKey, url: '/admin/settings?tab=features', icon: Sparkles },
    { titleKey: 'admin.settings.languages' as TranslationKey, url: '/admin/settings?tab=languages', icon: Globe },
    { titleKey: 'admin.settings.currency' as TranslationKey, url: '/admin/settings?tab=currency', icon: CreditCard },
    { titleKey: 'admin.settings.vat' as TranslationKey, url: '/admin/settings?tab=vat', icon: Percent },
    { titleKey: 'admin.settings.pickup' as TranslationKey, url: '/admin/settings?tab=pickup', icon: Store },
    { titleKey: 'admin.settings.smtp' as TranslationKey, url: '/admin/settings?tab=smtp', icon: FileText },
    { titleKey: 'admin.settings.order' as TranslationKey, url: '/admin/settings?tab=order', icon: ShoppingCart },
    { titleKey: 'admin.settings.filesystem' as TranslationKey, url: '/admin/settings?tab=filesystem', icon: Layers },
    { titleKey: 'admin.settings.social' as TranslationKey, url: '/admin/settings?tab=social', icon: Users },
    { titleKey: 'admin.settings.shipping' as TranslationKey, url: '/admin/settings?tab=shipping', icon: Truck },
  ];

  const isActive = (path: string) => {
    if (path === '/admin') return currentPath === '/admin';
    if (path === '/admin/products') return currentPath === '/admin/products';
    if (path.includes('?')) {
      const [basePath, query] = path.split('?');
      return currentPath === basePath && location.search === `?${query}`;
    }
    return currentPath.startsWith(path);
  };

  const isProductSectionActive = productItems.some(i => isActive(i.url));

  const renderGroup = (labelKey: TranslationKey, items: typeof mainItems) => (
    <SidebarGroup>
      <SidebarGroupLabel className="text-xs uppercase tracking-wider text-sidebar-foreground/50 font-semibold">
        {t(labelKey)}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const title = t(item.titleKey as TranslationKey);
            return (
              <SidebarMenuItem key={item.titleKey}>
                <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={title}>
                  <NavLink to={item.url} end={item.url === '/admin'} className="hover:bg-sidebar-accent/50" activeClassName="bg-accent/10 text-accent font-medium border-r-2 border-accent">
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span>{title}</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  const renderCollapsible = (sectionKey: string, labelKey: string, icon: React.ElementType, items: NavItem[], endPath?: string) => {
    if (!canAccess(sectionKey)) return null;
    const Icon = icon;
    return (
      <SidebarGroup>
        <Collapsible open={openSections.has(sectionKey)} onOpenChange={() => toggleSection(sectionKey)}>
          <CollapsibleTrigger className="w-full">
            <SidebarGroupLabel className="text-xs uppercase tracking-wider text-sidebar-foreground/50 font-semibold flex items-center justify-between w-full cursor-pointer hover:text-sidebar-foreground/70">
              <span className="flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5" />
                {t(labelKey as TranslationKey)}
              </span>
              {openSections.has(sectionKey) ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </SidebarGroupLabel>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => {
                  const title = t(item.titleKey as TranslationKey);
                  return (
                    <SidebarMenuItem key={item.titleKey}>
                      <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={title}>
                        <NavLink to={item.url} end={endPath ? item.url === endPath : false} className="hover:bg-sidebar-accent/50 text-xs pl-2" activeClassName="bg-accent/10 text-accent font-medium border-r-2 border-accent">
                          <item.icon className="h-3.5 w-3.5 shrink-0" />
                          <span>{title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </CollapsibleContent>
        </Collapsible>
      </SidebarGroup>
    );
  };

  return (
    <Sidebar collapsible="offcanvas" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-3">
        <Link to="/admin" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
            <LayoutDashboard className="h-4 w-4 text-accent-foreground" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-sidebar-foreground">Eylace Admin</h2>
            <p className="text-[10px] text-sidebar-foreground/50">{t('admin.managementPanel')}</p>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="overflow-y-auto">
        {canAccess('main') && renderGroup('admin.group.main', mainItems)}
        {renderCollapsible('orders', 'Sales', ShoppingCart, orderItems, '/admin/orders')}
        {renderCollapsible('ai', 'admin.ai.section', Brain, aiItems)}
        {renderCollapsible('products', 'admin.products', Package, productItems, '/admin/products')}
        {canAccess('products') && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive(uploadMediaItem.url)} tooltip="Upload Media">
                    <NavLink to={uploadMediaItem.url} className="hover:bg-sidebar-accent/50" activeClassName="bg-accent/10 text-accent font-medium border-r-2 border-accent">
                      <uploadMediaItem.icon className="h-4 w-4 shrink-0" />
                      <span>Upload Media</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        {renderCollapsible('sellers', 'admin.sellers.section', Store, sellerItems, '/admin/sellers')}
        {renderCollapsible('stockManagement', 'Stock Management', Boxes, stockItems)}
        {canAccess('management') && renderGroup('admin.group.management', managementItems)}
        {renderCollapsible('preorder', 'admin.preorder', CalendarClock, preorderItems, '/admin/preorder')}
        {renderCollapsible('otp', 'admin.otp.section', Smartphone, otpItems)}
        {canAccess('operations') && renderGroup('admin.group.operations', operationsItems)}
        {renderCollapsible('marketing', 'admin.marketing.section', Megaphone, marketingItems)}
        {renderCollapsible('support', 'Support', LifeBuoy, supportItems)}
        {renderCollapsible('affiliateSystem', 'Affiliate System', Link2, affiliateItems)}
        {renderCollapsible('clubPoint', 'Club Point System', Award, clubPointItems)}
        {renderCollapsible('blogSystem', 'Blog System', BookOpen, blogItems)}
        {renderCollapsible('refunds', 'Refunds', Undo2, refundItems)}
        {renderCollapsible('accounting', 'Accounting Management', Calculator, accountingItems)}
        {canAccess('content') && renderGroup('admin.group.content', contentItems)}
        {canAccess('system') && renderGroup('admin.group.system', systemItems)}
        {renderCollapsible('websiteSetup', 'admin.websiteSetup', Monitor, websiteSetupItems)}
        {renderCollapsible('settings', 'admin.settings', Settings, settingsItems)}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2 md:p-3 space-y-1">
        <SidebarMenuButton asChild>
          <Link to="/" className="flex items-center gap-2 text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground min-h-[40px]">
            <ArrowLeft className="h-4 w-4 shrink-0" />
            <span>{t('admin.backToStore')}</span>
          </Link>
        </SidebarMenuButton>
        <SidebarMenuButton
          onClick={async () => { await signOut(); navigate('/admin/login'); }}
          className="flex items-center gap-2 text-sm text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer min-h-[40px]"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span>{t('admin.logout')}</span>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}
