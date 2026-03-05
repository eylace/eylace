import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Construction } from 'lucide-react';

interface ComingSoonPageProps {
  title: string;
  description: string;
  icon?: string;
}

const ComingSoonContent = ({ title, description }: ComingSoonPageProps) => (
  <Card className="border border-border">
    <CardContent className="py-16 text-center">
      <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
        <Construction className="h-8 w-8 text-accent" />
      </div>
      <h2 className="text-xl font-bold text-foreground mb-2">{title}</h2>
      <p className="text-muted-foreground max-w-md mx-auto">{description}</p>
    </CardContent>
  </Card>
);

// Categories Management - moved to AdminCategories.tsx

// Courier Management - moved to AdminCouriers.tsx

// Fraud Detection
export const AdminFraud = () => (
  <AdminLayout title="Fraud Detection" description="Monitor suspicious activities">
    <ComingSoonContent title="Fraud Detection" description="AI-powered fraud detection with customer behavior analysis coming soon." />
  </AdminLayout>
);

// Transactions
export const AdminTransactions = () => (
  <AdminLayout title="Transactions" description="View all payment transactions">
    <ComingSoonContent title="Transaction History" description="Complete payment transaction logs and refund management coming soon." />
  </AdminLayout>
);

// Marketing
export const AdminMarketing = () => (
  <AdminLayout title="Marketing" description="Manage campaigns and promotions">
    <ComingSoonContent title="Marketing Hub" description="Email campaigns, push notifications, and promotional banners coming soon." />
  </AdminLayout>
);

// Reports
export const AdminReports = () => (
  <AdminLayout title="Reports" description="Detailed analytics and reports">
    <ComingSoonContent title="Reports & Analytics" description="Comprehensive sales reports, customer analytics, and export functionality coming soon." />
  </AdminLayout>
);

// Media
export const AdminMedia = () => (
  <AdminLayout title="Media Gallery" description="Manage uploaded images and files">
    <ComingSoonContent title="Media Gallery" description="Centralized media management with bulk upload and organization coming soon." />
  </AdminLayout>
);

// Notifications
export const AdminNotifications = () => (
  <AdminLayout title="Notifications" description="Manage system notifications">
    <ComingSoonContent title="Notification Center" description="Configure automated notifications for orders, promotions, and system events coming soon." />
  </AdminLayout>
);

// Settings
export const AdminSettings = () => (
  <AdminLayout title="Settings" description="Configure your store settings">
    <ComingSoonContent title="System Settings" description="Store configuration, payment gateways, and global settings coming soon." />
  </AdminLayout>
);

// Pages
export const AdminPages = () => (
  <AdminLayout title="Pages" description="Manage static pages">
    <ComingSoonContent title="CMS Pages" description="Create and edit static pages like About, Privacy Policy, Terms of Service coming soon." />
  </AdminLayout>
);

// SEO
export const AdminSEO = () => (
  <AdminLayout title="SEO & Analytics" description="Search engine optimization">
    <ComingSoonContent title="SEO & Analytics" description="Meta tags management, sitemap configuration, and Google Analytics integration coming soon." />
  </AdminLayout>
);
