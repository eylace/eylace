import { Navigate, Link, useLocation } from 'react-router-dom';
import { Loader2, ShieldAlert, Globe, ClipboardList, SlidersHorizontal, Plus, Trash2, LayoutDashboard } from 'lucide-react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from './AdminSidebar';
import { AdminNotificationBell } from './AdminNotificationBell';
import { ThemeToggle } from './ThemeToggle';
import { AdminLanguageSwitcher } from './AdminLanguageSwitcher';
import { AdminProfileMenu } from './AdminProfileMenu';
import { useAdminCheck } from '@/hooks/useAdminData';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { TranslationKey } from '@/i18n/translations';

interface AdminLayoutProps {
  children: React.ReactNode;
  titleKey?: TranslationKey;
  descriptionKey?: TranslationKey;
  title?: string;
  description?: string;
}

const quickNavTabs = [
  { label: 'Dashboard', path: '/admin', exact: true },
  { label: 'Orders', path: '/admin/orders' },
  { label: 'Preorders', path: '/admin/preorder' },
  { label: 'Earnings', path: '/admin/transactions' },
  { label: 'Homepage Settings', path: '/admin/website-setup' },
];

export const AdminLayout = ({ children, titleKey, descriptionKey, title, description }: AdminLayoutProps) => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  const { t } = useLanguage();
  const location = useLocation();

  const displayTitle = titleKey ? t(titleKey) : title;
  const displayDesc = descriptionKey ? t(descriptionKey) : description;

  const isTabActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const shouldPreserveStorageKey = (key: string) => {
    return (
      key.startsWith('sb-') ||
      key.includes('supabase') ||
      key === 'eylace-lang' ||
      key === 'eylace-theme'
    );
  };

  const removeNonEssentialStorage = (storage: Storage) => {
    const keysToDelete: string[] = [];

    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key && !shouldPreserveStorageKey(key)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => storage.removeItem(key));
  };

  const handleClearCache = async () => {
    removeNonEssentialStorage(localStorage);
    removeNonEssentialStorage(sessionStorage);

    if ('caches' in window) {
      const names = await caches.keys();
      await Promise.all(names.map((name) => caches.delete(name)));
    }

    toast.success('Only unnecessary cache cleared. You stay logged in.', { duration: 2000 });
  };

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground">
            You don't have permission to access the admin dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-30 bg-card border-b-2 border-accent">
            {/* Mobile header */}
            <div className="flex md:hidden items-center h-12 px-2 gap-2">
              <SidebarTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:text-accent hover:bg-accent/10 transition-colors shrink-0" />
              <Link to="/admin" className="flex items-center gap-1.5 shrink-0">
                <div className="h-7 w-7 rounded-lg bg-accent flex items-center justify-center">
                  <LayoutDashboard className="h-3.5 w-3.5 text-accent-foreground" />
                </div>
                <span className="font-bold text-sm text-foreground">Eylace</span>
              </Link>
              <div className="flex-1" />
              <Link to="/admin/products/add" className="shrink-0">
                <Button size="sm" variant="accent" className="h-7 text-[11px] gap-1 px-2 rounded-md">
                  <Plus className="h-3 w-3" />
                  Add New
                </Button>
              </Link>
              <ThemeToggle />
              <AdminNotificationBell />
            </div>
            {/* Mobile nav tabs */}
            <div className="flex md:hidden items-center gap-1 px-2 pb-2 overflow-x-auto scrollbar-none">
              {quickNavTabs.map(({ label, path, exact }) => (
                <Link
                  key={path}
                  to={path}
                  className={cn(
                    "inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors",
                    isTabActive(path, exact)
                      ? "bg-accent text-accent-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/10"
                  )}
                >
                  {label}
                </Link>
              ))}
            </div>

            {/* Desktop header - single row */}
            <div className="hidden md:flex items-center h-12 px-3 gap-3">

              {/* Icon buttons */}

              {/* Icon buttons */}
              <div className="flex items-center gap-0.5 shrink-0">
                <SidebarTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:text-accent hover:bg-accent/10 transition-colors" />
                <Link
                  to="/"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="View Storefront"
                  className="inline-flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:text-accent hover:bg-accent/10 transition-colors"
                >
                  <Globe className="h-4 w-4" />
                </Link>
                <Link
                  to="/admin/reports"
                  title="Reports"
                  className={cn(
                    "inline-flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:text-accent hover:bg-accent/10 transition-colors",
                    isTabActive('/admin/reports') && "text-accent bg-accent/10"
                  )}
                >
                  <ClipboardList className="h-4 w-4" />
                </Link>
                <Link
                  to="/admin/settings"
                  title="Settings"
                  className={cn(
                    "inline-flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:text-accent hover:bg-accent/10 transition-colors",
                    isTabActive('/admin/settings') && "text-accent bg-accent/10"
                  )}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                </Link>
                <button
                  onClick={handleClearCache}
                  title="Clear Cache"
                  className="inline-flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Separator */}
              <div className="w-px h-6 bg-border shrink-0" />

              {/* Navigation tabs */}
              <nav className="flex items-center gap-1 shrink-0">
                {quickNavTabs.map(({ label, path, exact }) => (
                  <Link
                    key={path}
                    to={path}
                    className={cn(
                      "inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors",
                      isTabActive(path, exact)
                        ? "bg-accent text-accent-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/10"
                    )}
                  >
                    {label}
                  </Link>
                ))}
              </nav>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Add New button */}
              <Link to="/admin/products/add" className="shrink-0">
                <Button size="sm" variant="accent" className="h-8 text-xs gap-1 px-3 rounded-md">
                  <Plus className="h-3.5 w-3.5" />
                  Add New
                </Button>
              </Link>

              {/* Separator */}
              <div className="w-px h-6 bg-border shrink-0" />

              {/* Right utilities */}
              <div className="flex items-center gap-1 shrink-0">
                <AdminLanguageSwitcher />
                <ThemeToggle />
                <AdminNotificationBell />
              </div>
            </div>
          </header>
          <main className="flex-1 p-3 md:p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
