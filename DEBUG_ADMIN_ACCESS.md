# Debugging Admin Access for Business Registrations

## Quick Fix

Your user needs to have one of these roles in the database:
- `SUPER_ADMIN`
- `LGU_ADMIN`

### Step 1: Check Your User ID
Open your browser console (F12) → Network tab, then refresh the profile page. Look for any API call and check the response to find your user ID. Or check the database directly:

```sql
SELECT user_id, email, role FROM "user" WHERE email = 'your-email@example.com';
```

### Step 2: Set Admin Role
Connect to your PostgreSQL database and run:

```sql
UPDATE "user" 
SET role = 'LGU_ADMIN' 
WHERE email = 'your-email@example.com';
```

Or if you know your user_id:
```sql
UPDATE "user" 
SET role = 'LGU_ADMIN' 
WHERE user_id = 1;
```

### Step 3: Verify the Update
```sql
SELECT user_id, email, first_name, last_name, role FROM "user" 
WHERE email = 'your-email@example.com';
```

Expected result:
```
user_id | email                  | first_name | last_name | role
--------|------------------------|------------|-----------|----------
   123  | your-email@example.com | John       | Doe       | LGU_ADMIN
```

### Step 4: Refresh and Test
1. Clear your browser cache (Ctrl+F5 or Cmd+Shift+R)
2. Go back to the profile page
3. Navigate to Business Registrations tab
4. Should now show pending registrations instead of error

## If It Still Doesn't Work

### Check 1: Enable Network Logs
Add this to see the actual API error:

1. Open browser DevTools (F12)
2. Go to Console tab
3. Go back to Business Registrations tab
4. Look for any error messages
5. Share the response status and error message

### Check 2: Verify Token Authentication
The error could also be:

**401 Unauthorized** - Token expired or invalid
- Solution: Log out and log back in

**403 Forbidden** - User exists but role is not SUPER_ADMIN or LGU_ADMIN
- Solution: Follow Step 2 above to set role

**404 Not Found** - Endpoint doesn't exist
- This shouldn't happen - indicates backend issue

**500 Internal Server Error** - Backend crash
- Check backend logs: `npm run dev` in Travel_Ease_Backend terminal

### Check 3: Verify Backend is Running
Make sure the backend is running:

```bash
cd Travel_Ease_Backend
npm run dev
```

You should see the server start on http://localhost:3000 or similar.

### Check 4: Verify Endpoint Exists
Make a manual request to test the endpoint:

```bash
# Replace YOUR_TOKEN with actual token from localStorage
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/business/pending-registrations

# Expected response if you have admin role:
{
  "message": "Success",
  "data": [...],
  "pagination": {"page": 1, "pageSize": 20, "total": 0, "totalPages": 0}
}

# If you don't have admin role:
{
  "error": "Insufficient permissions",
  "message": "This action requires one of the following roles: SUPER_ADMIN, LGU_ADMIN"
}
```

## Database Query to Show All Users and Their Roles

```sql
SELECT 
  user_id, 
  email, 
  first_name, 
  last_name, 
  role,
  auth_provider,
  created_at
FROM "user" 
ORDER BY user_id DESC;
```

This shows:
- All user accounts
- Their current roles (NULL means no admin rights)
- Authentication provider (google, password, etc.)
- Account creation date

## Possible Role Values

```
SUPER_ADMIN   - Full system access (can do everything)
LGU_ADMIN     - Admin for LGU (local government unit) operations
BUSINESS_OWNER - Owner of a business (not admin)
TRAVEL_AGENCY  - Travel agency user
USER          - Regular user (or NULL/not set)
```

Only users with `SUPER_ADMIN` or `LGU_ADMIN` can see pending business registrations.

## Still Having Issues?

Provide this information:
1. Exact error message shown on screen
2. Browser console errors (F12 → Console)
3. Network tab response (F12 → Network → click failed request → Response)
4. Output of this SQL query on your database:
   ```sql
   SELECT user_id, email, role FROM "user" WHERE email = 'your-email@example.com';
   ```
