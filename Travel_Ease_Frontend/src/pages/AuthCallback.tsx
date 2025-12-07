import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

// Storage key for email verification during business auth flow
const BUSINESS_AUTH_EMAIL_KEY = "business_auth_email";
const TOKEN_STORAGE_KEY = "token";
const PROFILE_STORAGE_KEY = "travelEaseUser";
const ORIGINAL_USER_KEY = "travelEaseOriginalUser";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { syncOAuthUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("Completing sign in...");
  const [emailMismatch, setEmailMismatch] = useState<{
    expected: string;
    actual: string;
  } | null>(null);
  
  // Store the original token and user profile before OAuth flow starts (in case of mismatch)
  const [originalToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [originalUserJson] = useState(() => localStorage.getItem(ORIGINAL_USER_KEY));

  useEffect(() => {
    const handleCallback = async () => {
      // If Supabase is not configured, redirect to home
      if (!isSupabaseConfigured) {
        navigate("/", { replace: true });
        return;
      }

      try {
        // Check for hash fragment (implicit flow) or query params (PKCE flow)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const queryParams = new URLSearchParams(window.location.search);

        // Handle OAuth errors returned by Supabase (e.g., identity already exists)
        const oauthError = hashParams.get("error") || queryParams.get("error");
        const oauthErrorDescription =
          hashParams.get("error_description") || queryParams.get("error_description");
        const oauthErrorCode = hashParams.get("error_code") || queryParams.get("error_code");

        if (oauthError || oauthErrorDescription || oauthErrorCode) {
          // Clear any stale Supabase session so the next attempt starts clean
          try {
            await supabase.auth.signOut();
          } catch {
            // ignore cleanup failures
          }

          // Restore original token/profile so the UI stays consistent after the failed OAuth attempt
          if (originalToken) {
            localStorage.setItem(TOKEN_STORAGE_KEY, originalToken);
          } else {
            localStorage.removeItem(TOKEN_STORAGE_KEY);
          }
          if (originalUserJson) {
            localStorage.setItem(PROFILE_STORAGE_KEY, originalUserJson);
          }

          const friendlyError =
            oauthErrorCode === "identity_already_exists"
              ? "That Google account is already linked. We've reset your session—please start Google sign-in again."
              : oauthErrorDescription || oauthError || "Authentication failed. Please try again.";

          setError(friendlyError);
          return;
        }
        
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const code = queryParams.get("code");
        
        let session = null;
        
        if (accessToken) {
          // Implicit flow - set session from hash fragment
          setStatus("Setting up session...");
          const { data, error: setSessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || "",
          });
          
          if (setSessionError) {
            setError(setSessionError.message);
            return;
          }
          session = data.session;
        } else if (code) {
          // PKCE flow - exchange code for session
          setStatus("Exchanging authorization code...");
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
            window.location.href
          );

          if (exchangeError) {
            setError(exchangeError.message);
            return;
          }

          // Get the session after exchange
          setStatus("Retrieving session...");
          const { data: { session: exchangedSession }, error: sessionError } = await supabase.auth.getSession();

          if (sessionError) {
            setError(sessionError.message);
            return;
          }
          session = exchangedSession;
        } else {
          // No auth params - try to get existing session
          setStatus("Checking session...");
          const { data: { session: existingSession } } = await supabase.auth.getSession();
          session = existingSession;
        }

        if (session?.access_token) {
          // Store token for API calls
          localStorage.setItem("token", session.access_token);
          
          // Clean up URL (remove auth params)
          window.history.replaceState({}, document.title, window.location.pathname);

          // Check for business auth email verification requirement
          const storedEmail = localStorage.getItem(BUSINESS_AUTH_EMAIL_KEY);
          const googleEmail = session.user?.email;

          if (storedEmail && googleEmail) {
            // Business creation flow - verify email matches
            if (storedEmail.toLowerCase() !== googleEmail.toLowerCase()) {
              // Email mismatch - block and show error
              // Sign out the mismatched Google account from Supabase
              await supabase.auth.signOut();
              
              // Restore the original user's token (if they were logged in before)
              if (originalToken) {
                localStorage.setItem(TOKEN_STORAGE_KEY, originalToken);
              } else {
                localStorage.removeItem(TOKEN_STORAGE_KEY);
              }
              
              // Restore the original user profile to localStorage
              // This ensures the AuthContext will load the correct user on next render
              if (originalUserJson) {
                localStorage.setItem(PROFILE_STORAGE_KEY, originalUserJson);
              }
              
              // Show the mismatch error (don't clear BUSINESS_AUTH_EMAIL_KEY yet,
              // in case user wants to try a different account)
              setEmailMismatch({ expected: storedEmail, actual: googleEmail });
              return;
            }
            // Emails match - clear the stored email and original user backup
            localStorage.removeItem(BUSINESS_AUTH_EMAIL_KEY);
            localStorage.removeItem(ORIGINAL_USER_KEY);
          }
          
          // Sync OAuth user with backend to create/retrieve internal profile
          setStatus("Syncing your profile...");
          try {
            const { isNewUser } = await syncOAuthUser();

            // Determine redirect destination
            const savedRedirect = localStorage.getItem("auth_redirect");
            localStorage.removeItem("auth_redirect");

            if (isNewUser) {
              // New user - redirect to onboarding
              navigate("/onboarding", { replace: true });
            } else {
              // Existing user - redirect to saved path or home
              navigate(savedRedirect || "/", { replace: true });
            }
          } catch (syncError) {
            localStorage.removeItem("auth_redirect");
            localStorage.removeItem(BUSINESS_AUTH_EMAIL_KEY);
            localStorage.removeItem(ORIGINAL_USER_KEY);

            // Check if this is a DB_UNAVAILABLE error - don't clear token, DB is just down
            const isDbUnavailable = syncError instanceof Error && syncError.name === "DB_UNAVAILABLE";
            
            if (!isDbUnavailable) {
              // Only clear token for actual auth failures
              localStorage.removeItem("token");
            }

            const message =
              syncError instanceof Error
                ? syncError.message
                : "Authentication failed. Please try again.";

            setError(message);
            return;
          }
        } else {
          setError("No session token received. Please try again.");
        }
      } catch {
        setError("Authentication failed. Please try again.");
      }
    };

    handleCallback();
  }, [navigate, syncOAuthUser]);

  // Email mismatch error - show blocking message with option to try different account
  if (emailMismatch) {
    const handleTryDifferentAccount = async () => {
      setEmailMismatch(null);
      setStatus("Redirecting to Google...");
      try {
        const { error: signInError } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
            queryParams: {
              access_type: "offline",
              prompt: "consent",
            },
          },
        });
        if (signInError) {
          setError(signInError.message);
        }
      } catch (err) {
        setError("Failed to start Google sign-in. Please try again.");
      }
    };

    const handleCancel = () => {
      // Clean up business auth flow state
      localStorage.removeItem(BUSINESS_AUTH_EMAIL_KEY);
      localStorage.removeItem("auth_redirect");
      localStorage.removeItem(ORIGINAL_USER_KEY);
      
      // The original token and profile were already restored when we detected the mismatch,
      // so the user should still be logged in with their original account
      // Force a page reload to ensure AuthContext picks up the restored profile
      window.location.href = "/";
    };

    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="max-w-md text-center px-4">
          <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">
            Account Mismatch
          </h1>
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
            <p className="text-red-700 text-sm">
              The Google account you signed in with (<strong>{emailMismatch.actual}</strong>) doesn't match your registered email (<strong>{emailMismatch.expected}</strong>).
            </p>
            <p className="text-red-600 text-sm mt-2">
              Please sign in with the correct Google account to create a business.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <button
              onClick={handleTryDifferentAccount}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary-red px-6 py-3 text-white font-medium transition-colors hover:bg-primary-red-dark"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Try a Different Google Account
            </button>
            <button
              onClick={handleCancel}
              className="text-gray-600 hover:text-gray-900 text-sm font-medium"
            >
              Cancel and go back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="max-w-md text-center">
          <div className="mb-4 text-6xl">⚠️</div>
          <h1 className="mb-4 text-2xl font-bold text-gray-900">
            Authentication Error
          </h1>
          <p className="mb-8 text-gray-600">{error}</p>
          <button
            onClick={() => navigate("/login", { replace: true })}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary-red" />
        <p className="text-base text-gray-600">{status}</p>
      </div>
    </div>
  );
}
