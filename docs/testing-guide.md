# TravelEase Testing Guide

This document provides testing instructions for verifying the travel plan state machine implementation.

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

## 4. UI Flow Testing

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

