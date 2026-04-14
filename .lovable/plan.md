

## Website Bug Analysis & Fix Plan

### Bugs Found

**BUG 1 (Critical): `useAdminCheck` uses `.maybeSingle()` — crashes for multi-role admins**
The admin user (652354f5) has both `admin` AND `super_admin` roles. The `.maybeSingle()` call in `useAdminData.ts` line 124 throws a PostgreSQL error when >1 row is returned, potentially locking the admin out of the dashboard.

**Fix**: Change `.maybeSingle()` to `.limit(1)` + array access (as documented in the architecture memory).

---

**BUG 2 (Critical): `products_public` view missing `flash_sale_starts` and `sold_count` columns**
The migration added `flash_sale_starts` to the `products` table, but the `products_public` view was never updated. The `useProducts` hook filters by `flash_sale_starts` on the view — this filter silently fails/is ignored, meaning products with a future start date would still appear.

**Fix**: Recreate the `products_public` view to include `flash_sale_starts` and `sold_count`.

---

**BUG 3 (Medium): 6 expired flash sale products still marked `is_flash_sale = true`**
Products like "Nike Air Max 270", "Apple AirPods Pro", etc. have `flash_sale_ends = 2026-03-01` (over a month ago) but are still `is_flash_sale = true`. The `useProducts` hook does filter these out at query time, but:
- They still appear in admin product lists as "flash sale" items
- They show discounted prices even though the sale ended
- The `ProductCard` may still show flash sale badges

**Fix**: Run a migration to set `is_flash_sale = false` for all products where `flash_sale_ends < NOW()`. This is a one-time cleanup + optionally add a DB trigger or cron to auto-clear.

---

**BUG 4 (Low): `order_tracking_events` RLS blocks guest order tracking**
The `order_tracking_events` table only has an `is_owner_of_order_tracking` SELECT policy that checks `user_id = auth.uid()`. Guest orders have `user_id = NULL`, so tracking events for guest orders can never be fetched — the TrackOrder page will always show an empty timeline for guest orders.

**Fix**: Add a SELECT policy for `anon` and `authenticated` roles that allows viewing tracking events for guest orders (where the parent order has `user_id IS NULL`).

---

**BUG 5 (Low): `order_tracking_events` has no INSERT policy**
Admins cannot insert tracking events because there's no INSERT/UPDATE/DELETE policy. The admin-update-order edge function likely uses service role, but if tracking events are ever added from the client, they'll fail.

**Fix**: Add admin INSERT/UPDATE policies for `order_tracking_events`.

---

### Files to modify

| File / Resource | Change |
|---|---|
| `src/hooks/useAdminData.ts` | Fix `.maybeSingle()` → `.limit(1)` + array access |
| DB Migration | Recreate `products_public` view with `flash_sale_starts`, `sold_count` |
| DB Migration | Set `is_flash_sale = false` where `flash_sale_ends < NOW()` |
| DB Migration | Add RLS policy on `order_tracking_events` for guest order viewing |
| DB Migration | Add admin INSERT/UPDATE policies on `order_tracking_events` |

### Technical Details

- The `products_public` view needs `DROP VIEW IF EXISTS` then `CREATE VIEW` with all existing columns plus `flash_sale_starts` and `sold_count`
- The `useAdminCheck` fix is a 3-line change: replace `.maybeSingle()` with array handling
- Guest tracking events RLS: `EXISTS (SELECT 1 FROM orders WHERE orders.id = order_tracking_events.order_id AND orders.user_id IS NULL)`

