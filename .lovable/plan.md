

## Plan: Seller Login Option + Professional Seller Dashboard

### Part 1: Add Seller Login Option to Website

**Header changes** (`src/components/layout/Header.tsx`):
- Add a "Seller Login" link in the user dropdown menu (for logged-in users who are sellers, show "Seller Dashboard" link)
- Add "Seller Login" link in mobile menu
- Use `useSellerCheck` hook to detect if current user is a seller

**Auth page** (`src/pages/Auth.tsx`):
- Add a "Seller Login" tab/link that redirects to `/auth?mode=seller`, same login form but after login redirects to `/seller` instead of `/`

### Part 2: Professional Seller Dashboard Rebuild

Replace the current simple 3-tab layout with a full sidebar-based professional dashboard (similar to the Admin panel pattern) with these modules:

**New Layout** (`src/components/seller/SellerLayout.tsx`):
- Dedicated sidebar navigation (collapsible) with seller branding
- Top bar with seller name, notifications, profile menu
- No site header/footer (dedicated seller experience like admin panel)

**Dashboard Tabs/Pages** (all within `/seller` route using internal tab state):

1. **Dashboard Overview** - KPI cards (revenue, orders, conversion rate, avg order value, pending orders, low stock alerts), quick action buttons
2. **Products Management** - Existing product table enhanced with bulk actions, search/filter, stock alerts, SKU field
3. **Orders Management** - Order list with status filters, order detail view, status update capability, shipping label info
4. **Analytics & Reports** - Existing charts enhanced with date range picker, export to CSV, comparison periods
5. **Finance/Payments** - Earnings summary, commission breakdown, payout history, pending balance
6. **Reviews & Ratings** - View product reviews, respond to reviews, rating trends
7. **Promotions** - Create product-level discounts, participate in flash sales
8. **Store Settings** - Edit store name, logo, description, contact info, shipping policies
9. **Support** - Link to seller support, FAQs, contact admin

**Technical Details:**

- **Files to create:**
  - `src/components/seller/SellerLayout.tsx` - Sidebar + topbar layout
  - `src/components/seller/SellerSidebar.tsx` - Navigation sidebar
  - `src/components/seller/SellerOverview.tsx` - Dashboard home
  - `src/components/seller/SellerOrdersTab.tsx` - Orders management
  - `src/components/seller/SellerFinanceTab.tsx` - Earnings & payouts
  - `src/components/seller/SellerReviewsTab.tsx` - Reviews management
  - `src/components/seller/SellerPromotionsTab.tsx` - Discounts management
  - `src/components/seller/SellerStoreSettings.tsx` - Store profile editor

- **Files to modify:**
  - `src/pages/SellerDashboard.tsx` - Rebuild with SellerLayout, tab-based routing
  - `src/components/layout/Header.tsx` - Add Seller Dashboard/Login link
  - `src/hooks/useSellerData.ts` - Add seller finance/reviews hooks

- **No database changes needed** - Uses existing `sellers`, `products`, `orders`, `order_items`, `product_reviews` tables

- **Existing components reused:** `SellerAnalytics` (enhanced), `ProductFormModal`, Recharts, all UI primitives

