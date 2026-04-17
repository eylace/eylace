
## Plan: Cost Tracking + Comprehensive Profit Dashboard

### Problem
1. **AdminAddProduct.tsx** (the actual `/admin/add-product` page used via "Add New") has no "Cost per item" field in the Price & Stock tab.
2. Dashboard overview is missing profit-related cards: Net Profit, Gross Profit, Sold COGS (cost of goods sold), Purchase Cost (current stock value), and Courier Expense.

### Part 1 — Add "Cost per item" to AdminAddProduct (Price & Stock tab)

**File:** `src/pages/AdminAddProduct.tsx`
- Add `cost_per_item: ''` to `ProductFormState` interface and `defaultForm`.
- Load `cost_per_item` from product on edit.
- Include `cost_per_item` in the save payload (`parseFloat` or `null`).
- Add a 5th input in the Pricing grid (change `md:grid-cols-4` → `md:grid-cols-5`) labeled **"Cost per item"** with helper text *"Your purchase cost — used for profit calculation"*.

### Part 2 — Persist cost_per_item into order_items at checkout
**File:** `supabase/functions/checkout-create-order/index.ts`
- When inserting order items, fetch `cost_per_item` from the product row alongside price and copy it into `order_items.cost_per_item` so historical profit calculations are accurate even if the product cost later changes.

### Part 3 — Enrich admin-get-orders to include cost_per_item
**File:** `supabase/functions/admin-get-orders/index.ts`
- Ensure the `items` array returned to the dashboard includes `cost_per_item` (already in DB after the previous migration, just need to select it).

### Part 4 — Comprehensive Profit Dashboard

**File:** `src/components/admin/AdminDashboardOverview.tsx`

Replace the current 6-card grid with a richer KPI section organised in two rows:

**Row 1 — Last 30 Days performance** (3 large cards, with date range subtitle):
| Card | Formula |
|------|---------|
| **Total Profit (Last 30 Days)** | Σ (item.price − item.cost_per_item) × qty for delivered orders in last 30d |
| **Total Revenue (Last 30 Days)** | Σ order.total for delivered orders in last 30d |
| **Total Sales (Last 30 Days)** | Σ order.total for non-cancelled orders in last 30d |

**Row 2 — All-Time financial breakdown** (3 cards):
| Card | Formula | Source |
|------|---------|--------|
| **Purchase Cost (All Time)** | Σ product.cost_per_item × product.stock | `products` table — total base value of current inventory |
| **Sold COGS (All Time)** | Σ item.cost_per_item × qty for delivered orders | order_items |
| **Courier Expense (All Time)** | Σ order.shipping for delivered orders | orders.shipping |

**Row 3 — Operational metrics** (existing 4 cards kept): Customers, Products, Orders (total), Pending.

Add a new query to fetch products with `cost_per_item` and `stock` to compute Purchase Cost. Keep all existing charts (Revenue Overview, Order Status, Daily Report, etc.) below unchanged.

### Files Modified
1. `src/pages/AdminAddProduct.tsx` — add cost_per_item form field
2. `supabase/functions/checkout-create-order/index.ts` — copy cost into order_items
3. `supabase/functions/admin-get-orders/index.ts` — include cost_per_item in items
4. `src/components/admin/AdminDashboardOverview.tsx` — new profit/expense KPI cards

No new database migrations required (cost_per_item columns already exist on products and order_items).
