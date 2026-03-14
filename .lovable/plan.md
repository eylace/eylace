

## Plan: Menu Manager, Banner Ads & Hero Banner Management

Three features to build:

### 1. Frontend Menu Manager (Admin Dashboard)
**What**: Admin can add/edit/remove menu items in the frontend navigation bar. Each item supports: label, URL, type (link / dropdown / mega menu), children (sub-menu items). Changes save to `system_settings` (key: `menu_config_v1`) and instantly reflect on the frontend.

**Implementation**:
- **New admin page** `src/pages/AdminMenuManager.tsx` — drag-friendly list UI with add/edit/remove for menu items. Each item has: `label`, `url`, `type` (link|dropdown|mega), `children[]`, `isActive`, `sortOrder`.
- **Update `AdminSidebar.tsx`** — add "Menu Manager" link under Website Setup section.
- **Update `App.tsx`** — add route `/admin/menu-manager`.
- **New hook** `src/hooks/useMenuConfig.ts` — fetches menu config from `system_settings`, with cache/invalidation pattern matching `useWebsiteSetup`.
- **Update `Header.tsx`** — replace the hardcoded nav bar (lines 194-210) with dynamic menu items from `useMenuConfig`. Render dropdowns for `dropdown` type, mega menu panels for `mega` type, and plain links for `link` type.

### 2. Marketing Ads Section (Banner Ads)
**What**: Admin can create product/category banner ads that display on the storefront when enabled.

**Implementation**:
- **New admin page** `src/pages/AdminMarketingAds.tsx` — CRUD for ads: title, image URL, link URL, placement (homepage/sidebar/category), isActive toggle, start/end dates.
- **Update `AdminSidebar.tsx`** — add "Ads" item under Marketing section.
- **Update `App.tsx`** — add route `/admin/marketing/ads`.
- Ads stored in `system_settings` (key: `marketing_ads_v1`).
- **New component** `src/components/home/BannerAdsSection.tsx` — reads ads config and renders active banner ads on homepage.
- **Update `Index.tsx`** — include `BannerAdsSection` component.

### 3. Hero Banner Manager (Homepage Settings)
**What**: Admin can add/remove unlimited hero banners (currently hardcoded to 3). Each banner has: title, subtitle, description, CTA text, CTA link, background image/gradient, sort order.

**Implementation**:
- **Update `AdminWebsiteSetupPage.tsx`** — add a "Hero Banners" sub-section inside the "Homepage Settings" tab. Full CRUD: add new banner, edit existing, delete, reorder. Fields: title, subtitle, description, CTA text, link, image URL, gradient color.
- **Add `heroBanners` array** to the `WebsiteSetupState` interface and `useWebsiteSetup` hook defaults.
- **Update `HeroSection.tsx`** — replace hardcoded `heroSlides` array with dynamic data from `useWebsiteSetup().heroBanners`. Fall back to current hardcoded slides if empty.

### Files to create:
- `src/pages/AdminMenuManager.tsx`
- `src/pages/AdminMarketingAds.tsx`
- `src/hooks/useMenuConfig.ts`
- `src/components/home/BannerAdsSection.tsx`

### Files to edit:
- `src/App.tsx` (2 new routes)
- `src/components/admin/AdminSidebar.tsx` (2 new menu items)
- `src/components/layout/Header.tsx` (dynamic menu rendering)
- `src/pages/AdminWebsiteSetupPage.tsx` (hero banner CRUD in homepage-settings tab)
- `src/components/home/HeroSection.tsx` (dynamic banners from DB)
- `src/hooks/useWebsiteSetup.ts` (add `heroBanners` to interface/defaults)
- `src/pages/Index.tsx` (add BannerAdsSection)
- `src/i18n/translations.ts` (new keys)

### No database migrations needed
All data stored in existing `system_settings` table as JSONB.

