---
name: login-console-fix
overview: Address login API errors causing browser console noise by fixing backend connectivity and improving frontend handling.
todos:
  - id: fix-backend-coords
    content: Remap longtitude to longitude in API responses
    status: completed
  - id: update-types
    content: Allow frontend types to handle longtitude fallback
    status: completed
  - id: render-markers
    content: Use normalized coords in embedded map component
    status: completed
---

# Fix Login Console Errors

## Steps

1. **Capture backend error context**  

- Trigger `/user/login` from the UI or via a REST client while tailing the backend log (`terminals/15.txt`).  
- Confirm the precise stack trace (currently suspected Prisma P1001) to document the root cause before changing code.

2. **Restore backend login functionality**  

- Update configuration (`Travel_Ease_Backend/.env` or secrets manager) so Prisma’s `DATABASE_URL` and Supabase keys point to a reachable service.  
- If unavailable locally, adjust `Travel_Ease_Backend/src/modules/user/controllers/userController.ts` (and/or `lib/prismaHelpers.ts`) to gracefully handle connectivity failures—returning a 503 with a clear message instead of a 500.

3. **Improve frontend error reporting**  

- Refine the client request wrapper in [`Travel_Ease_Frontend/src/lib/api.ts`](Travel_Ease_Frontend/src/lib/api.ts) so login failures surface a user-facing notification instead of just logging the raw error.  
- Remove or gate the “Making POST request…” console log to reduce noise in the browser console.