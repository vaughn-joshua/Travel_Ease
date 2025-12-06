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

## 4. Authentication State Machine

```
┌───────────────────┐    login()     ┌───────────────────┐
│  Unauthenticated  │ ───────────────► Authenticated     │
│  (no token)       │                │  (valid JWT)      │
└───────────────────┘                └───────────────────┘
                                            │
                                            │ logout() / token expired
                                            ▼
                                     ┌───────────────────┐
                                     │  Unauthenticated  │
                                     └───────────────────┘
```

### Auth Modes

1. **Supabase Auth** (Production): Uses Supabase for auth, JWT from Supabase
2. **Local JWT** (Development): Uses bcrypt + local JWT signing

### Protected Resources

- All travel plan create/edit/delete operations
- Business create/edit operations
- Favorites, reviews, blog create/update/delete
- Quick Join request (search is public, joining requires auth)

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

