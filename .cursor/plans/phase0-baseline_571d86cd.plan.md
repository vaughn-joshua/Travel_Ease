---
name: Phase0-Baseline
overview: Establish TravelEase architecture baseline with state machines for boot, API lifecycle, and env config; document how services interact and unify base URLs/ports.
todos:
  - id: map-arch
    content: Map ports, env, config wiring
    status: completed
  - id: state-machines
    content: Define boot/API/env state machines
    status: completed
    dependencies:
      - map-arch
  - id: docs-output
    content: Publish baseline docs and testing notes
    status: completed
    dependencies:
      - state-machines
---

# Phase 0 – Architecture & System Baseline

## Scope & Goals

- Map repo structure, ports, env, and service wiring (frontend, backend, DB). Document how each layer communicates.
- Define state machines for: app boot sequence, API request lifecycle, environment configuration states.
- Verify runtime: ensure backend and frontend dev servers run with unified base URLs.
- Identify immediate cleanup/simplifications (naming, duplicated config) without forward-phase changes.

## Deliverables

- Architecture note: how frontend ⇄ backend ⇄ DB communicate (ports, proxy, auth flow), base URL conventions, and boot order.
- State machine doc additions for boot, API request lifecycle, env config states (with legal/illegal transitions and side effects).
- Quick verification steps (curl/health + frontend access) and Postman/manual notes.

## Implementation Steps

- Read configs: `Travel_Ease_Backend/server.ts`, `Travel_Ease_Backend/src/config/*`, `Travel_Ease_Backend/.env.example`, `Travel_Ease_Frontend/src/config/api.ts`, `vite.config.ts`, `deploy/nginx/*` to map ports/proxy.
- Extract base URL/port rules and align documented defaults (e.g., backend 3001, frontend 5173, Vite proxy `/api`).
- Draft state machines:
- App boot: env load → DB connect → middleware/register routes → listen → health.
- API request lifecycle: receive → auth/ownership → validation → handlers → prisma → response/log/error.
- Env config: missing/invalid env → degraded mode (warn) → ready; side effects on CORS, DB, Cloudinary.
- Document findings in `docs/state-machines.md` (add sections) and a short `docs/architecture-baseline.md` describing the system map and runtime endpoints.
- Testing instructions: `curl /api/health`, frontend access at http://localhost:5173 via Vite proxy, note Postman collection guidance.
- Cleanup targets list (no code changes unless trivial docs/naming alignment needed for this phase).

## Risks / Constraints

- Stay within Phase 0: no behavioral changes beyond documentation/clarity; defer feature tweaks to later phases.
- Keep naming consistent (title/name, slots/max_slots) in docs to avoid drift.