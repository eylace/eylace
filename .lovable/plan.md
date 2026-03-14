

## Admin Dashboard Header — Quick Navigation Bar

The uploaded image shows a **top navigation bar** with icon buttons (globe, clipboard, settings), quick-access tabs (Dashboard, Orders, Preorders, Earnings, Homepage Settings), and an "Add New +" button. This needs to be added to the `AdminLayout` header.

### What will be built

A **quick-access navigation strip** inside the admin header (`AdminLayout.tsx`) containing:

1. **3 Icon Buttons** (left side):
   - **Globe** → links to the live storefront (`/`)
   - **Clipboard/Pages** → links to admin pages/reports
   - **Sliders/Settings** → links to admin settings

2. **Navigation Tabs** (center):
   - **Dashboard** → `/admin`
   - **Orders** → `/admin/orders`
   - **Preorders** → `/admin/preorder`
   - **Earnings** → `/admin/transactions`
   - **Homepage Settings** → `/admin/website-setup`

3. **"Add New +" Button** (right side):
   - Opens a dropdown or navigates to `/admin/products/add`

### Implementation

**File: `src/components/admin/AdminLayout.tsx`**
- Add a secondary navigation row below the existing header (or integrate into the header)
- Use `NavLink` or `useLocation` to highlight the active tab
- Icon buttons use `lucide-react` icons: `Globe`, `ClipboardList`, `SlidersHorizontal`
- "Add New +" uses a `Button` with `Plus` icon
- Responsive: hide tab labels on small screens, show icons only
- Style matches the reference image: clean, minimal, with subtle hover/active states

### Technical details

- All links use React Router's `useNavigate` or `Link`
- Active tab detection via `useLocation().pathname`
- The bar renders only in the admin layout, no new pages needed
- No database changes required

