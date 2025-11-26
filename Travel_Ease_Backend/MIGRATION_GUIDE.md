# Migration Guide - Adding Auth & Constraints

This guide explains how to apply the Phase 2 database migrations to your Supabase database.

## New Columns and Constraints

Phase 2 adds the following to support Supabase Auth and improve data integrity:

### User Table Updates
- `auth_id` (UUID, UNIQUE) - Links to Supabase auth.users.id
- `created_at` (TIMESTAMP) - Timestamp when user was created
- `updated_at` (TIMESTAMP) - Auto-updated timestamp
- `password` made nullable - Not needed when using Supabase Auth

### Unique Constraints
- `business_favorite(user_id, business_id)` - Prevent duplicate favorites
- `travel_plan_favorite(user_id, travel_plan_id)` - Prevent duplicate favorites

### Trigger (Optional - for Supabase Auth)
- Auto-create user profile when signing up via Supabase Auth

## How to Apply Migration

### Option 1: Via Supabase SQL Editor (Recommended)

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste the contents of `prisma/migrations/0_baseline/migration.sql`
5. Click **Run**
6. Verify the changes in the **Table Editor**

### Option 2: Via Prisma (If Database is Accessible)

```bash
cd Travel_Ease_Backend

# Mark baseline as applied
npx prisma migrate resolve --applied 0_baseline

# Generate Prisma client
npx prisma generate

# Verify schema matches
npx prisma db pull
```

## Verifying Migration Success

After running the migration, verify:

```sql
-- Check new columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user'
AND column_name IN ('auth_id', 'created_at', 'updated_at');

-- Check unique constraints
SELECT constraint_name, table_name
FROM information_schema.table_constraints
WHERE constraint_type = 'UNIQUE'
AND table_name IN ('business_favorite', 'travel_plan_favorite');

-- Check trigger exists (if using Supabase Auth)
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

Expected results:
- `user.auth_id` should be UUID, nullable, unique
- `user.created_at` and `user.updated_at` should be TIMESTAMP
- `user.password` should be nullable
- Unique constraints should exist on favorites
- Trigger should exist if uncommented

## Rollback (If Needed)

If you need to undo these changes:

```sql
-- Remove columns
ALTER TABLE "user" DROP COLUMN IF EXISTS "auth_id";
ALTER TABLE "user" DROP COLUMN IF EXISTS "created_at";
ALTER TABLE "user" DROP COLUMN IF EXISTS "updated_at";

-- Make password required again
ALTER TABLE "user" ALTER COLUMN "password" SET NOT NULL;

-- Remove unique constraints
ALTER TABLE "business_favorite" DROP CONSTRAINT IF EXISTS "business_favorite_user_id_business_id_key";
ALTER TABLE "travel_plan_favorite" DROP CONSTRAINT IF EXISTS "travel_plan_favorite_user_id_travel_plan_id_key";

-- Remove trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
```

## Testing After Migration

1. Restart your backend server
2. Try registering a new user
3. Try logging in
4. Verify token-based requests work

## Troubleshooting

### "Column already exists"
- Some columns may already exist from manual testing
- The migration uses `IF NOT EXISTS` to safely handle this
- If you get errors, check which columns exist and comment out those lines

### "Unique constraint violation"
- You may have duplicate favorite records
- Clean them up before adding the constraint:
  ```sql
  -- Find duplicates
  SELECT user_id, business_id, COUNT(*)
  FROM business_favorite
  GROUP BY user_id, business_id
  HAVING COUNT(*) > 1;
  
  -- Remove duplicates (keeps oldest)
  DELETE FROM business_favorite a USING business_favorite b
  WHERE a.favorite_id > b.favorite_id
  AND a.user_id = b.user_id
  AND a.business_id = b.business_id;
  ```

### "Trigger on auth.users fails"
- The trigger section is commented out by default
- Only enable it if you want automatic profile creation
- Supabase's `auth.users` table requires special permissions

## Next Steps

After successfully applying the migration:

1. ✅ Restart backend: `npm run dev`
2. ✅ Test authentication endpoints
3. ✅ Run test suite: `npm test`
4. ✅ Verify protected routes work with tokens

## Local Development (Without Supabase)

If using local PostgreSQL instead of Supabase:

```bash
# Apply all schema changes
npx prisma db push

# Or use migrations
npx prisma migrate dev
```

No manual SQL needed - Prisma handles everything!

