import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminReviewsTab } from '@/components/admin/AdminReviewsTab';

const AdminReviews = () => (
  <AdminLayout title="Reviews" description="Moderate customer reviews">
    <AdminReviewsTab />
  </AdminLayout>
);

export default AdminReviews;
