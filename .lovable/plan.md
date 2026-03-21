

## Plan: Make Entire Frontend Fully Admin-Manageable

### Current State
- **Admin panel** already has controls for header, homepage sections, top bar, footer columns/links/social — all saved to `website_setup_v1` in `system_settings`
- **Header** already reads most settings from `useWebsiteSetup()` (sticky, search, cart, wishlist, language switcher) — working well
- **Homepage** already toggles sections via setup flags — working well
- **Footer is hardcoded** — the 4 link columns, social icons, payment icons, and download app section ignore admin settings entirely

### Changes Required

**1. Rewrite `src/components/layout/Footer.tsx` to be fully dynamic**
- Replace hardcoded 4 columns (Customer Service, Quick Links, Sell on Eylace, Partners) with `setup.footerColumns` — admin can add/remove columns and links
- Use `setup.footerSocialLinks` for social icons instead of hardcoded Facebook/Twitter/Instagram/Youtube
- Gate payment icons section with `setup.footerShowPaymentIcons`
- Gate newsletter section with `setup.footerShowNewsletter`
- Use `setup.footerAboutText` and `setup.footerCopyright` (already partially done)
- Keep a sensible fallback when no columns are configured (show defaults)

**2. Add footer "Download App" and "Features Bar" toggles to admin**
- Add new settings: `footerShowDownloadApp`, `footerShowFeaturesBar`, `footerAppStoreUrl`, `footerGooglePlayUrl`
- Add these toggles to the Footer Settings tab in `AdminWebsiteSetupPage.tsx`
- Wire them in Footer.tsx so admin can show/hide download app section and the trust badges bar

**3. Update `useWebsiteSetup.ts` defaults**
- Add the new footer settings to the `WebsiteSetup` interface and defaults

### What This Enables
- Admin can add/remove/edit footer columns and links from Website Setup → Footer Settings
- Admin can toggle payment icons, social links, newsletter, download app, and trust badges on/off
- Admin can set App Store / Google Play URLs
- All changes reflect instantly on the frontend via the existing `invalidateSetupCache()` mechanism

### No Database Changes Needed
Everything uses the existing `system_settings` JSON column.

