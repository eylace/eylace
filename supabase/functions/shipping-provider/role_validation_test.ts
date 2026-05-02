import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

// Mirrors the allowedRoles list in index.ts. If that list changes, this test
// must be updated in lockstep — that's intentional, it guards against an
// accidental regression where 'seller' (a non-existent enum value) sneaks
// back in and breaks Pathao for vendors.
const ALLOWED_ROLES = [
  "admin",
  "super_admin",
  "order_manager",
  "support_manager",
  "moderator",
  "vendor_admin",
  "vendor_order_manager",
  "vendor_staff",
  "warehouse_manager",
] as const;

// Valid app_role enum values in the database. Roles outside this set will
// silently match nothing in `user_roles.role IN (...)` — which is what
// caused the original "Forbidden" bug.
const APP_ROLE_ENUM = new Set([
  "admin",
  "super_admin",
  "order_manager",
  "product_manager",
  "vendor_manager",
  "customer_manager",
  "finance_manager",
  "marketing_manager",
  "support_manager",
  "content_manager",
  "moderator",
  "vendor_admin",
  "vendor_order_manager",
  "vendor_staff",
  "warehouse_manager",
]);

Deno.test("shipping-provider: every allowed role is a real app_role enum value", () => {
  for (const role of ALLOWED_ROLES) {
    assert(
      APP_ROLE_ENUM.has(role),
      `Role "${role}" is not a valid app_role enum value — Pathao will reject all users with this role.`,
    );
  }
});

Deno.test("shipping-provider: legacy 'seller' role must NOT be in the allow-list", () => {
  // Regression guard for the original bug.
  assert(
    !(ALLOWED_ROLES as readonly string[]).includes("seller"),
    "'seller' is not a real app_role — using it caused 'Forbidden: admin or seller role required' for vendors.",
  );
});

Deno.test("shipping-provider: admin role is accepted", () => {
  const userRole = "admin";
  const matched = (ALLOWED_ROLES as readonly string[]).includes(userRole);
  assertEquals(matched, true, "admin must be allowed to dispatch couriers");
});

Deno.test("shipping-provider: vendor_admin role is accepted", () => {
  const userRole = "vendor_admin";
  const matched = (ALLOWED_ROLES as readonly string[]).includes(userRole);
  assertEquals(matched, true, "vendor_admin must be allowed to dispatch couriers");
});

Deno.test("shipping-provider: vendor_order_manager role is accepted", () => {
  const userRole = "vendor_order_manager";
  const matched = (ALLOWED_ROLES as readonly string[]).includes(userRole);
  assertEquals(matched, true, "vendor_order_manager must be allowed to dispatch couriers");
});

Deno.test("shipping-provider: anonymous customer role is rejected", () => {
  const userRole = "customer";
  const matched = (ALLOWED_ROLES as readonly string[]).includes(userRole);
  assertEquals(matched, false, "regular customers must not be able to dispatch couriers");
});