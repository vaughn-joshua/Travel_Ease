# TravelEase State Machines & DTOs

This document defines the canonical state machines, transitions, and DTO mappings for the TravelEase system. All backend and frontend code MUST adhere to these definitions.

---

## 1. TravelPlan State Machine

```
┌───────┐     activate()     ┌────────┐     complete()     ┌───────────┐
│ Draft │ ───────────────────► Active │ ────────────────────► Completed │
└───────┘                    └────────┘                    └───────────┘
    │                            │
    │ cancel()                   │ cancel()
    ▼                            ▼
┌───────────┐              ┌───────────┐
│ Cancelled │◄─────────────│ Cancelled │
└───────────┘              └───────────┘
```

### States

| State       | Description                                      | Visibility Allowed? |
|-------------|--------------------------------------------------|---------------------|
| `Draft`     | Plan is being prepared, not yet started          | Yes                 |
| `Active`    | Plan is in progress (start_date ≤ today)         | Yes                 |
| `Completed` | Plan has finished (terminal)                     | No (forced false)   |
| `Cancelled` | Plan was cancelled (terminal)                    | No (forced false)   |

### Valid Transitions

| From       | To          | Trigger                     | Side Effects                          |
|------------|-------------|-----------------------------|---------------------------------------|
| Draft      | Active      | `status = 'Active'`         | None                                  |
| Draft      | Cancelled   | `status = 'Cancelled'`      | `visibility = false`                  |
| Active     | Completed   | `status = 'Completed'`      | `visibility = false`                  |
| Active     | Cancelled   | `status = 'Cancelled'`      | `visibility = false`                  |

### Illegal States / Invariants

1. **No resurrection**: Completed → Draft/Active is FORBIDDEN
2. **No uncancelling**: Cancelled → any other state is FORBIDDEN
3. **No visibility on terminal**: If status ∈ {Completed, Cancelled}, visibility MUST be false
4. **Date ordering**: start_date ≤ end_date (enforced at validation layer)
5. **Slot floor**: max_slots cannot be reduced below current approved participant count

---

## 2. Participant State Machine

```
         request_join()           approve()
              │                       │
              ▼                       ▼
┌──────────────────┐        ┌─────────────────────┐
│  Pending         │────────► Approved            │
│  (status=false)  │        │ (status=true)       │
└──────────────────┘        └─────────────────────┘
        │                           │
        │ deny()                    │ remove()
        ▼                           ▼
    [DELETED]                   [DELETED]
```

### Participant Roles

| Role    | Permissions                                                |
|---------|------------------------------------------------------------|
| Admin   | Full access: edit plan, activities, manage participants    |
| Editor  | Edit activities only                                       |
| Viewer  | Read-only access                                           |

### Invariants

1. **Owner is always Admin**: Plan creator is automatically added as Admin participant with status=true
2. **At least one Admin**: Cannot demote/remove the last Admin from a plan
3. **Slot enforcement**: Approved participants cannot exceed max_slots (if set)
4. **No duplicate participants**: (user_id, travel_plan_id) is unique
5. **Join requires visibility**: Users can only request to join visible plans in Draft/Active status

### Slot Counting Rules

- Only **approved participants** (status=true) count toward max_slots
- Pending requests (status=false) do NOT count toward limit
- When approving, check: `approvedCount < max_slots` (or max_slots is null)

---

## 3. Activity Lifecycle

Activities are simpler - they have no formal state machine, but follow these rules:

### Ownership & Access

| Actor              | Can Create | Can Edit          | Can Delete        |
|--------------------|------------|-------------------|-------------------|
| Plan Owner         | Yes        | Yes               | Yes               |
| Admin Participant  | Yes        | Yes               | Yes               |
| Editor Participant | Yes        | Yes (own + any)   | Yes (own + any)   |
| Viewer Participant | No         | No                | No                |

### Invariants

1. Activity must belong to an existing travel plan
2. target_date should fall within plan's date range (soft validation)
3. budget_range uses predefined enum values

---

## 4. Authentication State Machine (Comprehensive)

### 4.1 Core Authentication Flow

```
┌───────────────────┐                                    ┌───────────────────┐
│  UNAUTHENTICATED  │                                    │   SESSION_INIT    │
│  (no token)       │                                    │  (OAuth redirect) │
└────────┬──────────┘                                    └─────────┬─────────┘
         │                                                         │
         │ email/password login ──────────────────┐                │ OAuth callback
         │                                        │                │
         │ Google OAuth start ────────────────────┼───────────────►│
         │                                        │                │
         ▼                                        ▼                ▼
┌───────────────────┐     auth success     ┌───────────────────────────────┐
│   AUTHENTICATING  │ ────────────────────►│   SESSION_ACTIVE              │
│  (verifying...)   │                      │  (valid Supabase JWT)         │
└────────┬──────────┘                      └───────────────┬───────────────┘
         │                                                 │
         │ auth failed                                     │ backend sync required?
         ▼                                                 ▼
┌───────────────────┐                      ┌───────────────────────────────┐
│   AUTH_FAILED     │                      │   BACKEND_SYNCING             │
│  (error shown)    │                      │  (POST /user/oauth)           │
└───────────────────┘                      └───────────────┬───────────────┘
                                                           │
         ┌─────────────────────────────────────────────────┼─────────────────┐
         │                                                 │                 │
         │ new user (needs profile)                        │ existing user   │ sync failed
         ▼                                                 ▼                 ▼
┌───────────────────┐                      ┌───────────────────┐   ┌─────────────────┐
│   ONBOARDING      │                      │   AUTHENTICATED   │   │   SYNC_FAILED   │
│  (profile form)   │                      │  (fully logged in)│   │  (not registered)│
└────────┬──────────┘                      └─────────┬─────────┘   └─────────────────┘
         │                                           │
         │ profile saved                             │ logout / token expired
         ▼                                           ▼
┌───────────────────┐                      ┌───────────────────┐
│   AUTHENTICATED   │                      │  UNAUTHENTICATED  │
└───────────────────┘                      └───────────────────┘
```

### 4.2 Authentication States

| State | Description | Token Present | Backend Synced |
|-------|-------------|---------------|----------------|
| UNAUTHENTICATED | No active session | No | No |
| SESSION_INIT | OAuth redirect in progress | No | No |
| AUTHENTICATING | Verifying credentials | Pending | No |
| AUTH_FAILED | Authentication error | No | No |
| SESSION_ACTIVE | Valid Supabase JWT | Yes | Pending |
| BACKEND_SYNCING | Syncing with backend | Yes | In Progress |
| SYNC_FAILED | User not in local DB | Yes | Failed |
| ONBOARDING | New user needs profile | Yes | Partial |
| AUTHENTICATED | Fully authenticated | Yes | Yes |

### 4.3 Token Lifecycle State Machine

```
┌─────────────┐      supabase login      ┌─────────────────┐
│  NO_TOKEN   │ ─────────────────────────►│  TOKEN_VALID    │
└─────────────┘                          └────────┬────────┘
      ▲                                           │
      │                                           │ approaching expiry
      │ logout / clear                            ▼
      │                                  ┌─────────────────┐
      │                                  │ TOKEN_EXPIRING  │
      │                                  └────────┬────────┘
      │                                           │
      │         ┌─────────────────────────────────┼─────────────────┐
      │         │ auto-refresh success            │                 │ refresh failed
      │         ▼                                 │                 ▼
      │ ┌─────────────────┐                       │         ┌─────────────────┐
      │ │  TOKEN_VALID    │                       │         │  TOKEN_EXPIRED  │
      │ └─────────────────┘                       │         └────────┬────────┘
      │                                           │                  │
      └───────────────────────────────────────────┴──────────────────┘
```

### 4.4 Token States

| State | Description | API Calls Allowed | Auto-Refresh |
|-------|-------------|-------------------|--------------|
| NO_TOKEN | No token in storage | No (401) | N/A |
| TOKEN_VALID | Token present and valid | Yes | Monitored |
| TOKEN_EXPIRING | Token nearing expiry | Yes | In Progress |
| TOKEN_EXPIRED | Token is invalid | No (403) | Retry once |

### 4.5 User Onboarding State Machine

```
┌───────────────────────────────────────────────────────────────────┐
│                     ONBOARDING FLOW                                │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────┐                                               │
│  │ GOOGLE_OAUTH   │ OAuth callback received                       │
│  └───────┬────────┘                                               │
│          │                                                        │
│          │ authenticateToken middleware                           │
│          ▼                                                        │
│  ┌────────────────┐                                               │
│  │ CHECK_USER     │ Is user in local DB?                          │
│  └───────┬────────┘                                               │
│          │                                                        │
│    ┌─────┴─────┐                                                  │
│    │           │                                                  │
│    │ NO        │ YES                                              │
│    ▼           ▼                                                  │
│  ┌────────────────┐    ┌────────────────┐                         │
│  │ AUTO_PROVISION │    │ CHECK_PROFILE  │                         │
│  │ (create user)  │    │ Is profile_completed?                    │
│  └───────┬────────┘    └───────┬────────┘                         │
│          │               ┌─────┴─────┐                            │
│          │               │           │                            │
│          │               │ NO        │ YES                        │
│          ▼               ▼           ▼                            │
│    ┌────────────────┐  ┌────────────────┐  ┌────────────────┐     │
│    │ NEEDS_PROFILE  │  │ NEEDS_PROFILE  │  │ PROFILE_DONE   │     │
│    │ needsOnboarding│  │ needsOnboarding│  │ redirect home  │     │
│    └───────┬────────┘  └───────┬────────┘  └────────────────┘     │
│            │                   │                                  │
│            └─────────┬─────────┘                                  │
│                      │ PUT /user/profile                          │
│                      ▼                                            │
│               ┌────────────────┐                                  │
│               │ PROFILE_DONE   │                                  │
│               │ profile_completed=true                            │
│               └────────────────┘                                  │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

### 4.6 Onboarding States

| State | `profile_completed` | `needsOnboarding` | Next Action |
|-------|---------------------|-------------------|-------------|
| AUTO_PROVISION | false | true | User created, redirect to /onboarding |
| NEEDS_PROFILE | false | true | Redirect to /onboarding |
| PROFILE_DONE | true | false | Redirect to intended destination |

### 4.6.1 Auto-Provisioning Behavior

When `authenticateToken` or `requireGoogleAuth` middleware verifies a valid Supabase OAuth token but finds no local user record:

1. **AUTO_PROVISION transition is triggered**:
   - Creates minimal user record with `auth_id`, `email`, and name from Supabase metadata
   - Sets `auth_provider='google'` and `profile_completed=false`
   - Logs `AUTO_PROVISIONED` event for audit trail

2. **User proceeds to onboarding** as `needsOnboarding=true`

3. **After profile completion**, `profile_completed` is set to `true` and user is fully authenticated

This eliminates the previous `ACCOUNT_NOT_REGISTERED` (403) error for new OAuth users.

### 4.7 Authorization State Machine

```
┌─────────────────┐                              ┌─────────────────┐
│ UNAUTHENTICATED │  authenticateToken           │  AUTHENTICATED  │
│ (no req.user)   │ ─────────────────────────────►│ (req.user set)  │
└─────────────────┘                              └────────┬────────┘
                                                          │
                                                          │ requireGoogleAuth?
                                                          ▼
                                               ┌─────────────────────┐
                                               │ CHECK_GOOGLE_AUTH   │
                                               │ Is provider=google? │
                                               └──────────┬──────────┘
                                                    ┌─────┴─────┐
                                                    │           │
                                                    │ NO        │ YES
                                                    ▼           ▼
                                              ┌───────────┐ ┌───────────────┐
                                              │ FORBIDDEN │ │ GOOGLE_AUTHED │
                                              │ (403)     │ │ (proceed)     │
                                              └───────────┘ └───────┬───────┘
                                                                    │
                                                                    │ resource permission?
                                                                    ▼
                                                          ┌─────────────────┐
                                                          │ AUTHORIZED      │
                                                          │ (access granted)│
                                                          └─────────────────┘
```

### 4.8 Authorization Levels

| Level | Middleware | Description |
|-------|------------|-------------|
| Public | None | No authentication required |
| Authenticated | `authenticateToken` | Valid JWT required |
| Google Auth | `requireGoogleAuth` | Must have provider=google (for business creation) |
| Owner | `requirePlanOwnership` | Must be plan owner or Admin participant |
| Editor | `requireActivityAccess` | Must be owner, Admin, or Editor participant |

### 4.9 Auth Configuration

| Mode | Condition | Token Verification |
|------|-----------|-------------------|
| **Supabase** (Production) | `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` set | `supabaseAdmin.auth.getUser(token)` |
| **Local JWT** (Test only) | `NODE_ENV=test` + `JWT_SECRET` set | `jwt.verify(token, JWT_SECRET)` |

### 4.10 Protected Resources

| Resource | Auth Level | Notes |
|----------|------------|-------|
| Travel plan CRUD | Authenticated | Owner/Admin for edit |
| Activity CRUD | Authenticated | Editor+ for edit |
| Business create | Google Auth | Requires Google verification |
| Business edit | Authenticated | Owner only |
| Favorites | Authenticated | User's own |
| Reviews | Authenticated | User's own |
| Blogs | Authenticated | Author only |
| Quick Join search | Public | No auth |
| Quick Join request | Authenticated | Creates pending participant |

---

## 5. DTO Field Mappings (Single Source of Truth)

The backend returns **normalized DTOs** with both naming conventions for backward compatibility.

### TravelPlan DTO

| Frontend Field | Backend DB Field   | Type                | Notes                          |
|----------------|--------------------|---------------------|--------------------------------|
| `id`           | `travel_plan_id`   | number              | Primary key                    |
| `title`        | `name`             | string              | Plan name                      |
| `slots`        | `max_slots`        | number \| null      | Participant limit              |
| `is_public`    | `visibility`       | boolean             | Whether joinable               |
| `status`       | `status`           | PlanStatus enum     | Draft/Active/Completed/Cancelled |

Both field names are returned in API responses for compatibility.

### Participant DTO

| Field           | Type              | Notes                              |
|-----------------|-------------------|------------------------------------|
| participant_id  | number            | Primary key                        |
| user_id         | number            | FK to user                         |
| travel_plan_id  | number            | FK to travel plan                  |
| role            | 'Admin' \| 'Editor' \| 'Viewer' | PascalCase           |
| status          | boolean           | false=pending, true=approved       |
| joined_at       | DateTime          | When participant was added         |

### Activity DTO

| Field          | Type              | Notes                              |
|----------------|-------------------|------------------------------------|
| activity_id    | number            | Primary key                        |
| travel_plan_id | number            | FK to travel plan                  |
| user_id        | number            | Creator                            |
| budget_range   | BudgetRange enum  | '0-100', '100-200', etc.           |
| is_priority    | boolean           | Priority flag                      |

### BudgetRange Enum Values

```typescript
type BudgetRange = '0-100' | '100-200' | '200-400' | '400-700' | '700-1000' | '1000-1500' | '1500+';
```

---

## 6. Quick Join Flow

```
1. User searches (POST /api/travel_plan/quick_join)
   - Input: { start_date, end_date, location }
   - Returns: visible plans matching criteria with slot availability

2. User requests to join (POST /api/travel_plan/request_join)
   - Creates Participant with status=false (pending)
   - Requires: plan is visible, status ∈ {Draft, Active}, slots available

3. Owner/Admin approves (PUT /api/travel_plan/:id/approve/:participantId)
   - Sets status=true
   - Checks slot availability before approving

4. Owner/Admin denies (DELETE /api/travel_plan/:id/deny/:participantId)
   - Deletes the pending participant record
```

---

## 7. API Response Patterns

### Success Response

```json
{
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response

```json
{
  "error": "Error description",
  "details": "Additional context"
}
```

### Validation Error

```json
{
  "error": "Validation failed",
  "details": [
    { "field": "title", "message": "Title is required" }
  ]
}
```

---

## 8. Status Transition Matrix

| Current State | Draft | Active | Completed | Cancelled |
|---------------|-------|--------|-----------|-----------|
| Draft         | -     | ✓      | ✗         | ✓         |
| Active        | ✗     | -      | ✓         | ✓         |
| Completed     | ✗     | ✗      | -         | ✗         |
| Cancelled     | ✗     | ✗      | ✗         | -         |

✓ = Allowed transition
✗ = Forbidden transition

---

## 9. App Boot Sequence State Machine

The backend server follows a deterministic boot sequence:

```
┌─────────────────┐
│   INITIALIZING  │  dotenv/config loads env vars
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   ENV_LOADED    │  process.env populated
└────────┬────────┘
         │
         │ Check DATABASE_URL
         ▼
┌─────────────────┐     missing      ┌─────────────────┐
│   DB_CHECKING   │ ────────────────► │   DB_DEGRADED   │ (warn, continue)
└────────┬────────┘                  └────────┬────────┘
         │                                    │
         │ connected (5s timeout)             │
         ▼                                    │
┌─────────────────┐                           │
│   DB_CONNECTED  │◄──────────────────────────┘
└────────┬────────┘
         │
         │ Register middleware & routes
         ▼
┌─────────────────┐
│  ROUTES_READY   │
└────────┬────────┘
         │
         │ app.listen(PORT)
         ▼
┌─────────────────┐
│    LISTENING    │  Server accepting requests
└────────┬────────┘
         │
         │ Process termination signal
         ▼
┌─────────────────┐
│   SHUTTING_DOWN │  prisma.$disconnect()
└─────────────────┘
```

### Boot States

| State | Description | Side Effects |
|-------|-------------|--------------|
| INITIALIZING | Process started, loading dotenv | — |
| ENV_LOADED | Environment variables available | — |
| DB_CHECKING | Testing database connectivity | 5s timeout |
| DB_CONNECTED | Database connection successful | Prisma ready |
| DB_DEGRADED | Database unavailable, server continues | Warning logged |
| ROUTES_READY | All middleware and routes registered | — |
| LISTENING | Server accepting HTTP requests | Port bound |
| SHUTTING_DOWN | Graceful shutdown in progress | Connections closed |

### Boot Invariants

1. Server MUST start even if database is unavailable (degraded mode)
2. CORS origins MUST be validated before route handlers
3. Prisma client is singleton, cached in development
4. Health endpoint MUST report database status

---

## 10. API Request Lifecycle State Machine

Every HTTP request follows this state flow:

```
┌─────────────────┐
│    RECEIVED     │  Express receives request
└────────┬────────┘
         │
         ▼
┌─────────────────┐     CORS fail      ┌─────────────────┐
│   CORS_CHECK    │ ──────────────────► │   ERROR (403)   │
└────────┬────────┘                    └─────────────────┘
         │ pass
         ▼
┌─────────────────┐
│  BODY_PARSING   │  express.json()
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  REQUEST_LOG    │  requestLogger middleware
└────────┬────────┘
         │
         │ Route requires auth?
         ▼
┌─────────────────┐     no token       ┌─────────────────┐
│   AUTH_CHECK    │ ──────────────────► │   ERROR (401)   │
└────────┬────────┘     invalid/expired └─────────────────┘
         │                    │
         │ token valid        │
         ▼                    ▼
┌─────────────────┐     ┌─────────────────┐
│   AUTHORIZED    │     │   ERROR (403)   │
└────────┬────────┘     └─────────────────┘
         │
         │ Zod validation?
         ▼
┌─────────────────┐     validation fail ┌─────────────────┐
│   VALIDATING    │ ──────────────────► │   ERROR (400)   │
└────────┬────────┘                    └─────────────────┘
         │ pass
         ▼
┌─────────────────┐
│   HANDLING      │  Route handler executes
└────────┬────────┘
         │
         │ Prisma query
         ▼
┌─────────────────┐     P1xxx error    ┌─────────────────┐
│   DB_QUERY      │ ──────────────────► │   ERROR (503)   │
└────────┬────────┘     P2xxx error    └─────────────────┘
         │                    │
         │ success            ▼
         ▼              ┌─────────────────┐
┌─────────────────┐     │   ERROR (400)   │
│   RESPONDING    │     └─────────────────┘
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   COMPLETED     │  Response sent, logged
└─────────────────┘
```

### Request States

| State | HTTP Status | Description |
|-------|-------------|-------------|
| RECEIVED | — | Request received by Express |
| CORS_CHECK | 403 on fail | Origin validation |
| BODY_PARSING | 400 on fail | JSON body parsing |
| REQUEST_LOG | — | Structured logging |
| AUTH_CHECK | 401/403 | Token validation (if required) |
| AUTHORIZED | — | User context attached |
| VALIDATING | 400 on fail | Zod schema validation |
| HANDLING | — | Business logic execution |
| DB_QUERY | 400/503 | Prisma database operations |
| RESPONDING | 2xx | Success response |
| ERROR | 4xx/5xx | Error response via errorHandler |
| COMPLETED | — | Request finished |

### Error Code Mapping

| Prisma Code | HTTP Status | Meaning |
|-------------|-------------|---------|
| P1xxx | 503 | Connection/server errors |
| P2002 | 400 | Duplicate constraint |
| P2003 | 400 | Foreign key violation |
| P2025 | 404 | Record not found |
| Other P2xxx | 400 | Client/query errors |

### 10.1 Graceful Degradation for Listings

Public-facing listing endpoints (e.g., `/travel_plan/public_plans`, `/travel_plan/previous_plans`, `/blogs/overview`) implement graceful degradation when the database is unavailable:

```
┌─────────────────┐
│   DB_QUERY      │  Prisma query executes
└────────┬────────┘
         │
         │ P1xxx error (connection failure)
         ▼
┌─────────────────┐
│  DB_DEGRADED    │  Database unreachable
└────────┬────────┘
         │
         │ Return empty fallback (HTTP 200)
         ▼
┌─────────────────────────────────────────────────────┐
│   FALLBACK_RESPONSE                                 │
│   {                                                 │
│     data: [],                                       │
│     pagination: { page: 1, pageSize: 10, ... },     │
│     dbUnavailable: true                             │
│   }                                                 │
└─────────────────────────────────────────────────────┘
```

#### Degraded Response Shape

| Field | Type | Description |
|-------|------|-------------|
| `data` | array | Empty array when degraded |
| `pagination` | object | Standard pagination with `total: 0` |
| `dbUnavailable` | boolean | `true` when database was unreachable |

#### Response Headers

| Header | Value | Description |
|--------|-------|-------------|
| `X-Cache` | `MISS` | Cache was not used |
| `X-DB-Status` | `unavailable` / `connected` / `error` | Database connection state |

#### Frontend Handling

Frontend fetch utilities export `*_with_meta` variants (e.g., `fetch_public_plans_with_meta`) that return the `dbUnavailable` flag. Use these when displaying degraded state banners:

```typescript
const { plans, dbUnavailable } = await fetch_public_plans_with_meta();
if (dbUnavailable) {
  // Show non-blocking banner: "Some features temporarily unavailable"
}
```

---

## 11. Environment Configuration State Machine

Environment configuration follows validation states:

```
┌─────────────────┐
│   UNCONFIGURED  │  .env not loaded
└────────┬────────┘
         │
         │ dotenv/config
         ▼
┌─────────────────┐
│    LOADING      │  Parsing .env file
└────────┬────────┘
         │
         │ Check required vars
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                     CONFIGURATION CHECKS                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  DATABASE_URL ─────┬─── present ──► DB_READY                    │
│                    └─── missing ──► DB_UNAVAILABLE (warn)       │
│                                                                 │
│  SUPABASE_URL ─────┬─── present ──► AUTH_SUPABASE               │
│  + SERVICE_KEY     └─── missing ──► AUTH_LOCAL (test mode)      │
│                                                                 │
│  CLOUDINARY_* ─────┬─── present ──► UPLOADS_READY               │
│                    └─── missing ──► UPLOADS_DISABLED (warn)     │
│                                                                 │
│  REDIS_ENABLED ────┬─── true + URL ► CACHE_REDIS                │
│                    └─── false ─────► CACHE_MEMORY               │
│                                                                 │
│  ALLOWED_ORIGINS ──┬─── present ──► CORS_CUSTOM                 │
│                    └─── missing ──► CORS_DEFAULT (localhost)    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────┐
│    CONFIGURED   │  Ready for boot
└─────────────────┘
```

### Configuration States

| Component | State | Fallback |
|-----------|-------|----------|
| Database | DB_READY / DB_UNAVAILABLE | Server starts, queries fail |
| Auth | AUTH_SUPABASE / AUTH_LOCAL | Local JWT in test mode |
| Uploads | UPLOADS_READY / UPLOADS_DISABLED | Image routes return error |
| Cache | CACHE_REDIS / CACHE_MEMORY | In-memory LRU cache |
| CORS | CORS_CUSTOM / CORS_DEFAULT | localhost:3000, localhost:5173 |

### Environment Invariants

1. Server MUST start with minimal config (PORT only)
2. Missing DATABASE_URL → degraded mode, not crash
3. Missing Supabase config + NODE_ENV=test → use local JWT
4. Missing Cloudinary → upload endpoints return 503
5. CORS defaults MUST include Vite dev server port (5173)

### Required vs Optional

| Variable | Required For | Fallback |
|----------|--------------|----------|
| DATABASE_URL | Data persistence | Degraded (queries fail) |
| PORT | Server binding | 3001 |
| NODE_ENV | Mode selection | development |
| SUPABASE_* | Production auth | Local JWT (test) |
| CLOUDINARY_* | Image uploads | 503 on upload |
| REDIS_* | Distributed cache | In-memory |
| ALLOWED_ORIGINS | CORS | localhost defaults |

