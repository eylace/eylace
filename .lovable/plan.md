

## Plan: My Orders Navigation, Return Request Improvements & Admin Returns Management

### Summary
1. Redirect "My Orders" links to customer dashboard orders tab
2. Prevent duplicate return requests per item
3. Add return request progress tracking UI
4. Create full admin Return & Refund management page

---

### 1. Redirect "My Orders" to Customer Dashboard

**Files:** `src/components/layout/Header.tsx`

- Change `/orders` links to `/account?tab=orders` (both the dropdown menu link at line ~142 and the header link at line ~180)
- The Account page already has `activeSection` state and an `orders` tab — just need to read `?tab=orders` from URL params

**File:** `src/pages/Account.tsx`

- On mount, read `searchParams.get('tab')` and set `activeSection` accordingly (e.g., if `tab=orders`, set `activeSection` to `'orders'`)

---

### 2. Prevent Duplicate Return Requests

**Files:** `src/pages/Orders.tsx`, `src/components/orders/ReturnRequestModal.tsx`

- In Orders.tsx: The return requests are already fetched per order. Before showing "Request Return" button, check if all items in that order already have a return request. If so, hide the button.
- In ReturnRequestModal: Filter out items that already have a return request (pass `existingReturnItemIds` prop). Disable/hide already-returned items in the selection list.

---

### 3. Return Request Progress Tracking

**File:** `src/pages/Orders.tsx` (existing return request display section, lines ~323-354)

- Replace the simple badge display with a step-based progress timeline showing:
  - **Requested** → **Under Review** → **Approved/Rejected** → **Refunded**
- Map statuses: `pending` = step 1, `approved`/`rejected` = step 3, `picked_up` = step 2.5, `refunded` = step 4
- Show dates for completed steps, current step highlighted

---

### 4. Admin Return & Refund Management

**New file:** `src/pages/AdminReturnsRefunds.tsx`

- Full CRUD page for viewing all return requests from the `return_requests` table
- Features: search, filter by status, view details modal with order/item info
- Admin can update status (approve/reject/refund), add admin notes, edit refund amount
- Delete return requests if needed

**New file:** `src/components/admin/AdminReturnsTab.tsx`

- Table view with columns: Order #, Customer, Item, Reason, Status, Refund Amount, Date
- Status update dropdown, admin notes textarea, save button
- Detail modal showing full return request info + order items

**Edge function update:** Use existing `admin-get-orders` pattern — create `admin-manage-returns` edge function for fetching all return requests (bypassing RLS) and updating them.

**New file:** `supabase/functions/admin-manage-returns/index.ts`

- GET: Fetch all return requests with order & item details using service role
- PUT: Update return request status, admin_notes, refund_amount, resolved_at
- DELETE: Remove return request

**Router & Sidebar updates:**

- `src/App.tsx`: Add route `/admin/returns` → `AdminReturnsRefunds`
- `src/components/admin/AdminSidebar.tsx`: Add "Returns & Refunds" item under Operations section with `RotateCcw` icon
- `src/i18n/translations.ts`: Add translation key for the new menu item

---

### 5. Performance (0.5s target)

The project already has extensive code-splitting (90+ lazy routes), query caching (5min stale, 10min GC), and 25+ database indexes. No additional changes needed — the architecture already targets sub-1s loads. The new admin page will be lazy-loaded following existing patterns.

---

### Database Changes

**Migration:** Add an index on `return_requests.order_id` and `return_requests.status` for faster admin queries.

```sql
CREATE INDEX IF NOT EXISTS idx_return_requests_order_id ON public.return_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_return_requests_status ON public.return_requests(status);
CREATE INDEX IF NOT EXISTS idx_return_requests_user_id ON public.return_requests(user_id);
```

### Files to Create/Edit

| File | Action |
|------|--------|
| `src/components/layout/Header.tsx` | Edit links → `/account?tab=orders` |
| `src/pages/Account.tsx` | Read URL `?tab=` param on mount |
| `src/pages/Orders.tsx` | Hide return button for already-returned items, add progress timeline |
| `src/components/orders/ReturnRequestModal.tsx` | Filter out already-returned items |
| `src/pages/AdminReturnsRefunds.tsx` | Create new admin page |
| `src/components/admin/AdminReturnsTab.tsx` | Create returns management component |
| `supabase/functions/admin-manage-returns/index.ts` | Create edge function |
| `src/components/admin/AdminSidebar.tsx` | Add menu item |
| `src/App.tsx` | Add route + lazy import |
| `src/i18n/translations.ts` | Add translation keys |
| Migration SQL | Add indexes |

