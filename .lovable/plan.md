

## Plan: Full Affiliate Program System

### Summary
Build a complete affiliate program with: customer-facing dashboard (join, get links, track earnings), referral tracking via URL params, commission calculation on orders, and full admin management panel.

---

### 1. Database Tables (Migration)

**Table: `affiliates`** — stores affiliate accounts
```sql
CREATE TABLE public.affiliates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code text NOT NULL UNIQUE,
  commission_rate numeric NOT NULL DEFAULT 5,
  status text NOT NULL DEFAULT 'pending', -- pending, approved, rejected, suspended
  payment_method text DEFAULT 'bkash',
  payment_details jsonb DEFAULT '{}',
  total_earnings numeric DEFAULT 0,
  total_paid numeric DEFAULT 0,
  total_clicks integer DEFAULT 0,
  total_conversions integer DEFAULT 0,
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS: users see own, admins see all + manage
```

**Table: `affiliate_clicks`** — tracks link clicks
```sql
CREATE TABLE public.affiliate_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  ip_address text,
  user_agent text,
  landing_page text,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

**Table: `affiliate_conversions`** — tracks sales from referrals
```sql
CREATE TABLE public.affiliate_conversions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  order_id uuid,
  order_total numeric NOT NULL DEFAULT 0,
  commission_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending', -- pending, approved, paid, rejected
  created_at timestamptz NOT NULL DEFAULT now()
);
```

**Table: `affiliate_payouts`** — payout history
```sql
CREATE TABLE public.affiliate_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  payment_method text,
  transaction_id text,
  status text NOT NULL DEFAULT 'pending', -- pending, completed, failed
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

RLS policies: users can SELECT own records, INSERT affiliate applications. Admins can ALL.

---

### 2. Customer-Facing Pages

**Update: `src/pages/AffiliateProgram.tsx`**
- If user is logged in and already an affiliate → show **Affiliate Dashboard** with tabs:
  - **Overview**: stats (clicks, conversions, earnings, pending balance)
  - **Links**: generate product-specific referral links, copy-to-clipboard
  - **Conversions**: table of orders made through their links
  - **Payouts**: payout history + request payout button
  - **Settings**: payment method (bKash/Nagad/bank), account details
- If logged in but not an affiliate → show join form with "Join Now" button
- If not logged in → show current landing page with "Join Now" redirecting to `/auth`

**New: `src/components/affiliate/AffiliateDashboard.tsx`** — main dashboard component  
**New: `src/components/affiliate/AffiliateLinksTab.tsx`** — link generator  
**New: `src/components/affiliate/AffiliateConversionsTab.tsx`** — conversions table  
**New: `src/components/affiliate/AffiliatePayoutsTab.tsx`** — payout history  
**New: `src/components/affiliate/AffiliateSettingsTab.tsx`** — payment settings  

---

### 3. Referral Tracking

**Update: `src/pages/Index.tsx` or `src/App.tsx`**
- On app load, check URL for `?ref=CODE` parameter
- Store referral code in `localStorage` with 30-day expiry
- When an order is placed (in Checkout), if referral code exists, record an `affiliate_click` and `affiliate_conversion`

**Update: `src/pages/Checkout.tsx`**
- After successful order creation, check localStorage for referral code
- If found, create an `affiliate_conversion` record via edge function

---

### 4. Edge Function: `affiliate-manage`

**New: `supabase/functions/affiliate-manage/index.ts`**
- `POST /join` — create affiliate application (generates unique referral code)
- `POST /track-click` — record a click (called from frontend on `?ref=` detection)
- `POST /record-conversion` — record conversion after order (validates order ownership)
- `GET /stats` — get affiliate stats for dashboard
- Admin operations (requires admin role):
  - `PUT /approve` — approve/reject affiliate
  - `PUT /update` — update commission rate, status, notes
  - `POST /payout` — create payout record, update totals
  - `DELETE /remove` — remove affiliate

---

### 5. Admin Panel

**New: `src/pages/AdminAffiliateProgram.tsx`** — admin page with tabs:
- **All Affiliates**: table with search, filter by status, approve/reject/suspend actions
- **Conversions**: all conversions across affiliates, approve/reject commission
- **Payouts**: manage payout requests, mark as paid
- **Settings**: default commission rate, cookie duration, min payout threshold

**New: `src/components/admin/AdminAffiliatesTab.tsx`** — affiliates management component

**Update: `src/components/admin/AdminSidebar.tsx`**
- Add "Affiliate Program" under Marketing section with `Link2` icon
- URL: `/admin/affiliate`

**Update: `src/App.tsx`**
- Add lazy import + route: `/admin/affiliate` → `AdminAffiliateProgram`

---

### 6. Translation Keys

Add keys for all new UI strings in `src/i18n/translations.ts`.

---

### Files Summary

| File | Action |
|------|--------|
| Migration SQL | Create 4 tables + RLS + indexes |
| `supabase/functions/affiliate-manage/index.ts` | New edge function |
| `supabase/config.toml` | Add function config |
| `src/pages/AffiliateProgram.tsx` | Rewrite with dashboard |
| `src/components/affiliate/AffiliateDashboard.tsx` | New |
| `src/components/affiliate/AffiliateLinksTab.tsx` | New |
| `src/components/affiliate/AffiliateConversionsTab.tsx` | New |
| `src/components/affiliate/AffiliatePayoutsTab.tsx` | New |
| `src/components/affiliate/AffiliateSettingsTab.tsx` | New |
| `src/pages/AdminAffiliateProgram.tsx` | New admin page |
| `src/components/admin/AdminAffiliatesTab.tsx` | New admin component |
| `src/components/admin/AdminSidebar.tsx` | Add menu item |
| `src/App.tsx` | Add route + lazy import |
| `src/pages/Checkout.tsx` | Add referral conversion tracking |
| `src/i18n/translations.ts` | Add translation keys |

