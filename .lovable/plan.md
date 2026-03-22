

## Plan: Mobile Product Card — Bigger Cards, Side-by-Side Buttons

### Changes

**1. `src/components/products/ProductCard.tsx`**
- Change buttons from `flex-col sm:flex-row` back to `flex-row` always (side-by-side on mobile too, like the reference image)
- Both buttons same style: orange accent background, equal width
- Reduce card padding from `p-3`/`p-4` to `p-2 sm:p-4`
- Add `flex flex-col` + `h-full` to the card and use `mt-auto` on actions to align buttons at the same level across cards

**2. `src/index.css`**
- Reduce `.container-main` horizontal padding on mobile from `px-4` to `px-2` — gives more space to product cards
- Product grids will have slightly wider cards

**3. `src/components/home/FlashSaleSection.tsx`**
- Reduce grid gap from `gap-4` to `gap-2 sm:gap-4` on mobile
- Reduce section padding from `p-4` to `p-2 sm:p-4` on mobile

**4. All product grid pages** (FeaturedProducts, Deals, Search, NewArrivals, etc.)
- Change grid gap from `gap-4` to `gap-2 sm:gap-4` on mobile for consistency

### Result
- Buttons always side-by-side (matching reference image)
- Cards are wider on mobile (less wasted padding/gap)
- All cards same height with buttons aligned at bottom

