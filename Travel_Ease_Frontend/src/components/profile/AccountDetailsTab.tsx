import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { authApi } from "../../services/auth";
import { useDeleteAccount } from "../../features/user/mutations";
import { supabase } from "../../lib/supabaseClient";

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

export function AccountDetailsTab() {
  const {
    user,
    updateProfile,
    signOut,
    hasPassword,
    signInWithGoogle,
    isGoogleAuth,
  } = useAuth();
  const deleteAccount = useDeleteAccount();
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState<FormData>({
    first_name: "",
    last_name: "",
    contact_no: "",
  });
  const [passwordFormData, setPasswordFormData] = useState<PasswordFormData>({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isRedirectingToGoogle, setIsRedirectingToGoogle] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.firstName || "",
        last_name: user.lastName || "",
        contact_no: user.contactNo || "",
      });
    }
  }, [user]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordFormData((prev) => ({ ...prev, [name]: value }));
    setErrorMessage("");
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setErrorMessage("Please log in to update your profile");
        return;
      }

      await updateProfile({
        first_name: formData.first_name,
        last_name: formData.last_name,
        contact_no: formData.contact_no,
      });

      setSuccessMessage("Profile updated successfully!");
      setIsEditingProfile(false);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to update profile",
      );
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordFormData.new_password !== passwordFormData.confirm_password) {
      setErrorMessage("New passwords do not match");
      return;
    }

    if (passwordFormData.new_password.length < 6) {
      setErrorMessage("Password must be at least 6 characters");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setErrorMessage("Please log in");
        return;
      }

      // Use setPassword for both setting new password and updating existing
      const response = await authApi.setPassword(passwordFormData.new_password);
      if (!response.message) {
        setErrorMessage("Failed to update password");
        return;
      }

      setSuccessMessage(
        `Password ${hasPassword ? "changed" : "set"} successfully!`,
      );
      setPasswordFormData({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
      setIsEditingPassword(false);

      // Refresh profile to sync any changes
      await updateProfile({
        first_name: user?.firstName || "",
        last_name: user?.lastName || "",
        contact_no: user?.contactNo || "",
      });

      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : `Failed to ${hasPassword ? "change" : "set"} password`,
      );
    }
  };

  const handleAddGoogleAuth = async () => {
    setIsRedirectingToGoogle(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to sign in with Google",
      );
      setIsRedirectingToGoogle(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setErrorMessage("Please log in");
        return;
      }

      await authApi.disconnectGoogle(token);
      setSuccessMessage("Google connection removed successfully");

      // Refresh profile to sync auth_provider change
      await updateProfile({
        first_name: user?.firstName || "",
        last_name: user?.lastName || "",
        contact_no: user?.contactNo || "",
      });

      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to disconnect Google",
      );
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setErrorMessage("Please log in");
        return;
      }

      await deleteAccount.mutateAsync();
      setSuccessMessage("Account deleted successfully. Redirecting...");
      setTimeout(() => signOut(), 2000);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to delete account",
      );
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col p-6">
      {successMessage && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 text-green-700">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {errorMessage}
        </div>
      )}

      {/* Profile Card */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-lg overflow-hidden">
        <div className="flex items-center justify-between bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
          <h2 className="text-xl font-semibold text-white">
            Account Information
          </h2>
          {!isEditingProfile && (
            <button
              onClick={() => setIsEditingProfile(true)}
              className="whitespace-nowrap rounded-lg bg-white px-4 py-2 font-medium text-primary-red transition-colors hover:bg-gray-100"
            >
              Edit Profile
            </button>
          )}
        </div>

        <div className="p-6">
          {/* Display Profile Info */}
          {!isEditingProfile ? (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-sm text-gray-500">First Name</p>
                  <p className="text-base font-semibold text-gray-900">
                    {user?.firstName || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Last Name</p>
                  <p className="text-base font-semibold text-gray-900">
                    {user?.lastName || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Contact Number</p>
                  <p className="text-base font-semibold text-gray-900">
                    {user?.contactNo || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-base font-semibold text-gray-900 break-all">
                    {user?.email || "-"}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleProfileChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-red"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleProfileChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-red"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Contact Number
                  </label>
                  <input
                    type="tel"
                    name="contact_no"
                    value={formData.contact_no}
                    onChange={handleProfileChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-red"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 cursor-not-allowed text-gray-500"
                  />
                </div>
              </div>
              <div className="border-t pt-4 flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-red text-white rounded-lg hover:bg-red-700"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {!isEditingProfile && (
        <>
          {/* Authentication Methods */}
          <div className="mt-6 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
              <h2 className="text-xl font-semibold text-white">
                Authentication Methods
              </h2>
            </div>

            <div className="p-6 space-y-4">
              {/* Email/Password */}
              <div className="border-b border-gray-200 pb-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">
                      Email & Password
                    </p>
                    <p className="text-sm text-gray-500">
                      {hasPassword ? "Connected" : "Not set"}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsEditingPassword(!isEditingPassword)}
                    className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                  >
                    {hasPassword ? "Change" : "Set"} Password
                  </button>
                </div>

                {isEditingPassword && (
                  <form onSubmit={handleSetPassword} className="mt-4 space-y-3">
                    {hasPassword && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Current Password
                        </label>
                        <input
                          type="password"
                          name="current_password"
                          value={passwordFormData.current_password}
                          onChange={handlePasswordChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        New Password
                      </label>
                      <input
                        type="password"
                        name="new_password"
                        value={passwordFormData.new_password}
                        onChange={handlePasswordChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        name="confirm_password"
                        value={passwordFormData.confirm_password}
                        onChange={handlePasswordChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                      >
                        {hasPassword ? "Update" : "Set"} Password
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingPassword(false)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Google OAuth */}
              <div className="pt-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">Google Account</p>
                    <p className="text-sm text-gray-500">
                      {isGoogleAuth ? "Connected" : "Not connected"}
                    </p>
                  </div>
                  {!isGoogleAuth ? (
                    <button
                      onClick={handleAddGoogleAuth}
                      disabled={isRedirectingToGoogle}
                      className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 disabled:opacity-50"
                    >
                      {isRedirectingToGoogle ? "Redirecting..." : "Connect"}
                    </button>
                  ) : (
                    <button
                      onClick={handleDisconnectGoogle}
                      className="px-3 py-1 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                    >
                      Disconnect
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="mt-6 bg-white rounded-2xl shadow-lg border border-red-200 overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
              <h2 className="text-xl font-semibold text-white">Danger Zone</h2>
            </div>

            <div className="p-6">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
              >
                Delete Account
              </button>

              {showDeleteConfirm && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-900 font-medium mb-4">
                    Are you sure you want to delete your account? This action
                    cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleDeleteAccount}
                      disabled={deleteAccount.isPending}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      {deleteAccount.isPending ? "Deleting..." : "Yes, Delete"}
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
