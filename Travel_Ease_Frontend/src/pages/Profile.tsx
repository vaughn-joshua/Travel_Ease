import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useDeleteAccount } from "../features/user/mutations";
import { useMyBusinesses } from "../features/businesses/queries";
import { supabase } from "../lib/supabaseClient";
import { authApi } from "../services/auth";

// Storage key for intended redirect after Google OAuth
const BUSINESS_AUTH_EMAIL_KEY = "business_auth_email";

interface FormData {
  first_name: string;
  last_name: string;
  contact_no: string;
}

interface PasswordFormData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, loading: authLoading, updateProfile, signOut, signInWithGoogle, isConfigured, hasPassword, refreshProfile } = useAuth();

  const [redirectingToBusiness, setRedirectingToBusiness] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    first_name: "",
    last_name: "",
    contact_no: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDisconnectGoogle, setShowDisconnectGoogle] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [disconnectPassword, setDisconnectPassword] = useState("");
  const [disconnectError, setDisconnectError] = useState("");

  // Password change states
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordFormData, setPasswordFormData] = useState<PasswordFormData>({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  // Fetch user's businesses to determine if "Create Business" should be shown
  const { data: businessesData, isLoading: businessesLoading } = useMyBusinesses();
  const hasBusinesses = (businessesData?.data?.length ?? 0) > 0;

  // Delete account mutation
  const deleteAccountMutation = useDeleteAccount();

  // Pre-fill form with user data
  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.firstName || "",
        last_name: user.lastName || "",
        contact_no: user.contactNo || "",
      });
    }
  }, [user]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login", { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    setSubmitError("");
    setSuccessMessage("");
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordFormData((prev) => ({ ...prev, [name]: value }));
    if (passwordErrors[name]) {
      setPasswordErrors((prev) => ({ ...prev, [name]: "" }));
    }
    setSubmitError("");
    setSuccessMessage("");
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = "First name is required";
    }
    if (!formData.last_name.trim()) {
      newErrors.last_name = "Last name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePassword = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Current password is only required for users who already have a password
    // (not for users setting password for first time)
    if (hasPassword && !passwordFormData.current_password) {
      newErrors.current_password = "Current password is required";
    }
    if (!passwordFormData.new_password) {
      newErrors.new_password = "New password is required";
    } else if (passwordFormData.new_password.length < 6) {
      newErrors.new_password = "Password must be at least 6 characters";
    }
    if (!passwordFormData.confirm_password) {
      newErrors.confirm_password = "Please confirm your new password";
    } else if (passwordFormData.new_password !== passwordFormData.confirm_password) {
      newErrors.confirm_password = "Passwords do not match";
    }

    setPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveProfile = async () => {
    setSubmitError("");
    setSuccessMessage("");

    if (!validate()) return;

    setSubmitting(true);

    try {
      await updateProfile({
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        contact_no: formData.contact_no.trim() || undefined,
      });

      setSuccessMessage("Profile updated successfully!");
      setIsEditing(false);
    } catch (err: unknown) {
      console.error("Profile update error:", err);
      setSubmitError("Failed to update profile. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    setSuccessMessage("");

    if (!validatePassword()) return;

    setPasswordSubmitting(true);

    try {
      if (!hasPassword) {
        // For users without a password: use backend endpoint to set password
        // This uses the admin API which can properly create an email identity
        try {
          const response = await authApi.setPassword(passwordFormData.new_password);
          // Refresh profile to get updated hasPassword flag
          await refreshProfile();
          setSuccessMessage(response.message || "Password set successfully! You can now disconnect your Google account.");
          setPasswordFormData({
            current_password: "",
            new_password: "",
            confirm_password: "",
          });
          setShowPasswordForm(false);
        } catch (err: unknown) {
          console.error("Set password error:", err);
          const errorResponse = (err as any)?.response?.data;
          const errorMessage = errorResponse?.error || "Failed to set password. Please try again.";
          setSubmitError(errorMessage);
        }
      } else {
        // For users with a password: verify current password first, then update via Supabase
        // Step 1: Verify current password by attempting to sign in
        const { error: verifyError } = await supabase.auth.signInWithPassword({
          email: user?.email || "",
          password: passwordFormData.current_password,
        });

        if (verifyError) {
          setPasswordErrors({ current_password: "Current password is incorrect" });
          setPasswordSubmitting(false);
          return;
        }

        // Step 2: Update to new password (keeps user logged in)
        const { error: updateError } = await supabase.auth.updateUser({
          password: passwordFormData.new_password,
        });

        if (updateError) {
          setSubmitError("Failed to update password. Please try again.");
          setPasswordSubmitting(false);
          return;
        }

        // Success - clear form and show confirmation
        setSuccessMessage("Password updated successfully!");
        setPasswordFormData({
          current_password: "",
          new_password: "",
          confirm_password: "",
        });
        setShowPasswordForm(false);
      }
    } catch (err: unknown) {
      console.error("Password update error:", err);
      setSubmitError("Failed to update password. Please try again.");
    } finally {
      setPasswordSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        first_name: user.firstName || "",
        last_name: user.lastName || "",
        contact_no: user.contactNo || "",
      });
    }
    setIsEditing(false);
    setErrors({});
    setSubmitError("");
  };

  const handleDisconnectGoogle = async () => {
    if (!disconnectPassword) {
      setDisconnectError("Please enter your password");
      return;
    }

    setDisconnecting(true);
    setDisconnectError("");
    setSubmitError("");
    setSuccessMessage("");

    try {
      const res = await authApi.disconnectGoogle(disconnectPassword);
      setShowDisconnectGoogle(false);
      setDisconnectPassword("");
      setSuccessMessage(res.message || "Google account disconnected. Please log in again.");
      await signOut();
      navigate("/login", { replace: true });
    } catch (err: unknown) {
      console.error("Disconnect Google error:", err);
      const errorResponse = (err as any)?.response?.data;
      const errorCode = errorResponse?.code;
      const errorMessage = errorResponse?.error || (err as Error)?.message || "Failed to disconnect Google. Please try again.";

      // Handle specific error codes
      if (errorCode === "NO_EMAIL_IDENTITY" || errorMessage.includes("set a password")) {
        setDisconnectError(
          "You must set a password before disconnecting Google. This creates an email login method. Please set a password first."
        );
      } else if (errorCode === "INVALID_PASSWORD") {
        setDisconnectError("Incorrect password. Please try again.");
      } else {
        setDisconnectError(errorMessage);
      }
    } finally {
      setDisconnecting(false);
    }
  };

  const handleCancelPassword = () => {
    setPasswordFormData({
      current_password: "",
      new_password: "",
      confirm_password: "",
    });
    setPasswordErrors({});
    setShowPasswordForm(false);
    setSubmitError("");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  const handleQuickPasswordClick = () => {
    setSuccessMessage("");
    setSubmitError("");
    setPasswordErrors({});
    setShowPasswordForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccountMutation.mutateAsync();
      await signOut();
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Failed to delete account:", error);
      setSubmitError("Failed to delete account. Please try again.");
    }
  };

  const handleCreateBusinessClick = async () => {
    if (authLoading || redirectingToBusiness) return;

    const targetPath = "/businesses/onboarding";

    // Remember intended destination post-auth
    localStorage.setItem("auth_redirect", targetPath);

    // Store the user's email for verification after Google OAuth
    if (user?.email) {
      localStorage.setItem(BUSINESS_AUTH_EMAIL_KEY, user.email);
    }

    // Store the current user profile so we can restore it if there's a mismatch
    if (user) {
      localStorage.setItem("travelEaseOriginalUser", JSON.stringify(user));
    }

    // If Supabase is not configured, fall back to login page
    if (!isConfigured) {
      navigate("/login", { replace: true, state: { from: targetPath } });
      return;
    }

    // Always trigger Google OAuth for business creation
    setRedirectingToBusiness(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Google sign-in failed:", error);
      setRedirectingToBusiness(false);
      navigate("/login", { replace: true, state: { from: targetPath } });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary-red" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center text-primary-red hover:text-primary-red-dark transition-colors mb-4"
          >
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600 mt-1">Manage your account information</p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg">
            <p className="text-green-800 font-medium">{successMessage}</p>
          </div>
        )}

        {/* Error Message */}
        {submitError && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
            <p className="text-red-800 font-medium">{submitError}</p>
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-primary-red to-primary-red-dark p-6 text-white">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                {(user?.firstName || user?.email)?.charAt(0).toUpperCase() || "U"}
              </div>
              <div>
                <h2 className="text-xl font-semibold">
                  {user?.firstName} {user?.lastName}
                </h2>
                <p className="text-white/80">{user?.email}</p>
                {user?.source === "google" && (
                  <span className="inline-flex items-center gap-1 mt-1 text-xs bg-white/20 px-2 py-0.5 rounded-full">
                    <svg className="w-3 h-3" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    </svg>
                    Connected with Google
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="p-6 space-y-6">
            {/* Email (read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="flex items-center px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-gray-600">{user?.email}</span>
              </div>
              <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
            </div>

            {/* First Name */}
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-2">
                First Name
              </label>
              {isEditing ? (
                <>
                  <input
                    type="text"
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-red transition-colors ${
                      errors.first_name ? "border-red-500 bg-red-50" : "border-gray-300"
                    }`}
                  />
                  {errors.first_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>
                  )}
                </>
              ) : (
                <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700">
                  {formData.first_name || "-"}
                </div>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-2">
                Last Name
              </label>
              {isEditing ? (
                <>
                  <input
                    type="text"
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-red transition-colors ${
                      errors.last_name ? "border-red-500 bg-red-50" : "border-gray-300"
                    }`}
                  />
                  {errors.last_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>
                  )}
                </>
              ) : (
                <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700">
                  {formData.last_name || "-"}
                </div>
              )}
            </div>

            {/* Contact Number */}
            <div>
              <label htmlFor="contact_no" className="block text-sm font-medium text-gray-700 mb-2">
                Contact Number <span className="text-gray-400">(Optional)</span>
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  id="contact_no"
                  name="contact_no"
                  value={formData.contact_no}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-red transition-colors"
                  placeholder="+63 912 345 6789"
                />
              ) : (
                <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700">
                  {formData.contact_no || "-"}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    disabled={submitting}
                    className="flex-1 py-3 px-4 bg-primary-red text-white font-semibold rounded-lg hover:bg-primary-red-dark focus:outline-none focus:ring-2 focus:ring-primary-red focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={submitting}
                    className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="flex-1 py-3 px-4 bg-primary-red text-white font-semibold rounded-lg hover:bg-primary-red-dark focus:outline-none focus:ring-2 focus:ring-primary-red focus:ring-offset-2 transition-colors"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          {/* Password Change Section - Visible for all users when showPasswordForm is true */}
          {showPasswordForm && (
            <div className="border-t border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {hasPassword ? "Change Password" : "Set Password"}
              </h3>
              
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                {/* Current Password - Only show for users who already have a password */}
                {hasPassword && (
                  <div>
                    <label htmlFor="current_password" className="block text-sm font-medium text-gray-700 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      id="current_password"
                      name="current_password"
                      value={passwordFormData.current_password}
                      onChange={handlePasswordChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-red transition-colors ${
                        passwordErrors.current_password ? "border-red-500 bg-red-50" : "border-gray-300"
                      }`}
                    />
                    {passwordErrors.current_password && (
                      <p className="mt-1 text-sm text-red-600">{passwordErrors.current_password}</p>
                    )}
                  </div>
                )}

                  {/* New Password */}
                  <div>
                    <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      id="new_password"
                      name="new_password"
                      value={passwordFormData.new_password}
                      onChange={handlePasswordChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-red transition-colors ${
                        passwordErrors.new_password ? "border-red-500 bg-red-50" : "border-gray-300"
                      }`}
                    />
                    {passwordErrors.new_password && (
                      <p className="mt-1 text-sm text-red-600">{passwordErrors.new_password}</p>
                    )}
                  </div>

                  {/* Confirm New Password */}
                  <div>
                    <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      id="confirm_password"
                      name="confirm_password"
                      value={passwordFormData.confirm_password}
                      onChange={handlePasswordChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-red transition-colors ${
                        passwordErrors.confirm_password ? "border-red-500 bg-red-50" : "border-gray-300"
                      }`}
                    />
                    {passwordErrors.confirm_password && (
                      <p className="mt-1 text-sm text-red-600">{passwordErrors.confirm_password}</p>
                    )}
                  </div>

                {/* Password Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={passwordSubmitting}
                    className="flex-1 py-3 px-4 bg-primary-red text-white font-semibold rounded-lg hover:bg-primary-red-dark focus:outline-none focus:ring-2 focus:ring-primary-red focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {passwordSubmitting
                      ? hasPassword
                        ? "Updating..."
                        : "Setting..."
                      : hasPassword
                      ? "Update Password"
                      : "Set Password"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelPassword}
                    disabled={passwordSubmitting}
                    className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Quick Links */}
          <div className="border-t border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h3>
            <div className="grid grid-cols-2 gap-3">
              {(() => {
                const showCreateLink = !businessesLoading && (!hasBusinesses || user?.source !== "google");

                if (showCreateLink) {
                  return (
                    <button
                      onClick={handleCreateBusinessClick}
                      disabled={redirectingToBusiness}
                      className="flex items-center gap-3 p-3 border-2 border-dashed border-primary-red/40 rounded-lg hover:bg-primary-red/5 hover:border-primary-red transition-colors disabled:opacity-70 disabled:cursor-wait col-span-2"
                    >
                      <div className="w-10 h-10 bg-primary-red/10 rounded-lg flex items-center justify-center">
                        {redirectingToBusiness ? (
                          <svg className="w-5 h-5 text-primary-red animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-primary-red" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                          </svg>
                        )}
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-primary-red">
                          {redirectingToBusiness ? "Redirecting…" : "Create Business"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {redirectingToBusiness
                            ? "Redirecting…"
                            : user?.source === "google"
                            ? "Publish your first listing"
                            : "Create with email & password"}
                        </p>
                      </div>
                    </button>
                  );
                }

                return (
                  <Link
                    to="/businesses/my"
                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors col-span-2 bg-primary-red/5 border-primary-red/20"
                  >
                    <div className="w-10 h-10 bg-primary-red/10 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-primary-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">My Businesses</p>
                      <p className="text-xs text-gray-500">
                        {businessesLoading
                          ? "Loading..."
                          : `${businessesData?.data?.length ?? 0} business${(businessesData?.data?.length ?? 0) > 1 ? "es" : ""} registered`}
                      </p>
                    </div>
                    <svg className="w-5 h-5 text-primary-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                );
              })()}

              <Link
                to="/user/favorites"
                className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 bg-pink-50 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Favorites</p>
                  <p className="text-xs text-gray-500">Saved places & plans</p>
                </div>
              </Link>

              {/* Change Password Button - Visible for all users */}
              <button
                onClick={handleQuickPasswordClick}
                className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">
                    {hasPassword ? "Change Password" : "Set Password"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {hasPassword
                      ? "Update your password"
                      : "Create password for your account"}
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Sign Out Section */}
          <div className="border-t border-gray-200 p-6">
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>

          {/* Danger Zone */}
          <div className="border-t border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Danger Zone</h3>
            <p className="text-sm text-gray-600 mb-4">
              These actions are permanent and cannot be undone.
            </p>
            
            <div className="space-y-4">
              {/* Disconnect Google - only show for Google-connected users */}
              {user?.source === "google" && (
                <div className="flex items-center justify-between p-4 border border-amber-200 bg-amber-50 rounded-lg">
                  <div>
                    <p className="font-medium text-amber-800">Disconnect Google Account</p>
                    <p className="text-sm text-amber-600">
                      Remove Google sign-in from your account. You'll need to set a password to continue logging in.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDisconnectGoogle(true)}
                    className="py-2 px-4 border border-amber-500 text-amber-700 font-medium rounded-lg hover:bg-amber-100 transition-colors whitespace-nowrap"
                  >
                    Disconnect
                  </button>
                </div>
              )}

              {/* Delete Account */}
              <div className="flex items-center justify-between p-4 border border-red-200 bg-red-50 rounded-lg">
                <div>
                  <p className="font-medium text-red-800">Delete Account</p>
                  <p className="text-sm text-red-600">
                    Permanently delete your account and all associated data
                    {hasBusinesses && `, including ${businessesData?.data?.length} business${(businessesData?.data?.length ?? 0) > 1 ? 'es' : ''}`}.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="py-2 px-4 border border-red-500 text-red-500 font-medium rounded-lg hover:bg-red-100 transition-colors whitespace-nowrap"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Account?</h3>
              <p className="text-gray-600 mb-4">
                This action cannot be undone. All your data will be permanently deleted:
              </p>
              <ul className="text-left text-sm text-gray-600 mb-6 space-y-1 pl-4">
                <li>• Your profile and account information</li>
                <li>• Favorites and preferences</li>
                <li>• Travel plans you've created</li>
                {hasBusinesses && (
                  <li className="text-red-600 font-medium">
                    • {businessesData?.data?.length} registered business{(businessesData?.data?.length ?? 0) > 1 ? 'es' : ''}
                  </li>
                )}
              </ul>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleteAccountMutation.isPending}
                  className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteAccountMutation.isPending}
                  className="flex-1 py-2 px-4 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {deleteAccountMutation.isPending ? "Deleting..." : "Delete Account"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Disconnect Google Modal */}
      {showDisconnectGoogle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div>
              <div className="mx-auto w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-amber-600" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">Disconnect Google Account?</h3>
              <p className="text-gray-600 mb-4 text-center">
                Enter your password to disconnect your Google account. You'll be able to log in with your email and password after disconnecting.
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleDisconnectGoogle();
                }}
                className="space-y-4"
              >
                <div>
                  <label htmlFor="disconnect_password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    id="disconnect_password"
                    value={disconnectPassword}
                    onChange={(e) => {
                      setDisconnectPassword(e.target.value);
                      setDisconnectError("");
                    }}
                    placeholder="Enter your password"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-red transition-colors ${
                      disconnectError ? "border-red-500 bg-red-50" : "border-gray-300"
                    }`}
                    autoFocus
                  />
                  {disconnectError && (
                    <div className="mt-2">
                      <p className="text-sm text-red-600">{disconnectError}</p>
                      {disconnectError.includes("NO_EMAIL_IDENTITY") || disconnectError.includes("set a password") ? (
                        <button
                          type="button"
                          onClick={() => {
                            setShowDisconnectGoogle(false);
                            setDisconnectPassword("");
                            setDisconnectError("");
                            handleQuickPasswordClick();
                          }}
                          className="mt-2 text-sm text-primary-red hover:underline"
                        >
                          Set a password first →
                        </button>
                      ) : null}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDisconnectGoogle(false);
                      setDisconnectPassword("");
                      setDisconnectError("");
                    }}
                    disabled={disconnecting}
                    className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={disconnecting || !disconnectPassword}
                    className="flex-1 py-2 px-4 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {disconnecting ? "Disconnecting..." : "Disconnect Google"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
