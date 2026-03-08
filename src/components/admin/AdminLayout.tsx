import { Navigate } from 'react-router-dom';
import { Loader2, ShieldAlert } from 'lucide-react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from './AdminSidebar';
import { AdminNotificationBell } from './AdminNotificationBell';
import { ThemeToggle } from './ThemeToggle';
import { AdminLanguageSwitcher } from './AdminLanguageSwitcher';
import { useAdminCheck } from '@/hooks/useAdminData';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import type { TranslationKey } from '@/i18n/translations';

interface AdminLayoutProps {
  children: React.ReactNode;
  titleKey?: TranslationKey;
  descriptionKey?: TranslationKey;
  title?: string;
  description?: string;
}

export const AdminLayout = ({ children, titleKey, descriptionKey, title, description }: AdminLayoutProps) => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  const { t } = useLanguage();

  const displayTitle = titleKey ? t(titleKey) : title;
  const displayDesc = descriptionKey ? t(descriptionKey) : description;

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
          <header className="h-12 md:h-14 flex items-center gap-2 md:gap-4 border-b border-border bg-card px-2 md:px-4 sticky top-0 z-30">
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
          </header>
          <main className="flex-1 p-3 md:p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
