

# "Deliver to" Location Picker Popup in Header

## What We're Building
When a customer clicks "Deliver to" in the header, a dialog popup opens with Bangladesh's full address hierarchy: **বিভাগ (Division) → জেলা (District) → উপজেলা/থানা (Upazila/Thana)**. The selected address is saved to localStorage (and to the user's profile if logged in) and displayed in the header.

## Changes

### 1. Create `src/data/bangladeshLocations.ts`
- A static data file containing all 8 divisions of Bangladesh, each with their districts, and each district with their upazilas/thanas
- Structure: `{ divisions: [{ name, nameBn, districts: [{ name, nameBn, upazilas: [{ name, nameBn }] }] }] }`

### 2. Create `src/contexts/DeliveryLocationContext.tsx`
- Context to store the selected delivery location (division, district, upazila, full address string)
- Persists to `localStorage` so it survives page refresh
- If user is logged in, also saves to `profiles` table (city, state fields)
- Provides `location` object and `setLocation` + `clearLocation` methods
- Exposes `isPickerOpen` / `openPicker` / `closePicker` state for the dialog

### 3. Create `src/components/location/DeliveryLocationPicker.tsx`
- A Dialog component with 3 cascading select dropdowns:
  - **বিভাগ (Division)** — 8 divisions
  - **জেলা (District)** — filtered by selected division
  - **উপজেলা/থানা (Upazila)** — filtered by selected district
- Optional street address input field
- "Save" button that updates the context and closes the dialog
- Bilingual labels (EN/BN) for all divisions, districts, upazilas

### 4. Update `src/components/layout/Header.tsx`
- Make the existing "Deliver to" section (lines 52-58) clickable → calls `openPicker()`
- Display the saved location (e.g., "Mirpur, Dhaka") instead of the static "Dhaka 1200"
- Import and render `<DeliveryLocationPicker />` in the header

### 5. Update `src/i18n/translations.ts`
- Add keys: `location.selectDivision`, `location.selectDistrict`, `location.selectUpazila`, `location.saveAddress`, `location.title`, `location.streetAddress`

### 6. Wire into `App.tsx`
- Wrap app with `DeliveryLocationProvider`

## Technical Notes
- Bangladesh has 8 divisions, 64 districts, ~495 upazilas — the static data file will be comprehensive
- The selected location can later be used by checkout to pre-fill shipping address fields
- No database migration needed — uses existing `profiles` table fields (city, state)

