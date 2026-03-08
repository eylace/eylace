

# Preorder Module — Full Admin Section

## Overview
A complete **Preorder** collapsible section in the admin sidebar with 11 sub-pages, backed by new database tables with proper RLS policies.

## Database Schema (Migration)

### New Tables

1. **preorder_products** — Products available for preorder
   - `id`, `product_id` (ref products), `preorder_price`, `advance_amount`, `advance_type` (percentage/fixed), `estimated_delivery`, `max_quantity`, `status` (active/paused/ended), `created_at`, `updated_at`

2. **preorder_orders** — Orders placed as preorders
   - `id`, `order_number`, `user_id`, `preorder_product_id` (ref preorder_products), `quantity`, `advance_paid`, `remaining_amount`, `total`, `status` (pending/confirmed/paid/shipped/delivered/cancelled), `shipping_address` (jsonb), `payment_method`, `created_at`, `updated_at`

3. **preorder_commissions** — Commission history for sellers
   - `id`, `preorder_order_id`, `seller_id`, `commission_rate`, `commission_amount`, `status` (pending/paid), `paid_at`, `created_at`

4. **preorder_settings** — Key-value settings for preorder module
   - `id`, `key` (text unique), `value` (jsonb), `updated_at`

5. **preorder_conversations** — Buyer-seller conversations on preorder products
   - `id`, `preorder_product_id`, `user_id`, `seller_id`, `message`, `sender_type` (buyer/seller), `created_at`

6. **preorder_queries** — Product queries/questions
   - `id`, `preorder_product_id`, `user_id`, `question`, `answer`, `status` (pending/answered), `created_at`, `answered_at`

7. **preorder_reviews** — Reviews specific to preorder products
   - `id`, `preorder_product_id`, `user_id`, `rating`, `title`, `content`, `images` (text[]), `created_at`

8. **preorder_faqs** — FAQ entries for the preorder system
   - `id`, `question`, `answer`, `sort_order`, `is_active`, `created_at`

9. **preorder_notification_types** — Notification type configuration
   - `id`, `name`, `slug`, `description`, `email_enabled`, `sms_enabled`, `push_enabled`, `template` (text), `is_active`, `created_at`

### RLS Policies
- All tables: Admin full access via `has_role(auth.uid(), 'admin')`
- Public SELECT on faqs, notification_types
- User-scoped INSERT/SELECT on orders, conversations, queries, reviews

## New Files

### Pages (11 files)
| File | Route | Description |
|------|-------|-------------|
| `AdminPreorderDashboard.tsx` | `/admin/preorder` | KPI cards (total preorders, revenue, pending), charts |
| `AdminPreorderAddProduct.tsx` | `/admin/preorder/add` | Form to create preorder product (select product, set advance %, delivery date) |
| `AdminPreorderProducts.tsx` | `/admin/preorder/products` | Table of all preorder products with status toggle |
| `AdminPreorderOrders.tsx` | `/admin/preorder/orders` | Preorder orders list with status management |
| `AdminPreorderCommissions.tsx` | `/admin/preorder/commissions` | Commission history table with pay/pending filters |
| `AdminPreorderSettings.tsx` | `/admin/preorder/settings` | Global preorder settings (default advance %, auto-confirm, etc.) |
| `AdminPreorderConversations.tsx` | `/admin/preorder/conversations` | View buyer-seller conversations |
| `AdminPreorderQueries.tsx` | `/admin/preorder/queries` | Product queries with answer interface |
| `AdminPreorderReviews.tsx` | `/admin/preorder/reviews` | Preorder product reviews moderation |
| `AdminPreorderFaqs.tsx` | `/admin/preorder/faqs` | CRUD for preorder FAQs |
| `AdminPreorderNotificationTypes.tsx` | `/admin/preorder/notifications` | Configure notification types (email/SMS/push toggles) |

### Modified Files
| File | Change |
|------|--------|
| `AdminSidebar.tsx` | Add collapsible "Preorder" section with all 11 nav items |
| `App.tsx` | Add 11 new routes |
| `translations.ts` | Add ~30 new translation keys for preorder section |

## Sidebar Structure
```text
▼ PREORDER
  ├── Dashboard
  ├── Add New Preorder Product
  ├── Preorder Products
  ├── Orders (Preorder)
  ├── Commission History
  ├── Settings
  ├── Product Conversations
  ├── Product Queries
  ├── Product Reviews
  ├── FAQs
  └── Notification Types
```

## Each Page Pattern
Every page follows existing admin pattern:
- Wrapped in `<AdminLayout>`
- Uses shadcn `Card`, `Table`, `Dialog`, `Badge`, `Button`
- Full CRUD with Supabase queries
- Loading states with `Loader2`
- Toast notifications on success/error
- Search/filter capabilities

## Implementation Order
1. Database migration (all 9 tables + RLS)
2. Sidebar + Routes + Translations
3. Dashboard page (KPIs + charts)
4. Preorder Products (add + list)
5. Preorder Orders
6. Commissions, Settings, Conversations, Queries, Reviews, FAQs, Notification Types

