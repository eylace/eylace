
আমি কোড দেখে ৪টা root cause পেয়েছি, তাই fix‑টা শুধু UI না, checkout + backend + data access — এই তিন জায়গায় করতে হবে।

1. `IP` column desktop‑এ hide হচ্ছে
- `src/components/admin/AdminOrdersTab.tsx`‑এ IP header/cell এখন `hidden 2xl:table-cell`
- তাই 100% desktop width‑এও column দেখা যায় না, শুধু extra-wide width‑এ দেখা যায়

2. `real IP` reliably save হচ্ছে না
- `src/pages/Checkout.tsx` এখন আগে `detect-ip` call করে, তারপর আলাদা client insert করে
- `supabase/functions/detect-ip/index.ts` শুধু `x-forwarded-for` / `x-real-ip` দেখে
- ফলে অনেক ক্ষেত্রে `unknown`, proxy IP, বা invalid IP save হওয়ার chance আছে

3. order ownership / account attribution logic fragile
- checkout এখন client-side condition দিয়ে decide করছে order `user_id` পাবে নাকি guest হবে
- browser/session reuse হলে wrong account attribution হওয়া সম্ভব
- permanent fix-এর জন্য order creation server-side centralize করা দরকার

4. guest order visibility policy too broad
- current migration‑এ guest SELECT policy effectively `user_id IS NULL`
- এটা overly permissive; guest orders wrong context‑এ visible/mixed হওয়ার risk তৈরি করছে
- user যে “customer order admin side/account‑এ চলে আসছে” issue বলেছে, এটা ওই access model‑এর সাথেও related হতে পারে

Implementation plan

A. Sales table IP column fully responsive করব
- `AdminOrdersTab.tsx`‑এ IP column `2xl` dependency remove করব
- IP columnকে normal desktop breakpoint‑এ visible করব
- low-priority columns (`Assigned To`, `Fraud`) earlier hide করে IP‑কে higher priority দেব
- table width/layout rebalance করব যাতে 100% desktop, 80%, laptop, tablet — সবখানে IP visible থাকে
- `useAdminData.ts` এর `AdminOrder` type‑এ `customer_ip` add করব, যাতে `any` cast remove হয়

B. Order creation server-side করব for permanent fix
- নতুন secure backend function বানাব (e.g. `checkout-create-order`)
- এই function:
  - request থেকে validated real IP detect করবে
  - blocked IP check করবে
  - authenticated user থাকলে server-side resolve করবে
  - privileged/admin session হলে order কখনো admin `user_id`‑তে bind করবে না
  - guest হলে `user_id = null`, normal customer হলে actual customer `user_id`
  - order + order_items এক flow‑তে create করবে
- এতে IP detection + ownership attribution + consistency এক জায়গায় থাকবে

C. IP detection harden করব
- `detect-ip` logic বা নতুন order function‑এ multiple headers inspect করব:
  - `cf-connecting-ip`
  - `x-forwarded-for`
  - `x-real-ip`
  - `fly-client-ip`
  - `x-client-ip`
- first valid IP normalize করব
- invalid/private/local proxy values filter করব যতটা সম্ভব
- no valid public IP পেলে safe fallback রাখব, কিন্তু bogus value save করব না

D. Checkout frontend refactor করব
- `Checkout.tsx` থেকে direct `orders` / `order_items` insert path সরিয়ে backend function invoke করব
- current guest/account branching client-side থেকে backend-side validation‑এ move করব
- success response থেকে created order data use করব
- existing UI flow, toasts, order success screen preserve থাকবে

E. Customer order isolation fix করব
- overly broad guest order read policy replace করব
- guest tracking/read-এর জন্য secure path রাখব (policy tightening + প্রয়োজন হলে dedicated lookup function / tracking flow update)
- `/orders` বা customer-facing order fetch যেন শুধু rightful user-এর orderই দেখায়, সেটা নিশ্চিত করব
- guest order authenticated/admin context‑এ leak করবে না

F. Existing IP block flow align করব
- blocked IP check একই backend order creation flow‑তে centralize করব
- Sales table‑এ stored IP reliably show করবে
- order row থেকে block action existing `blocked_ips` system‑এর সাথেই কাজ করবে

G. Optional carry-forward improvement
- incomplete order → sales convert flow‑এ IP available থাকলে preserve করব
- এতে future manual conversion‑এও IP history retain থাকবে

Files likely to change
- `src/components/admin/AdminOrdersTab.tsx`
- `src/hooks/useAdminData.ts`
- `src/pages/Checkout.tsx`
- `src/pages/Orders.tsx` and/or guest tracking flow file(s)
- `supabase/functions/detect-ip/index.ts`
- new backend order creation function
- new migration for RLS/policy tightening (and any supporting schema tweak if needed)

Technical details
- direct client inserts থেকে backend function‑এ move করা হচ্ছে কারণ এটিই permanent fix
- role check‑এ `.limit(1)` pattern follow করব
- `orders` ownership server-side set হবে; client `user_id` trusted হবে না
- guest order access policy tighten করা হবে যাতে accidental data bleed বন্ধ হয়
- `customer_ip` typed field হিসেবে admin model‑এ থাকবে

Validation / QA
- 100% desktop, 80% zoom, laptop width, tablet width‑এ IP column visible কিনা
- guest checkout → order created with `user_id = null`, valid IP saved
- normal logged-in customer checkout → correct customer `user_id`, valid IP saved
- admin logged-in browser থেকে storefront checkout test → order admin account‑এ attach না হয়
- blocked IP → checkout rejected
- Sales page → IP immediately visible
- customer `/orders` page → অন্যের order বা guest order leak না হয়

Approve করলে আমি next step‑এ এই permanent fix implement করব end-to-end.
