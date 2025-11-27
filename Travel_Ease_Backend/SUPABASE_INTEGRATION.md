# Supabase Auth Integration Guide

This document explains how Travel_Ease integrates with Supabase Auth for user authentication.

## Architecture Overview

Travel_Ease uses **Supabase Auth by default**. Local JWTs are only used in automated tests or as an explicit fallback when Supabase is unavailable. There is **no AUTH_MODE toggle** anymore—if Supabase env vars are present, we verify Supabase-issued JWTs; otherwise tests fall back to local JWT with `JWT_SECRET`.

## Setup Instructions

### 1. Configure Supabase Project

1. Create project at [supabase.com](https://supabase.com)
2. Get your credentials from Dashboard > Settings > API
3. Add to `.env`:

```env
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."
JWT_SECRET="local-or-test-secret" # used only for automated tests/local fallback
```

### 2. Set Up User Profile Sync

Run this SQL in Supabase SQL Editor to auto-create profiles:

```sql
-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Function to sync auth.users to user table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user (auth_id, email, first_name, last_name, contact_no)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NEW.raw_user_meta_data->>'contact_no'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call function on new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 3. User Registration Flow

**Frontend:**
```javascript
// Option 1: Use Supabase client directly (recommended)
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'secure_password',
  options: {
    data: {
      first_name: 'John',
      last_name: 'Doe',
      contact_no: '1234567890'
    }
  }
});

// Option 2: Call backend endpoint (creates user in Supabase + our DB)
const response = await fetch('/api/user/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    first_name: 'John',
    last_name: 'Doe',
    email: 'user@example.com',
    password: 'secure_password',
    contact_no: '1234567890'
  })
});
```

**What Happens:**
1. Supabase creates user in `auth.users`
2. Trigger automatically creates matching profile in `user` table
3. `auth_id` links the two records
4. User receives session token

### 4. User Login Flow

**Frontend:**
```javascript
// Option 1: Supabase client (recommended)
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'secure_password'
});

// Use data.session.access_token for API calls

// Option 2: Backend endpoint
const response = await fetch('/api/user/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'secure_password'
  })
});

const { token, user } = await response.json();
```

### 5. Making Authenticated Requests

**All protected endpoints require Authorization header:**

```javascript
fetch('/api/travel_plan/create_plan', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`  // Supabase token
  },
  body: JSON.stringify({
    title: 'My Trip',
    location: 'Bora cay'
  })
});
```

## Server-Side Token Verification

The `authenticateToken` middleware verifies Supabase tokens via `supabaseAdmin.auth.getUser(token)`. If Supabase is configured, the token must be valid; otherwise, the middleware returns 401/403. In automated tests (NODE_ENV=test), a local JWT path is used with `JWT_SECRET` so tests can run without Supabase.

Optional: instead of using the Supabase Admin client, you can verify tokens via JWKS (Supabase publishes a JWKS endpoint). If you choose JWKS, document the cache/rotation strategy and replace the admin client call accordingly.

## Database Schema

**User Table:**
```sql
CREATE TABLE user (
  user_id SERIAL PRIMARY KEY,
  auth_id UUID UNIQUE,  -- Links to auth.users.id
  email VARCHAR(100) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  contact_no VARCHAR(50),
  password VARCHAR,  -- NULL when using Supabase
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Testing

- **With Supabase**: use a real Supabase project and real tokens. Protected routes should accept `Authorization: Bearer <supabase access token>`.
- **Without Supabase (tests/CI)**: leave `SUPABASE_*` empty and set `JWT_SECRET`. In this case, automated tests use the local JWT path in `authenticateToken` to run without hitting Supabase.

## Common Operations

### Get Current User

```javascript
// In controller, after authenticateToken middleware
const currentUser = req.user;
console.log(currentUser.id);  // user_id from user table
console.log(currentUser.email);
console.log(currentUser.auth_id); // Supabase UUID (if using Supabase)
```

### Check User Exists

```javascript
const user = await prisma.user.findUnique({
  where: { auth_id: supabaseUserId }
});
```

### Link Existing User to Supabase

```javascript
await prisma.user.update({
  where: { email: 'user@example.com' },
  data: { auth_id: supabaseUserId }
});
```

## Security Notes

1. **Never expose SERVICE_ROLE_KEY** in frontend code
2. **Use ANON_KEY** in frontend Supabase client
3. **Supabase RLS** can be enabled for additional security
4. **Token expiration**: Supabase tokens expire (configurable)
5. **Refresh tokens**: Handle token refresh in frontend

## Troubleshooting

### "User profile not found" error

- User exists in Supabase but not in `user` table
- Check trigger is set up correctly
- Manually insert: `INSERT INTO user (auth_id, email, ...) VALUES (...)`

### "Invalid or expired Supabase token"

- Token might have expired
- User might have logged out
- Refresh the token on frontend

### "Cannot reach Supabase"

- Check internet connection
- Verify SUPABASE_URL is correct
- Check Supabase project isn't paused (free tier)

## Best Practices

1. Use Supabase client SDK on frontend for auth
2. Use backend only for protected resource access
3. Store tokens securely (httpOnly cookies or secure storage)
4. Implement token refresh logic
5. Log out users by clearing tokens and calling `supabase.auth.signOut()`

## Migration from Local to Supabase

To migrate existing users:

```javascript
// For each user in user table without auth_id
const users = await prisma.user.findMany({ where: { auth_id: null } });

for (const user of users) {
  // Create Supabase auth user
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: user.email,
    password: 'temporary-password', // User should reset
    email_confirm: true,
    user_metadata: {
      first_name: user.first_name,
      last_name: user.last_name
    }
  });

  if (!error) {
    // Link records
    await prisma.user.update({
      where: { user_id: user.user_id },
      data: { 
        auth_id: data.user.id,
        password: null // Clear old password
      }
    });
  }
}
```

## Resources

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript/introduction)
- [Server-Side Auth](https://supabase.com/docs/guides/auth/server-side-rendering)
