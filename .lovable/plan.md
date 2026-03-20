

## Plan: Footer Payment Icons — Real Brand SVG Logos

### Problem
Currently the "We Accept" section uses generic Lucide icons (CreditCard, Wallet, etc.) for all payment methods. The user wants **original brand logos** — Visa, Mastercard, bKash, Nagad, PayPal, etc.

### Approach
Create inline SVG components for each payment brand with their recognizable colors and shapes. This avoids external image dependencies and keeps everything crisp and scalable.

### Changes

**1. Create `src/components/payment/PaymentIcons.tsx`**
- Build small SVG-based icon components for each payment method:
  - **International**: Visa, Mastercard, American Express, UnionPay, PayPal, Apple Pay, Google Pay
  - **National (Bangladesh)**: bKash, Nagad, Rocket, Upay, SSLCommerz
  - **Other**: Cash on Delivery
- Each icon will use the brand's actual colors (e.g., Visa blue/gold, Mastercard red/orange circles, bKash pink, Nagad orange)
- Standardized size (~40x26px) with proper aspect ratios

**2. Update `src/components/layout/Footer.tsx`**
- Replace the Lucide icon array with the new brand SVG icons
- Add more payment methods: Apple Pay, Google Pay, JCB, Discover
- Clean layout: icon-only, no text, white/light background card style for each icon
- Remove unused Lucide icon imports (Wallet, Banknote, Building2, Globe, Smartphone)

**3. Update `src/components/checkout/PaymentMethods.tsx`**
- Optionally use the same brand icons next to payment method radio buttons for consistency

### Result
Footer will show ~15 recognizable payment brand logos in a professional row, similar to major e-commerce sites like Daraz or Amazon.

