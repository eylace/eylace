import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminOrdersTab } from '@/components/admin/AdminOrdersTab';

const AdminOrders = () => (
  <AdminLayout titleKey="admin.title.orders" descriptionKey="admin.desc.orders">
    <AdminOrdersTab />
  </AdminLayout>
);

export default AdminOrders;
