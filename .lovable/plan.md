

## Plan: Incomplete Order Tracking System — সম্পূর্ণ ওভারহল

### বর্তমান সমস্যাগুলো
1. **ডুপ্লিকেট**: প্রতিবার ফর্ম পরিবর্তনে নতুন row insert হয় — কোনো upsert নেই
2. **সেশন ট্র্যাকিং নেই**: গেস্ট ইউজারের জন্য কোনো session ID নেই, তাই ডুপ্লিকেট ঠেকানো যায় না
3. **ক্লিনআপ অসম্পূর্ণ**: শুধু logged-in ইউজারের incomplete record ডিলিট হয়, গেস্টের হয় না
4. **cart_items-এ ডাটা কম**: শুধু name/qty/price — image, variation, product_id নেই
5. **অ্যাডমিন প্যানেলে ফিচার কম**: সার্চ, ফিল্টার, CSV এক্সপোর্ট, "converted" স্ট্যাটাস নেই

### সমাধান

#### 1. Checkout.tsx — Smart Upsert with Session ID
- চেকআউট পেজ লোড হলে একটি `sessionId` তৈরি হবে (`crypto.randomUUID()`)
- প্রথমবার insert করে `incompleteId` state-এ সেভ, পরে সেই ID দিয়ে update (3s debounce)
- **cart_items enriched**: `product_id`, `image`, `variation` সহ সেভ
- অর্ডার কমপ্লিট হলে সেই `incompleteId` দিয়ে ডিলিট (গেস্ট+লগড-ইন উভয়)
- `beforeunload` ইভেন্ট দিয়ে পেজ ছাড়ার আগে শেষবার সেভ

#### 2. DashboardIncompleteOrders.tsx — Full Admin Panel
- **সার্চ**: নাম, ফোন, ইমেইল দিয়ে ফিল্টার
- **স্ট্যাটাস ফিল্টার**: Abandoned / Contacted / Converted
- **CSV এক্সপোর্ট**: সব ডাটা ডাউনলোড
- **প্রোডাক্ট ইমেজ**: cart_items-এ থাকলে থাম্বনেইল দেখাবে
- **ভ্যারিয়েশন ব্যাজ**: সাইজ/কালার দেখাবে
- **"Converted" স্ট্যাটাস**: নতুন স্ট্যাটাস অপশন
- **Bulk delete/archive**: একাধিক সিলেক্ট করে ডিলিট
- **Pagination**: ২০ এর বদলে সব দেখানো + load more

#### 3. Database Migration
- `incomplete_orders` টেবিলে `session_id` (text) কলাম যোগ — গেস্ট ইউজার ট্র্যাকিংয়ের জন্য
- RLS policy: Anyone can update their own incomplete order (session_id match)

### ফাইল পরিবর্তন
| ফাইল | পরিবর্তন |
|---|---|
| `src/pages/Checkout.tsx` | Session-based upsert, enriched cart_items, cleanup on complete, beforeunload |
| `src/components/admin/DashboardIncompleteOrders.tsx` | Search, filter, CSV export, product images, variations, converted status, bulk actions |
| DB Migration | `session_id` কলাম যোগ, update RLS policy |

