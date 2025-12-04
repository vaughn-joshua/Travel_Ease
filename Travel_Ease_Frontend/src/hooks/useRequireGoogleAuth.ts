import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export type AuthStatus = 
  | "loading"
  | "authenticated"
  | "unauthenticated"
  | "wrong_provider"
  | "profile_incomplete";

interface UseRequireGoogleAuthOptions {
  /** If true, redirects unauthenticated users to sign in */
  redirectOnUnauthenticated?: boolean;
  /** If true, requires profile to be completed */
  requireProfileCompleted?: boolean;
}

interface UseRequireGoogleAuthResult {
  /** Current authentication status */
  status: AuthStatus;
  /** Whether the user is fully authorized (Google auth + profile completed if required) */
  isAuthorized: boolean;
  /** Whether we're still checking auth status */
  isLoading: boolean;
  /** Trigger Google sign-in flow */
  triggerSignIn: () => Promise<void>;
  /** Error message to display, if any */
  errorMessage: string | null;
}

/**
 * Hook to require Google authentication for protected pages
 * 
 * Usage:
 * ```tsx
 * const { status, isAuthorized, isLoading, triggerSignIn, errorMessage } = useRequireGoogleAuth();
 * 
 * if (isLoading) return <Loading />;
 * if (!isAuthorized) return <AuthPrompt onSignIn={triggerSignIn} message={errorMessage} />;
 * 
 * // Render protected content
 * ```
 */
export function useRequireGoogleAuth(
  options: UseRequireGoogleAuthOptions = {}
): UseRequireGoogleAuthResult {
  const { 
    redirectOnUnauthenticated = false,
    requireProfileCompleted = false 
  } = options;
  
  const { user, loading, signInWithGoogle, isConfigured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    if (loading) {
      setStatus("loading");
      return;
    }

    if (!user) {
      setStatus("unauthenticated");
      
      if (redirectOnUnauthenticated) {
        // Store current path for redirect after auth
        localStorage.setItem("auth_redirect", location.pathname);
      }
      return;
    }

    // Check if user signed in with Google
    if (user.source !== "supabase") {
      setStatus("wrong_provider");
      return;
    }

    // Check if profile is completed (if required)
    if (requireProfileCompleted && !(user.firstName && user.lastName)) {
      setStatus("profile_incomplete");
      navigate("/onboarding", { replace: true });
      return;
    }

    setStatus("authenticated");
  }, [user, loading, redirectOnUnauthenticated, requireProfileCompleted, location.pathname, navigate]);

  const triggerSignIn = async () => {
    try {
      localStorage.setItem("auth_redirect", location.pathname);
      await signInWithGoogle();
    } catch (error) {
      console.error("Sign in error:", error);
    }
  };

  const isLoading = status === "loading";
  const isAuthorized = status === "authenticated";

  let errorMessage: string | null = null;
  switch (status) {
    case "unauthenticated":
      errorMessage = "Please sign in with Google to continue.";
      break;
    case "wrong_provider":
      errorMessage = "This feature requires signing in with a Google account. Please sign out and sign in with Google.";
      break;
    case "profile_incomplete":
      errorMessage = "Please complete your profile to continue.";
      break;
  }

  return {
    status,
    isAuthorized,
    isLoading,
    triggerSignIn,
    errorMessage,
  };
}

export default useRequireGoogleAuth;







