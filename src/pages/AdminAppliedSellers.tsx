import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminSellersTab } from '@/components/admin/AdminSellersTab';

const AdminAppliedSellers = () => (
  <AdminLayout titleKey="admin.sellers.applied" descriptionKey="admin.sellers.appliedDesc">
    <AdminSellersTab />
  </AdminLayout>
);

export default AdminAppliedSellers;
