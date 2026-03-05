import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminSellersTab } from '@/components/admin/AdminSellersTab';

const AdminSellers = () => (
  <AdminLayout title="Sellers" description="Manage seller applications and profiles">
    <AdminSellersTab />
  </AdminLayout>
);

export default AdminSellers;
