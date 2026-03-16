

# Add 6-Step Order Status Flow to Customer Order Tracking

## Problem
The current `OrderTrackingTimeline` only shows 4 steps (Pending → Processing → Shipped → Delivered). The user wants the full 6-step flow visible to customers.

## Changes

### 1. Update `OrderTrackingTimeline.tsx`
- Expand `statusSteps` from 4 to 6: **Pending → Confirmed → Processing → Shipped → Out for Delivery → Delivered**
- Add icons: `Package` (pending), `ClipboardCheck` (confirmed), `Clock` (processing), `Truck` (shipped), `Navigation` (out for delivery), `CheckCircle` (delivered)
- Update `getStepIndex` to handle `confirmed` (index 1) and `out_for_delivery` (index 4)
- Add bilingual labels using `useLanguage` + `t()`
- Make the timeline responsive (horizontal on desktop, vertical on mobile)

### 2. Update `Orders.tsx`
- Add `confirmed` and `out_for_delivery` to `statusColors` map
- Show tracking button for all non-pending/non-cancelled statuses
- Always show the timeline inside expanded orders (not just on button click) so customers can always see where their order is

### 3. Add translation keys in `translations.ts`
- `tracking.pending` / `tracking.confirmed` / `tracking.processing` / `tracking.shipped` / `tracking.outForDelivery` / `tracking.delivered` in both EN and BN
- `tracking.carrier` / `tracking.trackingNumber` / `tracking.estDelivery` / `tracking.orderCancelled` / `tracking.deliveredOn` / `tracking.trackingHistory`

