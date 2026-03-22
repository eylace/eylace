

## Plan: Fix Mobile Product Card — Buttons & Content Visibility

### Problem
On mobile (390px wide, 2-column grid), the ProductCard content is getting clipped by `overflow-hidden` on `.card-product`. The "Add to Cart" and "Buy Now" buttons are cut off or hidden because the card content overflows the container.

### Root Cause
The `.card-product` class applies `overflow-hidden`, and on narrow mobile screens the buttons and lower content sections overflow the card boundary and become invisible.

### Fix (2 files)

**1. `src/components/products/ProductCard.tsx`**
- Make the buttons stack vertically on very small screens instead of side-by-side
- Reduce button text size and padding on mobile
- Ensure the actions section is always visible by removing unnecessary spacing
- Make variation swatches, rating stars, and price text responsive for narrow cards

**2. `src/index.css`**
- Update `.card-product` to use `overflow-visible` or only clip the image area (not the content area), so buttons are never hidden

### Specific Changes

- **Buttons**: Change from `flex gap-2` to `flex flex-col sm:flex-row gap-1.5` so they stack on mobile
- **Button size**: Use `size="xs"` on mobile with shorter text ("Add" → icon only on very small)
- **Card overflow**: Keep `overflow-hidden` only on the image container, not the entire card
- **Price section**: Add `text-sm` for mobile to prevent wrapping issues
- **Variations**: Limit to 3 swatches on mobile instead of 5

