import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminOrdersTab } from '@/components/admin/AdminOrdersTab';

const AdminOrders = () => (
  <AdminLayout title="Orders" description="Manage all customer orders">
    <AdminOrdersTab />
  </AdminLayout>
);

export default AdminOrders;
