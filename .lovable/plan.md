## Goal

In Admin → Website Setup, the admin already sees tabs for Homepage, Hero Banners, Header, Top Bar, Footer, Appearance (Logo/Favicon), etc. — but several of those fields are **not actually wired to the live site**. The admin edits them, saves, and nothing changes on the frontend. This plan fixes the disconnects and reorganizes the page so every "front-end visual" control lives in one place.

## What's already working (keep as-is)

- Hero Banners CRUD → rendered by `HeroSection.tsx` ✓
- Footer (about, copyright, columns, social, payment icons, app store URLs, features bar) → rendered by `Footer.tsx` ✓
- Favicon URL → applied by `Layout.tsx` ✓
- Fonts, colors, border radius, custom CSS → applied by `Layout.tsx` ✓
- Header toggles (sticky, search, cart, wishlist, language, currency) → respected by `Header.tsx` ✓
- Checkout variant selection + customization ✓
- CTA Call/WhatsApp + Prepayment Offer ✓

## Gaps to fix (the real work)

### 1. Logo not used by the header
`Header.tsx` hardcodes the "Eylace" wordmark and ignores `setup.logoUrl`. Update the brand block to render `<img src={setup.logoUrl} />` when set, fall back to the wordmark otherwise. Same fix in the mobile/compact header markup if present.

### 2. Top Bar reads from the wrong place
`TopBar.tsx` currently loads `system_settings.top_bar_headlines` (a separate legacy key) and ignores `website_setup_v1.topBarEnabled / topBarText / topBarBgColor / topBarTextColor / topBarLinks`. Rewrite `TopBar.tsx` to:
- Read from `useWebsiteSetup()` instead of its own Supabase query.
- Respect `topBarEnabled` (hide when false).
- Show `topBarText` as the marquee/headline content.
- Apply `topBarBgColor` / `topBarTextColor`.
- Render `topBarLinks` on the right side (desktop) as small inline links.
- Keep the dismiss button.

### 3. Header announcement bar unused
`setup.headerAnnouncementText` is editable but never rendered. Add a slim bar above the main header row in `Header.tsx` that shows the text when non-empty.

### 4. Reorganize the Website Setup tabs
Promote the most-used controls and group them logically so the admin can find everything quickly. New tab order:

1. **Branding** (new tab, pulled out of Appearance) — Logo, Favicon, Site Name, Primary color, Accent color, Border radius, Dark-mode default
2. **Top Bar** — existing
3. **Header** — merge "Select Header" + "Header Settings" + Announcement Text into one tab
4. **Homepage** — merge "Select Homepage" + "Homepage Settings" + Hero Banners CRUD into one tab (Hero Banners get a clear "Hero Slides / Images" subsection title)
5. **Footer** — existing
6. **Pages** — existing
7. **Auth Layout** — existing
8. **Typography** — existing Font tab
9. **Checkout** — existing
10. **Advanced** — Custom CSS (moved from Appearance)

The underlying `WebsiteSetupState` shape stays the same; only the tab grouping changes, so saved data remains compatible.

### 5. Site Name field (small addition)
Add a `siteName` text field in the new Branding tab (defaults to "Eylace"). Use it in `Header.tsx` as the fallback wordmark text when no logo is uploaded, and as the document title prefix (optional, low priority).

## Files to change

- `src/pages/AdminWebsiteSetupPage.tsx` — re-group tabs, add Branding tab, add `siteName` field
- `src/hooks/useWebsiteSetup.ts` — add `siteName` to interface + defaults
- `src/components/layout/Header.tsx` — render `setup.logoUrl` + `setup.siteName` + `setup.headerAnnouncementText`
- `src/components/layout/TopBar.tsx` — switch source to `useWebsiteSetup()`, respect all top-bar fields, render links

## Out of scope

- No backend/schema changes (all data already lives in `system_settings.website_setup_v1`)
- No new admin pages, no auth/role changes
- The "Select Homepage" / "Select Header" preset cards (default/minimal/modern) stay as visual selectors; wiring those presets to actually swap layouts is a separate, larger task
