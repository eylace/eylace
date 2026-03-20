import { AdminLayout } from '@/components/admin/AdminLayout';
import { DashboardIncompleteOrders } from '@/components/admin/DashboardIncompleteOrders';

const AdminIncompleteOrders = () => {
  return (
    <AdminLayout titleKey="admin.incomplete.title">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Incomplete Orders</h1>
          <p className="text-muted-foreground text-sm">ইনকমপ্লিট অর্ডারগুলো ট্র্যাক করুন এবং ফলো-আপ করুন</p>
        </div>
        <DashboardIncompleteOrders />
      </div>
    </AdminLayout>
  );
};

export default AdminIncompleteOrders;
