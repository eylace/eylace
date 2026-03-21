import { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { SellerSidebar } from './SellerSidebar';
import { Link } from 'react-router-dom';
import { Bell, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SellerProfile } from '@/hooks/useSellerData';

interface SellerLayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  seller: SellerProfile;
}

export const SellerLayout = ({ children, activeTab, onTabChange, seller }: SellerLayoutProps) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <SellerSidebar activeTab={activeTab} onTabChange={onTabChange} seller={seller} />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar */}
          <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <h1 className="text-lg font-semibold capitalize">{activeTab === 'overview' ? 'Dashboard' : activeTab}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" asChild>
                <Link to="/"><Home className="h-4 w-4" /></Link>
              </Button>
              <Button variant="ghost" size="icon">
                <Bell className="h-4 w-4" />
              </Button>
              <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-accent-foreground text-sm font-bold">
                {seller.name.charAt(0)}
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
