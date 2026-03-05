import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminDashboardOverview } from '@/components/admin/AdminDashboardOverview';

const Admin = () => {
  return (
    <AdminLayout>
      <AdminDashboardOverview />
    </AdminLayout>
  );
};

export default Admin;
