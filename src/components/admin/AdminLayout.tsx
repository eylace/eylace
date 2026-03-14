import { Navigate, Link, useLocation } from 'react-router-dom';
import { Loader2, ShieldAlert, Globe, ClipboardList, SlidersHorizontal, Plus, Trash2 } from 'lucide-react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from './AdminSidebar';
import { AdminNotificationBell } from './AdminNotificationBell';
import { ThemeToggle } from './ThemeToggle';
import { AdminLanguageSwitcher } from './AdminLanguageSwitcher';
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

  const handleClearCache = () => {
    localStorage.clear();
    sessionStorage.clear();
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
    localStorage.setItem('eylace-lang', 'en');
    toast.success('Cache cleared successfully! Reloading...', { duration: 1500 });
    setTimeout(() => window.location.reload(), 1500);
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
          <header className="sticky top-0 z-30 bg-card border-b border-border">
            {/* Primary header row */}
            <div className="h-12 md:h-14 flex items-center gap-2 md:gap-4 px-2 md:px-4">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground shrink-0" />
              {displayTitle && (
                <div className="flex-1 min-w-0">
                  <h1 className="text-sm md:text-lg font-semibold text-foreground truncate">{displayTitle}</h1>
                  {displayDesc && <p className="text-[10px] md:text-xs text-muted-foreground truncate hidden sm:block">{displayDesc}</p>}
                </div>
              )}
              <div className="ml-auto flex items-center gap-1 md:gap-2 shrink-0">
                <AdminLanguageSwitcher />
                <ThemeToggle />
                <AdminNotificationBell />
              </div>
            </div>

            {/* Quick navigation strip */}
            <div className="h-10 flex items-center gap-1.5 px-2 md:px-4 border-t border-border/50 bg-muted/30 overflow-x-auto scrollbar-none">
              {/* Icon buttons group */}
              <div className="flex items-center gap-0.5 shrink-0">
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
              <div className="w-px h-5 bg-border shrink-0 mx-1" />

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

              {/* Add New button */}
              <div className="ml-auto shrink-0">
                <Link to="/admin/products/add">
                  <Button size="sm" variant="accent" className="h-7 text-xs gap-1 px-3 rounded-md">
                    <Plus className="h-3.5 w-3.5" />
                    Add New
                  </Button>
                </Link>
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
