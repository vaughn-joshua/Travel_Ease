# TravelEase Testing Guide

This document provides testing instructions for verifying the travel plan state machine implementation, system health, and runtime verification.

---

## 0. System Verification (Phase 0 Baseline)

### 0.1 Health Check

Verify the backend is running and database is connected:

```bash
curl http://localhost:3001/api/health
```

**Expected Response:**

```json
{
  "status": "OK",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "port": 3001,
  "database": "connected"
}
```

If database shows "disconnected", check:
- `DATABASE_URL` is set in `.env`
- PostgreSQL is running
- Network connectivity to database host

### 0.2 Frontend Proxy Verification

With both servers running:

```bash
# Terminal 1: Backend
cd Travel_Ease_Backend && npm run dev

# Terminal 2: Frontend
cd Travel_Ease_Frontend && npm run dev
```

Open http://localhost:5173 and check browser DevTools:
1. Network tab shows `/api/` requests
2. Requests proxy to `localhost:3001`
3. No CORS errors in Console

### 0.3 Environment Configuration Check

Backend environment validation:

```bash
cd Travel_Ease_Backend
node -e "require('dotenv').config(); console.log({
  db: !!process.env.DATABASE_URL,
  supabase: !!process.env.SUPABASE_URL,
  cloudinary: !!process.env.CLOUDINARY_CLOUD_NAME,
  redis: process.env.REDIS_ENABLED,
  port: process.env.PORT || 3001
})"
```

**Expected:** Shows which services are configured.

### 0.4 Database Connectivity

```bash
cd Travel_Ease_Backend
npx prisma db push --dry-run
```

**Expected:** Schema validation without errors (dry-run doesn't modify DB).

### 0.5 Quick Smoke Test

Test a public endpoint:

```bash
curl http://localhost:3001/api/travel_plan/public_plans
```

**Expected:** JSON response with array of public plans (may be empty).

---

## 1. Running Backend Tests

### Run All Tests

```bash
cd Travel_Ease_Backend
npm test
```

### Run State Machine Tests Only

```bash
cd Travel_Ease_Backend
npm test -- tests/state-machine.test.ts
```

### Run Travel Plan Integration Tests

```bash
cd Travel_Ease_Backend
npm test -- tests/travel-plan.test.ts
```

### Run Participant Tests

```bash
cd Travel_Ease_Backend
npm test -- tests/participants.test.ts
```

---

## 2. Running Frontend Tests

### Run All Tests

```bash
cd Travel_Ease_Frontend
npm test
```

### Run DTO Mapper Tests Only

```bash
cd Travel_Ease_Frontend
npm test -- src/__tests__/dtoMapper.test.ts
```

> **Note:** If you encounter PostCSS config errors, you may need to rename `postcss.config.ts` to `postcss.config.mjs` or adjust your vitest configuration. This is an environment-specific issue related to ESM module loading.

---

## 3. Manual API Testing (Postman/curl)

### Prerequisites

1. Start the backend server:
   ```bash
   cd Travel_Ease_Backend
   npm run dev
   ```

2. Get an auth token by logging in:
   ```bash
   curl -X POST http://localhost:3001/api/user/login \
     -H "Content-Type: application/json" \
     -d '{"email": "test@example.com", "password": "password123"}'
   ```

3. Set the token as an environment variable:
   ```bash
   export TOKEN="your-jwt-token-here"
   ```

### Test Cases

#### 3.1 Create a Travel Plan

```bash
curl -X POST http://localhost:3001/api/travel_plan/create_plan \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Beach Trip",
    "description": "Summer vacation",
    "location": "Boracay",
    "start_date": "2025-07-01",
    "end_date": "2025-07-07",
    "slots": 5
  }'
```

**Expected Response:**
- Status: 201
- Body contains `id`, `travel_plan_id`, `title`, `name`, `slots`, `max_slots`, `is_public`, `visibility`
- Status should be "Draft"

#### 3.2 Test Status Transitions

**Valid: Draft → Active**

```bash
curl -X PUT http://localhost:3001/api/travel_plan/edit_plan/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"status": "Active"}'
```

**Expected:** Status 200, plan now Active

**Invalid: Draft → Completed (should fail)**

```bash
curl -X PUT http://localhost:3001/api/travel_plan/edit_plan/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"status": "Completed"}'
```

**Expected:** Status 400, error message about invalid transition

**Terminal State: Completed → Draft (should fail)**

```bash
# First complete a plan, then try to revert
curl -X PUT http://localhost:3001/api/travel_plan/edit_plan/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"status": "Draft"}'
```

**Expected:** Status 400, error about terminal state

#### 3.3 Test Visibility Rules

**Cannot enable visibility on Completed plan:**

```bash
curl -X PUT http://localhost:3001/api/travel_plan/edit_plan/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"visibility": true}'
```

**Expected:** Status 400 if plan is Completed/Cancelled

#### 3.4 Test Slot Enforcement

**Create plan with max_slots:**

```bash
curl -X POST http://localhost:3001/api/travel_plan/create_plan \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Limited Plan",
    "slots": 2
  }'
```

**Add participant when slots available:**

```bash
curl -X POST http://localhost:3001/api/travel_plan/1/participants \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"user_id": 2, "role": "Viewer"}'
```

**Expected:** Status 201 if slots available, 400 if plan is full

**Cannot reduce max_slots below current count:**

```bash
curl -X PUT http://localhost:3001/api/travel_plan/edit_plan/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"max_slots": 1}'
```

**Expected:** Status 400 if current participants > 1

#### 3.5 Test Quick Join Flow

**Search for public plans:**

```bash
curl -X POST http://localhost:3001/api/travel_plan/quick_join \
  -H "Content-Type: application/json" \
  -d '{
    "start_date": "2025-07-01",
    "end_date": "2025-07-07",
    "location": "Boracay"
  }'
```

**Expected:** Array of matching visible plans with slot availability

**Request to join (requires auth):**

```bash
curl -X POST http://localhost:3001/api/travel_plan/request_join \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"travel_plan_id": 1}'
```

**Expected:** Status 201 with pending participant

**Approve join request (owner only):**

```bash
curl -X PUT http://localhost:3001/api/travel_plan/1/approve/2 \
  -H "Authorization: Bearer $TOKEN"
```

**Expected:** Status 200, participant now approved

#### 3.6 Test Role Permissions

**Non-owner trying to edit plan (should fail):**

```bash
curl -X PUT http://localhost:3001/api/travel_plan/edit_plan/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OTHER_USER_TOKEN" \
  -d '{"title": "Hijacked"}'
```

**Expected:** Status 403, not authorized

**Editor can edit activities but not plan:**

```bash
# Add user as Editor first, then test editing activity
curl -X PUT http://localhost:3001/api/travel_plan/activity_edit/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $EDITOR_TOKEN" \
  -d '{"notes": "Updated notes"}'
```

**Expected:** Status 200 for activity edit, 403 for plan edit

---

## 3.7 Authentication Testing

### 3.7.1 Email/Password Registration

```bash
curl -X POST http://localhost:3001/api/user/register \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Test",
    "last_name": "User",
    "email": "test@example.com",
    "password": "SecurePass123",
    "contact_no": "+1234567890"
  }'
```

**Expected:**
- Status: 201
- Body includes `user.profile_completed: true` (email/password registration completes profile)
- Body includes `user.auth_provider: "password"`

### 3.7.2 Email/Password Login

```bash
curl -X POST http://localhost:3001/api/user/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123"
  }'
```

**Expected:**
- Status: 200
- Body includes `token`, `refresh_token`, `expires_at`
- Body includes `user.profile_completed`

### 3.7.3 OAuth Sync (after Google sign-in)

```bash
# Use the token from Supabase OAuth callback
curl -X POST http://localhost:3001/api/user/oauth \
  -H "Authorization: Bearer $SUPABASE_TOKEN"
```

**Expected for new user:**
- Status: 200
- `isNewUser: true`
- `needsOnboarding: true`
- `user.profile_completed: false`

**Expected for existing user:**
- Status: 200
- `isNewUser: false`
- `needsOnboarding: false`
- `user.profile_completed: true`

### 3.7.4 Profile Update (Onboarding Completion)

```bash
curl -X PUT http://localhost:3001/api/user/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "contact_no": "+1234567890"
  }'
```

**Expected:**
- Status: 200
- `user.profile_completed: true` (set automatically when first_name and last_name are provided)

### 3.7.5 Get Current User Profile

```bash
curl http://localhost:3001/api/user/me \
  -H "Authorization: Bearer $TOKEN"
```

**Expected:**
- Status: 200
- Body includes `auth_provider`, `profile_completed`, `created_at`

### 3.7.6 Token Validation Errors

**No token:**
```bash
curl http://localhost:3001/api/user/me
```
**Expected:** Status 401, `error: "Authentication required"`

**Invalid token:**
```bash
curl http://localhost:3001/api/user/me \
  -H "Authorization: Bearer invalid-token"
```
**Expected:** Status 403, `error: "Invalid or expired token"`

---

## 4. UI Flow Testing

### 4.0 Authentication Flow

#### Email/Password Registration

1. Navigate to `/signup`
2. Fill in all required fields (first name, last name, email, password)
3. Submit the form
4. Verify redirect to home page (profile_completed = true automatically)
5. Check localStorage for `token` and `travelEaseUser`

#### Email/Password Login

1. Navigate to `/login`
2. Enter registered email and password
3. Submit the form
4. Verify redirect to home or saved redirect path
5. Verify user context is populated

#### Google OAuth Sign-in (New User)

1. Navigate to `/login`
2. Click "Continue with Google"
3. Complete Google OAuth flow
4. Verify redirect to `/auth/callback`
5. Verify redirect to `/onboarding` (new user, profile_completed = false)
6. Complete onboarding form
7. Verify redirect to home page
8. Verify `profile_completed = true` in user context

#### Google OAuth Sign-in (Existing User)

1. Navigate to `/login`
2. Click "Continue with Google"
3. Complete Google OAuth flow
4. Verify redirect to `/auth/callback`
5. Verify direct redirect to home (profile already complete)
6. Verify user context is populated with correct auth_provider

#### Session Persistence

1. Sign in with any method
2. Close browser tab
3. Open new tab and navigate to app
4. Verify user is still authenticated (from localStorage)

#### Sign Out

1. Click sign out button
2. Verify localStorage is cleared (`token`, `travelEaseUser`)
3. Verify redirect to login or home
4. Verify protected routes redirect to login

### 4.1 Plan Lifecycle

1. Create a new plan from the dashboard
2. Verify it appears in "Draft" tab
3. Edit the plan and change status to "Active"
4. Verify it moves to "Ongoing" tab
5. Complete the plan
6. Verify it moves to "Previous" tab
7. Try to edit completed plan - should be restricted

### 4.2 Participant Management

1. Create a plan and make it public
2. Log in as another user
3. Search for the plan using Quick Join
4. Request to join
5. Log back in as owner
6. View pending requests
7. Approve or deny the request
8. Verify participant appears/disappears

### 4.3 Slot Limits

1. Create a plan with max_slots = 3
2. Invite 2 participants
3. Verify plan shows "2/3 slots"
4. Try to invite a 4th participant - should fail
5. Try to reduce max_slots to 1 - should fail

---

## 5. Deprecated Endpoints

The following endpoints are deprecated and should not be used:

| Deprecated | Use Instead |
|------------|-------------|
| `GET /api/travel_plan/finished_plan` | `GET /api/travel_plan/previous_plans?status=Completed` |
| `GET /api/travel_plan/specific_plans` | `GET /api/travel_plan/plans/:id` |

Deprecated endpoints return:
- `finished_plan`: 301 redirect
- `specific_plans`: 410 Gone

---

## 6. Key State Machine Rules

See [docs/state-machines.md](./state-machines.md) for the complete state machine specification.

### Quick Reference

**Status Transitions:**
- Draft → Active ✓
- Draft → Cancelled ✓
- Active → Completed ✓
- Active → Cancelled ✓
- Completed → * ✗
- Cancelled → * ✗

**Visibility Rules:**
- Only Draft/Active plans can be made visible
- Terminal states (Completed/Cancelled) auto-disable visibility

**Slot Rules:**
- Only approved participants count toward max_slots
- Cannot approve when at capacity
- Cannot reduce max_slots below current approved count

**Role Permissions:**
| Role | view | edit_plan | edit_activities | manage_participants |
|------|------|-----------|-----------------|---------------------|
| Admin | ✓ | ✓ | ✓ | ✓ |
| Editor | ✓ | ✗ | ✓ | ✗ |
| Viewer | ✓ | ✗ | ✗ | ✗ |

