import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { usePreviousPlans } from "../../features/travelPlans/queries";

export default function Previous_Plans(): React.ReactElement {
  const navigate = useNavigate();
  const { loading: authLoading } = useAuth();

  // Check for token in localStorage to determine if user is authenticated
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // Use TanStack Query hook for fetching previous plans
  const {
    data: plans = [],
    isError,
    error,
    refetch,
  } = usePreviousPlans(!authLoading && Boolean(token));

  return (
    <div>
      <h3 className="text-2xl font-semibold text-gray-900 mb-4">
        Previous Plans
      </h3>

      {/* Error state */}
      {isError && (
        <div className="text-center py-4">
          <p className="text-red-500 mb-2 text-sm">
            {(error as Error)?.message || "Failed to load previous plans"}
          </p>
          <button
            onClick={() => refetch()}
            className="text-primary-red hover:underline text-sm"
          >
            Try again
          </button>
        </div>
      )}

      {/* Empty state */}
      {!isError && plans.length === 0 && (
        <div className="text-center py-6 text-gray-500">
          <p className="text-sm">No previous plans</p>
        </div>
      )}

      {/* Plans list */}
      {!isError && plans.length > 0 && (
        <div className="grid grid-cols-1 gap-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              onClick={() => navigate(`/planner/view/${plan.id}`)}
              className="bg-white rounded-lg shadow-sm border border-gray-100 p-3 cursor-pointer hover:shadow-md hover:border-red-200 transition-all"
            >
              <h4 className="font-medium text-gray-900 text-sm">{plan.title}</h4>
              <p className="text-xs text-gray-600 mt-1">{plan.location}</p>
              {plan.accommodation && (
                <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                  <span>🛏️</span> {plan.accommodation.name}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                {plan.start_date} - {plan.end_date}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
