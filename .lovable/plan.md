

## Plan: IP Block System & Order IP Detection

### Overview
Build a complete IP detection and blocking system: capture customer IP at checkout, display it in the admin orders table, and provide a dedicated "IP Block" admin section for managing blocked IPs. Blocked IPs will be checked at checkout to prevent fake orders.

### Database Changes

**1. Add `customer_ip` column to `orders` table**
- New nullable text column to store the IP address captured during order creation

**2. Create `blocked_ips` table**
- Columns: `id`, `ip_address` (unique), `reason`, `blocked_by` (user_id), `created_at`
- RLS: Admin-only for all operations

### Backend Changes

**3. Create Edge Function `detect-ip`**
- Simple function that returns the caller's IP from request headers (`x-forwarded-for`, `x-real-ip`, or connection info)
- Called from checkout before order creation

**4. Create Edge Function `check-blocked-ip`**
- Accepts an IP, checks against `blocked_ips` table, returns blocked status
- Called at checkout to prevent blocked IPs from placing orders

### Frontend Changes

**5. Update Checkout flow (`src/pages/Checkout.tsx`)**
- Before creating an order, call `detect-ip` to get customer IP
- Check against `check-blocked-ip`; if blocked, show error and prevent order
- Include `customer_ip` in the order payload

**6. Update Admin Orders Table (`AdminOrdersTab.tsx`)**
- Add IP column to the orders table showing `customer_ip`
- Add a "Block IP" option in the three-dot menu per order

**7. Create IP Block Admin Page (`src/pages/AdminIpBlock.tsx`)**
- List all blocked IPs with reason and date
- Add new IP manually with reason
- Unblock (delete) existing entries
- Search/filter functionality

**8. Update Admin Sidebar (`AdminSidebar.tsx`)**
- Add "IP Block" item under the Operations section with a `ShieldAlert` or `Ban` icon

**9. Update App Router (`App.tsx`)**
- Add route for `/admin/ip-block` pointing to the new page

### Technical Details
- IP detection uses `x-forwarded-for` header in the edge function (standard for proxied environments)
- The `blocked_ips` table uses a unique constraint on `ip_address` to prevent duplicates
- Guest and authenticated orders both capture IP equally
- The `DashboardIncompleteOrders` conversion flow will also carry forward the IP if available

