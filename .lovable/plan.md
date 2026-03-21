

## Plan: Create All Categories Page

### Problem
The "View All" link in the CategoriesSection on the homepage points to `/categories`, but no such page or route exists.

### Changes

**1. Create `src/pages/Categories.tsx`**
- New page using `Layout` wrapper
- Fetch all categories using `useCategories()` hook
- Display categories in a responsive grid (4 cols mobile, 6-8 cols desktop)
- Each category links to `/category/{slug}` (existing route)
- Show category image/icon, name
- Include breadcrumb: Home > All Categories
- Loading state with spinner

**2. Update `src/App.tsx`**
- Add lazy import for the new Categories page
- Add route: `<Route path="/categories" element={<Categories />} />`

No database changes needed — uses existing `useCategories()` hook and `categories` table.

