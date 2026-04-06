
## Plan: Stock & Inventory Management System

### Problem
1. Stock is never decremented when orders are placed
2. "5,000+ sold" is hardcoded on product detail page (line 219)
3. No `sold_count` column exists on products table
4. No real-time stock display updates
5. Seller/Admin dashboards show stock but no dedicated inventory management view

### Changes

#### 1. Database Migration
- Add `sold_count` column (integer, default 0) to `products` table
- Create a `decrement_stock_on_order` database function (SECURITY DEFINER) that:
  - Takes an order_id, loops through its `order_items`
  - Decrements `stock` by quantity for each product
  - Increments `sold_count` by quantity for each product
  - Skips if stock is already 0 (prevents negative stock)
- Create a trigger `trg_decrement_stock_after_order_insert` on `order_items` table that fires AFTER INSERT and calls the stock decrement logic per row

#### 2. Checkout Flow (src/pages/Checkout.tsx)
- No code change needed if using a trigger approach — stock will auto-decrement when order_items are inserted
- Add a pre-checkout stock validation: before placing order, verify each item's current stock >= requested quantity; show error if insufficient

#### 3. Product Detail Page (src/pages/ProductDetail.tsx)
- Replace hardcoded "5,000+ sold" with actual `sold_count` from database (via the adapted product)
- Show real-time stock count with color coding (green >10, yellow 1-10, red 0)
- Subscribe to Supabase Realtime on the product row to update stock/sold_count live

#### 4. Product Adapter (src/lib/productAdapter.ts)
- Map `sold_count` from DB product to the adapted Product type

#### 5. Types (src/types/index.ts)
- Add `soldCount` field to Product interface

#### 6. useProducts Hook (src/hooks/useProducts.ts)
- Include `sold_count` in DBProduct interface

#### 7. ProductCard (src/components/products/ProductCard.tsx)
- Show "X sold" badge on cards when soldCount > 0
- Show "Out of Stock" overlay when stock is 0

#### 8. Enable Realtime
- Add products table to `supabase_realtime` publication for live stock updates

### Files to Change
| File | Change |
|------|--------|
| Migration SQL | Add `sold_count`, create trigger for stock decrement |
| `src/types/index.ts` | Add `soldCount` to Product |
| `src/hooks/useProducts.ts` | Add `sold_count` to DBProduct |
| `src/lib/productAdapter.ts` | Map `sold_count` → `soldCount` |
| `src/pages/ProductDetail.tsx` | Real sold count, real-time subscription, stock validation |
| `src/components/products/ProductCard.tsx` | Show sold count badge |
| `src/pages/Checkout.tsx` | Pre-checkout stock validation |
