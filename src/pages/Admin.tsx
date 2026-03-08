import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminDashboardOverview } from '@/components/admin/AdminDashboardOverview';

const Admin = () => {
  return (
    <AdminLayout titleKey="admin.dashboard">
      <AdminDashboardOverview />
    </AdminLayout>
  );
};

export default Admin;
