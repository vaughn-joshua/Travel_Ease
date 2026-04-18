<p align="center">
  <img src="docs/assets/travelease-logo.svg" alt="TravelEase logo" width="140" />
</p>

<h1 align="center">TravelEase</h1>

<p align="center">
  <strong>Travel planning, business discovery, and LGU-assisted destination management in one full-stack web platform.</strong>
</p>

<p align="center">
  <img alt="Build Status" src="https://img.shields.io/badge/build-%5BPLACEHOLDER%5D-lightgrey" />
  <img alt="Version" src="https://img.shields.io/badge/version-%5BPLACEHOLDER%5D-lightgrey" />
  <img alt="License" src="https://img.shields.io/badge/license-%5BPLACEHOLDER%5D-lightgrey" />
</p>

<p align="center">
  <a href="https://travelease.app"><strong>Live Website: https://travelease.app</strong></a>
</p>

---

<a id="table-of-contents"></a>
## 📚 Table of Contents

- [About the Project](#about-the-project)
- [Live Demo](#live-demo)
- [Getting Started](#getting-started)
- [Test Credentials / Access Roles](#test-credentials--access-roles)
- [User Roles & Permissions](#user-roles--permissions)
- [Usage Guide](#usage-guide)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [Security](#security)
- [License](#license)
- [Contact & Support](#contact--support)

---

<a id="about-the-project"></a>
## 📖 About the Project

TravelEase is a full-stack travel management web application built for trip planning, destination discovery, business registration, and administrative coordination. It is designed for developers maintaining the platform, QA teams validating behavior, LGU administrators reviewing business activity, and evaluators assessing system readiness.

### Overview

The platform combines public-facing travel features with administrative tooling in a single PERN-based monorepo. Travelers can explore destinations, manage plans, and interact with travel-related content, while administrators can review business registrations, oversee user access, and support operational workflows.

### Key Features

- Multi-role authentication and access control for platform users and administrators
- Travel plan creation, itinerary management, and participant collaboration
- Business directory with registration and approval workflows
- Interactive map-based discovery with routing and location services
- Travel blog publishing and content management
- Reviews, favorites, and user profile management
- Traffic- and route-aware system utilities for destination planning
- Monorepo architecture with separate frontend and backend workspaces

### Tech Stack

| Layer | Technologies |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, React Router v7, TanStack Query, React Hook Form, Tailwind CSS 4, Leaflet |
| Backend | Node.js, Express, TypeScript, Zod, Pino |
| Data | PostgreSQL, Prisma ORM, Supabase |
| Auth | Supabase Auth with local JWT fallback for tests |
| Caching / Infra | Redis, Vercel, Railway |
| Testing | Vitest, Testing Library, Supertest |

---

<a id="live-demo"></a>
## 🚀 Live Demo

| Environment | URL | Purpose | Notes |
| --- | --- | --- | --- |
| Production | [https://travelease.app](https://travelease.app) | Public live environment | Frontend is deployed on Vercel and the backend API is hosted on Railway |
| Staging | [PLACEHOLDER: Add staging URL] | Pre-release QA / UAT | [PLACEHOLDER: Add staging deployment notes] |

---

<a id="getting-started"></a>
## 🛠️ Getting Started

### Prerequisites

- Node.js `18.18+`
- npm `9+`
- PostgreSQL database or Supabase project
- Supabase project for authentication and storage
- Redis instance for caching and rate limiting if enabled
- Git

### Installation

1. Clone the repository.

```bash
git clone [PLACEHOLDER: Add repository URL]
cd Travel_Ease
```

2. Install all workspace dependencies from the monorepo root.

```bash
npm install
```

3. Copy the example environment files.

```bash
cp Travel_Ease_Backend/env.example Travel_Ease_Backend/.env
cp Travel_Ease_Frontend/env.example Travel_Ease_Frontend/.env.local
```

4. Update the copied files with your local or hosted service credentials.

5. Generate the Prisma client and push the schema.

```bash
cd Travel_Ease_Backend
npx prisma generate
npx prisma db push
cd ..
```

6. Start the backend and frontend in separate terminals.

```bash
npm run dev:backend
npm run dev:frontend
```

7. Open the local applications.

- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend API: [http://localhost:3001/api/health](http://localhost:3001/api/health)

### Helpful Commands

```bash
# Root workspace commands
npm run dev:backend
npm run dev:frontend
npm run build
npm test

# Backend-specific commands
npm run build --workspace=Travel_Ease_Backend
npm run test --workspace=Travel_Ease_Backend
npx vitest run tests/auth.test.ts --workspace=Travel_Ease_Backend

# Frontend-specific commands
npm run lint --workspace=Travel_Ease_Frontend
npm run test --workspace=Travel_Ease_Frontend
```

### Environment Variables

Use the root [`env.example`](./env.example) as the master reference, then configure the frontend and backend workspace files separately.

#### `Travel_Ease_Backend/.env`

```env
DATABASE_URL=postgresql://[USERNAME]:[PASSWORD]@[HOST]:5432/[DATABASE]
DIRECT_URL=postgresql://[USERNAME]:[PASSWORD]@[HOST]:5432/[DATABASE]
PORT=3001
NODE_ENV=development

SUPABASE_URL=https://[PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=[PLACEHOLDER]
SUPABASE_SERVICE_ROLE_KEY=[PLACEHOLDER]
SUPABASE_STORAGE_BUCKET=images

JWT_SECRET=[PLACEHOLDER]
ALLOWED_ORIGINS=http://localhost:5173
FRONTEND_URL=http://localhost:5173

REDIS_ENABLED=false
REDIS_URL=redis://localhost:6379/0

MAP_PROVIDER=nominatim
NOMINATIM_BASE_URL=https://nominatim.openstreetmap.org
OSRM_BASE_URL=https://router.project-osrm.org
```

#### `Travel_Ease_Frontend/.env.local`

```env
VITE_API_BASE_URL=/api
VITE_SUPABASE_URL=https://[PROJECT-REF].supabase.co
VITE_SUPABASE_ANON_KEY=[PLACEHOLDER]
VITE_ORS_API_KEY=[PLACEHOLDER]
VITE_ENABLE_EDITOR=false

# Vercel server-side environment variable for production only
BACKEND_URL=https://[PLACEHOLDER-BACKEND-URL]
```

> **Note:** Do not commit real environment files or service credentials to version control.

---

<a id="test-credentials--access-roles"></a>
## 🔐 Test Credentials / Access Roles

> [!WARNING]
> **⚠️ SECURITY WARNING:** The accounts below are for testing, QA, demonstration, and evaluation only. Rotate these credentials immediately in any real deployment, never reuse them in production, and restrict access to authorized reviewers.

| Role | Name | Email | Password | Access Level |
| --- | --- | --- | --- | --- |
| SUPER ADMIN | Vaughn Joshua | `stonks.vaughn@gmail.com` | `pass123` | Full system access |
| LGU ADMIN | [PLACEHOLDER: Add LGU admin display name] | `travelease759@gmail.com` | `pass123` | Local Government Unit administrative access |

### Role-Based Access Notes

- `SUPER_ADMIN` can access global administrative tools, including user role management and system-level operations.
- `LGU_ADMIN` can access LGU-oriented moderation workflows such as pending business registration review.
- Default or demo passwords must be changed before any production use.
- Limit distribution of demo credentials to approved testers and evaluators only.

---

<a id="user-roles--permissions"></a>
## 👥 User Roles & Permissions

TravelEase supports multiple application roles internally. The matrix below focuses on the two administrative demo roles documented in this README.

| Capability | SUPER ADMIN | LGU ADMIN | Notes |
| --- | --- | --- | --- |
| Sign in to the platform | ✅ | ✅ | Standard authenticated access |
| Access account details, notifications, favorites, and profile tools | ✅ | ✅ | Shared authenticated features |
| Access business management features | ✅ | ✅ | Includes business-related management screens available to the user |
| View pending business registrations | ✅ | ✅ | Restricted to admin roles |
| Approve or reject pending business registrations | ✅ | ✅ | Used for LGU review workflows |
| Access business registration moderation tab | ✅ | ✅ | Available in the profile area |
| View all registered users | ✅ | ❌ | `SUPER_ADMIN` only |
| Change user roles | ✅ | ❌ | `SUPER_ADMIN` only |
| Access the admin panel | ✅ | ❌ | `SUPER_ADMIN` only |
| Run system operations such as traffic snapshot generation | ✅ | ❌ | `SUPER_ADMIN` only |

### Administrative Distinctions

- `SUPER_ADMIN` is the highest privileged role and is intended for platform-wide governance.
- `LGU_ADMIN` is intended for operational oversight within LGU workflows without access to global user administration.

---

<a id="usage-guide"></a>
## 🧭 Usage Guide

### How to Log In

1. Open [https://travelease.app](https://travelease.app).
2. Navigate to the login page.
3. Enter one of the test credentials listed above.
4. Submit the form and wait for the role-specific dashboard and profile tools to load.

### Basic Workflow: `SUPER_ADMIN`

1. Sign in with the `SUPER_ADMIN` account.
2. Open the profile area and access the `Business Registrations` tab to review pending submissions.
3. Use the `Admin Panel` to inspect users and update account roles when required.
4. Trigger system operations such as traffic snapshot generation when operational data needs recalculation.
5. Validate user-facing changes, notifications, and approval outcomes before signing out.

### Basic Workflow: `LGU_ADMIN`

1. Sign in with the `LGU_ADMIN` account.
2. Open the profile area and access `Business Registrations`.
3. Review each pending business submission and either approve or reject it.
4. Use standard account and business-management tools to verify changes.
5. Confirm the updated registration state and sign out after review.

### Screenshots

- [PLACEHOLDER: Add login screen screenshot]
- [PLACEHOLDER: Add SUPER_ADMIN dashboard screenshot]
- [PLACEHOLDER: Add LGU_ADMIN business registration review screenshot]
- [PLACEHOLDER: Add public-facing travel planner or map screenshot]

---

<a id="api-documentation"></a>
## 🔌 API Documentation

All backend routes are exposed under the `/api` prefix.

### Base URL

- Production: `https://travelease.app/api`
- Local: `http://localhost:3001/api`

### Authentication

- Production authentication uses Supabase JWTs.
- Automated backend tests use local JWT fallback with `AUTH_MODE=local`.
- Protected endpoints require an `Authorization: Bearer <token>` header.

### Route Groups

| Route Group | Description |
| --- | --- |
| `/api/user` | Authentication, profile management, favorites, admin user operations |
| `/api/business` | Business directory, registrations, approvals, moderation |
| `/api/travel_plan` | Travel plan creation, editing, participant collaboration |
| `/api/blogs` | Travel blog listing, publishing, and updates |
| `/api/reviews` | Business and travel plan reviews |
| `/api/map` | Location search, geocoding, and routing-related utilities |
| `/api/notification` | Notification retrieval and updates |
| `/api/traffic` | Traffic snapshots and alternative route suggestions |
| `/api/weather` | Weather-related services |
| `/api/utils` | Utility endpoints such as uploads |

### Reference Materials

- API reference document: [PLACEHOLDER: Add OpenAPI, Swagger, or Postman collection link]
- Endpoint coverage details: [PLACEHOLDER: Add detailed API documentation location]

---

<a id="contributing"></a>
## 🤝 Contributing

Contributions should follow the project’s review and testing expectations before merge.

### Contribution Workflow

1. Create a feature branch from the main integration branch.
2. Make focused changes in the appropriate workspace.
3. Run relevant tests and lint checks locally.
4. Open a pull request with a clear summary, screenshots if UI-related, and testing notes.

### Branch Naming Convention

Use descriptive branch names such as:

- `feature/short-description`
- `fix/issue-summary`
- `docs/readme-update`
- `chore/dependency-maintenance`

### Project Policies

- Contribution guide: [PLACEHOLDER: Add `CONTRIBUTING.md` link]
- Code of Conduct: [PLACEHOLDER: Add `CODE_OF_CONDUCT.md` link]

---

<a id="security"></a>
## 🛡️ Security

Security is a shared responsibility across development, QA, deployment, and administrative operations.

### Reporting Vulnerabilities

- Report security concerns privately to: `[PLACEHOLDER: Add security contact email]`
- Do not disclose sensitive vulnerabilities in public issues or pull requests.

### Credential Handling Best Practices

- Rotate all demo and seeded credentials before production rollout.
- Never commit `.env`, `.env.local`, service role keys, or database secrets.
- Limit access to administrative accounts using least-privilege principles.
- Store production secrets in managed environment variable platforms such as Vercel and Railway.
- Review access logs and administrative activity regularly.

### Test Credential Disclaimer

> The credentials listed in this README are intended only for controlled testing and evaluation environments. They must not remain active in production or publicly exposed administrative deployments.

---

<a id="license"></a>
## 📄 License

`[PLACEHOLDER: Specify license type, e.g. MIT, Apache-2.0, or Proprietary]`

---

<a id="contact--support"></a>
## 📬 Contact & Support

| Topic | Details |
| --- | --- |
| Maintainer | `[PLACEHOLDER: Add maintainer or team name]` |
| Support Email | `[PLACEHOLDER: Add support email]` |
| Security Contact | `[PLACEHOLDER: Add security email]` |
| Issue Tracker | `[PLACEHOLDER: Add repository issue tracker URL]` |

For operational questions, bug reports, or deployment support, use the issue tracker and support contacts above once they are finalized.
