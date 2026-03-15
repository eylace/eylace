

## Flash Deal Product Management System - Plan

### Current State
- `flash_deals` table exists with: title, discount, start_date, end_date, is_active, products (integer count)
- `products` table has `is_flash_sale` and `flash_sale_ends` fields
- No `flash_deal_products` junction table exists -- products can't be linked to specific flash deals
- Current UI only creates/deletes deals with basic info, no product management

### What We Need

#### 1. Database Migration
Create a `flash_deal_products` junction table:
```sql
CREATE TABLE public.flash_deal_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flash_deal_id uuid NOT NULL REFERENCES public.flash_deals(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  deal_price numeric,
  deal_discount numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(flash_deal_id, product_id)
);

ALTER TABLE public.flash_deal_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage flash deal products" ON public.flash_deal_products
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view flash deal products" ON public.flash_deal_products
  FOR SELECT TO public USING (true);
```

#### 2. Rebuild `AdminMarketingFlashDeals.tsx`
Complete rewrite with:

- **Flash Deal Creation/Edit Modal**: Title, discount %, start datetime (`datetime-local` input), end datetime, active toggle
- **Deal Detail View**: Click a deal row to expand/open a detail panel showing:
  - Deal info (title, discount, dates, status)
  - **Product Management Section**:
    - Search/select products from `products` table to add
    - Set per-product deal price or discount override
    - List of added products with remove button
    - Auto-update `flash_deals.products` count and `products.is_flash_sale`/`flash_sale_ends` when products are added/removed
- **Deal List Table**: Title, discount, start/end datetime, product count, active toggle, edit/delete actions
- **Date/Time**: Use `datetime-local` inputs so admin can set exact start and end times (not just dates)

#### 3. Product Sync Logic
When adding a product to a flash deal:
- Insert into `flash_deal_products`
- Update `products` row: set `is_flash_sale = true`, `flash_sale_ends = deal.end_date`
- Update `flash_deals.products` count

When removing:
- Delete from `flash_deal_products`
- Update `products` row: set `is_flash_sale = false`, `flash_sale_ends = null`
- Update count

#### 4. UI Flow
1. Main page shows all flash deals in a table
2. "New Flash Deal" button opens creation dialog
3. Each deal row has: Edit, Manage Products, Delete actions
4. "Manage Products" opens a dialog/panel with product search + added products list

