import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { userApi } from "../services/api";

interface BusinessFavorite {
  favorite_id: number;
  user_id: number;
  business_id: number;
  business: {
    business_id: number;
    name: string;
    description: string | null;
    picture: string | null;
    rating: number | null;
    city: string | null;
  };
}

interface TravelPlanFavorite {
  favorite_id: number;
  user_id: number;
  travel_plan_id: number;
  travel_plan: {
    travel_plan_id: number;
    name: string;
    description: string | null;
    start_date: string;
    end_date: string;
    location: string | null;
  };
}

type TabType = "businesses" | "plans";

export default function Favorites(): React.ReactElement {
  const navigate = useNavigate();
  const { user, loading: authLoading, isConfigured } = useAuth();

  const [businessFavorites, setBusinessFavorites] = useState<BusinessFavorite[]>([]);
  const [planFavorites, setPlanFavorites] = useState<TravelPlanFavorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("businesses");
  const [removingId, setRemovingId] = useState<number | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/", { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Fetch favorites
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);
        const data = await userApi.getFavorites("me");
        setBusinessFavorites(data.business_favorites || []);
        setPlanFavorites(data.travel_plan_favorites || []);
      } catch (err: any) {
        console.error("Error fetching favorites:", err);
        setError(err.response?.data?.error || "Failed to load favorites");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchFavorites();
    }
  }, [user]);

  const handleRemoveBusinessFavorite = async (businessId: number) => {
    try {
      setRemovingId(businessId);
      await userApi.removeFavorite({ business_id: businessId });
      setBusinessFavorites((prev) =>
        prev.filter((f) => f.business_id !== businessId)
      );
    } catch (err: any) {
      console.error("Error removing favorite:", err);
      setError(err.response?.data?.error || "Failed to remove favorite");
    } finally {
      setRemovingId(null);
    }
  };

  const handleRemovePlanFavorite = async (planId: number) => {
    try {
      setRemovingId(planId);
      await userApi.removeFavorite({ travel_plan_id: planId });
      setPlanFavorites((prev) =>
        prev.filter((f) => f.travel_plan_id !== planId)
      );
    } catch (err: any) {
      console.error("Error removing favorite:", err);
      setError(err.response?.data?.error || "Failed to remove favorite");
    } finally {
      setRemovingId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary-red" />
          <p className="text-gray-600">Loading favorites...</p>
        </div>
      </div>
    );
  }

  if (!isConfigured || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-md text-center">
          <h1 className="mb-4 text-2xl font-bold text-gray-900">
            Sign In Required
          </h1>
          <p className="mb-6 text-gray-600">
            Please sign in to view your favorites.
          </p>
          <button onClick={() => navigate("/")} className="btn-primary">
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Favorites</h1>
          <p className="mt-2 text-gray-600">
            Your saved businesses and travel plans
          </p>
        </div>
        <button
          onClick={() => navigate("/profile")}
          className="text-sm text-primary-red hover:underline"
        >
          ← Back to Profile
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-700">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 font-medium underline"
          >
            Dismiss
          </button>
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
              <svg
                className="mx-auto mb-4 h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              <h3 className="mb-2 text-lg font-medium text-gray-900">
                No favorite businesses yet
              </h3>
              <p className="mb-4 text-gray-500">
                Explore businesses and add them to your favorites
              </p>
              <Link
                to="/businesses"
                className="inline-flex items-center gap-2 rounded-lg bg-primary-red px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-red-dark"
              >
                Browse Businesses
              </Link>
            </div>
          ) : (
            businessFavorites.map((fav) => (
              <div
                key={fav.favorite_id}
                className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 transition hover:shadow-md"
              >
                <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                  {fav.business.picture ? (
                    <img
                      src={fav.business.picture}
                      alt={fav.business.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-gray-400">
                      <svg
                        className="h-8 w-8"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/businesses/${fav.business.business_id}`}
                    className="font-semibold text-gray-900 hover:text-primary-red"
                  >
                    {fav.business.name}
                  </Link>
                  {fav.business.city && (
                    <p className="text-sm text-gray-500">{fav.business.city}</p>
                  )}
                  {fav.business.rating !== null && (
                    <div className="mt-1 flex items-center gap-1 text-sm">
                      <svg
                        className="h-4 w-4 text-yellow-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-gray-600">
                        {Number(fav.business.rating).toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleRemoveBusinessFavorite(fav.business_id)}
                  disabled={removingId === fav.business_id}
                  className="flex-shrink-0 rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                  title="Remove from favorites"
                >
                  {removingId === fav.business_id ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-primary-red" />
                  ) : (
                    <svg
                      className="h-5 w-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
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
              <svg
                className="mx-auto mb-4 h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <h3 className="mb-2 text-lg font-medium text-gray-900">
                No favorite travel plans yet
              </h3>
              <p className="mb-4 text-gray-500">
                Browse public plans and save the ones you like
              </p>
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-lg bg-primary-red px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-red-dark"
              >
                Explore Plans
              </Link>
            </div>
          ) : (
            planFavorites.map((fav) => (
              <div
                key={fav.favorite_id}
                className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 transition hover:shadow-md"
              >
                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-primary-red/10 text-primary-red">
                  <svg
                    className="h-8 w-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/planner/view/${fav.travel_plan.travel_plan_id}`}
                    className="font-semibold text-gray-900 hover:text-primary-red"
                  >
                    {fav.travel_plan.name}
                  </Link>
                  {fav.travel_plan.location && (
                    <p className="text-sm text-gray-500">
                      {fav.travel_plan.location}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-400">
                    {new Date(fav.travel_plan.start_date).toLocaleDateString()} -{" "}
                    {new Date(fav.travel_plan.end_date).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleRemovePlanFavorite(fav.travel_plan_id)}
                  disabled={removingId === fav.travel_plan_id}
                  className="flex-shrink-0 rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                  title="Remove from favorites"
                >
                  {removingId === fav.travel_plan_id ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-primary-red" />
                  ) : (
                    <svg
                      className="h-5 w-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

