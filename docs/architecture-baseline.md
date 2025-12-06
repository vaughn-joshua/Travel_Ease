# TravelEase Architecture Baseline

This document defines the system architecture, service wiring, and runtime configuration for TravelEase.

---

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
│                                                                             │
│   Browser ─────────────────────────────────────────────────────────────────┐│
│       │                                                                    ││
│       ▼                                                                    ││
│   ┌─────────────────┐                                                      ││
│   │ React Frontend  │  Port 5173 (dev) or static files (prod)              ││
│   │ (Vite)          │                                                      ││
│   └────────┬────────┘                                                      ││
│            │                                                               ││
│            │ /api/* proxy (dev) or nginx (prod)                            ││
│            ▼                                                               ││
└────────────────────────────────────────────────────────────────────────────┘│
                                                                              │
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SERVER LAYER                                    │
│                                                                             │
│   ┌─────────────────┐                                                       │
│   │ Express Backend │  Port 3001                                            │
│   │ (Node.js/TSX)   │                                                       │
│   └────────┬────────┘                                                       │
│            │                                                                │
│            ├──────────────────────────────────────────────────────┐         │
│            │                                                      │         │
│            ▼                                                      ▼         │
│   ┌─────────────────┐                                    ┌────────────────┐ │
│   │ PostgreSQL      │  via DATABASE_URL                  │ Supabase Auth  │ │
│   │ (Prisma ORM)    │                                    │ (JWT tokens)   │ │
│   └─────────────────┘                                    └────────────────┘ │
│            │                                                                │
│            ▼                                                                │
│   ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐       │
│   │ Redis (optional)│     │ Cloudinary      │     │ Map Providers   │       │
│   │ Cache/Rate Limit│     │ Image CDN       │     │ Nominatim/OSRM  │       │
│   └─────────────────┘     └─────────────────┘     └─────────────────┘       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Port & URL Configuration

### Development Defaults

| Service | Port | URL |
|---------|------|-----|
| Backend (Express) | 3001 | http://localhost:3001 |
| Frontend (Vite) | 5173 | http://localhost:5173 |
| API via Vite Proxy | — | http://localhost:5173/api/* → 3001 |
| PostgreSQL | 5432 | via DATABASE_URL |
| Redis | 6379 | via REDIS_URL (optional) |

### Production (Nginx)

| Service | Port | URL |
|---------|------|-----|
| Nginx | 80/443 | https://YOUR_DOMAIN |
| Backend (upstream) | 3001 | http://127.0.0.1:3001 |
| Static Frontend | — | /var/www/travelease/frontend |
| API Proxy | — | /api/* → upstream |

---

## 3. Environment Variables

### Backend (`Travel_Ease_Backend/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `PORT` | No | 3001 | Backend server port |
| `NODE_ENV` | No | development | Environment mode |
| `SUPABASE_URL` | Yes* | — | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes* | — | Supabase admin key |
| `JWT_SECRET` | Test only | — | Local JWT signing key |
| `ALLOWED_ORIGINS` | No | localhost:3000,5173 | CORS whitelist |
| `CLOUDINARY_CLOUD_NAME` | Yes** | — | Image upload service |
| `CLOUDINARY_API_KEY` | Yes** | — | Cloudinary key |
| `CLOUDINARY_API_SECRET` | Yes** | — | Cloudinary secret |
| `REDIS_ENABLED` | No | false | Enable Redis caching |
| `REDIS_URL` | No | — | Redis connection string |
| `MAP_PROVIDER` | No | nominatim | Map geocoding provider |

\* Required for production auth
\** Required for image uploads

### Frontend (`Travel_Ease_Frontend/.env.local`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_BASE_URL` | No | /api | API base URL (proxy in dev) |
| `VITE_SUPABASE_URL` | Yes | — | Supabase URL for client auth |
| `VITE_SUPABASE_ANON_KEY` | Yes | — | Supabase public key |

---

## 4. Request Flow

### Development Flow

```
Browser → http://localhost:5173/api/travel_plan/plans
                    │
                    ▼
              Vite Dev Server (port 5173)
                    │
                    │ proxy: /api/* → http://localhost:3001
                    ▼
              Express Server (port 3001)
                    │
                    ├─ CORS check (origin whitelist)
                    ├─ requestLogger middleware
                    ├─ express.json() body parser
                    ├─ authenticateToken (if protected route)
                    ├─ Zod validation (if schema defined)
                    ├─ Route handler
                    │     └─ Prisma query → PostgreSQL
                    ├─ errorHandler (on error)
                    └─ JSON response → Browser
```

### Production Flow

```
Browser → https://YOUR_DOMAIN/api/travel_plan/plans
                    │
                    ▼
              Nginx (port 443)
                    │
                    │ location /api/ { proxy_pass http://travelease_backend; }
                    ▼
              Express Server (port 3001)
                    │
                    └─ (same middleware chain as dev)
```

---

## 5. API Route Map

All routes are prefixed with `/api/` in the backend.

| Prefix | Router File | Auth Required |
|--------|-------------|---------------|
| `/api/travel_plan` | travelPlanRoutes | Mixed |
| `/api/user` | userRoutes | Mixed |
| `/api/business` | businessRoutes | Mixed |
| `/api/blogs` | blogRoutes | Mixed |
| `/api/reviews` | reviewRoutes | Yes |
| `/api/map` | mapRoutes | No |
| `/api/utils` | utilsRoutes | No |
| `/api/config` | configRoutes | No |
| `/api/health` | inline | No |

---

## 6. Authentication Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                     AUTHENTICATION FLOW                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐                                                 │
│  │ Client App  │                                                 │
│  └──────┬──────┘                                                 │
│         │                                                        │
│         │ 1. Login via Supabase (Google OAuth / email+password)  │
│         ▼                                                        │
│  ┌─────────────┐                                                 │
│  │ Supabase    │ Returns: access_token, refresh_token            │
│  │ Auth        │                                                 │
│  └──────┬──────┘                                                 │
│         │                                                        │
│         │ 2. Store token in localStorage                         │
│         ▼                                                        │
│  ┌─────────────┐                                                 │
│  │ API Request │ Authorization: Bearer <token>                   │
│  └──────┬──────┘                                                 │
│         │                                                        │
│         │ 3. Backend validates token                             │
│         ▼                                                        │
│  ┌─────────────────────────────────────────────────────┐         │
│  │ authenticateToken middleware                        │         │
│  │                                                     │         │
│  │ Test mode (NODE_ENV=test):                          │         │
│  │   - Verify JWT with local JWT_SECRET                │         │
│  │   - Lookup user by decoded.id                       │         │
│  │                                                     │         │
│  │ Production mode:                                    │         │
│  │   - supabaseAdmin.auth.getUser(token)               │         │
│  │   - Lookup user by email in local DB                │         │
│  │   - Sync auth_id if needed                          │         │
│  └──────┬──────────────────────────────────────────────┘         │
│         │                                                        │
│         │ 4. req.user = { id, email, first_name, last_name }     │
│         ▼                                                        │
│  ┌─────────────┐                                                 │
│  │ Route       │ Access req.user for authorization               │
│  │ Handler     │                                                 │
│  └─────────────┘                                                 │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 7. Verification Checklist

### Backend Health Check

```bash
curl http://localhost:3001/api/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "port": 3001,
  "database": "connected"
}
```

### Frontend Access

1. Open http://localhost:5173
2. Check browser DevTools Network tab for API calls
3. Verify `/api/travel_plan/public_plans` returns data

### Database Connectivity

```bash
cd Travel_Ease_Backend
npx prisma db push --dry-run
```

---

## 8. File Structure Summary

```
Travel_Ease/
├── Travel_Ease_Backend/          # Express API server
│   ├── server.ts                 # Entry point, boot sequence
│   ├── prisma/
│   │   └── schema.prisma         # Database schema
│   ├── src/
│   │   ├── config/               # Service configs (cloudinary, map, db)
│   │   ├── lib/                  # Shared utilities (prisma, logger, cache)
│   │   ├── middleware/           # Auth, error handling, rate limit
│   │   ├── modules/              # Feature modules (travel-plan, business, etc.)
│   │   ├── routes/               # Express routers
│   │   ├── schemas/              # Zod validation schemas
│   │   ├── services/             # Business logic services
│   │   └── types/                # TypeScript types
│   └── tests/                    # Vitest test files
│
├── Travel_Ease_Frontend/         # React application (Vite)
│   ├── src/
│   │   ├── components/           # UI components
│   │   ├── config/               # API configuration
│   │   ├── context/              # React contexts (Auth)
│   │   ├── features/             # TanStack Query hooks
│   │   ├── lib/                  # Query client, Supabase client
│   │   ├── pages/                # Route pages
│   │   ├── services/             # API service modules
│   │   ├── types/                # TypeScript types
│   │   └── utils/                # Utility functions
│   └── vite.config.ts            # Vite + proxy config
│
├── deploy/
│   └── nginx/
│       └── travelease.conf       # Production nginx config
│
└── docs/                         # Documentation
    ├── state-machines.md         # State machine specifications
    ├── architecture-baseline.md  # This document
    └── testing-guide.md          # Testing instructions
```

