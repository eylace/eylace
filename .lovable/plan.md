

## Plan: Fix Size Guide "Add" Button Not Working

### Root Cause
On line 106 of `AdminSizeGuides.tsx`, there's a `<SelectItem value="">All</SelectItem>`. Radix UI's Select component does not support empty string (`""`) as a value — this causes the component to fail silently, preventing the dialog from rendering or functioning properly when opened.

### Fix (1 file)

**`src/pages/AdminSizeGuides.tsx`**
- Change `<SelectItem value="">All</SelectItem>` to `<SelectItem value="all">All</SelectItem>`
- Update `handleSave` to convert `"all"` back to `null` before saving to the database
- Update `openEdit` to map `null`/empty category_id to `"all"`

