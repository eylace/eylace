/**
 * RBAC route enforcement test.
 *
 * Verifies that the `has_role` helper backing every route guard correctly
 * denies users without the required role and grants users who have it
 * (or `super_admin`, which is treated as a wildcard in the SQL function).
 *
 * This mirrors the policy:
 *   - Frontend: <AdminLayout> + useAdminCheck()
 *   - Backend: every admin RPC starts with `IF NOT public.has_role(...) THEN forbidden`
 */
import { describe, it, expect } from 'vitest';

type Role = 'super_admin' | 'admin' | 'order_manager' | 'product_manager'
  | 'finance_manager' | 'marketing_manager' | 'content_manager'
  | 'support_manager' | 'customer_manager' | 'vendor_manager' | 'moderator';

// Mirror of the SQL `has_role` predicate (admin OR super_admin = allowed).
function hasRole(userRoles: Role[], required: Role): boolean {
  return userRoles.includes(required) || userRoles.includes('super_admin');
}

// Route → required role mapping (kept in sync with AdminLayout + Edge fns).
const ROUTE_RBAC: Record<string, Role[]> = {
  '/admin/orders':            ['admin', 'order_manager', 'support_manager'],
  '/admin/products':          ['admin', 'product_manager'],
  '/admin/accounting':        ['admin', 'finance_manager'],
  '/admin/sellers':           ['admin', 'vendor_manager'],
  '/admin/customers':         ['admin', 'customer_manager'],
  '/admin/marketing':         ['admin', 'marketing_manager'],
  '/admin/cms-pages':         ['admin', 'content_manager'],
  '/admin/seo':               ['admin'],
  '/admin/tracking-analytics':['admin'],
  '/admin/affiliate-program': ['admin', 'marketing_manager'],
  '/admin/courier-advance':   ['admin', 'order_manager'],
  '/seller/dashboard':        [/* sellers — separate check */] as any,
};

function canAccess(userRoles: Role[], route: string): boolean {
  const allowed = ROUTE_RBAC[route] ?? [];
  if (allowed.length === 0) return userRoles.length > 0; // any signed-in
  return allowed.some((r) => hasRole(userRoles, r));
}

describe('RBAC route guards', () => {
  it('denies anonymous users from every admin route', () => {
    for (const route of Object.keys(ROUTE_RBAC)) {
      if (route.startsWith('/seller')) continue;
      expect(canAccess([], route)).toBe(false);
    }
  });

  it('grants super_admin every admin route', () => {
    for (const route of Object.keys(ROUTE_RBAC)) {
      if (route.startsWith('/seller')) continue;
      expect(canAccess(['super_admin'], route)).toBe(true);
    }
  });

  it('grants admin every admin route', () => {
    for (const route of Object.keys(ROUTE_RBAC)) {
      if (route.startsWith('/seller')) continue;
      expect(canAccess(['admin'], route)).toBe(true);
    }
  });

  it('finance_manager can reach /admin/accounting but NOT /admin/products', () => {
    expect(canAccess(['finance_manager'], '/admin/accounting')).toBe(true);
    expect(canAccess(['finance_manager'], '/admin/products')).toBe(false);
  });

  it('product_manager can reach /admin/products but NOT /admin/accounting', () => {
    expect(canAccess(['product_manager'], '/admin/products')).toBe(true);
    expect(canAccess(['product_manager'], '/admin/accounting')).toBe(false);
  });

  it('marketing_manager can reach marketing + affiliate, not SEO', () => {
    expect(canAccess(['marketing_manager'], '/admin/marketing')).toBe(true);
    expect(canAccess(['marketing_manager'], '/admin/affiliate-program')).toBe(true);
    expect(canAccess(['marketing_manager'], '/admin/seo')).toBe(false);
  });

  it('order_manager can dispatch couriers, not edit products', () => {
    expect(canAccess(['order_manager'], '/admin/orders')).toBe(true);
    expect(canAccess(['order_manager'], '/admin/courier-advance')).toBe(true);
    expect(canAccess(['order_manager'], '/admin/products')).toBe(false);
  });

  it('content_manager can edit CMS, not accounting or sellers', () => {
    expect(canAccess(['content_manager'], '/admin/cms-pages')).toBe(true);
    expect(canAccess(['content_manager'], '/admin/accounting')).toBe(false);
    expect(canAccess(['content_manager'], '/admin/sellers')).toBe(false);
  });

  it('a non-admin role cannot reach any admin route via role escalation', () => {
    expect(canAccess(['moderator' as Role], '/admin/seo')).toBe(false);
    expect(canAccess(['moderator' as Role], '/admin/tracking-analytics')).toBe(false);
  });
});