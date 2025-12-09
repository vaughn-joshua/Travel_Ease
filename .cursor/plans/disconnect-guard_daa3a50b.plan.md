---
name: disconnect-guard
overview: Add UI guard for Google disconnect and expand auth recovery checks
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

# Update Disconnect Flow

1. **Profile guard** – In [`Travel_Ease_Frontend/src/pages/Profile.tsx`](Travel_Ease_Frontend/src/pages/Profile.tsx), add `disconnectPrompt` state, clear it when `hasPassword` or on successful disconnect, and replace the plain "Disconnect" click handler with a function that shows the password form (with a friendly prompt) when Google users lack a password; otherwise open the existing modal. Render the prompt above the card.
2. **Auth recovery keywords** – In [`Travel_Ease_Frontend/src/lib/authRecovery.ts`](Travel_Ease_Frontend/src/lib/authRecovery.ts), extend the user-action error codes/messages so disconnect/password failures (missing password, incorrect password, etc.) never trigger the auth recovery reload even without explicit error codes.
3. **Manual check** – Reload the profile page, confirm the new prompt appears for Google-only users, verify the password form opens instead of the modal, then test the disconnect modal once a password exists and ensure no auth recovery reload occurs on expected validation errors.