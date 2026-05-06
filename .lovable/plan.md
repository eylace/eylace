## Goal

Checkout-এ দুটি পরিবর্তন:

1. **COD ৳0.50 additional fee সম্পূর্ণ remove** করা — Online payment আর COD উভয়ের জন্য total একই formula হবে: `subtotal + shipping + tax − discount` (online হলে শুধু prepayment offer discount বাদ যাবে)।
2. **COD select করলে** "0.50 fee" notice-এর জায়গায় একটি নতুন **"Pay Courier Charge in Advance"** action দেখাবে — click করলে user শুধু shipping/courier charge টা online এ pay করতে পারবে; বাকি product amount delivery-তে cash এ দিবে।

---

## Changes

### 1. `src/pages/Checkout.tsx` — fee removal
- Line 172: `const codFee = isCashOnDelivery ? 0.5 : 0;` → `const codFee = 0;` (অথবা পুরো variable ও related field সরিয়ে clean করব)।
- `getCheckoutPricing` return থেকে `codFee` রাখব 0 হিসেবে যাতে downstream component break না করে, পরে চাইলে cleanup।

### 2. `src/components/checkout/PaymentMethods.tsx` — UI
COD selected হলে বর্তমান `t('payment.codNote')` block-এর পরিবর্তে একটি নতুন panel দেখাব:

```text
┌──────────────────────────────────────────────┐
│ 🚚  Pay Courier Charge in Advance            │
│     Courier delivery charge: ৳{shipping}     │
│     [ Pay ৳{shipping} Online ]  ← button     │
└──────────────────────────────────────────────┘
```

- Button click করলে একটি নতুন `AdvanceCourierChargeModal` open হবে যেখানে available online gateways (bKash / Nagad / Card ইত্যাদি — `onlineGateways` থেকে filtered) list থাকবে।
- User gateway select করে "Pay" করলে existing online-payment redirect flow ব্যবহার করে শুধু `shipping` amount-এর জন্য একটি **partial payment intent** create হবে।

### 3. New: `src/components/checkout/AdvanceCourierChargeModal.tsx`
- Props: `open`, `onClose`, `amount` (= shipping), `gateways`, `onConfirmed(paymentRef)`.
- Internal: gateway radio list + Pay button → calls existing payment-initiate edge function with `purpose: 'advance_courier_charge'` + `amount`.
- Success হলে `paymentRef` (transaction id) parent-এ ফেরত পাঠাবে; checkout form-এ hidden field `advanceCourierPaymentRef` set হবে।

### 4. `supabase/functions/checkout-create-order/index.ts` — order metadata
- নতুন optional body field accept: `advance_courier_payment_ref`, `advance_courier_amount`.
- COD order create করার সময় এই দুটি `orders.metadata` (jsonb) এ store করব যাতে admin দেখতে পায় shipping prepaid।
- Migration: যদি `metadata` jsonb column না থাকে তাহলে add করব (check করে decide)।

### 5. `src/components/checkout/OrderSummary.tsx`
- `codFee` row সম্পূর্ণ hide (0 হলে already hidden আছে — ভালো)।
- যদি `advanceCourierPaid` true থাকে, summary-তে একটি badge: "Courier charge prepaid online ✓"।

### 6. Translations (`src/i18n/translations.ts`)
- নতুন keys (en + bn): `payment.advanceCourierTitle`, `payment.advanceCourierDesc`, `payment.payCourierBtn`, `payment.courierPrepaid`।

---

## Out of scope (এই turn এ নয়)
- Actual gateway integration code change — existing bKash/Nagad/SSLCommerz initiate flow reuse করা হবে; নতুন gateway adapter লেখা হবে না।
- Refund logic যদি COD order cancel হয় তখন advance courier charge ফেরত — পরে আলাদা feature।

---

## Files touched
- `src/pages/Checkout.tsx` (codFee = 0)
- `src/components/checkout/PaymentMethods.tsx` (new advance panel)
- `src/components/checkout/AdvanceCourierChargeModal.tsx` (new)
- `src/components/checkout/OrderSummary.tsx` (prepaid badge)
- `supabase/functions/checkout-create-order/index.ts` (accept new fields)
- `src/i18n/translations.ts` (new keys)
- Possibly 1 migration to ensure `orders.metadata` jsonb exists।
