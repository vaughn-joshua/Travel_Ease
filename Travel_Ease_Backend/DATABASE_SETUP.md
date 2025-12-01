# Database Setup Guide

This guide provides options for setting up your database locally or with Supabase.

## Option 1: Local PostgreSQL (Recommended for Development)

### Install PostgreSQL

**macOS (using Homebrew):**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Download and install from [postgresql.org](https://www.postgresql.org/download/windows/)

### Create Database

```bash
# Access PostgreSQL
psql postgres

# Create database and user
CREATE DATABASE travelease_db;
CREATE USER travelease_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE travelease_db TO travelease_user;

# Exit psql
\q
```

### Configure .env

```env
DATABASE_URL="postgresql://travelease_user:your_password@localhost:5432/travelease_db"
JWT_SECRET="generate-a-random-secret-key-here"
```

Generate a secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Initialize Schema

```bash
cd Travel_Ease_Backend

# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push

# Verify tables were created
npx prisma studio
```

## Option 2: Supabase (Recommended for Production)

### Setup Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Create account and new project
3. Save your database password
4. Wait for project to provision (~2 minutes)

### Get Connection String

1. Go to **Settings** > **Database**
2. Find **Connection String** section
3. Copy **Session mode** URI (Port 5432)
4. Replace `[YOUR-PASSWORD]` with your password

### Configure .env

```env
# Session Mode for migrations and development
DATABASE_URL="postgresql://postgres.abcdefghijk:YOUR_PASSWORD@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"

# Add JWT secret
JWT_SECRET="your-secret-jwt-key"
```

### If Database Connection Pooler is Paused

Free tier Supabase projects pause after 7 days of inactivity:

1. Go to Supabase Dashboard
2. Click **Restore** or **Resume** if paused
3. Wait 30-60 seconds for database to wake up
4. Try connection again

### Initialize Schema on Supabase

#### Method 1: Baseline Existing Schema

If you already created tables manually or have data:

```bash
# Pull current schema
npx prisma db pull

# Generate client
npx prisma generate

# Create baseline migration (records current state)
mkdir -p prisma/migrations/0_init
npx prisma migrate diff \
  --from-empty \
  --to-schema-datamodel prisma/schema.prisma \
  --script > prisma/migrations/0_init/migration.sql

# Mark it as applied
npx prisma migrate resolve --applied "0_init"
```

#### Method 2: Fresh Schema

If starting from scratch:

```bash
# Apply schema using migrations
npx prisma migrate dev --name init

# Or push schema directly (development only)
npx prisma db push
```

## Connection Mode Comparison

| Feature | Session Mode (5432) | Transaction Mode (6543) |
|---------|-------------------|----------------------|
| **Migrations** | ✅ Supported | ❌ Not supported |
| **Max Connections** | ~60 | ~1000+ |
| **Latency** | Low | Very Low |
| **Use Case** | Dev, migrations | Production apps |
| **Prepared Statements** | ✅ Full support | ⚠️ Limited |

### Recommended Setup

**Development:**
```env
DATABASE_URL="postgresql://postgres.[ref]:[pass]@....supabase.com:5432/postgres"
```

**Production:**
```env
DATABASE_URL="postgresql://postgres.[ref]:[pass]@....supabase.com:6543/postgres?pgbouncer=true"
```

## Switching Between Local and Supabase

Just change the `DATABASE_URL` in your `.env` file and restart the server:

```bash
# Stop server (Ctrl+C)
# Edit .env to change DATABASE_URL
# Restart
npm run dev
```

Prisma will automatically connect to the new database.

## Verifying Connection

Test your database connection:

```bash
# Simple connection test
npx prisma db execute --stdin <<< "SELECT 1 as connected;"

# Open Prisma Studio to browse data
npx prisma studio
```

## Migration Workflow

```
1. Edit prisma/schema.prisma
   ↓
2. npx prisma migrate dev --name describe_change
   ↓
3. Review generated SQL in prisma/migrations/
   ↓
4. Test locally
   ↓
5. Commit migration files to git
   ↓
6. Deploy: npx prisma migrate deploy
```

## Data Seeding

Create a seed file if you need test data:

```bash
# Create seed.js
cat > prisma/seed.js << 'EOF'
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Your seed data here
  const user = await prisma.user.create({
    data: {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      password: '$2a$10$...', // Use bcrypt to hash
    }
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
EOF

# Add to package.json
"prisma": {
  "seed": "node prisma/seed.js"
}

# Run seed
npx prisma db seed
```

## Backup and Recovery

### Supabase Backups

- **Free tier**: Daily automatic backups (7-day retention)
- **Pro tier**: Point-in-time recovery

Access backups:
1. Supabase Dashboard > **Database** > **Backups**
2. Download or restore as needed

### Manual Backup

```bash
# Export schema and data
pg_dump "postgresql://..." > backup.sql

# Restore
psql "postgresql://..." < backup.sql
```

## Security Best Practices

1. **Never commit .env files**
2. **Use strong JWT secrets** (32+ random characters)
3. **Rotate secrets periodically**
4. **Use Supabase RLS (Row Level Security)** for additional protection
5. **Monitor connection pools** to avoid exhaustion

## Performance Tips

- Use **indexes** on frequently queried columns (already in schema)
- Use **connection pooling** (Transaction mode) in production
- Monitor query performance with Prisma query logs:
  ```javascript
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });
  ```

## Running Tests

### SSL Configuration for Tests

Tests may fail with SSL certificate errors when connecting to Supabase or other remote PostgreSQL instances. The test setup automatically handles this by setting `NODE_TLS_REJECT_UNAUTHORIZED=0` to accept self-signed certificates.

**Running tests:**
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage report
```

### Using Local PostgreSQL for Tests

For faster and more reliable tests, use a local PostgreSQL instance:

1. Create a test database:
```bash
psql postgres
CREATE DATABASE travelease_test;
\q
```

2. Update your `.env` to point to the test database:
```env
DATABASE_URL="postgresql://localhost:5432/travelease_test"
```

3. Push the schema:
```bash
npx prisma db push
```

### Using Supabase for Tests

If you must use Supabase for tests, ensure your connection string includes SSL parameters:

```env
DATABASE_URL="postgresql://postgres.[ref]:[pass]@....supabase.com:5432/postgres?sslmode=require"
```

The test setup will automatically set `NODE_TLS_REJECT_UNAUTHORIZED=0` to handle self-signed certificate warnings.

### Troubleshooting Test Failures

| Error | Solution |
|-------|----------|
| `self-signed certificate in certificate chain` | Ensure `NODE_TLS_REJECT_UNAUTHORIZED=0` is set (automatic in test setup) |
| `ECONNREFUSED` | Check if PostgreSQL is running and DATABASE_URL is correct |
| `relation "user" does not exist` | Run `npx prisma db push` to create tables |
| `SSL connection required` | Add `?sslmode=require` to DATABASE_URL |

## Need Help?

- Prisma Docs: https://www.prisma.io/docs
- Supabase Docs: https://supabase.com/docs
- Prisma + Supabase: https://www.prisma.io/docs/guides/database/supabase

