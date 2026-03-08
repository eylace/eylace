import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminReviewsTab } from '@/components/admin/AdminReviewsTab';

const AdminReviews = () => (
  <AdminLayout titleKey="admin.title.reviews" descriptionKey="admin.desc.reviews">
    <AdminReviewsTab />
  </AdminLayout>
);

export default AdminReviews;
