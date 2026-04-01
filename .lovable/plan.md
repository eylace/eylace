

# Return Tracking System — Plan

## Summary
Add a **Return Tracking Number** and **Return Acknowledgement Receipt** system so both customers and admins can track and verify return status using a unique tracking number.

## Database Changes

### Migration: Add columns to `return_requests`
```sql
ALTER TABLE public.return_requests
  ADD COLUMN return_tracking_number text UNIQUE,
  ADD COLUMN acknowledgement_data jsonb DEFAULT '{}'::jsonb;
```
- `return_tracking_number`: Auto-generated unique ID like `RTN-20260401-XXXXX`
- `acknowledgement_data`: Stores receipt metadata (generated_at, collected_by, hub info)

### Create a DB function to auto-generate tracking number on insert
```sql
CREATE OR REPLACE FUNCTION public.generate_return_tracking_number()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.return_tracking_number := 'RTN-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(md5(random()::text), 1, 6));
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_return_tracking_number
  BEFORE INSERT ON public.return_requests
  FOR EACH ROW EXECUTE FUNCTION generate_return_tracking_number();
```

## Frontend Changes

### 1. Customer Side — `src/pages/Account.tsx`

**Returns section** — Show `return_tracking_number` for each return request:
- Display tracking number prominently in each return card
- Add a **"Download Receipt"** button that generates a printable Return Acknowledgement Receipt (PDF-style HTML with order details, tracking number, product info, return reason, date)
- Add a **Copy** button for the tracking number

**Return success** — After submitting a return in `ReturnRequestModal.tsx`:
- Show the generated tracking number in the success state
- Provide copy and download receipt options immediately

### 2. Admin Side — `src/components/admin/AdminReturnsTab.tsx`

- Add `return_tracking_number` column to the table (searchable)
- Show tracking number in the detail modal
- Admin can download/print the Return Acknowledgement Receipt
- Search filter supports tracking number lookup

### 3. Edge Function — `supabase/functions/admin-manage-returns/index.ts`

- Include `return_tracking_number` and `acknowledgement_data` in GET responses (already returned via `select('*')`, no change needed)

### 4. Return Tracking Page — Update `src/pages/TrackOrder.tsx`

Add a **second tab/section** for "Track Return" alongside "Track Order":
- Customer enters return tracking number (RTN-XXXXXXXX-XXXXXX)
- Fetches return request details from database
- Shows return status timeline (Requested → Under Review → Approved → Refunded / Rejected)
- Shows product info, refund amount, method, admin notes
- Shows Return Acknowledgement Receipt details

### 5. Return Acknowledgement Receipt Component

Create `src/components/orders/ReturnReceipt.tsx`:
- Printable receipt layout with:
  - Eylace branding
  - Return Tracking Number
  - Order Number
  - Product details (name, image, qty, price)
  - Return reason and description
  - Refund method and amount
  - Date submitted
  - Status
  - Instructions (keep copy, mention order number)
- Uses `window.print()` for download/print functionality

## Technical Details

- Tracking number format: `RTN-YYYYMMDD-XXXXXX` (6 random hex chars)
- Receipt generation is client-side (HTML print), no server PDF needed
- Customer fetches return by tracking number via direct Supabase query (RLS allows viewing own returns)
- For public tracking (without login), add a security-definer function that returns limited return info by tracking number
- Realtime subscription already exists for return_requests — tracking number updates will propagate automatically

## Files to Create/Edit

| File | Action |
|------|--------|
| Migration SQL | New — add columns + trigger |
| `src/components/orders/ReturnReceipt.tsx` | New |
| `src/pages/Account.tsx` | Edit — show tracking number, receipt download |
| `src/components/orders/ReturnRequestModal.tsx` | Edit — show tracking number on success |
| `src/components/admin/AdminReturnsTab.tsx` | Edit — tracking number column, search, receipt |
| `src/pages/TrackOrder.tsx` | Edit — add return tracking tab |

