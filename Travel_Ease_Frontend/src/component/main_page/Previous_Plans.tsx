import { useAuth } from "../../context/AuthContext";
import { usePreviousPlans } from "../../features/travelPlans/queries";

export default function Previous_Plans(): React.ReactElement {
  const { loading: authLoading } = useAuth();

  // Check for token in localStorage to determine if user is authenticated
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // Use TanStack Query hook for fetching previous plans
  const {
    data: plans = [],
    isLoading,
    isError,
    error,
    refetch,
  } = usePreviousPlans(!authLoading && Boolean(token));

  return (
    <div>
      <h3 className="text-2xl font-semibold text-gray-900 mb-4">
        Previous Plans
      </h3>

      {/* Loading state */}
      {(authLoading || isLoading) && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-red"></div>
        </div>
      )}

      {/* Error state */}
      {!authLoading && !isLoading && isError && (
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
      {!authLoading && !isLoading && !isError && plans.length === 0 && (
        <div className="text-center py-6 text-gray-500">
          <p className="text-sm">No previous plans</p>
        </div>
      )}

      {/* Plans list */}
      {!authLoading && !isLoading && !isError && plans.length > 0 && (
        <div className="grid grid-cols-1 gap-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white rounded-lg shadow-sm border border-gray-100 p-3"
            >
              <h4 className="font-medium text-gray-900 text-sm">{plan.title}</h4>
              <p className="text-xs text-gray-600 mt-1">{plan.location}</p>
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
