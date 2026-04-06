

## Plan: Prevent Duplicate Reviews & Returns

### Problem Analysis
1. **Review duplication on Product Page**: The "Write a Review" button in `ReviewsSection.tsx` always shows for logged-in users, even if they've already reviewed the product. The Account dashboard already handles this correctly (shows "Reviewed ✓" badge), but the product detail page does not.

2. **Return duplication**: The Account page already checks `!hasReturnRequest` per order (line 981). However, since `return_requests` has `order_item_id`, returns are per-item. The current per-order check should work for the "Return Order" button (it hides once any return exists for that order). This appears to be working correctly based on the code — if there's a bug, it may be a data-fetching timing issue.

### Changes

#### 1. ReviewsSection.tsx — Hide "Write a Review" if already reviewed
- Check if the current user already has a review for this product by querying `product_reviews` where `user_id = current user` and `product_id = this product`
- If already reviewed: show a disabled "Already Reviewed ✓" button instead of "Write a Review"
- Add this check inside the component using a `useEffect` query on mount

#### 2. WriteReviewModal.tsx — Pre-check before opening
- Add an `alreadyReviewed` prop so the modal can be prevented from opening
- The DB unique constraint (`23505` error) is already a backend safeguard, but the UI should prevent the attempt entirely

#### 3. Account.tsx — Ensure return check is robust
- The existing `hasReturnRequest` check on line 981 already prevents the "Return Order" button from appearing once a return exists for that order
- Verify that the `returnRequests` state is properly refreshed after a return submission (the realtime subscription on line 146 should handle this)
- No code change needed here — the logic is already correct

### Summary of File Changes
| File | Change |
|------|--------|
| `src/components/products/ReviewsSection.tsx` | Add user review check; conditionally show "Already Reviewed ✓" instead of "Write a Review" |
| `src/hooks/useProductReviews.ts` | Add `userHasReviewed` boolean to the return value |

This is a focused fix — 2 files modified, no database changes needed.

