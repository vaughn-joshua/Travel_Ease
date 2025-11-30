import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { syncOAuthUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("Completing sign in...");

  useEffect(() => {
    const handleCallback = async () => {
      // If Supabase is not configured, redirect to home
      if (!isSupabaseConfigured) {
        console.warn("Supabase not configured, redirecting to home");
        navigate("/", { replace: true });
        return;
      }

      try {
        setStatus("Exchanging authorization code...");
        
        // Exchange the code for a session (handles PKCE flow)
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
          window.location.href
        );

        if (exchangeError) {
          console.error("Session exchange error:", exchangeError);
          setError(exchangeError.message);
          return;
        }

        // Get the session to store the token
        setStatus("Retrieving session...");
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Get session error:", sessionError);
          setError(sessionError.message);
          return;
        }

        if (session?.access_token) {
          // Store token for API calls
          localStorage.setItem("token", session.access_token);
          
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
            console.error("OAuth sync error:", syncError);
            // Still allow access even if sync fails - user is authenticated
            const savedRedirect = localStorage.getItem("auth_redirect") || "/";
            localStorage.removeItem("auth_redirect");
            navigate(savedRedirect, { replace: true });
          }
        } else {
          setError("No session token received. Please try again.");
        }
      } catch (err) {
        console.error("Auth callback error:", err);
        setError("Authentication failed. Please try again.");
      }
    };

    handleCallback();
  }, [navigate, syncOAuthUser]);

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
