

## Plan: Conditional Order Flow — COD with OTP vs Online Payment Gateway

### Current State
- The Express checkout **always** shows the OTP popup on "Order Confirm", regardless of payment method selected.
- Online payment gateways (bKash, Nagad, SSLCommerz, etc.) show a "you will be redirected" text but no actual redirect or payment processing happens.

### What Will Change

**Flow 1: COD Selected → OTP Verification**
- Customer selects Cash on Delivery → clicks "Order Confirm" → OTP popup appears → verifies phone → order confirmed. *(This already works — no changes needed.)*

**Flow 2: Online Payment Selected → Payment Gateway Popup**
- Customer selects an online method (bKash, Nagad, Rocket, Card, SSLCommerz, etc.) → clicks "Order Confirm" → Instead of OTP popup, a **Payment Gateway Dialog** opens showing:
  - Selected gateway name & logo
  - For bKash/Nagad/Rocket: A simulated payment form (merchant number, transaction ID input) — since live API integration requires admin-configured API keys
  - For Card (Stripe/SSLCommerz): Card details form
  - A "Pay Now" button that processes payment
- After successful payment → order is confirmed automatically (no OTP needed)

### Technical Changes

**1. `CheckoutExpress.tsx`** — Split `handleOrderClick` logic:
- Check `form.getValues('paymentMethod')` 
- If COD/cash → show OTP dialog (existing flow)
- If online payment → show new Payment Gateway dialog
- Add new state: `paymentDialogOpen`, `paymentProcessing`
- Add new `PaymentGatewayDialog` component inline with payment form fields
- On successful payment simulation → call `onSubmit(pendingFormData)` directly

**2. `CheckoutExpress.tsx`** — Add Payment Gateway Dialog:
- Dialog shows selected gateway info
- For mobile banking (bKash/Nagad/Rocket): show merchant number field + transaction ID input
- For card gateways: reuse card input fields
- "Pay & Confirm Order" button processes and submits

**3. `PaymentMethods.tsx`** — No changes needed (already correctly categorizes COD vs Online)

**4. Other checkout variants** (Classic, Modern, Minimal) — Apply same conditional logic if they have submit handlers

### Important Notes
- Live bKash/SSLCommerz API integration requires admin-configured API credentials (account SID, secret keys). The system will use a **payment confirmation form** where customers enter their transaction details, which the admin can verify.
- If admin later configures live API keys, the system can be upgraded to actual redirect-based payment.
- The payment flow stores the payment method and transaction reference in the order record for admin verification.

