import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { usePreviousPlans } from "../../features/travelPlans/queries";
import { formatPlanDateRange } from "../../utils/date";

export default function Previous_Plans(): React.ReactElement {
  const navigate = useNavigate();
  const { loading: authLoading } = useAuth();

  // Check for token in localStorage to determine if user is authenticated
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // Use TanStack Query hook for fetching previous plans
  const {
    data,
    isError,
    error,
    refetch,
  } = usePreviousPlans(!authLoading && Boolean(token));

  const plans = data?.plans ?? [];
  const dbUnavailable = data?.dbUnavailable ?? false;

  return (
    <section>
      <h3 className="text-2xl font-semibold text-gray-900 mb-4">
        Previous Plans
      </h3>

      {/* Error state */}
      {isError && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-red-500 mb-2 text-sm">
            {(error as Error)?.message || "Failed to load previous plans"}
          </p>
          <button
            onClick={() => refetch()}
            className="text-primary-red hover:underline text-sm font-medium"
          >
            Try again
          </button>
        </div>
      )}

      {/* Empty state */}
      {!isError && plans.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 text-center">
          <p className="text-sm text-gray-600 font-medium">
            {dbUnavailable ? "Unable to load previous plans" : "No previous plans"}
          </p>
          {dbUnavailable && (
            <button
              onClick={() => refetch()}
              className="mt-3 text-sm font-medium text-red-500 hover:text-red-600"
            >
              Try again
            </button>
          )}
        </div>
      )}

      {/* Plans list */}
      {!isError && plans.length > 0 && (
        <div className="space-y-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              onClick={() => navigate(`/planner/view/${plan.id}`)}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 cursor-pointer hover:shadow-md hover:border-primary-red/20 transition-all"
            >
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-medium text-gray-900 text-sm line-clamp-1">{plan.title}</h4>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full shrink-0 ml-2">
                  Completed
                </span>
              </div>
              <p className="text-xs text-gray-500 line-clamp-1">📍 {plan.location}</p>
              {plan.accommodation && (
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1 line-clamp-1">
                  <span>🛏️</span> {plan.accommodation.name}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                📅 {formatPlanDateRange(plan.start_date, plan.end_date)}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
