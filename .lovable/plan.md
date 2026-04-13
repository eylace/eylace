

## Plan: Guest Order Fix, Guest Tracking, and Flash Sale System

### Investigation Summary

**Guest orders are NOT in the database at all** — there are 0 orders with `user_id = NULL`. The admin-get-orders edge function is working fine (returning 21 orders), but no guest order has ever been successfully saved. The admin panel code is correct; the problem is upstream in the checkout flow.

**Root causes identified:**

1. **Guest order insert may fail silently** — The checkout code correctly sets `user_id: null`, and RLS policies allow `anon` inserts with `user_id IS NULL`. However, the Supabase client may be using `authenticated` role if a stale session exists, or there may be a runtime error in the insert path that's being swallowed. I need to add robust error logging and ensure the anon role path works reliably.

2. **Track Order page only supports order number** — No phone number search exists. Guests need phone-based tracking too.

3. **Flash Sale is non-functional** — The countdown timer on the homepage is hardcoded (5h 32m 47s), the `useProducts` hook doesn't filter expired flash sales, and the seller product form has no flash sale fields.

---

### Part 1: Permanently Fix Guest Orders (5 changes)

**1a. Harden guest order insert in `Checkout.tsx`**
- Add `console.error` + `toast.error` with specific details for every failure path
- Ensure `user_id` field is explicitly omitted (not set to null) for guest orders so it hits the correct RLS policy
- Add a fallback: if the authenticated insert fails with RLS error, retry with the anon key directly

**1b. Add debug logging to processOrder**
- Log the exact payload before insert
- Log RLS role being used
- Ensure orderItems insert errors don't silently fail

**1c. Verify and test via curl**
- Test the guest order insert directly against the database to confirm RLS works

---

### Part 2: Guest Order Tracking by Phone + Order ID (3 changes)

**2a. Update `TrackOrder.tsx`**
- Add a phone number input field alongside the order number input
- Search logic: require BOTH order number AND phone number for security (as per your preference)
- Query: `orders.eq('order_number', orderNumber)` then verify phone matches `guest_phone` or `shipping_address.phone`
- Remove the redirect to `/account` for logged-in users so they can also use public tracking

**2b. Show order number prominently after checkout**
- After guest checkout success, display the order number clearly with a "Copy" button
- Add instruction text: "Save this order number to track your order"

---

### Part 3: Flash Sale System (6 changes)

**3a. Add `flash_sale_starts` column to products table**
- Migration: `ALTER TABLE products ADD COLUMN flash_sale_starts timestamptz DEFAULT NULL`

**3b. Fix `useProducts` hook — filter expired flash sales**
- When `flashSaleOnly: true`, add filter: `flash_sale_ends.gt.now()` (or `flash_sale_ends.is.null`)
- Also filter: `flash_sale_starts.lte.now()` (or `flash_sale_starts.is.null`)

**3c. Fix FlashSaleSection — use real countdown from product data**
- Calculate actual time remaining from the earliest `flash_sale_ends` in the fetched products
- Replace the hardcoded 5h 32m 47s with real data

**3d. Update Admin ProductFormModal**
- When "Flash Sale" toggle is on, show both `flash_sale_starts` and `flash_sale_ends` datetime pickers
- Save both fields to the database

**3e. Update Seller ProductFormModal**
- Add flash sale toggle + start/end date pickers to seller product form
- Sellers can set their own product flash sales

**3f. Auto-expiry behavior**
- The storefront query filter ensures expired flash sales are automatically hidden
- No cron job needed — filtering at query time is sufficient

---

### Files to modify

| File | Changes |
|------|---------|
| `src/pages/Checkout.tsx` | Harden guest insert, improve error handling |
| `src/pages/TrackOrder.tsx` | Add phone search, dual-field lookup |
| `src/hooks/useProducts.ts` | Filter expired flash sales |
| `src/components/home/FlashSaleSection.tsx` | Real countdown from product data |
| `src/components/admin/ProductFormModal.tsx` | Flash sale start date picker |
| `src/components/seller/ProductFormModal.tsx` | Add flash sale fields |
| DB Migration | Add `flash_sale_starts` column |

### Edge functions to redeploy
- None needed — the admin-get-orders function is already working correctly

