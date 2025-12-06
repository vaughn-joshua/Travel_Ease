---
name: Phase1-Auth
overview: Implement Supabase-centered authentication with email/password, Google onboarding, and JWT middleware, while documenting auth state machines and removing legacy JWT paths.
todos:
  - id: auth-discovery
    content: Audit auth flows & model state machines
    status: completed
  - id: auth-backend
    content: Implement backend Supabase auth & cleanup
    status: completed
    dependencies:
      - auth-discovery
  - id: auth-frontend
    content: Align frontend auth context/UI
    status: completed
    dependencies:
      - auth-backend
  - id: auth-tests-docs
    content: Add auth tests and update docs
    status: completed
    dependencies:
      - auth-frontend
---

# Phase 1 – Authentication System (Supabase + Google)

## Scope & Goals

- Deliver unified Supabase auth covering email/password signup/login, Google OAuth onboarding, and protected API routes.
- Model and document state machines for authentication, authorization, onboarding, and token lifecycle.
- Remove redundant local JWT paths, ensuring backend + frontend share canonical flows.

## Implementation Steps

- **Discovery & State Modeling**
- Review existing auth code: `[backend/src/middleware/auth.ts]`, `[backend/src/modules/user/controllers/userController.ts]`, `[frontend/src/context/AuthContext.tsx]`, `[frontend/src/services/auth.ts]`, and Supabase client helpers.
- Draft state diagrams for auth, authorization, onboarding, token lifecycle to add into `[docs/state-machines.md]`.
- **Backend Alignment**
- Harden Supabase email/password endpoints in `[backend/src/modules/user/controllers/userController.ts]` (error handling, onboarding flags, refresh token storage/expiry consistency).
- Build Google onboarding flow (ensure `/user/oauth` persists profile defaults, sets onboarding state, syncs metadata) and expose progress to clients.
- Upgrade JWT middleware in `[backend/src/middleware/auth.ts]`: verify Supabase JWTs via JWKS/GoTrue validation, ensure role extraction, drop unused local JWT fallback except test harness, delete `[backend/src/middleware/authenticateUser.ts]` and similar redundancies.
- Centralize auth-related config/types in `[backend/src/types/auth.ts?]` (create if needed) for DTO consistency.
- **Frontend Alignment**
- Update Auth context & pages (`[frontend/src/context/AuthContext.tsx]`, `[frontend/src/pages/Login.tsx]`, `[frontend/src/pages/Register.tsx]`, `[frontend/src/pages/AuthCallback.tsx]`, `[frontend/src/pages/Onboarding.tsx]`) to consume new onboarding states, handle token refresh, and surface Supabase errors.
- Ensure API services (`[frontend/src/services/auth.ts]`, `[frontend/src/services/api.ts]`) map DTO changes and manage token storage consistently.
- Implement onboarding UI state machine (pending profile completion, completed, blocked) with clear transitions.
- **Testing & Verification**
- Backend: expand tests in `[backend/tests/auth.test.ts]` (create if missing) covering signup/login, Google sync, token verification, onboarding transitions; update `[backend/tests/setup.ts]` for Supabase mocks.
- Frontend: add vitest tests for auth context (`[frontend/src/__tests__/AuthContext.test.tsx]`) and onboarding flow; add integration tests for login/register pages.
- Provide Postman/curl scripts documenting signup/login/oauth verification in `[docs/testing-guide.md]`.
- **Documentation & Cleanup**
- Extend `[docs/state-machines.md]` with new auth state machines (auth/authz/onboarding/token lifecycle) referencing canonical transitions.
- Summarize auth architecture and environment requirements in `[docs/architecture-baseline.md]` (Supabase keys, callback URLs).
- Remove deprecated JWT files/usages, update `.env.example` guidance, ensure tree is clear of unused auth helpers.

## Deliverables

- Working Supabase-backed email/password + Google sign-in with onboarding, enforced by updated middleware.
- Updated docs describing auth state machines, architecture, and testing guidance.
- Automated tests and manual verification steps for auth flows.
- Cleaned codebase without redundant legacy JWT logic.

## Implementation Todos

- `auth-discovery` – Audit current auth flows & model states
- `auth-backend` – Implement backend Supabase auth + middleware cleanup
- `auth-frontend` – Align frontend auth context/UI with new flows
- `auth-tests-docs` – Add tests, update docs, provide verification steps