# Complete SEO Optimization Plan — Eylace

Domain: `https://eylace.lovable.app` · Stack: React + Vite + react-router-dom + react-helmet-async

---

## 1. Metadata (per-route titles, descriptions, OG/Twitter)

**Goal:** Every public route ships unique, keyword-targeted title (≤60 chars) + description (≤160 chars) + canonical + OG/Twitter tags.

- Keep sitewide defaults in `index.html` (already done: brand title, description, OG image, Organization + WebSite JSON-LD).
- Use the existing `SeoHead` component on every public route. Currently applied: `/`, `/categories`, `/category/:slug`, `/contact`. **Missing:** add to:
  - `Deals`, `FlashSale`, `BestSellers`, `NewArrivals`, `TrendingNow`, `Blog`, `Search`, `AboutUs`, `FAQ`, `HelpCenter`, `ShippingInfo`, `ReturnsRefunds`, `TrackOrder`, `PrivacyPolicy`, `TermsConditions`, `CookiePolicy`, `SellerCenter`, `SellerRegistration`, `SellerPolicies`, `SellerSupport`, `DeliveryPartner`, `AffiliateProgram`, `AdvertiseWithUs`, `Careers`, `CmsPage`, `Sitemap`, `ProductDetail`, `Auth`.
- Title pattern: `{Page} — Eylace | {benefit/keyword}`. Description leads with user benefit + Bangladesh keyword.
- Remove sitewide `<link rel="canonical">` from `index.html` (none currently, good) — keep canonical per-route via `SeoHead`.

## 2. Headings (semantic hierarchy)

- One `<h1>` per route. Currently `Index.tsx` uses `sr-only h1` ✓. Audit and ensure every page has exactly one visible or sr-only `<h1>` matching its title intent.
- Fix skipped levels: `h1 → h2 → h3` with no jumps. Audit candidates: `ProductDetail`, `Account`, `AdminSettings` (admin not indexed, skip).
- Convert decorative bold text used as pseudo-headings (e.g. section labels in `HeroSection`, `FeaturedProducts`) to `<h2>`/`<h3>` where they represent real sections.

## 3. Sitemap

- Already have static `public/sitemap.xml` + `scripts/generate-sitemap.ts` with `prebuild` hook.
- **Enhance generator to fetch dynamic rows** (already partially) and:
  - Add `predev` hook (matches knowledge guide) alongside `prebuild`.
  - Include all active products (`/product/:slug`), all categories (`/category/:slug`), all published blog posts (`/blog/:slug`), all active CMS pages.
  - Emit `<lastmod>` from `updated_at` for each dynamic row.
  - Cap at 50k URLs; split into `sitemap-products.xml`, `sitemap-categories.xml`, `sitemap-blog.xml`, `sitemap-static.xml`, with `sitemap.xml` as index.
- Exclude private/auth routes from sitemap: `/orders`, `/account`, `/settings`, `/wishlist`, `/cart`, `/checkout`, `/auth`. (Currently incorrectly included — remove.)

## 4. robots.txt

- Current file is correct in spirit. Add explicit `Disallow:` for non-indexable surfaces:
  ```
  User-agent: *
  Allow: /
  Disallow: /admin
  Disallow: /admin/*
  Disallow: /auth
  Disallow: /checkout
  Disallow: /cart
  Disallow: /account
  Disallow: /orders
  Disallow: /settings
  Disallow: /wishlist
  Disallow: /seller-dashboard
  Sitemap: https://eylace.lovable.app/sitemap.xml
  ```

## 5. Structured Data (JSON-LD)

Sitewide (in `index.html`): Organization + WebSite + SearchAction ✓ present.

Add per-route via `SeoHead`:
- **ProductDetail** → `Product` schema with `name`, `image[]`, `description`, `sku`, `brand`, `aggregateRating`, `review[]`, `offers` (price, priceCurrency=BDT, availability, url, priceValidUntil).
- **Category / Categories** → `BreadcrumbList` ✓ + `ItemList` of products.
- **Blog list** → `Blog`; **Blog post** → `Article` with `headline`, `image`, `datePublished`, `dateModified`, `author`.
- **FAQ** → `FAQPage` with each Q/A.
- **ContactUs** → `LocalBusiness` ✓ already present.
- **AboutUs** → `AboutPage`.
- All non-home routes → `BreadcrumbList`.

## 6. Performance (Core Web Vitals)

- **LCP**: Preload hero image on `/` with `<link rel="preload" as="image" href="..." fetchpriority="high">` in `index.html`. Mark hero `<img>` with `fetchpriority="high"` and `loading="eager"`. All other images `loading="lazy"` + `decoding="async"`.
- **CLS**: Set explicit `width`/`height` (or `aspect-ratio`) on every `<img>` in `ProductCard`, `ImageGallery`, banners, category icons.
- **INP**: Debounce search input (`SearchModal`, `useProductSearch`). Wrap heavy filter recomputes in `useTransition`.
- **Bundle**: Lazy-load admin routes via `React.lazy` (admin tree is huge — ~100 admin pages bundled today). Code-split `AdminAIAnalyzer`, charts (`recharts`), TipTap editor, PDF generator.
- **Images**: Adopt `vite-imagetools` for bundled hero/banners; serve WebP/AVIF. Pipe Supabase Storage images through Supabase's `?width=` transform for responsive `srcset`.
- **Fonts**: Inter is self-hosted (good). Dynamic Google Fonts loader in `Layout.tsx` should add `&display=swap` (already ✓) and `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`.
- **Third-party scripts**: GTM/Pixel/GA4 injected via `TrackingScriptInjector` — confirm all use `async`/`defer` and load after `requestIdleCallback`.
- **Preconnect**: Supabase ✓. Add image CDN if used.

## 7. Accessibility (SEO-adjacent)

- Audit all icon-only buttons for `aria-label` (Header partially ✓; check `BackToTop`, `NotificationBell`, cart/quantity steppers, gallery prev/next, mobile menu toggle).
- Form labels: ensure every `Input`/`Select`/`Textarea` is paired with `<Label htmlFor>` or `aria-label`. Audit `Checkout`, `Auth`, `SellerRegistration`, `WriteReviewModal`.
- Color contrast: verify accent orange on white meets WCAG AA (4.5:1) for body text; use darker variant for small text if needed.
- Focus-visible rings on all interactive elements (Tailwind `focus-visible:ring-2`).
- Replace `h-screen` with `h-dvh` on mobile full-height layouts.
- `lang="en"` on `<html>` ✓. Add `lang="bn"` swap when Bangla active via `LanguageContext`.
- Alt text: every product/category image must have descriptive `alt`. Decorative images → `alt=""`.

## 8. URLs

- Use lowercase, hyphenated, descriptive slugs: `/product/{slug}`, `/category/{slug}`, `/blog/{slug}` ✓ already.
- Avoid query-string-only pages for indexable content. `/search?q=...` should carry `noindex` (search result pages).
- Redirect trailing slashes consistently (pick no trailing slash) — handle in router or via meta canonical.
- Avoid duplicate routes; consolidate any `/products/:id` vs `/product/:slug` patterns.

## 9. Canonical Tags

- `SeoHead` emits `<link rel="canonical">` per route ✓.
- ProductDetail canonical = `/product/{slug}` (never include query strings like `?ref=`, `?utm_*`).
- Category pagination: page 1 = `/category/foo`, page 2+ = `/category/foo?page=2` with self-canonical + `rel="prev"`/`rel="next"` hints.
- Search results, filter combinations → `<meta name="robots" content="noindex,follow">`.
- Account, cart, checkout, admin → `noindex,nofollow`.

## 10. Image alt text

- Audit all `<img>` for meaningful `alt`:
  - Product images: `{product name} — {variant if any}`.
  - Category icons: category name.
  - Banner images: descriptive of offer.
  - Logo: `Eylace logo` ✓.
  - Decorative dividers, background patterns: `alt=""` + `aria-hidden="true"`.
- Files to audit: `ProductCard`, `ImageGallery`, `HeroSection`, `PromoBanners`, `BannerAdsSection`, `CategoriesSection`, `Footer` payment/app badges.

## 11. Lazy loading

- Native `loading="lazy"` + `decoding="async"` on all below-the-fold `<img>`.
- Hero/LCP image: `loading="eager"` + `fetchpriority="high"`.
- Route-level: `React.lazy()` + `<Suspense>` for non-home, especially admin tree, `AdminAIAnalyzer`, TipTap, charts, PDF.
- Use `IntersectionObserver` for heavy below-fold sections (e.g. `BannerAdsSection` if it fetches network data).

## 12. Internal links

- Footer sitemap link grid ✓ (`Sitemap.tsx`).
- Add cross-links: product detail → related products, same brand, same category. Category page → sibling categories. Blog post → related posts.
- Breadcrumbs (visible + `BreadcrumbList` JSON-LD) on Category, ProductDetail, Blog, CMS pages.
- Use `<Link>` (react-router) for all internal nav — never `<a href>` for internal routes (avoid full reloads).
- Anchor text: descriptive ("Shop Samsung phones") not "click here".
- Add HTML sitemap page link in footer ✓.

---

## Execution order (suggested)

1. **Metadata pass** — add `SeoHead` to every missing route (1-2 hours).
2. **Sitemap upgrade** — make generator dynamic + split + remove private routes.
3. **robots.txt** — add disallow list.
4. **JSON-LD** — Product, Article, FAQ, Breadcrumb schemas.
5. **Image audit** — alt text + lazy loading + width/height across components.
6. **Performance** — LCP preload, code-split admin, font preconnect.
7. **Accessibility pass** — aria-labels, focus rings, form labels.
8. **Canonical/noindex** — robots meta on search, account, checkout.
9. **Internal linking** — related products, breadcrumbs everywhere.
10. **Re-run SEO scan + Lighthouse** to verify targets (≥90 across all categories).

## Technical references

- Per-route head: `src/components/seo/SeoHead.tsx` (already exists).
- Sitemap generator: `scripts/generate-sitemap.ts`, hooked via `package.json` `prebuild`.
- Lighthouse CI config: `lighthouserc.json` (targets: perf 85, a11y/seo/bp 90).
- Routes: `src/App.tsx`.
- Domain: `https://eylace.lovable.app` (used in canonical + sitemap + OG).
