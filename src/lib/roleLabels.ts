export const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  order_manager: 'Order Manager',
  product_manager: 'Product Manager',
  vendor_manager: 'Vendor Manager',
  customer_manager: 'Customer Manager',
  finance_manager: 'Finance Manager',
  marketing_manager: 'Marketing Manager',
  support_manager: 'Support Manager',
  content_manager: 'Content Manager',
  moderator: 'Moderator',
};

export const formatRoleLabel = (role?: string | null) => {
  if (!role) return 'Unassigned';
  return ROLE_LABELS[role] || role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};
