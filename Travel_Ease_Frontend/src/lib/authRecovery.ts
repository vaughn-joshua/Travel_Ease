/**
 * Auth Recovery Helper
 * 
 * Handles auth-related errors by triggering a page reload instead of logging out.
 * This preserves the session and allows Supabase to refresh tokens automatically.
 * 
 * Key behaviors:
 * - Detects auth errors from Axios, Fetch, and Supabase responses
 * - Triggers ONE reload per session to avoid infinite loops
 * - Does NOT clear tokens or redirect - just reloads
 * - Only explicit logout (signOut) should clear auth state
 */

// In-memory guard to prevent infinite reload loops
let hasAttemptedAuthRecovery = false;
let authRecoveryTimeoutId: number | null = null;

// Auth-related HTTP status codes
const AUTH_ERROR_STATUSES = [401, 403, 419];

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
 * Detect if an error is auth-related (401, 403, 419, or auth-specific messages)
 */
export function isAuthError(error: unknown): boolean {
  if (!error) return false;

  const err = error as Record<string, unknown>;

  // 1) Axios-style errors (error.response.status)
  const axiosResponse = err?.response as Record<string, unknown> | undefined;
  const axiosStatus = axiosResponse?.status;
  if (typeof axiosStatus === "number" && AUTH_ERROR_STATUSES.includes(axiosStatus)) {
    // Skip DB_UNAVAILABLE - that's not an auth error
    const code = (axiosResponse?.data as Record<string, unknown>)?.code;
    if (code !== "DB_UNAVAILABLE") {
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
  if (typeof message === "string") {
    const msgLower = message.toLowerCase();
    if (AUTH_ERROR_MESSAGES.some((m) => msgLower.includes(m))) {
      return true;
    }
  }

  return false;
}

/**
 * Handle auth errors by reloading the page (one-shot per session).
 * This allows Supabase to refresh tokens and restore the session.
 * 
 * @param error - Optional error to check. If not an auth error, does nothing.
 * @returns true if a reload was triggered, false otherwise
 */
export function handleAuthRecovery(error?: unknown): boolean {
  // If error provided, check if it's an auth error
  if (error !== undefined && !isAuthError(error)) {
    return false;
  }

  // Reload guard: avoid infinite loops
  if (hasAttemptedAuthRecovery) {
    console.warn("[AuthRecovery] Already attempted recovery this session, skipping reload");
    return false;
  }

  hasAttemptedAuthRecovery = true;

  // Reset guard after timeout to allow retry if user stays on page
  if (authRecoveryTimeoutId === null) {
    authRecoveryTimeoutId = window.setTimeout(() => {
      hasAttemptedAuthRecovery = false;
      authRecoveryTimeoutId = null;
    }, 15_000); // 15 seconds before allowing another reload attempt
  }

  console.log("[AuthRecovery] Auth error detected, reloading to restore session...");

  // IMPORTANT: Do NOT clear tokens or redirect manually
  // Just reload - Supabase will handle token refresh on page load
  window.location.reload();
  
  return true;
}

/**
 * Reset the auth recovery guard (useful for testing or after successful re-auth)
 */
export function resetAuthRecoveryGuard(): void {
  hasAttemptedAuthRecovery = false;
  if (authRecoveryTimeoutId !== null) {
    clearTimeout(authRecoveryTimeoutId);
    authRecoveryTimeoutId = null;
  }
}

/**
 * Check if auth recovery has been attempted this session
 */
export function hasAttemptedRecovery(): boolean {
  return hasAttemptedAuthRecovery;
}

