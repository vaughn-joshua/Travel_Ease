# Supabase Setup Guide for Travel_Ease

This guide explains how to use Travel_Ease with Supabase as your PostgreSQL database.

## Why Supabase?

- **Managed PostgreSQL**: No server maintenance required
- **Built-in Auth**: Can extend with Supabase Auth (optional)
- **Realtime**: Built-in realtime subscriptions (if needed later)
- **Free tier**: Generous free tier for development
- **Connection Pooling**: Built-in with Supavisor

## Quick Setup

### 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Create a new project
4. Note your database password (you'll need this)

### 2. Get Connection String

From your Supabase Dashboard:
1. Go to **Settings** > **Database**
2. Scroll to **Connection String**
3. Select **Session mode** (for Prisma)
4. Copy the connection string
5. Replace `[YOUR-PASSWORD]` with your actual password

### 3. Update .env

```env
# Supabase Session Mode (for Prisma)
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"

# Or use Transaction Mode with connection pooling (recommended for production)
# DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

### 4. Initialize Database Schema

Choose one of the following options:

#### Option A: Fresh Database (No existing data)

```bash
cd Travel_Ease_Backend
npx prisma migrate dev --name init
npx prisma generate
```

#### Option B: Existing Database (Baseline migrations)

If you already have tables in Supabase:

```bash
cd Travel_Ease_Backend

# 1. Pull current schema from Supabase
npx prisma db pull

# 2. Generate Prisma Client
npx prisma generate

# 3. Create a baseline migration (doesn't apply changes)
mkdir -p prisma/migrations/0_init
npx prisma migrate diff \
  --from-empty \
  --to-schema-datamodel prisma/schema.prisma \
  --script > prisma/migrations/0_init/migration.sql

# 4. Mark the migration as applied (tells Prisma the DB is already in this state)
npx prisma migrate resolve --applied 0_init
```

## Schema Management

### Making Schema Changes

When you modify `prisma/schema.prisma`:

```bash
# Create a new migration
npx prisma migrate dev --name your_migration_name

# This will:
# 1. Generate SQL migration file
# 2. Apply it to your database
# 3. Regenerate Prisma Client
```

### Production Deployments

For production (or Supabase production database):

```bash
# Deploy pending migrations
npx prisma migrate deploy

# This applies migrations without prompting (safe for CI/CD)
```

### Resetting Development Database

⚠️ **This deletes all data!**

```bash
npx prisma migrate reset
```

## Connection Modes

Supabase offers two connection modes:

### Session Mode (Port 5432)
- **Use for**: Prisma migrations, schema changes, direct queries
- **Limit**: Max 60 connections
- **Best for**: Development, migrations

```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres
```

### Transaction Mode (Port 6543)
- **Use for**: Production applications with connection pooling
- **Limit**: Handles thousands of connections
- **Best for**: Production apps, serverless functions

```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

### Recommended Setup

Use **Session Mode** in your `.env` for development:
```env
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"
```

For production, switch to **Transaction Mode** for better scalability.

## Prisma Studio with Supabase

View and edit your Supabase data visually:

```bash
npx prisma studio
```

This opens a GUI at `http://localhost:5555` to browse your database.

## Common Issues

### "Can't reach database server"

1. Check your internet connection
2. Verify the connection string is correct
3. Ensure your IP is allowed (Supabase allows all IPs by default)
4. Check if Supabase project is paused (free tier auto-pauses after inactivity)

### "SSL certificate verification failed"

Add `?sslmode=require` to your connection string:
```
DATABASE_URL="postgresql://...?sslmode=require"
```

### Foreign Key Conflicts

If you see errors about foreign keys when running migrations:
1. This means you have existing data that doesn't match the constraints
2. You may need to clean up orphaned records first
3. Or use Supabase SQL Editor to manually fix data

## Using Supabase SQL Editor

For manual SQL operations:
1. Go to **SQL Editor** in Supabase Dashboard
2. Run SQL queries directly
3. Useful for seeding data or fixing issues

## Migration Workflow

```mermaid
graph LR
    A[Modify schema.prisma] --> B[prisma migrate dev]
    B --> C[Review migration.sql]
    C --> D[Test locally]
    D --> E[Commit migration files]
    E --> F[Deploy: prisma migrate deploy]
```

## Best Practices

1. **Always commit migration files** to version control
2. **Test migrations** on a development database first
3. **Use transactions** for data migrations
4. **Backup before major changes** (Supabase Dashboard > Database > Backups)
5. **Use Session mode** for migrations, **Transaction mode** for app connections in production

## Schema Sync Strategy

Since you have an existing database:

1. **Current state**: Prisma schema matches your Supabase database
2. **Future changes**: Use `prisma migrate dev` to create and apply migrations
3. **Team workflow**: Teammates run `prisma migrate deploy` to apply your migrations

## Troubleshooting Connection Issues

If migrations fail with connection errors:

```bash
# Test connection
npx prisma db execute --stdin <<< "SELECT 1 as connected;"

# If it works, your connection is fine
# If it fails, check your DATABASE_URL
```

## Additional Resources

- [Prisma with Supabase](https://www.prisma.io/docs/guides/database/supabase)
- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pool)
- [Prisma Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate)

