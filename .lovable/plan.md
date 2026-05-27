# Admin Cache Refresh & UX Polish Plan

চারটি কাজ একসাথে করা হবে। ছোট, focused পরিবর্তন—existing `useAdminQuery` infra-র উপর গড়ে তোলা।

## 1. Centralized queryKey map + invalidation helper

নতুন ফাইল: `src/hooks/adminQueryKeys.ts`

```ts
export const adminQueryKeys = {
  products: ['admin-products'],
  categories: ['admin-categories'],
  brands: ['admin-brands'],
  orders: ['admin-orders'],
  customers: ['admin-customers'],
  sellers: ['admin-sellers'],
  coupons: ['admin-coupons'],
  reviews: ['admin-reviews'],
  preorderReviews: ['admin-preorder-reviews'],
  // ... সব admin domain key এক জায়গায়
} as const;

// কোন mutation কোন key invalidate করবে — domain → keys[] map
export const adminInvalidationMap: Record<string, readonly QueryKey[]> = {
  product: [adminQueryKeys.products, adminQueryKeys.categories],
  order:   [adminQueryKeys.orders, adminQueryKeys.customers],
  seller:  [adminQueryKeys.sellers],
  // ...
};
```

`src/hooks/useAdminQuery.ts`-এ যোগ:

```ts
export function useAdminMutation() {
  const qc = useQueryClient();
  return {
    invalidate: (domain: keyof typeof adminInvalidationMap) =>
      adminInvalidationMap[domain].forEach(k => qc.invalidateQueries({ queryKey: k })),
    invalidateKey: (key: QueryKey) => qc.invalidateQueries({ queryKey: key }),
  };
}
```

ব্যবহার (save/delete handler-এ):
```ts
const { invalidate } = useAdminMutation();
await supabase.from('products').update(...);
invalidate('product');   // refetch-ই হবে, কিন্তু…
```

## 2. Subtle "Updating…" state instead of spinner

`useAdminQuery` থেকে `isFetching` expose হয় already। প্রতিটি admin page-এ spinner block-এর শর্ত:

- প্রথম লোড (`isLoading && !data`) → spinner দেখাবে (এটা এমনিতেও কেবল প্রথমবারই হয়)।
- Refetch/background fetch (`isFetching && data?.length > 0`) → spinner নয়, বরং একটা subtle inline badge (top-right corner) "Updating…" দেখাবে।

নতুন small component: `src/components/admin/RefetchBadge.tsx`

```tsx
export function RefetchBadge({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground animate-pulse">
      <Loader2 className="h-3 w-3 animate-spin" /> Updating…
    </span>
  );
}
```

`AdminLayout`-এ একটা global slot তৈরি — যেকোনো page থেকে context/setter দিয়ে toggle করা যাবে; অথবা সহজ পথ: প্রতিটি page header-এর পাশে `<RefetchBadge active={isFetching && !isLoading} />` বসানো (একটা small helper hook দিয়ে centralize)।

আমরা centralize করব: `AdminLayout` একটা `QueryClient` listener বসাবে — যেকোনো admin query background-refetch হলে header-এ badge দেখাবে। এতে প্রতিটা page edit করা লাগবে না।

```tsx
// AdminLayout.tsx
const isFetching = useIsFetching({ predicate: q =>
  Array.isArray(q.queryKey) && String(q.queryKey[0]).startsWith('admin-')
});
const isMutating = useIsMutating();
// header-এ: <RefetchBadge active={(isFetching > 0 || isMutating > 0)} />
```

এটাই cleanest — single source, প্রতিটা page touch করতে হবে না।

## 3. Save/Delete-এর পর cache invalidate

মাইগ্রেশনের সময় বেশিরভাগ page ইতিমধ্যে `refetch()` কল করে — সেটা already cache update করে। তবে cross-page consistency-র জন্য (যেমন product update হলে category page-ও refresh দরকার) প্রতিটা domain-এর mutation এ `useAdminMutation().invalidate('domain')` ব্যবহার করতে হবে।

পরিবর্তন: high-traffic ৮টি page (Products, Categories, Brands, Orders, Customers, Sellers, Coupons, Reviews)-এ `refetch()` কে `invalidate('domain')` দিয়ে replace করা — অথবা পাশাপাশি call। বাকি pages already locally `refetch()` করছে; ওগুলো অপরিবর্তিত থাকবে (works fine, just not cross-page)।

## 4. টেস্ট — revisit করলে spinner আসে না

নতুন ফাইল: `src/hooks/__tests__/useAdminQuery.test.tsx`

Vitest + React Testing Library দিয়ে:

1. একটা mock `useAdminQuery`-based component render করুন।
2. একটা fetcher mock — প্রথম call delay দেবে।
3. প্রথম mount: spinner দেখা যাবে → resolve → data দেখা যাবে।
4. Unmount → remount same `QueryClient`-এ → spinner দেখা **যাবে না**, data সরাসরি দেখা যাবে, fetcher দ্বিতীয়বার call হবে না।

```tsx
it('does not show spinner on revisit (cache persists)', async () => {
  const qc = new QueryClient();
  const fetcher = vi.fn().mockResolvedValue(['a','b']);
  const Comp = () => {
    const { data = [], isLoading } = useAdminQuery(['admin-test'], fetcher);
    return <div>{isLoading ? 'LOADING' : data.join(',')}</div>;
  };
  const { unmount, rerender } = render(<QueryClientProvider client={qc}><Comp/></QueryClientProvider>);
  await screen.findByText('a,b');
  unmount();
  rerender(<QueryClientProvider client={qc}><Comp/></QueryClientProvider>);
  expect(screen.queryByText('LOADING')).toBeNull();
  expect(fetcher).toHaveBeenCalledTimes(1);
});
```

দ্বিতীয় test: `isFetching` true হলেও `isLoading` false—badge দেখাবে, spinner নয়।

## Technical Details

- **Files created:** `src/hooks/adminQueryKeys.ts`, `src/components/admin/RefetchBadge.tsx`, `src/hooks/__tests__/useAdminQuery.test.tsx`
- **Files edited:** `src/hooks/useAdminQuery.ts` (add `useAdminMutation`), `src/components/admin/AdminLayout.tsx` (global badge), 8 high-priority pages (swap to `invalidate('domain')`)
- **No breaking changes:** existing `refetch()` calls keep working; `useInvalidateAdmin` stays as low-level escape hatch.
- **Test runner:** existing `vitest` setup, no new deps।

## Scope Note

৬৩টা page আগের loop-এই migrate হয়েছে—এই plan সেটার উপর polish layer। প্রতিটা page-এ গিয়ে individual mutation edit না করে centralized infra + global badge দিয়ে কাজ সারা হবে, যাতে maintenance সহজ থাকে।
