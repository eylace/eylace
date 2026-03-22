import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminReturnsTab } from '@/components/admin/AdminReturnsTab';

const AdminReturnsRefunds = () => (
  <AdminLayout titleKey="admin.title.returns" descriptionKey="admin.desc.returns">
    <AdminReturnsTab />
  </AdminLayout>
);

export default AdminReturnsRefunds;
