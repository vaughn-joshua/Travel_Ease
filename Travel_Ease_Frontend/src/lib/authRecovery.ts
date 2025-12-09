/**
 * Auth Recovery Helper
 * 
 * Handles auth-related errors by triggering a page reload instead of logging out.
 * This preserves the session and allows Supabase to refresh tokens automatically.
 * 
 * ## Key Behaviors
 * - Detects auth errors from Axios, Fetch, and Supabase responses
 * - Triggers ONE reload per session to avoid infinite loops
 * - Does NOT clear tokens or redirect - just reloads
 * - Only explicit logout (signOut) should clear auth state
 * 
 * ## Integration Points
 * 
 * 1. **Axios Interceptors** (`src/services/api.ts`):
 *    - Response error interceptor calls `handleAuthRecovery(error)` for auth errors
 *    - Skips DB_UNAVAILABLE and explicit user flow errors
 * 
 * 2. **React Query** (`src/lib/queryClient.ts`):
 *    - QueryCache and MutationCache have global `onError` handlers
 *    - Both call `handleAuthRecovery(error)` when `isAuthError(error)` is true
 *    - Query retry logic doesn't retry auth errors
 * 
 * 3. **AuthContext** (`src/context/AuthContext.tsx`):
 *    - TOKEN_EXPIRED triggers `handleAuthRecovery` instead of clearing auth
 *    - Only explicit `signOut()` clears auth state
 *    - onAuthStateChange only updates session when valid
 * 
 * 4. **AuthCallback** (`src/pages/AuthCallback.tsx`):
 *    - Uses `handleAuthRecovery` for sync errors (not user flow errors)
 * 
 * ## Expected Behavior
 * 
 * | Scenario                           | Action                          |
 * |------------------------------------|---------------------------------|
 * | 401/403/419 from any API call      | Page reload (one-shot)          |
 * | Token expired                      | Page reload (one-shot)          |
 * | DB unavailable (503)               | Show error, no auth change      |
 * | Network errors (ECONNREFUSED)      | Show error, no reload           |
 * | ACCOUNT_NOT_REGISTERED             | Clear auth, show registration   |
 * | OAUTH_EMAIL_MISSING                | Clear auth, show error          |
 * | User clicks Logout                 | Clear auth + redirect           |
 * | User deletes account               | Clear auth + redirect           |
 * 
 * ## Reload Guard
 * - Uses sessionStorage to persist across page reloads (prevents infinite loops)
 * - 30-second cooldown between reload attempts
 * - Only ONE reload per session unless cooldown expires AND user navigates away
 * 
 * ## Testing Expectations
 * 
 * 1. 401 on a protected page → triggers recovery (reload), not logout
 * 2. Explicit logout button → calls signOut(), clears auth, navigates to /
 * 3. Multiple 401s in quick succession → only ONE reload (guard prevents loops)
 * 4. Network errors → no reload, error shown to user
 */

// Session storage keys for persistent reload guard
const AUTH_RECOVERY_KEY = "auth_recovery_attempted";
const AUTH_RECOVERY_TIMESTAMP_KEY = "auth_recovery_timestamp";

// Cooldown period in milliseconds (30 seconds)
const AUTH_RECOVERY_COOLDOWN_MS = 30_000;

// Debounce window in milliseconds (prevents multiple simultaneous calls)
const DEBOUNCE_WINDOW_MS = 100;

// In-memory debounce tracker (for same-page simultaneous errors)
let pendingReload = false;
let debounceTimeoutId: number | null = null;

// Auth-related HTTP status codes
const AUTH_ERROR_STATUSES = [401, 403, 419];

// Network error codes that should NOT trigger auth recovery
const NETWORK_ERROR_CODES = [
  "ECONNREFUSED",
  "ERR_NETWORK",
  "ERR_CANCELED",
  "ECONNABORTED",
  "ETIMEDOUT",
  "ERR_CONNECTION_REFUSED",
];

// Error codes that indicate auth issues
const AUTH_ERROR_CODES = [
  "invalid_token",
  "expired",
  "session",
  "unauth",
  "token_expired",
  "jwt_expired",
  "refresh_token",
];

// Error codes that are user-initiated action errors (NOT auth session errors)
// These should NOT trigger auth recovery - they need to be shown to the user
const USER_ACTION_ERROR_CODES = [
  "INVALID_PASSWORD",       // Wrong password for disconnect Google / change password
  "NO_EMAIL_IDENTITY",      // User needs to set password before disconnecting Google
  "PASSWORD_REQUIRED",      // Missing password field
  "NOT_GOOGLE_ACCOUNT",     // User trying to disconnect Google on non-Google account
  "PASSWORD_TOO_SHORT",     // Password policy failure when setting password
  "SET_PASSWORD_FAILED",    // Admin password set failed
  "NOT_GOOGLE_USER",        // Set-password called by non-Google user
  "ACCOUNT_NOT_REGISTERED", // OAuth user not yet in our DB
  "OAUTH_EMAIL_MISSING",    // OAuth flow missing email
  "VALIDATION_ERROR",       // Form validation errors
  "DUPLICATE_EMAIL",        // Email already exists
  "WEAK_PASSWORD",          // Password doesn't meet requirements
];

// User-action messages (no reload) to avoid auth recovery on disconnect/password flows
const USER_ACTION_MESSAGE_KEYWORDS = [
  "disconnect your google",
  "disconnecting google",
  "set a password before disconnecting google",
  "incorrect password",
];

// Error messages that indicate auth issues
const AUTH_ERROR_MESSAGES = [
  "unauthorized",
  "unauthenticated",
  "forbidden",
  "invalid token",
  "jwt expired",
  "session not found",
  "refresh token",
  "authentication failed",
  "token expired",
  "access denied",
];

/**
 * Check if an error is a network error (connection refused, timeout, etc.)
 * These should NOT trigger auth recovery - they indicate the server is unreachable
 */
function isNetworkError(error: unknown): boolean {
  if (!error) return false;

  const err = error as Record<string, unknown>;
  
  // Check axios error code
  const errorCode = err?.code;
  if (typeof errorCode === "string" && NETWORK_ERROR_CODES.includes(errorCode)) {
    return true;
  }

  // Check if response is missing (indicates network failure, not server response)
  const axiosResponse = err?.response;
  if (err?.isAxiosError && axiosResponse === undefined) {
    // Axios error without response = network error
    return true;
  }

  // Check error message for network-related keywords
  const message = err?.message;
  if (typeof message === "string") {
    const msgLower = message.toLowerCase();
    if (
      msgLower.includes("network error") ||
      msgLower.includes("connection refused") ||
      msgLower.includes("timeout") ||
      msgLower.includes("econnrefused")
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Check if an error code indicates a user-initiated action error
 * These should NOT trigger auth recovery - they need to be displayed to the user
 */
function isUserActionError(code: unknown): boolean {
  if (typeof code !== "string") return false;
  return USER_ACTION_ERROR_CODES.includes(code);
}

/**
 * Check if an error message indicates a user-action (disconnect/password) flow
 * These should NOT trigger auth recovery even without explicit error codes
 */
function isUserActionMessage(message: unknown): boolean {
  if (typeof message !== "string") return false;
  const normalized = message.toLowerCase();
  return USER_ACTION_MESSAGE_KEYWORDS.some((keyword) =>
    normalized.includes(keyword)
  );
}

/**
 * Detect if an error is auth-related (401, 403, 419, or auth-specific messages)
 * 
 * Important: 
 * - User action errors (wrong password, etc.) are NOT treated as auth errors
 * - Network errors (connection refused, timeout) are NOT treated as auth errors
 */
export function isAuthError(error: unknown): boolean {
  if (!error) return false;

  // Network errors are NOT auth errors - server is unreachable
  if (isNetworkError(error)) {
    return false;
  }

  const err = error as Record<string, unknown>;

  // 1) Axios-style errors (error.response.status)
  const axiosResponse = err?.response as Record<string, unknown> | undefined;
  const axiosStatus = axiosResponse?.status;
  const axiosData = axiosResponse?.data as Record<string, unknown> | undefined;
  const axiosCode = axiosData?.code;
  const axiosMessage =
    typeof axiosData?.error === "string"
      ? axiosData.error
      : typeof axiosData?.message === "string"
      ? axiosData.message
      : undefined;
  
  // Skip user action errors - these need to be shown to the user
  if (isUserActionError(axiosCode)) {
    return false;
  }
  if (isUserActionMessage(axiosMessage)) {
    return false;
  }
  
  if (typeof axiosStatus === "number" && AUTH_ERROR_STATUSES.includes(axiosStatus)) {
    // Skip DB_UNAVAILABLE - that's not an auth error
    if (axiosCode !== "DB_UNAVAILABLE") {
      return true;
    }
  }

  // 2) Fetch-style responses (error.status)
  const fetchStatus = err?.status;
  if (typeof fetchStatus === "number" && AUTH_ERROR_STATUSES.includes(fetchStatus)) {
    return true;
  }

  // 3) Supabase auth errors
  const supaError = (err?.error ?? err) as Record<string, unknown>;
  const supaStatus = supaError?.status;
  const supaCode = supaError?.code;
  const supaMessage = supaError?.message ?? "";

  if (isUserActionMessage(supaMessage)) {
    return false;
  }

  if (typeof supaStatus === "number" && AUTH_ERROR_STATUSES.includes(supaStatus)) {
    return true;
  }

  // Check error code
  if (typeof supaCode === "string") {
    const codeLower = supaCode.toLowerCase();
    if (AUTH_ERROR_CODES.some((c) => codeLower.includes(c))) {
      return true;
    }
  }

  // Check error message
  if (typeof supaMessage === "string") {
    const msgLower = supaMessage.toLowerCase();
    if (AUTH_ERROR_MESSAGES.some((m) => msgLower.includes(m))) {
      return true;
    }
  }

  // 4) Generic error.message string
  const message = err?.message;
  if (isUserActionMessage(message)) {
    return false;
  }
  if (typeof message === "string") {
    const msgLower = message.toLowerCase();
    if (AUTH_ERROR_MESSAGES.some((m) => msgLower.includes(m))) {
      return true;
    }
  }

  return false;
}

/**
 * Check if we're within the cooldown period from a previous reload attempt.
 * Uses sessionStorage to persist across page reloads.
 */
function isWithinCooldown(): boolean {
  try {
    const timestampStr = sessionStorage.getItem(AUTH_RECOVERY_TIMESTAMP_KEY);
    if (!timestampStr) return false;

    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp)) return false;

    const elapsed = Date.now() - timestamp;
    return elapsed < AUTH_RECOVERY_COOLDOWN_MS;
  } catch {
    // sessionStorage may be unavailable (private browsing, etc.)
    return false;
  }
}

/**
 * Check if auth recovery has already been attempted this session.
 * Uses sessionStorage to persist across page reloads.
 */
function hasRecoveryBeenAttempted(): boolean {
  try {
    return sessionStorage.getItem(AUTH_RECOVERY_KEY) === "true";
  } catch {
    return false;
  }
}

/**
 * Mark that auth recovery has been attempted.
 * Stores both the flag and timestamp in sessionStorage.
 */
function markRecoveryAttempted(): void {
  try {
    sessionStorage.setItem(AUTH_RECOVERY_KEY, "true");
    sessionStorage.setItem(AUTH_RECOVERY_TIMESTAMP_KEY, Date.now().toString());
  } catch {
    // sessionStorage unavailable - continue anyway
  }
}

/**
 * Handle auth errors by reloading the page (one-shot per session).
 * This allows Supabase to refresh tokens and restore the session.
 * 
 * Uses sessionStorage to prevent infinite reload loops across page reloads.
 * Includes debouncing to prevent multiple simultaneous errors from triggering
 * multiple reload attempts.
 * 
 * @param error - Optional error to check. If not an auth error, does nothing.
 * @returns true if a reload was triggered, false otherwise
 */
export function handleAuthRecovery(error?: unknown): boolean {
  // If error provided, check if it's an auth error
  if (error !== undefined && !isAuthError(error)) {
    return false;
  }

  // Debounce: if a reload is already pending, skip
  if (pendingReload) {
    console.warn("[AuthRecovery] Reload already pending, skipping duplicate call");
    return false;
  }

  // Check sessionStorage-based guard (persists across page reloads)
  if (hasRecoveryBeenAttempted() && isWithinCooldown()) {
    console.warn("[AuthRecovery] Already attempted recovery within cooldown period, skipping reload");
    return false;
  }

  // Set debounce flag
  pendingReload = true;

  // Clear any existing debounce timeout
  if (debounceTimeoutId !== null) {
    clearTimeout(debounceTimeoutId);
  }

  // Debounce: wait a short time to batch multiple simultaneous errors
  debounceTimeoutId = window.setTimeout(() => {
    // Double-check the guard (another call might have triggered reload)
    if (hasRecoveryBeenAttempted() && isWithinCooldown()) {
      console.warn("[AuthRecovery] Recovery was attempted by another call, skipping");
      pendingReload = false;
      return;
    }

    // Mark as attempted BEFORE reload (persists in sessionStorage)
    markRecoveryAttempted();

    console.log("[AuthRecovery] Auth error detected, reloading to restore session...");

    // IMPORTANT: Do NOT clear tokens or redirect manually
    // Just reload - Supabase will handle token refresh on page load
    window.location.reload();
  }, DEBOUNCE_WINDOW_MS);

  return true;
}

/**
 * Reset the auth recovery guard.
 * Call this after successful re-authentication or when user explicitly logs out.
 * Clears both sessionStorage and in-memory state.
 */
export function resetAuthRecoveryGuard(): void {
  pendingReload = false;
  if (debounceTimeoutId !== null) {
    clearTimeout(debounceTimeoutId);
    debounceTimeoutId = null;
  }
  try {
    sessionStorage.removeItem(AUTH_RECOVERY_KEY);
    sessionStorage.removeItem(AUTH_RECOVERY_TIMESTAMP_KEY);
  } catch {
    // sessionStorage unavailable
  }
}

/**
 * Check if auth recovery has been attempted this session
 */
export function hasAttemptedRecovery(): boolean {
  return hasRecoveryBeenAttempted() || pendingReload;
}

/**
 * Check if an error is a network error (exported for use by api.ts)
 */
export { isNetworkError };
