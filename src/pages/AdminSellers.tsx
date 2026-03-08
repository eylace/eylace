import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminSellersTab } from '@/components/admin/AdminSellersTab';

const AdminSellers = () => (
  <AdminLayout titleKey="admin.title.sellers" descriptionKey="admin.desc.sellers">
    <AdminSellersTab />
  </AdminLayout>
);

export default AdminSellers;
