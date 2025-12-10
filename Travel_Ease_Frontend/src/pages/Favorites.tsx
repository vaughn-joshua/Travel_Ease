import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useFavorites } from "../features/favorites/queries";
import { useRemoveFavorite } from "../features/favorites/mutations";

type TabType = "businesses" | "plans";
import { useState } from "react";

export default function Favorites(): React.ReactElement {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("businesses");

  const {
    data,
    isLoading,
    isError,
    error,
  } = useFavorites(Boolean(user));

  const removeFavoriteMutation = useRemoveFavorite();

  const businessFavorites = data?.business_favorites ?? [];
  const planFavorites = data?.travel_plan_favorites ?? [];

  // Smooth scroll to top on mount (respects reduced-motion)
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? 'auto' : 'smooth'
    });
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/", { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleRemoveBusinessFavorite = (businessId: number) => {
    removeFavoriteMutation.mutate({ business_id: businessId });
  };

  const handleRemovePlanFavorite = (planId: number) => {
    removeFavoriteMutation.mutate({ travel_plan_id: planId });
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
            <div className="absolute inset-0 rounded-full border-4 border-primary-red border-t-transparent animate-spin" />
          </div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-primary-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Sign In Required</h1>
          <p className="text-gray-500 mb-8">Please sign in to view your favorites.</p>
          <button 
            onClick={() => navigate("/")} 
            className="px-6 py-3 bg-primary-red text-white rounded-xl font-medium hover:bg-primary-red-dark transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  // Coming soon placeholder
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-lg mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Header illustration */}
          <div className="bg-gradient-to-br from-primary-red/5 to-primary-red/10 px-8 py-12 text-center">
            <div className="w-24 h-24 bg-white rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-primary-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Favorites Coming Soon
            </h1>
            <p className="text-gray-600">
              We're working on something special for you
            </p>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Feature preview */}
            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-primary-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Save Businesses</h3>
                  <p className="text-sm text-gray-500">
                    Bookmark your favorite restaurants, hotels, and attractions
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-primary-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Save Travel Plans</h3>
                  <p className="text-sm text-gray-500">
                    Keep track of public plans you're interested in joining
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-primary-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Get Updates</h3>
                  <p className="text-sm text-gray-500">
                    Receive notifications when favorites have updates
                  </p>
                </div>
              </div>
            </div>

            {/* Action */}
            <Link
              to="/profile"
              className="flex items-center justify-center gap-2 w-full py-3 px-6 bg-primary-red text-white font-semibold rounded-xl hover:bg-primary-red-dark focus:outline-none focus:ring-2 focus:ring-primary-red focus:ring-offset-2 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Profile
            </Link>
          </div>
        </div>
      </div>

      {/* Hidden - Original implementation for future use */}
      <div style={{ display: "none" }}>
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Favorites</h1>
              <p className="mt-2 text-gray-600">Your saved businesses and travel plans</p>
            </div>
            <button
              onClick={() => navigate("/profile")}
              className="text-sm text-primary-red hover:underline"
            >
              ← Back to Profile
            </button>
          </div>

          {isError && error && (
            <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-700">
              {(error as any).response?.data?.error || "Failed to load favorites"}
            </div>
          )}

          {/* Tabs */}
          <div className="mb-6 flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab("businesses")}
              className={`px-4 py-3 text-sm font-medium transition ${
                activeTab === "businesses"
                  ? "border-b-2 border-primary-red text-primary-red"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Businesses ({businessFavorites.length})
            </button>
            <button
              onClick={() => setActiveTab("plans")}
              className={`px-4 py-3 text-sm font-medium transition ${
                activeTab === "plans"
                  ? "border-b-2 border-primary-red text-primary-red"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Travel Plans ({planFavorites.length})
            </button>
          </div>

          {/* Business Favorites */}
          {activeTab === "businesses" && (
            <div className="space-y-4">
              {businessFavorites.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                  <svg className="mx-auto mb-4 h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <h3 className="mb-2 text-lg font-medium text-gray-900">No favorite businesses yet</h3>
                  <p className="mb-4 text-gray-500">Explore businesses and add them to your favorites</p>
                  <Link to="/businesses" className="inline-flex items-center gap-2 rounded-lg bg-primary-red px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-red-dark">
                    Browse Businesses
                  </Link>
                </div>
              ) : (
                businessFavorites.map((fav) => (
                  <div key={fav.favorite_id} className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 transition hover:shadow-md">
                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                      {fav.business?.picture ? (
                        <img src={fav.business.picture} alt={fav.business.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-gray-400">
                          <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link to={`/businesses/${fav.business?.business_id}`} className="font-semibold text-gray-900 hover:text-primary-red">
                        {fav.business?.name}
                      </Link>
                      {fav.business?.city && <p className="text-sm text-gray-500">{fav.business.city}</p>}
                    </div>
                    <button
                      onClick={() => fav.business?.business_id && handleRemoveBusinessFavorite(fav.business.business_id)}
                      disabled={removeFavoriteMutation.isPending}
                      className="flex-shrink-0 rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                      title="Remove from favorites"
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Travel Plan Favorites */}
          {activeTab === "plans" && (
            <div className="space-y-4">
              {planFavorites.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                  <svg className="mx-auto mb-4 h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <h3 className="mb-2 text-lg font-medium text-gray-900">No favorite travel plans yet</h3>
                  <p className="mb-4 text-gray-500">Browse public plans and save the ones you like</p>
                  <Link to="/" className="inline-flex items-center gap-2 rounded-lg bg-primary-red px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-red-dark">
                    Explore Plans
                  </Link>
                </div>
              ) : (
                planFavorites.map((fav) => (
                  <div key={fav.favorite_id} className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 transition hover:shadow-md">
                    <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-primary-red/10 text-primary-red">
                      <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link to={`/planner/view/${fav.travel_plan?.travel_plan_id}`} className="font-semibold text-gray-900 hover:text-primary-red">
                        {fav.travel_plan?.name}
                      </Link>
                      {fav.travel_plan?.location && <p className="text-sm text-gray-500">{fav.travel_plan.location}</p>}
                    </div>
                    <button
                      onClick={() => fav.travel_plan?.travel_plan_id && handleRemovePlanFavorite(fav.travel_plan.travel_plan_id)}
                      disabled={removeFavoriteMutation.isPending}
                      className="flex-shrink-0 rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                      title="Remove from favorites"
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
