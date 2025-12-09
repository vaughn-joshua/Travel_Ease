import { FormEvent, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface Feature {
  title: string;
  copy: string;
}

const features: Feature[] = [
  { title: "Stay in sync", copy: "Favorites, plans, and reviews follow you on every device." },
  { title: "Plan faster", copy: "Save ideas instantly and collaborate with your travel crew." },
  { title: "Secure by default", copy: "Supabase-backed auth with HTTPS-only tokens." },
];

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, isConfigured, loginWithEmail, signInWithGoogle } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Handle success message from redirect (e.g., after disconnecting Google)
  useEffect(() => {
    const state = location.state as { message?: string; type?: string } | null;
    if (state?.message && state?.type === "success") {
      setSuccessMessage(state.message);
      // Clear the state to prevent showing message on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    if (user && !loading) {
      const redirectTo = (location.state as { from?: string })?.from || "/";
      navigate(redirectTo, { replace: true });
    }
  }, [user, loading, navigate, location.state]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please fill in both email and password.");
      return;
    }

    setSubmitting(true);
    try {
      await loginWithEmail({ email, password });
      navigate("/", { replace: true });
    } catch (err: any) {
      const message =
        err?.response?.data?.error ||
        err?.message ||
        "Unable to sign in. Please check your credentials.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    try {
      localStorage.setItem("auth_redirect", location.pathname);
      await signInWithGoogle();
    } catch (err: any) {
      const message = err?.message || "Google sign-in failed.";
      setError(message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-red/5 via-white to-secondary-blue/10 flex items-center justify-center">
      <div className="mx-auto grid w-full min-h-screen max-w-6xl grid-cols-1 gap-8 px-4 sm:px-6 py-8 sm:py-12 lg:grid-cols-2 lg:px-10 lg:min-h-0">
        <section className="relative hidden overflow-hidden rounded-3xl bg-gradient-to-br from-primary-red to-secondary-blue text-white shadow-2xl lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 opacity-20 mix-blend-overlay">
            <div className="absolute -left-10 top-10 h-40 w-40 rounded-full bg-white blur-3xl" />
            <div className="absolute bottom-10 right-0 h-48 w-48 rounded-full bg-amber-300 blur-3xl" />
          </div>
          <div className="relative p-10">
            <p className="text-sm uppercase tracking-[0.2em] text-white/70">
              TravelEase
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight">
              Log in to keep your journeys moving.
            </h1>
            <p className="mt-4 max-w-xl text-lg text-white/80">
              Continue where you left off, coordinate with friends, and keep your
              bookings, blogs, and maps in one place.
            </p>
          </div>
          <div className="relative space-y-4 p-10">
            {features.map((item) => (
              <div
                key={item.title}
                className="flex items-start gap-4 rounded-2xl border border-white/20 bg-white/5 p-4 backdrop-blur-sm"
              >
                <div className="mt-1 h-8 w-8 rounded-full bg-white/20 text-center text-lg leading-8">
                  •
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="text-sm text-white/80">{item.copy}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center">
          <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white/90 shadow-xl backdrop-blur">
            <div className="flex items-start justify-between gap-3 px-6 pt-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-red">
                  Authentication
                </p>
                <h2 className="text-2xl font-semibold text-gray-900">
                  Welcome back
                </h2>
                <p className="text-sm text-gray-500">
                  Sign in to access your saved trips and business tools.
                </p>
              </div>
              <Link
                to="/signup"
                className="text-sm font-semibold text-primary-red underline-offset-4 transition hover:underline"
              >
                Create account
              </Link>
            </div>

            {successMessage && (
              <div className="mx-6 mt-4 rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800">
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {successMessage}
                </div>
              </div>
            )}

            {error && (
              <div className="mx-6 mt-4 rounded-lg border border-primary-red/30 bg-primary-red/5 px-4 py-3 text-sm text-primary-red-dark">
                {error}
              </div>
            )}

            <form
              className="space-y-4 px-6 py-6"
              onSubmit={handleSubmit}
              noValidate
            >
              <label className="block text-sm font-medium text-gray-700">
                Email address
                <input
                  type="email"
                  className="text_box mt-2"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </label>

              <label className="block text-sm font-medium text-gray-700">
                Password
                <input
                  type="password"
                  className="text_box mt-2"
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </label>

              <button
                type="submit"
                className="btn-primary w-full justify-center"
                disabled={submitting || loading}
              >
                {submitting ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <div className="flex items-center px-6 pb-4">
              <span className="h-px w-full bg-gray-200" />
              <span className="px-3 text-xs uppercase tracking-[0.2em] text-gray-400">
                or
              </span>
              <span className="h-px w-full bg-gray-200" />
            </div>

            <div className="px-6 pb-8">
              <button
                type="button"
                onClick={handleGoogle}
                disabled={!isConfigured || submitting}
                className={`btn-secondary w-full justify-center gap-2 ${
                  !isConfigured ? "cursor-not-allowed opacity-60" : ""
                }`}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </button>
              {!isConfigured && (
                <p className="mt-3 text-center text-xs text-amber-600">
                  Google sign-in requires Supabase credentials in your .env.
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
