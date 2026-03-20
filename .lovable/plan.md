

## Plan: Customer Service — ৫টি ডেডিকেটেড পেজ তৈরি ও লিংক

### বর্তমান অবস্থা
`/help`, `/track-order`, `/returns`, `/shipping`, `/faq` — সবগুলো `CmsPage`-এ পয়েন্ট করে, ফলে Page Not Found দেখায়।

### যা করা হবে

**1. Help Center (`/help`)** — `src/pages/HelpCenter.tsx`
- সার্চ বার (হেল্প টপিক খুঁজতে)
- ক্যাটাগরি কার্ড: Orders, Payments, Shipping, Returns, Account, Seller
- জনপ্রিয় প্রশ্নোত্তর সেকশন
- যোগাযোগ চ্যানেল (ইমেইল, ফোন, লাইভ চ্যাট)

**2. Track Order (`/track-order`)** — `src/pages/TrackOrder.tsx`
- অর্ডার নম্বর দিয়ে সার্চ ফর্ম
- লগইন থাকলে সরাসরি অর্ডার লিস্ট দেখাবে
- ট্র্যাকিং টাইমলাইন (OrderTrackingTimeline ব্যবহার)

**3. Returns & Refunds (`/returns`)** — `src/pages/ReturnsRefunds.tsx`
- রিটার্ন পলিসি সামারি কার্ড (সময়সীমা, শর্ত)
- ধাপে ধাপে রিটার্ন প্রক্রিয়া (৪ ধাপ)
- রিফান্ড টাইমলাইন
- FAQ accordion

**4. Shipping Info (`/shipping`)** — `src/pages/ShippingInfo.tsx`
- শিপিং অপশন টেবিল (Standard, Express, Same Day — সময় ও খরচ)
- ডেলিভারি এরিয়া কাভারেজ
- ট্র্যাকিং তথ্য
- শিপিং FAQ

**5. FAQ (`/faq`)** — `src/pages/FAQ.tsx`
- ক্যাটাগরি ফিল্টার ট্যাব (All, Orders, Payment, Shipping, Returns, Account)
- Accordion ফরম্যাটে প্রশ্নোত্তর
- "প্রশ্নের উত্তর পাননি?" — সাপোর্ট CTA

**6. Route আপডেট (`App.tsx`)**
- ৫টি রাউট CmsPage → নতুন কম্পোনেন্টে পরিবর্তন

### ফাইল পরিবর্তন
| ফাইল | পরিবর্তন |
|---|---|
| `src/pages/HelpCenter.tsx` | নতুন তৈরি |
| `src/pages/TrackOrder.tsx` | নতুন তৈরি |
| `src/pages/ReturnsRefunds.tsx` | নতুন তৈরি |
| `src/pages/ShippingInfo.tsx` | নতুন তৈরি |
| `src/pages/FAQ.tsx` | নতুন তৈরি |
| `src/App.tsx` | ৫টি route আপডেট |

