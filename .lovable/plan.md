

## Plan: Enhanced Customer Dashboard Feature Cards

### Summary
Add professional, Amazon-style feature cards to the dashboard Overview section with the three requested sections: My Orders, Login & Security, and My Addresses. Each card will have an icon, title, description, and clickable action that navigates to the correct tab.

---

### Changes

**File: `src/pages/Account.tsx`**

1. **Add feature cards section** after the Stats Grid (around line 448) in the Overview tab:
   - **My Orders** card: Icon (Package), title, description "Track, return, cancel an order, download invoice or buy again" → navigates to `orders` tab
   - **Login & Security** card: Icon (Shield), title, description "Edit login, name, and mobile number" → navigates to `settings` tab
   - **My Addresses** card: Icon (MapPin), title, description "Edit, remove or set default address" → navigates to `addresses` tab

2. Each card styled as a clickable card with:
   - Left icon in colored container
   - Title + description text
   - Right chevron arrow
   - Hover shadow/border effect

3. **Add "Buy Again" button** to the orders section for delivered orders (alongside existing Cancel/Return buttons)

4. **Add "Download Invoice" button** to expanded order details — generates a simple text-based invoice download

No database or backend changes needed. This is purely a UI enhancement.

---

### Files

| File | Action |
|------|--------|
| `src/pages/Account.tsx` | Add feature cards to Overview, add Buy Again + Download Invoice buttons to orders |

