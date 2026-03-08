import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminProductFormModal } from '@/components/admin/ProductFormModal';
import { useState } from 'react';

const AdminAddProduct = () => {
  const [open, setOpen] = useState(true);

  return (
    <AdminLayout title="Add New Product" description="Create a new physical product">
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <p>Use the form to add a new product</p>
      </div>
      <AdminProductFormModal open={open} onOpenChange={setOpen} onSaved={() => { window.location.href = '/admin/products'; }} />
    </AdminLayout>
  );
};

export default AdminAddProduct;
