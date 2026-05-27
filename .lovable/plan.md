## সমস্যা

Admin panel-এর ~51টা page-এ data fetch করা হয় component-এর local `useState` + `useEffect` দিয়ে। Page থেকে navigate away করলে component unmount হয়, state হারায়, ফিরে এলে আবার fetch + loading spinner দেখায়। User চায় — revisit-এ data instantly থাকবে, শুধু save করলে refresh হবে।

## সমাধান

React Query (already configured, `staleTime: 5min`, `gcTime: 10min`) দিয়ে cache করা — তাহলে data QueryClient-এ persist করবে, revisit-এ instant render, save-এ `invalidateQueries` দিয়ে refresh।

## পরিকল্পনা

### Step 1: Helper hook তৈরি — `src/hooks/useAdminQuery.ts`

একটি ছোট wrapper: `useAdminQuery(key, fetcher)` যা admin pages-এ standardized cache behavior দেবে:
- `staleTime: Infinity` (manual invalidation only)
- `gcTime: 30min`
- `refetchOnMount: false`, `refetchOnWindowFocus: false`
- `refetchOnReconnect: false`

আর একটি `useInvalidateAdmin(key)` helper যা save/delete-এর পর call করা হবে।

### Step 2: 51টা admin page systematically migrate

প্রতিটা page-এ এই pattern transform:

```text
আগে:                              পরে:
const [items, setItems] = ...     const { data: items = [], refetch } = useAdminQuery(
const [loading, setLoading] = ...   ['admin-warranties'],
useEffect(() => { fetch() }, [])    async () => { const {data} = await supabase...; return data; }
                                  );
```

Save/delete handlers-এ `fetch()` call → `refetch()` দিয়ে replace।

### Step 3: Batch execution

পেজগুলো 6টা logical group-এ ভাগ করে batch-এ migrate (parallel subagents দিয়ে):
1. **Products & Catalog** (10 files): AdminProducts, AdminInHouseProducts, AdminSellerProducts, AdminAddProduct, AdminAddDigitalProduct, AdminBrands, AdminColors, AdminAttributes, AdminLabels, AdminWarranties, AdminSizeGuides, AdminCategories, AdminCategoryDiscount, AdminStockManagement
2. **Orders & Sales** (8): AdminOrders, AdminIncompleteOrders, AdminReturnsRefunds, AdminRefundRequests, AdminCustomers, AdminTransactionsPage, AdminReportsPage, AdminMapsOrderData
3. **Sellers & Affiliates** (12): AdminAllSellers, AdminAppliedSellers, AdminSellerVerification, AdminSellerRatings, AdminSellerPayouts, AdminSellerPayoutRequests, AdminSellerCommission, AdminSellerBasedCommission, AdminCategoryBasedCommission, AdminSellerPackages, AdminAffiliate* group
4. **Marketing & Coupons** (10): AdminCoupons, AdminMarketing* group, AdminSmartBar
5. **Settings, SEO, Pages, System** (8): AdminSettingsPage, AdminWebsiteSetupPage, AdminSEOPage, AdminPagesPage, AdminMenuManager, AdminSystem*, AdminTrackingAnalytics, AdminAISettings
6. **Preorder, Support, OTP, Misc** (10): AdminPreorder* group, AdminSupport* group, AdminOtp* group, AdminCourier*, AdminShippingProviders, AdminPaymentGateways, AdminIpBlock, AdminFraudPage, AdminUserRoles, AdminClubPoint*, AdminBlog*, AdminUploadFiles, AdminRefund*, AdminAccounting

### Step 4: Verify

- Build pass check
- Manual spot-check 3-4 pages: navigate away → return → no loading spinner
- Save action → list refreshes properly

## টেকনিক্যাল ডিটেইল

- `useEffect`-এর fetch logic remove হবে, কিন্তু other useEffects (subscriptions, page-title, etc.) untouched থাকবে।
- যেসব page-এ state derive হয় fetched data থেকে (filters, search, dialog open) — সেগুলো local `useState` থাকবে; শুধু **server data** cache হবে।
- যেসব page-এ multiple parallel queries আছে — প্রতিটার জন্য আলাদা cache key।
- Mutations (insert/update/delete) এর পর `queryClient.invalidateQueries({ queryKey: [...] })` call।

## ঝুঁকি ও mitigation

- **ঝুঁকি**: কিছু page-এ fetch logic complex (multiple dependent queries) — pattern এ ঠিক না হলে আলাদা treatment।
- **Mitigation**: Migration-এর সময় file-by-file pattern verify, এবং প্রতি batch-এর পর build check।
- **ঝুঁকি**: যদি data stale থাকে (অন্য user বদলালে দেখাবে না)। 
- **Mitigation**: Mutations সব invalidate করবে; বড় cases-এ "Refresh" button যোগ করা যাবে।

## ডেলিভারি

এই plan approve হলে:
1. প্রথমে `useAdminQuery` hook তৈরি
2. তারপর batch করে সব page migrate
3. সবশেষে build verify

Migration time-consuming, কিন্তু এক পর্বেই সম্পূর্ণ admin panel স্থিতিশীল cache পাবে।