/**
 * Granular accounting permission keys & helpers.
 * Permissions are stored in `system_settings.role_permissions` (per-role)
 * and `system_settings.user_permission_overrides` (per-user, optional grants on top of role).
 */
import { supabase } from '@/integrations/supabase/client';

export const ACCOUNTING_PERMISSIONS = [
  { key: 'accounting.overview', label: 'View Overview', description: 'Financial dashboard summary' },
  { key: 'accounting.accounts.view', label: 'View Chart of Accounts', description: 'Browse account ledger structure' },
  { key: 'accounting.accounts.manage', label: 'Manage Chart of Accounts', description: 'Create / edit / delete accounts' },
  { key: 'accounting.transactions.view', label: 'View Transactions', description: 'Browse journal entries' },
  { key: 'accounting.transactions.manage', label: 'Manage Transactions', description: 'Post / edit / delete journal entries' },
  { key: 'accounting.invoices.view', label: 'View Invoices', description: 'Browse customer invoices' },
  { key: 'accounting.invoices.manage', label: 'Manage Invoices', description: 'Create / edit invoices & payments' },
  { key: 'accounting.bills.view', label: 'View Bills', description: 'Browse supplier bills' },
  { key: 'accounting.bills.manage', label: 'Manage Bills', description: 'Create / edit bills & payments' },
  { key: 'accounting.reports.view', label: 'View Reports', description: 'P&L, Balance Sheet, Cash Flow' },
  { key: 'accounting.reports.export', label: 'Export Reports', description: 'Download CSV / PDF' },
  { key: 'accounting.settings', label: 'Manage Settings', description: 'Auto-sync configuration & sync logs' },
] as const;

export type AccountingPermissionKey = typeof ACCOUNTING_PERMISSIONS[number]['key'];

export const ALL_ACCOUNTING_KEYS: AccountingPermissionKey[] = ACCOUNTING_PERMISSIONS.map(p => p.key);

/** Roles that always get full accounting access regardless of stored permissions. */
const FULL_ACCESS_ROLES = new Set(['super_admin', 'admin']);

/** Roles that get the default finance bundle when no stored config is present. */
const FINANCE_DEFAULT_KEYS: AccountingPermissionKey[] = [
  'accounting.overview',
  'accounting.accounts.view',
  'accounting.transactions.view',
  'accounting.transactions.manage',
  'accounting.invoices.view',
  'accounting.invoices.manage',
  'accounting.bills.view',
  'accounting.bills.manage',
  'accounting.reports.view',
  'accounting.reports.export',
];

export interface ResolvedAccountingPermissions {
  granted: Set<string>;
  hasFullAccess: boolean;
}

export const getDefaultAccountingPermissionsForRole = (role: string | null | undefined): string[] => {
  if (!role) return [];
  if (FULL_ACCESS_ROLES.has(role)) return [...ALL_ACCOUNTING_KEYS];
  if (role === 'finance_manager') return [...FINANCE_DEFAULT_KEYS];
  return [];
};

export const resolveAccountingPermissions = async (
  userId: string | null | undefined,
  roles: string[],
): Promise<ResolvedAccountingPermissions> => {
  const granted = new Set<string>();
  const hasFullAccess = roles.some(r => FULL_ACCESS_ROLES.has(r));
  if (hasFullAccess) {
    ALL_ACCOUNTING_KEYS.forEach(k => granted.add(k));
    return { granted, hasFullAccess };
  }

  // 1. Role-level permissions from system_settings
  const { data: rolePermsRow } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'role_permissions')
    .maybeSingle();
  const rolePerms = (rolePermsRow?.value as Record<string, string[]> | null) || null;

  for (const role of roles) {
    const stored = rolePerms?.[role];
    if (stored && Array.isArray(stored)) {
      stored.forEach(p => { if (p.startsWith('accounting.')) granted.add(p); });
    } else {
      getDefaultAccountingPermissionsForRole(role).forEach(p => granted.add(p));
    }
  }

  // 2. Per-user overrides (additive grants only)
  if (userId) {
    const { data: overridesRow } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'user_permission_overrides')
      .maybeSingle();
    const overrides = (overridesRow?.value as Record<string, string[]> | null) || null;
    overrides?.[userId]?.forEach(p => { if (p.startsWith('accounting.')) granted.add(p); });
  }

  return { granted, hasFullAccess };
};

export const can = (perms: ResolvedAccountingPermissions, key: AccountingPermissionKey): boolean =>
  perms.hasFullAccess || perms.granted.has(key);
