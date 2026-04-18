# TravelEase API Endpoint Reference

This document summarizes the backend API surface defined in the current codebase.

- Backend base URL in local development: `http://localhost:3001`
- Global API prefix: `/api`
- Route mounts are defined in `Travel_Ease_Backend/server.ts`
- Route handlers are defined in `Travel_Ease_Backend/src/routes/*.ts`
- Total mounted route handlers: `96` including `/api/health`

## Access Legend

- `Public`: no authentication required
- `Optional auth`: works without auth, but may include user-specific state when authenticated
- `Auth`: requires a valid authenticated user
- `Google`: requires a Google-authenticated user in addition to auth
- `Owner`: requires ownership of the target resource
- `Plan owner`: requires ownership of the target travel plan
- `Business owner`: requires ownership of the target business
- `Activity access`: requires access to the target activity
- `SUPER_ADMIN`, `LGU_ADMIN`: requires that role

## Mounted Route Groups

| Base path | Source file |
|---|---|
| `/api/travel_plan` | `Travel_Ease_Backend/src/routes/travelPlanRoutes.ts` |
| `/api/user` | `Travel_Ease_Backend/src/routes/userRoutes.ts` |
| `/api/utils` | `Travel_Ease_Backend/src/routes/utilsRoutes.ts` |
| `/api/config` | `Travel_Ease_Backend/src/routes/configRoutes.ts` |
| `/api/business` | `Travel_Ease_Backend/src/routes/businessRoutes.ts` |
| `/api/business` | `Travel_Ease_Backend/src/routes/businessSearchRoutes.ts` |
| `/api/blogs` | `Travel_Ease_Backend/src/routes/blogRoutes.ts` |
| `/api/reviews` | `Travel_Ease_Backend/src/routes/reviewRoutes.ts` |
| `/api/map` | `Travel_Ease_Backend/src/routes/mapRoutes.ts` |
| `/api/notification` | `Travel_Ease_Backend/src/routes/notificationRoutes.ts` |
| `/api/traffic` | `Travel_Ease_Backend/src/routes/trafficRoutes.ts` |
| `/api/weather` | `Travel_Ease_Backend/src/routes/weatherRoutes.ts` |
| `/api/health` | `Travel_Ease_Backend/server.ts` |

## User Endpoints

Base path: `/api/user`

| Method | Path | Access | Purpose |
|---|---|---|---|
| `POST` | `/register` | Public | Register a new account. |
| `POST` | `/login` | Public | Log in with credentials. |
| `POST` | `/oauth` | Auth | Sync an OAuth-authenticated user with the app database. |
| `GET` | `/me` | Auth | Get the current user profile. |
| `PUT` | `/profile` | Auth | Update the current user profile. |
| `DELETE` | `/account` | Auth | Delete the current user account. |
| `POST` | `/disconnect-google` | Auth | Disconnect the current user from Google. |
| `POST` | `/set-password` | Auth | Set a password for the current user. |
| `POST` | `/upgrade-to-agency` | Auth | Upgrade the current user to a travel agency role. |
| `GET` | `/search` | Auth | Search users for collaborator autocomplete. |
| `POST` | `/favorite` | Auth | Add a favorite entry. |
| `DELETE` | `/favorite` | Auth | Remove a favorite entry. |
| `GET` | `/favorite/:id` | Auth | Fetch or check a favorite item by id. |
| `GET` | `/user/:id` | Auth | Fetch a user by id. |
| `GET` | `/admin/users` | Auth + `SUPER_ADMIN` | List all users. |
| `PUT` | `/admin/users/:userId/role` | Auth + `SUPER_ADMIN` | Change a user's role. |

### User Notes

- `register` is rate-limited to 3 registrations per hour per IP.
- `login` is rate-limited to 5 attempts per minute per IP.

## Travel Plan Endpoints

Base path: `/api/travel_plan`

| Method | Path | Access | Purpose |
|---|---|---|---|
| `GET` | `/public_plans` | Optional auth | Browse public travel plans. |
| `POST` | `/quick_join` | Public | Entry point for the quick-join flow. |
| `POST` | `/request_join` | Auth | Submit a join request for a plan. |
| `PUT` | `/:id/approve/:participantId` | Auth + Plan owner | Approve a pending participant. |
| `DELETE` | `/:id/deny/:participantId` | Auth + Plan owner | Deny a pending participant. |
| `GET` | `/all` | Auth | Fetch grouped plan data in a single call. |
| `GET` | `/ongoing_plan` | Auth | Fetch the current ongoing plan. |
| `GET` | `/plans` | Auth | Fetch the current user's plans. |
| `GET` | `/previous_plans` | Auth | Fetch previous or completed plans. |
| `GET` | `/plans/:id` | Auth | Fetch a specific plan. |
| `GET` | `/activities/:id` | Auth | Fetch activities for a plan. |
| `POST` | `/create_plan` | Auth | Create a new travel plan. |
| `POST` | `/create_activity` | Auth | Create a new activity. |
| `GET` | `/:id/pending_requests` | Auth + Plan owner | Get pending join requests for a plan. |
| `PUT` | `/edit_plan/:id` | Auth + Plan owner | Edit a travel plan. |
| `PUT` | `/activity_edit/:id` | Auth + Activity access | Edit an activity. |
| `PATCH` | `/activity/:id/priority` | Auth + Activity access | Toggle activity priority. |
| `PUT` | `/collaborators_edit/:id` | Auth + Plan owner | Edit plan collaborators. |
| `PUT` | `/update_activity/:id` | Auth + Plan owner | Update an activity through the owner flow. |
| `PUT` | `/join_plan` | Auth | Join a plan directly. |
| `DELETE` | `/delete_activity/:id` | Auth + Activity access | Delete an activity. |
| `GET` | `/:id/user-role` | Auth | Get the current user's role in a plan. |
| `GET` | `/:id/participants` | Auth | List plan participants. |
| `POST` | `/:id/participants` | Auth + Plan owner | Add a participant. |
| `PUT` | `/:id/participants/:userId` | Auth + Plan owner | Update a participant. |
| `DELETE` | `/:id/participants/:userId` | Auth + Plan owner | Remove a participant. |

### Travel Plan Notes

- This router mixes REST-like paths with action-style paths such as `/create_plan`, `/edit_plan/:id`, and `/join_plan`.
- Participation flows are split between direct joining and request/approval flows.

## Business Endpoints

Base path: `/api/business`

| Method | Path | Access | Purpose |
|---|---|---|---|
| `POST` | `/create_business` | Auth + Google | Create a business listing. |
| `GET` | `/fetch_business/:id` | Public | Fetch a business by id. |
| `GET` | `/fetch_categories/:id` | Public | Fetch categories for a specific business. |
| `GET` | `/businesses` | Public | List businesses. |
| `GET` | `/categories` | Public | List business categories. |
| `PUT` | `/edit_business/:id` | Auth + Google + Business owner | Edit a business. |
| `GET` | `/my-businesses` | Auth + Google | List businesses created or claimed by the current user. |
| `DELETE` | `/delete_business/:id` | Auth + Google + Business owner | Delete a business and related records. |
| `GET` | `/:id/menu` | Public | Get menu items for a business. |
| `POST` | `/:id/menu` | Auth + Google | Create a menu item. |
| `PUT` | `/:id/menu/:itemId` | Auth + Google | Update a menu item. |
| `DELETE` | `/:id/menu/:itemId` | Auth + Google | Delete a menu item. |
| `GET` | `/travel_spots` | Public | Browse approved and LGU-registered travel spots. |
| `GET` | `/travel_spots/reviews/:id` | Public | Get reviews for a travel spot or business. |
| `GET` | `/search` | Public | Search businesses for map and search UI use cases. |
| `GET` | `/pending-registrations` | Auth + `SUPER_ADMIN` or `LGU_ADMIN` | List pending business registrations. |
| `PATCH` | `/status/:id` | Auth + `SUPER_ADMIN` or `LGU_ADMIN` | Change a business status. |
| `POST` | `/search-matches` | Auth | Search exact-name LGU-owned business matches before registration. |

### Business Notes

- `/travel_spots` supports `search`, `city`, `category`, and `limit`.
- `/search` only returns businesses with coordinates.
- Business write endpoints use the Google-auth middleware imported from `middleware/requireGoogleAuth.ts`.
- `/status/:id` accepts business statuses such as `LGU_REGISTERED`, `PENDING`, `APPROVED`, and `REJECTED`.

## Blog Endpoints

Base path: `/api/blogs`

| Method | Path | Access | Purpose |
|---|---|---|---|
| `GET` | `/rss-feed` | Public | Proxy an external RSS or Atom feed. |
| `GET` | `/` | Public | List published blogs with pagination, filtering, and search. |
| `GET` | `/featured` | Public | Get featured published blogs. |
| `GET` | `/overview` | Public | Get the aggregated blogs-page payload. |
| `GET` | `/:slug` | Public | Get a published blog by slug. |
| `POST` | `/` | Auth | Create a blog. |
| `PUT` | `/:id` | Auth + Author | Update an owned blog. |
| `DELETE` | `/:id` | Auth + Author | Delete an owned blog. |

### Blog Notes

- Public blog reads only expose blogs in `Published` status.
- `PUT /:id` enforces valid blog status transitions.
- Although the write routes use a helper named `requireGoogleAuth`, this router defines a local no-op version, so the effective requirement here is authenticated ownership rather than Google-provider-only access.
- `/overview` is a resilience-oriented aggregation endpoint and may return empty arrays with `dbUnavailable: true` when the database is unavailable.
- `/rss-feed` expects a `url` query param and accepts optional `limit` and `keyword`.

## Review Endpoints

Base path: `/api/reviews`

| Method | Path | Access | Purpose |
|---|---|---|---|
| `POST` | `/business` | Auth | Create a business review. |
| `POST` | `/travel_plan` | Auth | Create a travel plan review. |
| `GET` | `/travel_plan/:id` | Public | List reviews for a travel plan. |
| `PUT` | `/business/:id` | Auth + Review owner | Update the caller's business review. |
| `DELETE` | `/business/:id` | Auth + Review owner | Delete the caller's business review. |
| `PUT` | `/travel_plan/:id` | Auth + Review owner | Update the caller's travel plan review. |
| `DELETE` | `/travel_plan/:id` | Auth + Review owner | Delete the caller's travel plan review. |

### Review Notes

- Review update and delete operations explicitly check that the review belongs to the caller.
- Business-review reads are exposed through `/api/business/travel_spots/reviews/:id`, not this router.

## Map Endpoints

Base path: `/api/map`

| Method | Path | Access | Purpose |
|---|---|---|---|
| `POST` | `/search` | Public + rate-limited | Search for places using request body params. |
| `GET` | `/search` | Public + rate-limited | Search for places using query params. |
| `GET` | `/suggestions` | Public + rate-limited | Fetch autocomplete suggestions. |
| `GET` | `/geocode` | Public + rate-limited | Convert an address into coordinates. |
| `GET` | `/reverse` | Public + rate-limited | Convert coordinates into a place result. |
| `POST` | `/route` | Public + rate-limited | Get a route between two points using request body params. |
| `GET` | `/route` | Public + rate-limited | Get a route between two points using query params. |

### Map Notes

- All map routes share a map-specific rate limiter.
- `POST /route` expects `{ origin, destination, profile? }`.
- `GET /route` expects `olat`, `olng`, `dlat`, `dlng`, and optional `profile`.
- Several responses include `X-Cache` headers.

## Notification Endpoints

Base path: `/api/notification`

| Method | Path | Access | Purpose |
|---|---|---|---|
| `GET` | `/` | Auth | List the current user's notifications. |
| `GET` | `/unread-count` | Auth | Get the unread notification count. |
| `PATCH` | `/:id/read` | Auth | Mark one notification as read. |
| `PATCH` | `/read-all` | Auth | Mark all notifications as read. |
| `DELETE` | `/:id` | Auth | Delete a notification. |
| `POST` | `/respond-invitation` | Auth | Accept or decline a plan invitation. |

### Notification Notes

- This router applies `authenticateToken` to the entire router, so every notification endpoint is protected.

## Traffic Endpoints

Base path: `/api/traffic`

| Method | Path | Access | Purpose |
|---|---|---|---|
| `POST` | `/generate-snapshots` | Auth + `SUPER_ADMIN` | Manually generate traffic snapshots. |
| `GET` | `/alternative-suggestion` | Auth | Suggest alternative activities when traffic is heavy. |

### Traffic Notes

- `/alternative-suggestion` accepts either an `origin_activity_id` or `origin_lat` and `origin_lng`, plus a required `destination_activity_id`.
- Traffic levels are classified as `LIGHT`, `MODERATE`, `HEAVY`, or `UNKNOWN`.

## Weather Endpoints

Base path: `/api/weather`

| Method | Path | Access | Purpose |
|---|---|---|---|
| `GET` | `/` | Public | Get realtime or forecast weather by coordinates. |

### Weather Notes

- Required query params: `lat`, `lng`
- Optional query param: `date` in `YYYY-MM-DD`
- When `date` is omitted or is today, the realtime weather endpoint is used.
- When `date` is in the future, the forecast endpoint is used.

## Utility Endpoints

Base path: `/api/utils`

| Method | Path | Access | Purpose |
|---|---|---|---|
| `POST` | `/upload` | Auth | Upload a single image file. |
| `POST` | `/upload_images` | Auth | Upload multiple files or images. |

### Utility Notes

- The router uses `multer`.
- `/upload` expects a single file field named `image`.
- `/upload_images` expects multiple file entries under `files`.

## Config Endpoints

Base path: `/api/config`

| Method | Path | Access | Purpose |
|---|---|---|---|
| `GET` | `/init_db` | Public | Run Prisma generate and Prisma DB push. |
| `GET` | `/db_status` | Public | Check database connectivity. |

### Config Notes

- `/init_db` is a state-changing endpoint even though it is mounted as `GET`.
- Because these endpoints are public in current code, they are operationally sensitive.

## Health Endpoint

| Method | Full path | Access | Purpose |
|---|---|---|---|
| `GET` | `/api/health` | Public | Report service health, timestamp, port, and database status. |

## Overall Observations

- The API style is mixed: some routes are REST-like, while others are action-based.
- Ownership and role enforcement are delegated to middleware, not inferred from route naming.
- Caching is used in several public read endpoints, especially blogs, map, weather, and business travel-spot browsing.
- Some behaviors that matter to consumers are encoded in the route layer itself, such as blog publication filtering and admin-only business status changes.
