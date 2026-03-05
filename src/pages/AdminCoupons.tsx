import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminCouponsTab } from '@/components/admin/AdminCouponsTab';

const AdminCoupons = () => (
  <AdminLayout title="Coupons" description="Create and manage discount coupons">
    <AdminCouponsTab />
  </AdminLayout>
);

export default AdminCoupons;
