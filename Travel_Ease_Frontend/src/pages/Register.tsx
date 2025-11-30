import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { userApi } from "../services/api";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";

interface FormData {
  first_name: string;
  last_name: string;
  email: string;
  contact_no: string;
  password: string;
  confirm_password: string;
}

interface FormErrors {
  first_name?: string;
  last_name?: string;
  email?: string;
  contact_no?: string;
  password?: string;
  confirm_password?: string;
}

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    first_name: "",
    last_name: "",
    email: "",
    contact_no: "",
    password: "",
    confirm_password: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    setSubmitError("");
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = "First name is required";
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = "Last name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (formData.contact_no && !/^[0-9+\-\s()]*$/.test(formData.contact_no)) {
      newErrors.contact_no = "Please enter a valid phone number";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!formData.confirm_password) {
      newErrors.confirm_password = "Please confirm your password";
    } else if (formData.password !== formData.confirm_password) {
      newErrors.confirm_password = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    if (!validate()) return;

    setSubmitting(true);

    try {
      // Step 1: Register the user
      await userApi.register({
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        contact_no: formData.contact_no.trim() || undefined,
      });

      // Step 2: Login to get tokens
      const loginResponse = await userApi.login({
        email: formData.email.trim(),
        password: formData.password,
      });

      // Step 3: Store the access token
      localStorage.setItem("token", loginResponse.token);

      // Step 4: Hydrate Supabase client with the session (if configured)
      if (isSupabaseConfigured && loginResponse.refresh_token) {
        try {
          await supabase.auth.setSession({
            access_token: loginResponse.token,
            refresh_token: loginResponse.refresh_token,
          });
        } catch (sessionError) {
          console.warn("Could not set Supabase session:", sessionError);
          // Continue anyway - the token is stored
        }
      }

      // Step 5: Redirect to home or saved redirect path
      const redirectTo = localStorage.getItem("auth_redirect") || "/";
      localStorage.removeItem("auth_redirect");
      navigate(redirectTo, { replace: true });
    } catch (error: any) {
      console.error("Registration error:", error);
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        "Registration failed. Please try again.";
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-rose-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-2xl font-bold text-gray-900 mb-4"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary-red to-primary-red-dark text-white text-sm font-bold">
              TE
            </span>
            TravelEase
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-6">
            Create your account
          </h1>
          <p className="mt-2 text-gray-600">
            Join TravelEase and start planning your adventures
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {submitError && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
              <p className="text-red-700 text-sm">{submitError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="first_name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  First Name
                </label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-red transition-colors ${
                    errors.first_name
                      ? "border-red-500 bg-red-50"
                      : "border-gray-300"
                  }`}
                  placeholder="John"
                />
                {errors.first_name && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.first_name}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="last_name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Last Name
                </label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-red transition-colors ${
                    errors.last_name
                      ? "border-red-500 bg-red-50"
                      : "border-gray-300"
                  }`}
                  placeholder="Doe"
                />
                {errors.last_name && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.last_name}
                  </p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-red transition-colors ${
                  errors.email ? "border-red-500 bg-red-50" : "border-gray-300"
                }`}
                placeholder="john@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Contact Number */}
            <div>
              <label
                htmlFor="contact_no"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Contact Number{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="tel"
                id="contact_no"
                name="contact_no"
                value={formData.contact_no}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-red transition-colors ${
                  errors.contact_no
                    ? "border-red-500 bg-red-50"
                    : "border-gray-300"
                }`}
                placeholder="+63 912 345 6789"
              />
              {errors.contact_no && (
                <p className="mt-1 text-xs text-red-600">{errors.contact_no}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-red transition-colors ${
                  errors.password
                    ? "border-red-500 bg-red-50"
                    : "border-gray-300"
                }`}
                placeholder="At least 6 characters"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirm_password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Confirm Password
              </label>
              <input
                type="password"
                id="confirm_password"
                name="confirm_password"
                value={formData.confirm_password}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-red transition-colors ${
                  errors.confirm_password
                    ? "border-red-500 bg-red-50"
                    : "border-gray-300"
                }`}
                placeholder="Re-enter your password"
              />
              {errors.confirm_password && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.confirm_password}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 bg-primary-red text-white font-semibold rounded-lg hover:bg-primary-red-dark focus:outline-none focus:ring-2 focus:ring-primary-red focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {submitting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-gray-200" />
            <span className="px-4 text-sm text-gray-500">or</span>
            <div className="flex-1 border-t border-gray-200" />
          </div>

          {/* Sign in link */}
          <p className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              to="/"
              className="font-medium text-primary-red hover:text-primary-red-dark transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-gray-500">
          By creating an account, you agree to our Terms of Service and Privacy
          Policy.
        </p>
      </div>
    </div>
  );
}
