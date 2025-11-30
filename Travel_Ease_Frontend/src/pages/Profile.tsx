import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { userApi } from "../services/api";

interface UserProfile {
  user_id: number;
  auth_id: string | null;
  first_name: string;
  last_name: string;
  email: string;
  contact_no: string | null;
  created_at: string;
}

interface FormData {
  first_name: string;
  last_name: string;
  contact_no: string;
}

export default function Profile(): React.ReactElement {
  const navigate = useNavigate();
  const { user, loading: authLoading, isConfigured } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    first_name: "",
    last_name: "",
    contact_no: "",
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/", { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);
        const data = await userApi.getProfile("me");
        setProfile(data);
        setFormData({
          first_name: data.first_name,
          last_name: data.last_name,
          contact_no: data.contact_no || "",
        });
      } catch (err: any) {
        console.error("Error fetching profile:", err);
        setError(err.response?.data?.error || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      setSaving(true);
      const result = await userApi.updateProfile("me", formData);
      setProfile(result.user);
      setSuccess("Profile updated successfully!");
      setIsEditing(false);
    } catch (err: any) {
      console.error("Error updating profile:", err);
      setError(err.response?.data?.error || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        first_name: profile.first_name,
        last_name: profile.last_name,
        contact_no: profile.contact_no || "",
      });
    }
    setIsEditing(false);
    setError(null);
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary-red" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!isConfigured) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-md text-center">
          <h1 className="mb-4 text-2xl font-bold text-gray-900">
            Authentication Not Configured
          </h1>
          <p className="text-gray-600">
            Please configure Supabase to use profile features.
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-md text-center">
          <h1 className="mb-4 text-2xl font-bold text-gray-900">
            Sign In Required
          </h1>
          <p className="mb-6 text-gray-600">
            Please sign in to view your profile.
          </p>
          <button
            onClick={() => navigate("/")}
            className="btn-primary"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="mt-2 text-gray-600">
          Manage your account information
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 rounded-lg bg-green-50 p-4 text-green-700">
          {success}
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary-red to-primary-red-dark text-2xl font-bold text-white">
              {profile?.first_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "U"}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {profile?.first_name} {profile?.last_name}
              </h2>
              <p className="text-gray-500">{profile?.email}</p>
            </div>
          </div>

          {/* First Name */}
          <div>
            <label
              htmlFor="first_name"
              className="block text-sm font-medium text-gray-700"
            >
              First Name
            </label>
            <input
              type="text"
              id="first_name"
              name="first_name"
              value={formData.first_name}
              onChange={handleInputChange}
              disabled={!isEditing}
              className={`mt-1 block w-full rounded-lg border px-4 py-3 transition ${
                isEditing
                  ? "border-gray-300 focus:border-primary-red focus:outline-none focus:ring-1 focus:ring-primary-red"
                  : "border-transparent bg-gray-50 text-gray-700"
              }`}
              required
            />
          </div>

          {/* Last Name */}
          <div>
            <label
              htmlFor="last_name"
              className="block text-sm font-medium text-gray-700"
            >
              Last Name
            </label>
            <input
              type="text"
              id="last_name"
              name="last_name"
              value={formData.last_name}
              onChange={handleInputChange}
              disabled={!isEditing}
              className={`mt-1 block w-full rounded-lg border px-4 py-3 transition ${
                isEditing
                  ? "border-gray-300 focus:border-primary-red focus:outline-none focus:ring-1 focus:ring-primary-red"
                  : "border-transparent bg-gray-50 text-gray-700"
              }`}
              required
            />
          </div>

          {/* Email (read-only) */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
              <span className="ml-2 text-xs text-gray-400">(cannot be changed)</span>
            </label>
            <input
              type="email"
              id="email"
              value={profile?.email || ""}
              disabled
              className="mt-1 block w-full rounded-lg border border-transparent bg-gray-100 px-4 py-3 text-gray-500"
            />
          </div>

          {/* Contact Number */}
          <div>
            <label
              htmlFor="contact_no"
              className="block text-sm font-medium text-gray-700"
            >
              Contact Number
            </label>
            <input
              type="tel"
              id="contact_no"
              name="contact_no"
              value={formData.contact_no}
              onChange={handleInputChange}
              disabled={!isEditing}
              placeholder="Enter your phone number"
              className={`mt-1 block w-full rounded-lg border px-4 py-3 transition ${
                isEditing
                  ? "border-gray-300 focus:border-primary-red focus:outline-none focus:ring-1 focus:ring-primary-red"
                  : "border-transparent bg-gray-50 text-gray-700"
              }`}
            />
          </div>

          {/* Member Since */}
          {profile?.created_at && (
            <div className="border-t border-gray-100 pt-4">
              <p className="text-sm text-gray-500">
                Member since:{" "}
                <span className="font-medium text-gray-700">
                  {new Date(profile.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 border-t border-gray-100 pt-6">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={saving}
                  className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-primary-red px-6 py-2.5 text-sm font-medium text-white transition hover:bg-primary-red-dark disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="rounded-lg bg-primary-red px-6 py-2.5 text-sm font-medium text-white transition hover:bg-primary-red-dark"
              >
                Edit Profile
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Quick Links */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 text-left transition hover:border-primary-red/30 hover:shadow-md"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-red/10 text-primary-red">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-gray-900">My Travel Plans</h3>
            <p className="text-sm text-gray-500">View and manage your plans</p>
          </div>
        </button>

        <button
          onClick={() => navigate("/profile/favorites")}
          className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 text-left transition hover:border-primary-red/30 hover:shadow-md"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-red/10 text-primary-red">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-gray-900">My Favorites</h3>
            <p className="text-sm text-gray-500">Saved businesses and plans</p>
          </div>
        </button>
      </div>
    </div>
  );
}

