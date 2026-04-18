# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

TravelEase is a full-stack travel planning application using a PERN stack (PostgreSQL, Express, React, Node.js). It's a monorepo with npm workspaces containing two packages: `Travel_Ease_Backend` (Express API on port 3001) and `Travel_Ease_Frontend` (React Vite app on port 5173).

## Common Commands

### Development
```bash
npm run dev:backend          # Start backend (port 3001)
npm run dev:frontend         # Start frontend (port 5173, proxies /api to backend)
```

### Build
```bash
npm run build                # Build frontend (Vite → dist/)
npm run build --workspace=Travel_Ease_Backend  # Build backend (tsc + prisma generate)
```

### Testing
```bash
npm test                     # Run all workspace tests
npm run test --workspace=Travel_Ease_Backend   # Backend tests only
npm run test --workspace=Travel_Ease_Frontend  # Frontend tests only
npx vitest run tests/auth.test.ts --workspace=Travel_Ease_Backend  # Single test file
```

### Database (Prisma)
```bash
cd Travel_Ease_Backend
npx prisma db push           # Push schema changes (dev)
npx prisma migrate dev       # Create and run migrations
npx prisma studio            # Open GUI database browser
npx prisma generate          # Regenerate Prisma client
```

### Database Seeding
```bash
cd Travel_Ease_Backend
npm run db:seed                  # Main seed
npm run db:seed-subcategories    # Seed subcategories
npm run seed:lgu                 # Seed LGU businesses
npm run seed:categories          # Seed categories for existing data
```

### Linting
```bash
npm run lint --workspace=Travel_Ease_Frontend  # ESLint
```

## Testing

Backend uses **Vitest** with `globals: true`, `fileParallelism: false`, and 10s timeouts. Tests run against the real database (not mocked). Setup file (`tests/setup.ts`) sets `AUTH_MODE=local` so tests use local JWT auth instead of Supabase.

**Test helpers** in `tests/setup.ts`:
- `createTestUser(opts?)` — Creates a user in DB and returns `{ user, token }` with a signed JWT
- `cleanupTestData()` — Deletes travel plans and businesses (cascades handle children)

**Coverage thresholds:** 40% statements/lines, 35% branches (enforced in CI).

```bash
cd Travel_Ease_Backend
npx vitest run tests/auth.test.ts              # Single test file
npm run test:watch                              # Watch mode
npm run test:coverage                           # With coverage report
```

## Architecture

### Backend (`Travel_Ease_Backend/`)

**Modular feature-based structure** under `src/modules/`:
- Each feature (business, travel-plan, blog, user, map, review, notification) has its own `controllers/` and `utils/` directories
- Routes defined in `src/routes/` map to module controllers
- Services in `src/services/` contain business logic shared across controllers
- Validation schemas in `src/schemas/` use Zod

**Key libraries and patterns:**
- `src/lib/prisma.ts` — Prisma client singleton
- `src/lib/prismaHelpers.ts` — Retry logic for database operations
- `src/lib/supabase.ts` — Supabase admin client
- `src/lib/cache.ts` — Redis (optional) with in-memory fallback
- `src/middleware/auth.ts` — Supabase auth + JWT fallback for testing
- `src/middleware/roles.ts` — Role-based access control (SUPER_ADMIN, LGU_ADMIN, BUSINESS_OWNER, TRAVEL_AGENCY, USER)
- `src/middleware/ownership.ts` — Resource ownership verification

**Logging:** Pino structured logging (`src/lib/logger.ts`) with domain-specific child loggers (dbLogger, authLogger, etc.).

**Auth modes:** Supabase JWT in production, local JWT in testing (`AUTH_MODE=local`). The auth middleware (`src/middleware/auth.ts`) checks Supabase first, then falls back to local JWT.

**API routes** are all prefixed with `/api/`: travel_plan, business, user, map, blogs, reviews, notification, traffic, weather, health, utils (uploads).

**Travel plan state machine** (`src/modules/travel-plan/utils/stateMachine.ts`): Draft → Active → Completed/Cancelled.

### Frontend (`Travel_Ease_Frontend/`)

- **Pages** in `src/pages/` — 24+ lazy-loaded page components
- **Features** in `src/features/` — React Query hooks organized by domain (blogs, businesses, travelPlans, map, user, reviews)
- **API config** in `src/config/api.ts` — Centralized endpoint definitions with type-safe builders
- **Auth context** in `src/context/` — Supabase auth state management
- **Route guards** in `src/routes/` — RequireAuth, RequireSupabaseAuth, LandingRoute

**TanStack Query pattern:** Query keys use a factory pattern in `src/features/*/queryKeys.ts` with `all`, `lists`, `details` levels. Query client defaults: 30s staleTime, 5m gcTime, with auth error recovery for 401/403/419.

**Key frontend stack:** React 19, React Router v7, TanStack React Query, React Hook Form + Zod, Tailwind CSS 4 (CSS-first config), Leaflet maps.

**Vite config** splits vendor chunks manually (react, leaflet, query, forms, supabase) for caching.

### Database Schema

Prisma schema at `Travel_Ease_Backend/prisma/schema.prisma`. Key models: User, TravelPlan, Activity, Business, BusinessCategory, Blog, Review, Zone/ZoneTrafficSnapshot, Participant, Notification, MenuItem.

Uses Supabase PostgreSQL with connection pooling (pgbouncer) via `DATABASE_URL` and direct connection via `DIRECT_URL` for migrations.

**Note:** Prisma schema uses snake_case model names (`user`, `travel_plan`) which differs from the PascalCase convention. The backend build tolerates TypeScript errors (`noEmitOnError: false`) due to Prisma-generated naming mismatches.

### Deployment

- **Frontend:** Vercel (Vite framework, SPA rewrite rules in `vercel.json`, edge function proxy at `api/[...path].ts`)
- **Backend:** Railway via Docker (`Travel_Ease_Backend/Dockerfile`, multi-stage node:20-alpine)
- Prisma migrations run in Railway's release phase (`Procfile`)
- Health check endpoint: `GET /api/health`
- In production, browser sends `/api/*` to Vercel, edge function proxies to Railway via `BACKEND_URL`

### Environment Variables

See `env.example` (root), `Travel_Ease_Backend/env.example`, and `Travel_Ease_Frontend/env.example` for required variables. Key ones:
- Backend (Railway): `DATABASE_URL`, `DIRECT_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ALLOWED_ORIGINS`, `FRONTEND_URL`, `NODE_ENV=production`, `JWT_SECRET`
- Frontend (Vercel): `VITE_API_BASE_URL` (`/api`), `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `BACKEND_URL` (Railway root URL, no `/api` suffix)
- In dev, Vite proxies `/api` requests to `localhost:3001`, eliminating CORS issues
