

# Fix Product Pricing, Reviews & Count Issues

## Problems Identified

1. **Discount % not auto-calculated**: Admin enters original_price and price manually, but discount % is not computed automatically.
2. **Reviews don't show customer names**: The `useProductReviews` hook queries `product_reviews` directly, but RLS blocks SELECT for public. The `product_reviews_public` view strips `user_id`. Reviews show email-based names but the data isn't joined with profiles.
3. **Review count not synced**: The `products.review_count` and `products.rating` columns are static (set at insert time) and never updated when new reviews are added.
4. **RLS issue**: `product_reviews` has no SELECT policy for authenticated users viewing all reviews -- only the public view works.

## Plan

### 1. Auto-calculate discount % in ProductFormModal
- When `price` or `original_price` changes, auto-compute `discount = Math.round(((original_price - price) / original_price) * 100)` and set it in the form.
- Make the discount field read-only (auto-calculated) when both prices are provided.
- Display the calculated discount clearly.

### 2. Database: Add trigger to sync review_count & rating on products table
- Create a trigger function `update_product_review_stats()` that runs AFTER INSERT/UPDATE/DELETE on `product_reviews`.
- It recalculates `review_count` and `rating` on the `products` table from actual review data.
- This ensures every review is always counted.

### 3. Database: Fix RLS for product_reviews SELECT
- Add SELECT policy for authenticated users on `product_reviews` so the hook can fetch reviews.
- Alternatively, switch the hook to use `product_reviews_public` view (but we need user info for names).
- Better approach: Add a SELECT policy allowing everyone to read reviews (reviews are public content), then join with profiles to get customer names.

### 4. Show customer names on reviews
- Update `product_reviews_public` view OR add RLS SELECT policy on `product_reviews` for all users.
- In `useProductReviews`, join reviews with `profiles` table to get `first_name`, `last_name`.
- Update `ReviewsSection` to display customer's actual name (first_name + last_name) instead of email prefix.
- Show avatar initials from the customer's name.

### 5. Fix review display in ProductDetail
- The reviews tab shows `product.reviewCount` from DB which is stale. After the trigger is added, this will auto-sync.
- Also use `stats.totalReviews` from the hook for the tab label instead of the product's static count.

## Files to Change

| File | Change |
|------|--------|
| `src/components/admin/ProductFormModal.tsx` | Auto-calculate discount % from price vs original_price |
| `src/hooks/useProductReviews.ts` | Join with profiles to get customer names; add SELECT RLS fix |
| `src/components/products/ReviewsSection.tsx` | Display customer full name instead of email prefix |
| `src/pages/ProductDetail.tsx` | Use live review stats for tab count |
| **Migration SQL** | Add SELECT RLS on `product_reviews`, create trigger for `review_count`/`rating` sync, update view to include profile join |

## Migration SQL Summary

```sql
-- 1. Allow anyone to SELECT product_reviews (reviews are public)
CREATE POLICY "Anyone can view reviews" ON public.product_reviews
FOR SELECT TO public USING (true);

-- 2. Trigger to auto-update products.rating and products.review_count
CREATE OR REPLACE FUNCTION public.update_product_review_stats()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE _product_id text;
BEGIN
  _product_id := COALESCE(NEW.product_id, OLD.product_id);
  UPDATE public.products SET
    review_count = (SELECT COUNT(*) FROM product_reviews WHERE product_id = _product_id),
    rating = COALESCE((SELECT ROUND(AVG(rating)::numeric, 2) FROM product_reviews WHERE product_id = _product_id), 0)
  WHERE id::text = _product_id;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_update_product_review_stats
AFTER INSERT OR UPDATE OR DELETE ON public.product_reviews
FOR EACH ROW EXECUTE FUNCTION public.update_product_review_stats();
```

