import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      // If Supabase is not configured, redirect to home
      if (!isSupabaseConfigured) {
        console.warn("Supabase not configured, redirecting to home");
        navigate("/", { replace: true });
        return;
      }

      try {
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
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Get session error:", sessionError);
          setError(sessionError.message);
          return;
        }

        if (session?.access_token) {
          // Store token for existing manual fetches in BusinessForm, etc.
          localStorage.setItem("token", session.access_token);
        }

        // Redirect to home or a saved redirect path
        const redirectTo = localStorage.getItem("auth_redirect") || "/";
        localStorage.removeItem("auth_redirect");
        navigate(redirectTo, { replace: true });
      } catch (err) {
        console.error("Auth callback error:", err);
        setError("Authentication failed. Please try again.");
      }
    };

    handleCallback();
  }, [navigate]);

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
            onClick={() => navigate("/", { replace: true })}
            className="btn-primary"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary-red" />
        <p className="text-base text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
}

