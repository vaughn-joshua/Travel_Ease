---
name: resolve-oauth-db-degrade
overview: Fix OAuth sync 403s by auto-provisioning Supabase users and make travel plan listings degrade gracefully when the database is unreachable.
todos:
  - id: fix-auth
    content: Auto-provision Supabase users and extend auth tests
    status: completed
  - id: public-plans-degrade
    content: Graceful fallback for public/previous plans
    status: completed
    dependencies:
      - fix-auth
  - id: frontend-fallback
    content: Handle degraded travel-plan responses in UI
    status: completed
    dependencies:
      - public-plans-degrade
  - id: docs-tests
    content: Update docs & run tests
    status: completed
    dependencies:
      - frontend-fallback
---

# Resolve OAuth Sync & Plan Listing Failures

## fix-auth

- Update [`Travel_Ease_Backend/src/middleware/auth.ts`](Travel_Ease_Backend/src/middleware/auth.ts) so `authenticateToken` (and `requireGoogleAuth`, if applicable) auto-provisions a minimal `user` record when Supabase returns a valid profile but Prisma finds none, preserving onboarding flow in the Authentication state machine. Capture metadata from Supabase to populate `first_name`/`last_name`, set `auth_provider='google'`, and mark `profile_completed=false` for new records. Ensure a consistent response (`ACCOUNT_NOT_REGISTERED` only when Supabase truly has no email) and add logging for the new `AUTO_PROVISIONED` transition.
- Extend backend tests in [`Travel_Ease_Backend/tests/auth.test.ts`](Travel_Ease_Backend/tests/auth.test.ts) to cover the new auto-provision behaviour (mock Prisma to simulate missing user) and verify that `/api/user/oauth` now returns 200 with `needsOnboarding=true`.

## public-plans-degrade

- Refactor [`Travel_Ease_Backend/src/modules/travel-plan/controllers/publicPlans.ts`](Travel_Ease_Backend/src/modules/travel-plan/controllers/publicPlans.ts) and [`previousPlans.ts`](Travel_Ease_Backend/src/modules/travel-plan/controllers/previousPlans.ts) to wrap Prisma calls with `Promise.allSettled` / targeted try-catch so connection failures fall back to an empty dataset with `dbUnavailable=true` (HTTP 200) instead of bubbling a 503. Reuse the caching path for successful calls, and add metrics/headers (`X-DB-Status`) to signal degraded mode.
- Mirror the fallback pattern in any shared helpers (if additional list endpoints share logic) to keep the Travel Plan state machine consistent during `DB_DEGRADED`.

## frontend-handle-fallback

- Adjust travel-plan fetch utilities (e.g. [`Travel_Ease_Frontend/src/utils/travel_plan/fetch_public_plans.ts`](Travel_Ease_Frontend/src/utils/travel_plan/fetch_public_plans.ts), [`fetch_previous_plans.ts`](Travel_Ease_Frontend/src/utils/travel_plan/fetch_previous_plans.ts)) to read the new `{ data, dbUnavailable }` payload, surface the degraded state through TanStack Query (e.g. via query meta), and display a non-blocking banner or empty-state message in the relevant UI (Blogs/Plans pages) instead of logging Axios errors.
- Add lightweight unit tests (or component story checks) for the new degraded-state handling to avoid regressions.

## docs-tests

- Update [`docs/state-machines.md`](docs/state-machines.md) to capture the new auto-provision transition in the Authentication/Onboarding machine and the `DB_DEGRADED → FALLBACK_RESPONSE` branch for travel-plan listings.
- Run targeted test suites: backend `npm test -- tests/auth.test.ts` and frontend `npm run test -- src/__tests__/dtoMapper.test.ts` (or relevant new tests), plus manual verification of Google OAuth callback and travel plan listing screens under degraded DB conditions.