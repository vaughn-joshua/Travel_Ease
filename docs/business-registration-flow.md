## Business Registration Flow – Current Implementation

This document describes how the **current business registration process** works across the Travel Ease frontend and backend. It is intended as a reference so you can safely redesign the flow.

---

## 1. Frontend entry points & routing

### 1.1 Main routes (`Travel_Ease_Frontend/src/App.tsx`)

- **Create business**
  - `"/businesses/onboarding"` → wrapped in `RequireSupabaseAuth` → renders `BusinessForm`.
  - `"/businesses/new"` → same as above, also renders `BusinessForm`.
  - These are the **primary entry points** for registering a new business.

- **Edit business**
  - `"/businesses/:id/edit"` → wrapped in `RequireSupabaseAuth` → renders `BusinessForm` again.
  - `BusinessForm` checks `useParams<{ id: string }>()`:
    - If `id` exists → **edit mode**.
    - If no `id` → **create mode**.

- **My businesses (owner dashboard)**
  - `"/businesses/my"` → wrapped in `RequireSupabaseAuth` → renders `MyBusinesses`.
  - `MyBusinesses`:
    - Uses `useMyBusinesses()` to fetch the businesses owned by the current user.
    - Shows “Register a Business” / “+ Add Business” that links to `"/businesses/onboarding"`.
    - Shows per‑business “Edit” buttons linking to `"/businesses/:id/edit"`.

### 1.2 Auth guard (`Travel_Ease_Frontend/src/routes/AuthRoutes.tsx`)

- **`RequireSupabaseAuth`**
  - Ensures **Supabase Google OAuth** is configured and active.
  - Verifies that the Google account email matches the stored user email:
    - Uses a `BUSINESS_AUTH_EMAIL_KEY` localStorage value to remember which email to compare against on callback.
  - If not verified:
    - Shows blocking UI with options to retry Google sign‑in or cancel.
  - If verified:
    - Renders the children (e.g. `BusinessForm`, `MyBusinesses` routes).

**Effect:** all registration and management routes for businesses require the user to be:

1. Logged in (local auth / JWT).
2. Verified via Google OAuth, with a matching email.

---

## 2. Frontend registration form behavior

### 2.1 Core form component (`Travel_Ease_Frontend/src/pages/BusinessForm.tsx`)

`BusinessForm` is the **single canonical UI** for both creating and editing a business.

- **Mode detection**
  - `const { id } = useParams<{ id: string }>();`
  - `const isEdit = Boolean(id);`
  - If `isEdit` and `id` is present:
    - Calls `businessApi.getBusiness(id)` to fetch existing business data.
    - Maps the returned DTO into the local `formData` state.

- **Form state structure (`FormData` interface)**
  - Basic info:
    - `name: string`
    - `description: string`
  - Categories:
    - `categories: string[]`
    - Values match client‑side category keys: `"food"`, `"drinks"`, `"accomodation"`, `"souvenir shop"`, `"nature"`, `"night life"`, `"leisure"`, `"activities"`, `"local offers"`.
  - Operating hours:
    - `hours: { day: string; start: string; end: string; closed: boolean }[]`
    - Default hours: 09:00–17:00 for all days, Sunday closed.
  - Price range:
    - `priceMin: string`
    - `priceMax: string`
  - Media:
    - `coverImage: string` (URL)
    - `gallery: string[]` (URLs)
  - Address & location:
    - `houseNumber: string`
    - `street: string`
    - `brgy: string`
    - `city: string` (defaults to `"Tagaytay"`)
    - `lat: number | null`
    - `lng: number | null`

### 2.2 Editing existing businesses

When `isEdit` and `id` is set:

- Calls `businessApi.getBusiness(id)` (GET `/business/fetch_business/:id`).
- Maps the response into `formData`:
  - `name`, `description`
  - `categories` → from `data.categories.map(c => c.name)`
  - `hours` → derived from `data.hours[day.toLowerCase()]`
  - `priceMin`, `priceMax` → from `data.priceRange`
  - `coverImage`, `gallery` → from `data.media`
  - `houseNumber`, `street`, `brgy`, `city` → from a split `location.address` string
  - `lat`, `lng` → from `data.location`

### 2.3 User interactions inside `BusinessForm`

- **Categories**
  - Rendered as selectable buttons.
  - Clicking toggles membership in `formData.categories`.

- **Operating hours**
  - For each day:
    - A “Closed” checkbox.
    - If not closed: two `<input type="time">` fields for `start` and `end`.
  - `updateHours(index, field, value)` mutates hours in `formData`.

- **Price range**
  - Min and max price inputs (`type="number"`).
  - Simple client‑side constraints (min >= 0).

- **Images**
  - Uses `api.post("/utils/upload_images", FormData)` to upload files.
  - For cover:
    - Single file upload; first `secure_url` is stored as `coverImage`.
  - For gallery:
    - Multiple files; appended to `gallery` from `data.secure_url`.

- **Location & map**
  - Address fields:
    - `street` and `brgy` trigger `autoSearchFromAddress` on blur.
    - `autoSearchFromAddress` calls backend `/map/search` with a combined query of `street`, `brgy`, `city`.
    - If a result is found, sets `lat`/`lng` to the first place’s coordinates.
  - Free text map search:
    - The “Search Location on Map” field calls `/map/search` with a custom query and displays a dropdown of candidate places.
    - Selecting a result updates `lat`/`lng`.
  - Map:
    - Uses `RegisterMap` component with:
      - `pins` array (either empty or one pin using `formData.lat`/`lng`).
      - `onPinMove(lat, lng)` callback, which updates `formData.lat`/`lng`.
      - Clicking on the map with no existing pin places a new marker.
      - Marker is draggable and updates coordinates on drag end.

### 2.4 Submit logic and payload shape

`handleSubmit` builds the payload expected by the backend and calls the appropriate API:

- **Validation** (simplified)
  - Ensures:
    - `name` is not empty.
    - At least one category selected.
    - `city` is not empty.
  - Stores any validation errors in a local `errors` state.

- **Payload for create/update**
  ```ts
  const payload = {
    name: formData.name.trim(),
    description: formData.description.trim(),
    house_no: formData.houseNumber.trim(),
    street: formData.street.trim(),
    brgy: formData.brgy.trim(),
    city: formData.city.trim(),
    lat: formData.lat,
    lng: formData.lng,
    secure_url: JSON.stringify({
      secure_url: [formData.coverImage, ...formData.gallery].filter(Boolean),
    }),
    category: formData.categories, // string[]
    business_hrs: formData.hours
      .filter((h) => !h.closed)
      .map((h) => ({ day: h.day, start: h.start, end: h.end })),
    min_price: formData.priceMin ? parseInt(formData.priceMin) : 0,
    max_price: formData.priceMax ? parseInt(formData.priceMax) : 0,
  };
  ```

- **Create vs edit**
  - If `isEdit`:
    - `businessApi.updateBusiness(id!, payload)` → `PUT /business/edit_business/:id`.
  - Else:
    - `businessApi.createBusiness(payload)` → `POST /business/create_business`.

- **After success**
  - Shows a success message:
    - “Business created!” or “Business updated!”
  - Navigates to `"/businesses/:id"` where `id` is:
    - `result.business_id` from create.
    - The original `id` for update.

---

## 3. Data layer & API contracts

### 3.1 `businessApi` (`Travel_Ease_Frontend/src/services/api.ts`)

- **List businesses**
  - `getBusinesses(params)` → `GET /business/businesses`
  - Returns a paginated list of business DTOs.

- **Get travel spots**
  - `getTravelSpots(params, signal)` → `GET /business/travel_spots`
  - Used for public travel spots listing.

- **Search businesses**
  - `searchBusinesses(query, limit, signal)` → `GET /business/search`
  - Used for map search.

- **Get single business**
  - `getBusiness(id)` → `GET /business/fetch_business/:id`
  - Returns a rich DTO (via backend `formatBusinessToDTO`) used by `BusinessForm` on edit.

- **Create business**
  - `createBusiness(data)` → `POST /business/create_business`
  - Expects the payload built in `BusinessForm`:
    - `name`, `description`, address, `lat`, `lng`, `secure_url`, `category` array, `business_hrs` array, `min_price`, `max_price`.
  - Returns `{ message: string; business_id: number }`.

- **Update business**
  - `updateBusiness(id, data)` → `PUT /business/edit_business/:id`
  - Accepts a flexible payload; backend maps partial fields and aliases.

- **User‑specific businesses**
  - `getMyBusinesses()` → `GET /business/my-businesses`
  - Returns `{ data: MyBusiness[] }`, used by `useMyBusinesses` and `MyBusinesses`.

- **Delete business**
  - `deleteBusiness(id)` → `DELETE /business/delete_business/:id`.

### 3.2 Query keys (`Travel_Ease_Frontend/src/lib/queryKeys.ts`)

- `businessKeys`:
  - `all`: base key for all business queries.
  - `lists()` / `list(params)`: keys for lists (used by directory and filters).
  - `details()` / `detail(id)`: keys for single business detail.
  - `travelSpots(params)`: keys for travel spots endpoint.
  - `categories()`: keys for category list.
  - `menu(businessId)`, `reviews(businessId)`: keys for menu and reviews.

### 3.3 Business hooks (`Travel_Ease_Frontend/src/features/businesses`)

- **Mutations (`mutations.ts`)**
  - `useCreateBusiness()`:
    - `mutationFn: data => businessApi.createBusiness(data)`.
    - On success:
      - Invalidates `businessKeys.lists()`.
      - Invalidates `businessKeys.travelSpots()`.
  - `useUpdateBusiness()`:
    - `mutationFn: ({ id, data }) => businessApi.updateBusiness(id, data)`.
    - On success:
      - Invalidates `businessKeys.detail(id)`.
      - Invalidates `businessKeys.lists()`.
      - Invalidates `businessKeys.travelSpots()`.
  - `useDeleteBusiness()`:
    - `mutationFn: id => businessApi.deleteBusiness(id)`.
    - On success:
      - Invalidates `businessKeys.lists()`.
      - Invalidates `businessKeys.travelSpots()`.

- **Queries (`queries.ts`)**
  - `useBusinessDetail(id)`:
    - Uses `businessApi.getBusiness(id)` to fetch detail for view/edit.
  - `useBusinessList(params)`:
    - Uses `businessApi.getBusinesses(params)` for browsable directory.
  - `useMyBusinesses()`:
    - Uses `businessApi.getMyBusinesses()` for owner’s business dashboard.
    - Only enabled when authenticated via `useAuth`.

---

## 4. Backend registration logic

### 4.1 Routes & middleware (`Travel_Ease_Backend/src/routes/businessRoutes.ts`)

- **Create business**
  - `POST /business/create_business`
  - Middleware:
    - `authenticateToken` → verifies JWT and attaches `req.user`.
    - `requireGoogleAuth` → ensures the request comes from a valid Google OAuth session.
    - `validate(createBusinessSchema)` → validates payload against Zod/Joi schema.
    - `create_business` → controller that performs DB writes.

- **Edit business**
  - `PUT /business/edit_business/:id`
  - Middleware:
    - `authenticateToken`
    - `requireGoogleAuth`
    - `requireBusinessOwnership` → ensures `req.user.id` owns the business.
    - `validate(editBusinessSchema)`
    - `edit_business` → controller that updates the business and related records.

- **My businesses (owner view)**
  - `GET /business/my-businesses`
  - Middleware:
    - `authenticateToken`
    - `requireGoogleAuth`
  - Handler:
    - Uses `prisma.business.findMany` with `where: { user_id: userId }`.
    - Includes `business_category` and `business_hours`.

- **Public read endpoints**
  - `GET /business/fetch_business/:id` → `business_fetch` (used by `BusinessForm` edit path).
  - `GET /business/businesses` → `get_businesses`.
  - `GET /business/travel_spots` → travel spots listing.
  - `GET /business/travel_spots/reviews/:id` → reviews for travel spots.

### 4.2 `create_business` controller

File: `Travel_Ease_Backend/src/modules/business/controllers/createBusiness.ts`

- **Inputs from `req.body`**
  - `name`, `house_no`, `street`, `brgy`, `city`
  - `description`
  - `lat`, `lng`
  - `secure_url`
  - `business_hrs` (array of `{ day: string; start?: string; end?: string }`)
  - `category` (currently unused in DB creation)
  - `min_price`, `max_price`

- **Ownership**
  - Uses `req.user!.id` (from `authenticateToken`) as `user_id` for the new business.

- **DB transaction**
  - Creates a `business` row:
    - `user_id`, `name`
    - `house_number`, `street`, `brgy`, `city`
    - `latitude = lat`
    - `longtitude = lng` (DB column uses `longtitude` typo)
    - `description`
    - `picture = secure_url` (stored as provided, not JSON‑wrapped here)
    - `min_price`, `max_price`
    - `status = true` → newly created business is **immediately active** (visible in travel spots).
  - If `business_hrs` exists:
    - Creates `business_hours` rows for each element:
      - `day_of_week = day`
      - `open_time` / `close_time` are parsed as `Date` from `start`/`end` times.
  - Category creation is **skipped** at the moment (TODO in comments) because the DB uses `subcategory_id`, and the frontend sends category names.

- **Response**
  - `201 Created` with:
    - `{ message: "successfully created a business", business_id: result.business_id }`

### 4.3 `edit_business` controller

File: `Travel_Ease_Backend/src/modules/business/controllers/editBusiness.ts`

- **Inputs**
  - `id` from `req.params`.
  - `updateData` from `req.body` (partial update).

- **Transaction steps**
  1. Finds the target business; if not found, throws a custom `notFound` error → 404.
  2. Builds `businessUpdateData` mapping a variety of aliases:
     - Basic fields:
       - `updateData.name` → `name`
       - `updateData.description` → `description`
     - Address:
       - `updateData.house_no` or `updateData.house_number` → `house_number`
       - `updateData.street` → `street`
       - `updateData.brgy` → `brgy`
       - `updateData.city` → `city`
     - Coordinates:
       - `lat = updateData.lat ?? updateData.latitude`
       - `lng = updateData.lng ?? updateData.longitude ?? updateData.longtitude`
       - Mapped to `business.latitude` and `business.longitude` (note: the service layer often masks the `longtitude` typo).
     - Picture:
       - `picture = updateData.secure_url ?? updateData.picture`
     - Other fields:
       - `rating`, `status`
       - `min_price`, `max_price`
  3. Updates `business` row with `businessUpdateData`.
  4. Category updates:
     - If `updateData.category` is an array:
       - Deletes all existing `business_category` for that business.
       - Treats each item in `updateData.category` as a `subcategory_id` (numeric or parseInt string) and creates new entries.
  5. Business hours updates:
     - If `updateData.business_hrs` is an array:
       - Deletes existing `business_hours` for that business.
       - Creates new rows from `{ day, start, end }` with `day_of_week` and `open_time`/`close_time` as time.
  6. Fetches the updated business with `business_category` and `business_hours` and returns it.

- **Response**
  - `{ message: "Business updated successfully", business: result, business_id }`

### 4.4 DTO layer & detail fetch

- **Service (`Travel_Ease_Backend/src/services/businessService.ts`)**
  - `formatBusinessToDTO(business)`:
    - Reads `min_price`/`max_price` and produces:
      - `priceRange: { min: number; max: number } | null`
      - Follows rules:
        - Both null → `priceRange = null`
        - Only min set → `{ min: min_price, max: min_price }`
        - Only max set → `{ min: max_price, max: max_price }`
        - Both set → `{ min: min_price, max: max_price }`
    - Parses `picture`:
      - If parsed JSON has `secure_url`, wraps into:
        - `media.cover` (first URL or string)
        - `media.gallery` (array of URLs)
      - On parse failure, treats `picture` as a single fallback cover URL.
    - Aggregates `business_hours` into:
      - `hours[day] = { open, close }` for each `day_of_week`.
    - Builds `location`:
      - `lat`, `lng`
      - `address` as `"house_number, street, brgy, city"` (joined string).
    - Adds reviews, menu items, owner info.

- **Detail controller (`Travel_Ease_Backend/src/modules/business/controllers/businessFetch.ts`)**
  - Loads a single business with:
    - `business_category`, `business_hours`, `menu_item`, `business_review`, `user`.
  - Returns `formatBusinessToDTO(business)` to the frontend.

---

## 5. Domain rules & schema constraints

### 5.1 Prisma models (`Travel_Ease_Backend/prisma/schema.prisma`)

- **`business`**
  - Core business/establishment record:
    - `business_id`, `user_id`, `name`
    - `house_number`, `street`, `brgy`, `city`
    - `latitude`, `longtitude`
    - `description`
    - `rating` (`Decimal(3,1)`)
    - `status: Boolean? @default(false)`
    - `picture: String?`
    - `min_price: Int?`
    - `max_price: Int?`
  - Relationships:
    - `business_hours`, `business_category`, `business_review`, `menu_item`, `activity`, `business_favorite`
  - Indexes on:
    - `city`, `min_price`, `max_price`, `rating`, `status`, `(status, rating)`, `user_id`

- **`business_hours`**
  - `id`, `business_id`
  - `day_of_week`, `open_time`, `close_time`
  - Used to define weekly operating hours per business.

- **`business_category` & `subcategory`**
  - `business_category`:
    - `category_id`, `business_id`, `subcategory_id`
    - Links a business to one or more `subcategory` records.
  - `subcategory`:
    - `subcategory_id`
    - `main_category: category` (enum)
    - `subcategory_name: String`
    - Related `business_category` and `price_range`.
  - This pair defines the **structured category system** for businesses.

- **`price_range`**
  - Separate table associating price ranges with subcategories; business price is now stored directly in the `business` table via `min_price`/`max_price`.

### 5.2 Business rules from code

- **Status state machine**
  - Comments in controllers describe:
    - `status = false` → Draft / Inactive → not shown in public listings.
    - `status = true` → Active → visible in `/business/travel_spots`.
    - Transitions allowed both ways via `edit_business`.
  - **Current behavior**:
    - `create_business` sets `status = true`, so new businesses are immediately active.

- **Price range rules**
  - Controllers and service enforce these semantics:
    - Both `min_price` and `max_price` null → price not set.
    - Only `min_price` set → minimum price known.
    - Only `max_price` set → maximum price known.
    - Both set → `min_price <= max_price` enforced at validation level.

- **Ownership & Google auth**
  - All write operations for businesses (create, edit, delete, my‑businesses) require:
    - Valid JWT (`authenticateToken`).
    - Valid Google OAuth session (`requireGoogleAuth`).
  - Edits and deletes additionally require:
    - `requireBusinessOwnership` checking `user_id` of the business against `req.user.id`.

---

## 6. Legacy / secondary registration UIs

These components relate to business registration but are not the primary path anymore.

- **`Travel_Ease_Frontend/src/components/business/Register.tsx`**
  - Modal, multi‑step form (name, categories, description, address, hours, picture, map pin).
  - Uses `react-hook-form`.
  - The actual submission (`create_business`) is commented out:
    - `// await create_business(data);`
  - **Likely legacy or experimental**; not wired into `App.tsx` routes.

- **`Travel_Ease_Frontend/src/components/business/EditBusiness.tsx`**
  - Modal edit form using `useUpdateBusiness`.
  - Similar steps to `Register.tsx`, including price range and hours.
  - Also not wired into main routes (current edit route uses full‑page `BusinessForm`).
  - **Likely deprecated**.

- **`Travel_Ease_Frontend/src/components/business/AddProduct.tsx`**
  - Modal for “Complete Business Details”:
    - Uploads menu images via `upload_images`.
    - Updates `picture` and optionally `min_price`/`max_price` on the business using `useUpdateBusiness`.
  - More of a **post‑registration enhancement** (menu and price) than part of initial registration.

- **`Travel_Ease_Frontend/src/components/business/RegisterMap.tsx`**
  - Shared Leaflet map component:
    - Handles default center, click‑to‑place behavior, and draggable marker.
  - Used by both legacy components and `BusinessForm` as the underlying map/pin UI.

- **`Travel_Ease_Frontend/src/components/business/BusinessHours.tsx`**
  - Minimal stub with no meaningful logic.
  - Not used in active flows.

---

## 7. Recommended starting points for a new registration process

If you are going to redesign the business registration flow, this is the recommended order of changes:

1. **Update `BusinessForm` (UX + payload model)**
   - This is the central point where users enter business data.
   - Make your changes here first:
     - New steps, fields, or validation logic.
     - Different handling of status (e.g. start as Draft).
     - Different rules for required fields (e.g. requiring map pin, cover image, or specific categories).
   - Ensure `handleSubmit` still builds a payload that the backend understands (or update backend accordingly).

2. **Align `businessApi` methods and TanStack mutations**
   - Once the new payload shape is defined, make sure:
     - `createBusiness` and `updateBusiness` accept and send the correct fields.
     - Any new endpoints or flows (e.g. draft creation, approval workflow) are exposed here.
   - Optionally, migrate `BusinessForm` to use `useCreateBusiness` and `useUpdateBusiness` instead of calling `businessApi` directly.

3. **Adjust backend controllers and validation**
   - Update `createBusinessSchema` and `editBusinessSchema` to reflect your new required/optional fields and cross‑field rules.
   - Update `create_business` and `edit_business` to:
     - Properly map new fields to the `business` model and related tables.
     - Handle categories in a more robust way (e.g. mapping category names to `subcategory_id`).
     - Enforce new business states (e.g. create as Draft, separate approval step to mark Active).

4. **Evolve the schema and service layer if needed**
   - If your new flow introduces new domain concepts (e.g. verification, multi‑tenant ownership, approval workflows, richer price structures):
     - Extend `schema.prisma` (new fields, tables, or relations).
     - Update `businessService` DTOs so frontend receives consistent data.

5. **Clean up or integrate legacy components**
   - Decide whether to:
     - Remove `Register.tsx`, `EditBusiness.tsx`, and `AddProduct.tsx` if they are no longer used; or
     - Refactor them to reuse `BusinessForm` logic or call the same APIs consistently.
   - This will reduce confusion and keep the registration behavior in a single, well‑maintained place.

6. **Update or add tests**
   - Validate the new flow end‑to‑end by updating:
     - `Travel_Ease_Backend/tests/business.test.ts` (business endpoints).
     - `Travel_Ease_Backend/tests/services/businessService.test.ts` (DTO, hours, media, price).
     - `Travel_Ease_Backend/tests/auth-flow.test.ts` (auth and Google‑auth requirements).
   - Add new tests for any new states or transitions (e.g., Draft → Active, approval flows).

---

This file now serves as a single, comprehensive reference for the current business registration flow and how to evolve it.


