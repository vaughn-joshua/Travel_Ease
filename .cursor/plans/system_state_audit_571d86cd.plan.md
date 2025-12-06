---
name: System State Audit
overview: Establish repo-wide state-machine clarity, then align backend/fronted travel-plan flows while reducing surface area.
todos:
  - id: audit-arch
    content: Map architecture & define state machines
    status: completed
  - id: backend-consistency
    content: Harden travel plan backend to state rules
    status: completed
    dependencies:
      - audit-arch
  - id: frontend-align
    content: Align frontend DTOs/flows to backend canon
    status: completed
    dependencies:
      - backend-consistency
  - id: tests-cleanup
    content: Add tests + document verification
    status: completed
    dependencies:
      - frontend-align
---

# System State Audit

## Phase 1 – System Mapping & State Definitions

- Read and summarize current architecture (Express backend, Prisma DB, React front) focusing on travel plan, participants, activities, auth. Key files: `Travel_Ease_Backend/server.ts`, `src/routes/travelPlanRoutes.ts`, `src/modules/travel-plan/**`, `prisma/schema.prisma`, `Travel_Ease_Frontend/src/services/travelPlanApi.ts`, `Travel_Ease_Frontend/src/features/travelPlans/*`.
- Define state machines (TravelPlan status Draft/Active/Completed/Cancelled; Participant pending/approved with role; Activity lifecycle; Auth unauthenticated→authenticated) including legal transitions, side effects, and illegal states.
- Produce a concise doc capturing DTO field mappings (e.g., title/name, max_slots/slots, visibility/is_public) to use as a single source of truth.

## Phase 2 – Backend Consistency Pass (Travel Plans)

- Normalize travel-plan flows to the state machines: creation defaults, slot enforcement, visibility window, join/approve/deny paths, and Quick Join search. Focus files: `src/modules/travel-plan/controllers/*`, `src/services/travelPlanService.ts`, `src/middleware/ownership.ts`, `src/schemas/validation.ts`.
- Remove/mark legacy endpoints (e.g., `finished_plan`, `specific_plans`) and duplicate logic, preferring service-level helpers for DTO formatting and slot checks.
- Add guardrails for illegal states (e.g., approving over capacity, demoting last admin, visibility on Completed/Cancelled, date ordering) with centralized helpers.

## Phase 3 – Frontend Alignment & Simplification

- Align frontend DTOs and calls with backend canonical fields (title/name, slots/max_slots, visibility/is_public) and the state machines. Key files: `src/services/travelPlanApi.ts`, `src/features/travelPlans/*`, `src/pages/MainPage.tsx`, `src/pages/Planner.tsx`.
- Remove duplicated transformations across components; rely on shared mappers/query hooks. Ensure join/quick-join flows reflect backend rules and error states.

## Phase 4 – Tests, Verification, and Cleanup

- Add/refresh backend tests for travel-plan lifecycle, participant approvals, slot limits, visibility rules, and quick-join search; reuse `tests/travel-plan.test.ts`, `tests/participants.test.ts` as templates.
- Add minimal frontend tests for DTO mapper and join flow happy/error paths.
- Document testing instructions (Postman + UI flows) and list any deprecated code removed.