# Business Registration Access Control Fix

## Problem Identified
The user couldn't see pending business registrations after changing their role on Supabase. The access control implementation had several issues:

1. **Missing Role-Based Access Control**: The `GET /business/businesses` endpoint didn't check user roles, so non-admins could potentially access it
2. **Wrong Status Type Handling**: The endpoint was treating `status` as a boolean, but the database schema uses the `BusinessStatus` enum (PENDING, APPROVED, REJECTED, LGU_REGISTERED)
3. **Incorrect Frontend Query**: The frontend was calling `businessApi.getBusinesses({ status: false })` which wouldn't work with enum values

## Root Cause
When the database schema was migrated to use `BusinessStatus` enum instead of boolean status:
- All existing businesses were converted to enum values
- But the `get_businesses` controller still expected boolean values
- The frontend UI continued trying to query with `status: false`

## Solution Implemented

### 1. Backend Changes

#### Created New Admin-Only Endpoint
File: `/home/vaughn/Documents/vscode/Travel_Ease/Travel_Ease_Backend/src/routes/businessRoutes.ts`

Added a dedicated endpoint with proper role-based access control:
```typescript
router.get(
  "/pending-registrations",
  authenticateToken,
  requireRole("SUPER_ADMIN", "LGU_ADMIN"),
  async (req: Request, res: Response) => {
    // Fetches businesses where status: "PENDING"
    // Includes pagination support
  }
);
```

**Features:**
- ✅ Requires authentication via `authenticateToken`
- ✅ Checks user role via `requireRole("SUPER_ADMIN", "LGU_ADMIN")`
- ✅ Filters by `status: "PENDING"` (correct enum value)
- ✅ Returns 403 Forbidden if user doesn't have admin role
- ✅ Includes pagination support

### 2. Frontend Changes

#### Added API Method
File: `/home/vaughn/Documents/vscode/Travel_Ease/Travel_Ease_Frontend/src/services/api.ts`

```typescript
getPendingRegistrations: async (page?: number, pageSize?: number): Promise<{
  message: string;
  data: Array<...>;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}>
```

#### Updated BusinessRegistrationsTab Component
File: `/home/vaughn/Documents/vscode/Travel_Ease/Travel_Ease_Frontend/src/components/profile/BusinessRegistrationsTab.tsx`

**Before:**
```typescript
const { data = { items: [] }, isLoading, error, refetch } = useQuery({
  queryKey: ['admin', 'business-registrations', page],
  queryFn: () => businessApi.getBusinesses({ status: false, page }),
});
```

**After:**
```typescript
const { data, isLoading, error, refetch } = useQuery({
  queryKey: ['admin', 'business-registrations', page],
  queryFn: () => businessApi.getPendingRegistrations(page),
});
```

**Added Features:**
- ✅ Pagination controls
- ✅ Better error messaging including access denial notice
- ✅ Correct data extraction from response

## How It Works Now

### User Experience Flow
1. User (with admin role) navigates to Business Registrations tab
2. Frontend makes request to `/api/business/pending-registrations`
3. Backend's `authenticateToken` middleware validates JWT and retrieves user from database
4. Backend's `requireRole` middleware checks if `user.role` is "SUPER_ADMIN" or "LGU_ADMIN"
5. If authorized: Returns list of pending businesses
6. If unauthorized: Returns 403 Forbidden error

### Role Synchronization
The role is stored in the `user` table and is:
- Read from the database by `authenticateToken` middleware
- Attached to `req.user.role` for use by role-checking middleware
- Not read from Supabase JWT - it's sourced from the local database only

```typescript
// From authenticateToken middleware
const user = await prisma.user.findUnique({
  where: { email }
});

req.user = {
  id: user.user_id,
  role: user.role,  // Sourced from database
  // ... other fields
};
```

## How to Test

### 1. Verify Admin Can See Pending Registrations
```bash
# 1. Set a user's role to LGU_ADMIN in the database
UPDATE "user" SET role = 'LGU_ADMIN' WHERE user_id = X;

# 2. Make authenticated request
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/business/pending-registrations

# Expected: 200 OK with list of pending businesses
```

### 2. Verify Non-Admin Cannot Access
```bash
# With a regular user's token (role = 'USER')
curl -H "Authorization: Bearer $NON_ADMIN_TOKEN" \
  http://localhost:3000/api/business/pending-registrations

# Expected: 403 Forbidden with message:
# "Insufficient permissions. This action requires one of the following roles: SUPER_ADMIN, LGU_ADMIN"
```

### 3. Test Frontend UI
1. Log in with an admin account
2. Go to Account / Business Registrations tab
3. Should see pending registrations (previously would show "No pending registrations")

## Important Notes

### Role Changes in Supabase
Changing a user's role only in Supabase doesn't affect Travel Ease. The role must be updated in the **PostgreSQL database**:

```sql
-- Correct way to assign admin role
UPDATE "user" 
SET role = 'LGU_ADMIN' 
WHERE email = 'admin@example.com';
```

### Status Values in Database
Businesses now use `BusinessStatus` enum:
- `PENDING` - Awaiting admin approval
- `APPROVED` - Approved and visible to users
- `REJECTED` - Rejected with reason
- `LGU_REGISTERED` - Pre-loaded by LGU

### Getting Pending Registrations
Only use the dedicated `/pending-registrations` endpoint for admin views, not the generic `/businesses` endpoint.

## Files Modified
1. ✅ `/Travel_Ease_Backend/src/routes/businessRoutes.ts` - Added new endpoint
2. ✅ `/Travel_Ease_Frontend/src/services/api.ts` - Added API method
3. ✅ `/Travel_Ease_Frontend/src/components/profile/BusinessRegistrationsTab.tsx` - Updated component

## Next Steps (Optional)
- [ ] Update `get_businesses` controller to properly support BusinessStatus enum filtering
- [ ] Add automated tests for role-based access control
- [ ] Add audit logging for business status changes
