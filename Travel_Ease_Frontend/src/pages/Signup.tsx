import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const sellingPoints = [
  "Instant access to maps, plans, and saved spots.",
  "Invite collaborators and keep everyone in sync.",
  "Export-ready itineraries with built-in budget tracking.",
];

export default function Signup() {
  const navigate = useNavigate();
  const { user, loading, registerWithEmail, signInWithGoogle, isConfigured } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [contactNo, setContactNo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user && !loading) {
      navigate("/", { replace: true });
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!firstName || !lastName || !email || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await registerWithEmail({
        first_name: firstName,
        last_name: lastName,
        email,
        password,
        contact_no: contactNo || undefined,
      });
      navigate("/", { replace: true });
    } catch (err: any) {
      const message =
        err?.response?.data?.error ||
        err?.message ||
        "Unable to create your account. Please try again.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    try {
      localStorage.setItem("auth_redirect", "/");
      await signInWithGoogle();
    } catch (err: any) {
      const message = err?.message || "Google sign-up failed.";
      setError(message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-blue/10 via-white to-primary-red/5">
      <div className="mx-auto grid min-h-screen max-w-6xl grid-cols-1 gap-8 px-6 py-12 lg:grid-cols-2 lg:px-10">
        <section className="relative hidden overflow-hidden rounded-3xl bg-white/70 shadow-2xl backdrop-blur lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-red/10 via-white to-secondary-blue/20" />
          <div className="relative p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-red">
              Join TravelEase
            </p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight text-gray-900">
              Create an account built for travelers and builders.
            </h1>
            <p className="mt-4 max-w-xl text-base text-gray-600">
              Whether you are planning your next adventure or showcasing your
              business, your TravelEase profile keeps everything organized.
            </p>
          </div>

          <div className="relative space-y-3 p-10">
            {sellingPoints.map((point) => (
              <div
                key={point}
                className="flex items-center gap-4 rounded-2xl border border-primary-red/15 bg-white/80 p-4 shadow-sm"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-red/10 text-primary-red">
                  ✓
                </div>
                <p className="text-base font-medium text-gray-800">{point}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center">
          <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white/95 shadow-xl backdrop-blur">
            <div className="flex items-start justify-between gap-3 px-6 pt-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-red">
                  Create account
                </p>
                <h2 className="text-2xl font-semibold text-gray-900">
                  Start with your details
                </h2>
                <p className="text-sm text-gray-500">
                  We use this to personalize your itineraries and bookings.
                </p>
              </div>
              <Link
                to="/login"
                className="text-sm font-semibold text-primary-red underline-offset-4 transition hover:underline"
              >
                Log in
              </Link>
            </div>

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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-gray-700">
                  First name
                  <input
                    type="text"
                    className="text_box mt-2"
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    required
                  />
                </label>
                <label className="block text-sm font-medium text-gray-700">
                  Last name
                  <input
                    type="text"
                    className="text_box mt-2"
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    required
                  />
                </label>
              </div>

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
                Contact number (optional)
                <input
                  type="tel"
                  className="text_box mt-2"
                  placeholder="+63 900 000 0000"
                  value={contactNo}
                  onChange={(event) => setContactNo(event.target.value)}
                />
              </label>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-gray-700">
                  Password
                  <input
                    type="password"
                    className="text_box mt-2"
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                </label>
                <label className="block text-sm font-medium text-gray-700">
                  Confirm password
                  <input
                    type="password"
                    className="text_box mt-2"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                  />
                </label>
              </div>

              <button
                type="submit"
                className="btn-primary w-full justify-center"
                disabled={submitting || loading}
              >
                {submitting ? "Creating account..." : "Create account"}
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
                  Google sign-up requires Supabase credentials in your .env.
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
