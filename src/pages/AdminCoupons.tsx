import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminCouponsTab } from '@/components/admin/AdminCouponsTab';

const AdminCoupons = () => (
  <AdminLayout titleKey="admin.title.coupons" descriptionKey="admin.desc.coupons">
    <AdminCouponsTab />
  </AdminLayout>
);

export default AdminCoupons;
