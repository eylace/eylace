

# Complete Bilingual (EN/BN) Translation Plan

## Problem
The app has partial i18n coverage. Many components — especially newer admin dashboard features (DashboardFeatureCards, DashboardDailyReport, DashboardIncompleteOrders), frontend pages (Wishlist, Checkout, ProductDetail, Account, Search, Orders, SellerDashboard, Settings), and various admin sub-pages — still use hardcoded English or Bangla strings instead of the `t()` translation function.

## Scope of Work

### 1. Expand `src/i18n/translations.ts` (~200+ new keys)

Add translation keys for all missing text across these areas:

**Frontend pages:**
- Wishlist page (sign in prompt, empty state, header)
- Checkout page (empty cart, "Checkout" title, "Back to Cart", order success, countdown text)
- ProductDetail page (Add to Cart, Buy Now, product info labels, tabs like Description/Reviews/Q&A, shipping info)
- Account page (profile tabs, form labels, save/edit buttons, password change, address management)
- Orders page (order history, tracking, statuses)
- Search/Filters (filter labels, sort options, result counts)
- Cart components (CartItem, CartSummary labels)
- Settings page
- SellerDashboard & SellerRegistration

**Admin dashboard components:**
- `DashboardFeatureCards` — all 10 feature labels + descriptions + "পাওয়ার ফিচারস" / "Power Features", badge "All Active"/"সব সক্রিয়"
- `DashboardDailyReport` — column headers (তারিখ/Date, মোট অর্ডার/Total Orders, etc.), "দিন"/"days" button text
- `DashboardIncompleteOrders` — all inline Bangla text (কল, কন্ট্যাক্টেড, ডিলিট, কার্ট আইটেম, শিপিং অ্যাড্রেস, etc.)

**Admin sub-pages with hardcoded text:**
- Preorder pages, Marketing sub-pages (Popup, Newsletter, Bulk SMS, etc.)
- WebsiteSetupPage tab triggers
- AdminUserRoles (new role hierarchy UI)
- Various settings tabs

### 2. Update Components to Use `t()` 

For each file with hardcoded text:
- Import `useLanguage` 
- Replace every static string with `t('key.name')`
- Handle components that currently only have Bangla hardcoded (like DashboardFeatureCards, DashboardIncompleteOrders) — add English equivalents

**Key files to update (estimated 30-40 files):**

| Area | Files |
|------|-------|
| Frontend Core | Wishlist, Checkout, ProductDetail, Account, Orders, Search, Settings, SellerDashboard, SellerRegistration |
| Frontend Components | CartItem, CartSummary, ShippingForm, PaymentMethods, OrderSummary, PromoCodeInput, SearchFilters, SearchModal, ProductCard, ReviewsSection, QuantitySelector, CompareBar/Modal, NotificationBell |
| Admin Dashboard | DashboardFeatureCards, DashboardDailyReport, DashboardIncompleteOrders, AdminDashboardOverview |
| Admin Pages | ~15 admin sub-pages (Preorder*, Marketing*, WebsiteSetup, UserRoles, etc.) |

### 3. Default Language = English

The `LanguageContext` already defaults to `'en'` from localStorage, which is correct. No changes needed here.

## Implementation Strategy

Due to the large number of files, this will be done in **batches**:

1. **Batch 1**: Add all ~200+ translation keys to `translations.ts`
2. **Batch 2**: Update frontend pages (Wishlist, Checkout, ProductDetail, Account, Orders, Search)
3. **Batch 3**: Update frontend components (Cart, Shipping, Payment, Filters, ProductCard)
4. **Batch 4**: Update admin dashboard components (FeatureCards, DailyReport, IncompleteOrders)
5. **Batch 5**: Update remaining admin sub-pages

No database or backend changes needed — this is purely a frontend translation effort.

