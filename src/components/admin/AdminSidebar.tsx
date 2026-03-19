import { useState } from 'react';
import {
  LayoutDashboard, Package, ShoppingCart, Users, MessageSquare, Store, Tag, Settings,
  BarChart3, Truck, ShieldAlert, Megaphone, FileText, Globe, Layers, Image, Bell,
  CreditCard, ArrowLeft, LogOut, Shield, ChevronDown, ChevronRight, RefreshCw, Server, Map,
  Home, Upload, Download, Palette, Ruler, ShieldCheck, Sparkles, Percent, Type, Box,
  Monitor, PanelTop, Paintbrush, Lock, LayoutTemplate, CalendarClock, ClipboardList,
  MessagesSquare, HelpCircle, BellRing, Star, DollarSign, Wallet, UserCheck,
  Zap, MousePointerClick, AlertTriangle, ShoppingBag, Mail, Newspaper, UsersRound, Eye, Smartphone,
  Brain, Activity, LayoutList, Megaphone as MegaphoneIcon,
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
    { titleKey: 'admin.orders' as TranslationKey, url: '/admin/orders', icon: ShoppingCart },
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

  const managementItems = [
    { titleKey: 'admin.customers' as TranslationKey, url: '/admin/customers', icon: Users },
    { titleKey: 'admin.coupons' as TranslationKey, url: '/admin/coupons', icon: Tag },
  ];

  const operationsItems = [
    { titleKey: 'admin.courierManagement' as TranslationKey, url: '/admin/couriers', icon: Truck },
    { titleKey: 'admin.shippingProviders' as TranslationKey, url: '/admin/shipping-providers', icon: Package },
    { titleKey: 'admin.fraudDetection' as TranslationKey, url: '/admin/fraud', icon: ShieldAlert },
    { titleKey: 'admin.transactions' as TranslationKey, url: '/admin/transactions', icon: CreditCard },
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
  ];

  const contentItems = [
    { titleKey: 'admin.reports' as TranslationKey, url: '/admin/reports', icon: BarChart3 },
    { titleKey: 'admin.trackingAnalytics' as TranslationKey, url: '/admin/tracking', icon: Activity },
    { titleKey: 'admin.mediaGallery' as TranslationKey, url: '/admin/media', icon: Image },
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

        {/* AI Automation Section */}
        {canAccess('ai') && (
        <SidebarGroup>
          <Collapsible open={openSections.has('ai')} onOpenChange={() => toggleSection('ai')}>
            <CollapsibleTrigger className="w-full">
              <SidebarGroupLabel className="text-xs uppercase tracking-wider text-sidebar-foreground/50 font-semibold flex items-center justify-between w-full cursor-pointer hover:text-sidebar-foreground/70">
                <span className="flex items-center gap-1.5">
                  <Brain className="h-3.5 w-3.5" />
                  {t('admin.ai.section' as TranslationKey)}
                </span>
                {openSections.has('ai') ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {aiItems.map((item) => {
                    const title = t(item.titleKey as TranslationKey);
                    return (
                      <SidebarMenuItem key={item.titleKey}>
                        <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={title}>
                          <NavLink to={item.url} className="hover:bg-sidebar-accent/50 text-xs pl-2" activeClassName="bg-accent/10 text-accent font-medium border-r-2 border-accent">
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
        )}

        {/* Products Section */}
        {canAccess('products') && (
          <Collapsible open={openSections.has('products')} onOpenChange={() => toggleSection('products')}>
            <CollapsibleTrigger className="w-full">
              <SidebarGroupLabel className="text-xs uppercase tracking-wider text-sidebar-foreground/50 font-semibold flex items-center justify-between w-full cursor-pointer hover:text-sidebar-foreground/70">
                <span className="flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5" />
                  {t('admin.products' as TranslationKey)}
                </span>
                {openSections.has('products') ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {productItems.map((item) => {
                    const title = t(item.titleKey as TranslationKey);
                    return (
                      <SidebarMenuItem key={item.titleKey}>
                        <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={title}>
                          <NavLink
                            to={item.url}
                            end={item.url === '/admin/products'}
                            className="hover:bg-sidebar-accent/50 text-xs pl-2"
                            activeClassName="bg-accent/10 text-accent font-medium border-r-2 border-accent"
                          >
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
        )}

        {/* Sellers Section */}
        {canAccess('sellers') && (
        <SidebarGroup>
          <Collapsible open={openSections.has('sellers')} onOpenChange={() => toggleSection('sellers')}>
            <CollapsibleTrigger className="w-full">
              <SidebarGroupLabel className="text-xs uppercase tracking-wider text-sidebar-foreground/50 font-semibold flex items-center justify-between w-full cursor-pointer hover:text-sidebar-foreground/70">
                <span className="flex items-center gap-1.5">
                  <Store className="h-3.5 w-3.5" />
                  {t('admin.sellers.section' as TranslationKey)}
                </span>
                {openSections.has('sellers') ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {sellerItems.map((item) => {
                    const title = t(item.titleKey as TranslationKey);
                    return (
                      <SidebarMenuItem key={item.titleKey}>
                        <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={title}>
                          <NavLink
                            to={item.url}
                            end={item.url === '/admin/sellers'}
                            className="hover:bg-sidebar-accent/50 text-xs pl-2"
                            activeClassName="bg-accent/10 text-accent font-medium border-r-2 border-accent"
                          >
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
        )}

        {canAccess('management') && renderGroup('admin.group.management', managementItems)}

        {/* Preorder Section */}
        {canAccess('preorder') && (
          <Collapsible open={openSections.has('preorder')} onOpenChange={() => toggleSection('preorder')}>
            <CollapsibleTrigger className="w-full">
              <SidebarGroupLabel className="text-xs uppercase tracking-wider text-sidebar-foreground/50 font-semibold flex items-center justify-between w-full cursor-pointer hover:text-sidebar-foreground/70">
                <span className="flex items-center gap-1.5">
                  <CalendarClock className="h-3.5 w-3.5" />
                  {t('admin.preorder' as TranslationKey)}
                </span>
                {openSections.has('preorder') ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {preorderItems.map((item) => {
                    const title = t(item.titleKey as TranslationKey);
                    return (
                      <SidebarMenuItem key={item.titleKey}>
                        <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={title}>
                          <NavLink
                            to={item.url}
                            end={item.url === '/admin/preorder'}
                            className="hover:bg-sidebar-accent/50 text-xs pl-2"
                            activeClassName="bg-accent/10 text-accent font-medium border-r-2 border-accent"
                          >
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
        )}

        {/* OTP System Section */}
        {canAccess('otp') && (
          <Collapsible open={openSections.has('otp')} onOpenChange={() => toggleSection('otp')}>
            <CollapsibleTrigger className="w-full">
              <SidebarGroupLabel className="text-xs uppercase tracking-wider text-sidebar-foreground/50 font-semibold flex items-center justify-between w-full cursor-pointer hover:text-sidebar-foreground/70">
                <span className="flex items-center gap-1.5">
                  <Smartphone className="h-3.5 w-3.5" />
                  {t('admin.otp.section' as TranslationKey)}
                </span>
                {openSections.has('otp') ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {otpItems.map((item) => {
                    const title = t(item.titleKey as TranslationKey);
                    return (
                      <SidebarMenuItem key={item.titleKey}>
                        <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={title}>
                          <NavLink
                            to={item.url}
                            className="hover:bg-sidebar-accent/50 text-xs pl-2"
                            activeClassName="bg-accent/10 text-accent font-medium border-r-2 border-accent"
                          >
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
        )}

        {canAccess('operations') && renderGroup('admin.group.operations', operationsItems)}

        {/* Marketing Section */}
        {canAccess('marketing') && (
        <SidebarGroup>
          <Collapsible open={openSections.has('marketing')} onOpenChange={() => toggleSection('marketing')}>
            <CollapsibleTrigger className="w-full">
              <SidebarGroupLabel className="text-xs uppercase tracking-wider text-sidebar-foreground/50 font-semibold flex items-center justify-between w-full cursor-pointer hover:text-sidebar-foreground/70">
                <span className="flex items-center gap-1.5">
                  <Megaphone className="h-3.5 w-3.5" />
                  {t('admin.marketing.section' as TranslationKey)}
                </span>
                {openSections.has('marketing') ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {marketingItems.map((item) => {
                    const title = t(item.titleKey as TranslationKey);
                    return (
                      <SidebarMenuItem key={item.titleKey}>
                        <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={title}>
                          <NavLink
                            to={item.url}
                            className="hover:bg-sidebar-accent/50 text-xs pl-2"
                            activeClassName="bg-accent/10 text-accent font-medium border-r-2 border-accent"
                          >
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
        )}

        {canAccess('content') && renderGroup('admin.group.content', contentItems)}
        {canAccess('system') && renderGroup('admin.group.system', systemItems)}

        {/* Website Setup Section */}
        {canAccess('websiteSetup') && (
        <SidebarGroup>
          <Collapsible open={openSections.has('websiteSetup')} onOpenChange={() => toggleSection('websiteSetup')}>
            <CollapsibleTrigger className="w-full">
              <SidebarGroupLabel className="text-xs uppercase tracking-wider text-sidebar-foreground/50 font-semibold flex items-center justify-between w-full cursor-pointer hover:text-sidebar-foreground/70">
                <span className="flex items-center gap-1.5">
                  <Monitor className="h-3.5 w-3.5" />
                  {t('admin.websiteSetup' as TranslationKey)}
                </span>
                {openSections.has('websiteSetup') ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {websiteSetupItems.map((item) => {
                    const title = t(item.titleKey as TranslationKey);
                    return (
                      <SidebarMenuItem key={item.titleKey}>
                        <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={title}>
                          <NavLink
                            to={item.url}
                            className="hover:bg-sidebar-accent/50 text-xs pl-2"
                            activeClassName="bg-accent/10 text-accent font-medium border-r-2 border-accent"
                          >
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

        {/* Settings Section with Collapsible Sub-menu */}
        <SidebarGroup>
          <Collapsible open={openSections.has('settings')} onOpenChange={() => toggleSection('settings')}>
            <CollapsibleTrigger className="w-full">
              <SidebarGroupLabel className="text-xs uppercase tracking-wider text-sidebar-foreground/50 font-semibold flex items-center justify-between w-full cursor-pointer hover:text-sidebar-foreground/70">
                <span className="flex items-center gap-1.5">
                  <Settings className="h-3.5 w-3.5" />
                  {t('admin.settings' as TranslationKey)}
                </span>
                {openSections.has('settings') ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {settingsItems.map((item) => {
                    const title = t(item.titleKey as TranslationKey);
                    return (
                      <SidebarMenuItem key={item.titleKey}>
                        <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={title}>
                          <NavLink
                            to={item.url}
                            className="hover:bg-sidebar-accent/50 text-xs pl-2"
                            activeClassName="bg-accent/10 text-accent font-medium border-r-2 border-accent"
                          >
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
