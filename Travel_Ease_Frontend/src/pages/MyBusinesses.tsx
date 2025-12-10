import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useMyBusinesses } from "../features/businesses/queries";
import { useDeleteBusiness, useUpdateBusiness } from "../features/businesses/mutations";
import { isGoogleAuthRequiredError, getApiErrorMessage } from "../services/api";

interface Business {
  business_id: number;
  name: string;
  description: string;
  city: string;
  rating: number | null;
  status: boolean;
  picture: string | null;
  categories?: { category_name: string }[];
}

export default function MyBusinesses() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [error, setError] = useState("");

  // Use TanStack Query for fetching user's businesses
  const { data: businessesData, isLoading, refetch } = useMyBusinesses();

  const businesses = businessesData?.data || [];
  const loading = authLoading || isLoading;

  // Use TanStack Query mutation for deletion
  const deleteBusinessMutation = useDeleteBusiness();
  
  // Use TanStack Query mutation for updating business status
  const updateBusinessMutation = useUpdateBusiness();

  const handleToggleStatus = async (business: Business) => {
    updateBusinessMutation.mutate(
      { id: business.business_id, data: { status: !business.status } },
      {
        onSuccess: () => {
          refetch();
        },
        onError: (err) => {
          console.error("Error updating business status:", err);
          if (isGoogleAuthRequiredError(err)) {
            setError("This action requires signing in with Google. Please sign out and sign in with your Google account.");
          } else {
            setError(getApiErrorMessage(err));
          }
        },
      }
    );
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login", { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleDelete = async (id: number) => {
    deleteBusinessMutation.mutate(id, {
      onSuccess: () => {
        refetch();
        setDeleteId(null);
      },
      onError: (err) => {
        console.error("Error deleting business:", err);
        if (isGoogleAuthRequiredError(err)) {
          setError("This action requires signing in with Google. Please sign out and sign in with your Google account.");
        } else {
          setError(getApiErrorMessage(err));
        }
        setDeleteId(null);
      },
    });
  };

  const getImageUrl = (picture: string | null): string | null => {
    if (!picture) return null;
    try {
      const parsed =
        typeof picture === "string" ? JSON.parse(picture) : picture;
      if (parsed.secure_url) {
        return Array.isArray(parsed.secure_url)
          ? parsed.secure_url[0]
          : parsed.secure_url;
      }
      return picture;
    } catch {
      return picture;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary-red" />
          <p className="text-gray-600">Loading your businesses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              to="/profile"
              className="inline-flex items-center text-primary-red hover:text-primary-red-dark transition-colors mb-4"
            >
              ← Back to Profile
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">My Businesses</h1>
            <p className="text-gray-600 mt-1">
              Manage your registered businesses
            </p>
          </div>
          <Link to="/businesses/onboarding" className="btn-primary">
            + Add Business
          </Link>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Business List */}
        {businesses.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No businesses yet
            </h2>
            <p className="text-gray-600 mb-6">
              You haven't registered any businesses. Start by adding your first
              one!
            </p>
            <Link to="/businesses/onboarding" className="btn-primary">
              Register a Business
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {businesses.map((business) => (
              <div
                key={business.business_id}
                className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Image */}
                <div className="aspect-video bg-gray-200 relative">
                  {getImageUrl(business.picture) ? (
                    <img
                      src={getImageUrl(business.picture)!}
                      alt={business.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg
                        className="w-12 h-12 text-gray-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                  {/* Status Badge */}
                  <span
                    className={`absolute top-2 right-2 px-2 py-1 text-xs font-medium rounded-full ${
                      business.status
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {business.status ? "Active" : "Pending"}
                  </span>
                </div>

                {/* Content */}
                <div className="p-4">
                  {/* Categories */}
                  {business.categories && business.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {business.categories.slice(0, 2).map((cat, i) => (
                        <span
                          key={i}
                          className="text-xs bg-primary-red/10 text-primary-red px-2 py-0.5 rounded-full"
                        >
                          {cat.category_name}
                        </span>
                      ))}
                      {business.categories.length > 2 && (
                        <span className="text-xs text-gray-500">
                          +{business.categories.length - 2}
                        </span>
                      )}
                    </div>
                  )}

                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {business.name}
                  </h3>

                  {business.description && (
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {business.description}
                    </p>
                  )}

                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                    </svg>
                    {business.city}
                    {business.rating && (
                      <>
                        <span className="mx-1">•</span>
                        <svg
                          className="w-4 h-4 text-yellow-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {typeof business.rating === 'number' ? business.rating.toFixed(1) : (Number(business.rating) || 0).toFixed(1)}
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link
                      to={`/businesses/${business.business_id}`}
                      className="flex-1 text-center py-2 text-sm text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      View
                    </Link>
                    <Link
                      to={`/businesses/${business.business_id}/edit`}
                      className="flex-1 text-center py-2 text-sm text-primary-red border border-primary-red rounded-lg hover:bg-primary-red hover:text-white transition-colors"
                    >
                      Edit
                    </Link>
                    {/* Toggle Status Button */}
                    <button
                      onClick={() => handleToggleStatus(business)}
                      disabled={updateBusinessMutation.isPending}
                      className={`py-2 px-3 text-sm border rounded-lg transition-colors ${
                        business.status
                          ? "text-yellow-600 border-yellow-300 hover:bg-yellow-50"
                          : "text-green-600 border-green-300 hover:bg-green-50"
                      } disabled:opacity-50`}
                      title={business.status ? "Deactivate" : "Activate"}
                    >
                      {updateBusinessMutation.isPending ? (
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : business.status ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => setDeleteId(business.business_id)}
                      className="py-2 px-3 text-sm text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Delete Business?
              </h3>
              <p className="text-gray-600 mb-6">
                This action cannot be undone. All data associated with this
                business will be permanently deleted.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteId(null)}
                  disabled={deleteBusinessMutation.isPending}
                  className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteId)}
                  disabled={deleteBusinessMutation.isPending}
                  className="flex-1 py-2 px-4 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {deleteBusinessMutation.isPending
                    ? "Deleting..."
                    : "Delete Business"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
