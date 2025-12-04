import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useUpcomingPlans } from "../../features/travelPlans/queries";

export default function UpcomingPlans(): React.ReactElement {
  const navigate = useNavigate();
  const { loading: authLoading } = useAuth();

  // Check for token in localStorage to determine if user is authenticated
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // Use TanStack Query hook for fetching upcoming plans
  const {
    data: plans = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useUpcomingPlans(!authLoading && Boolean(token));

  const handle_click = (id: number): void => {
    navigate(`/planner/start/${id}`);
  };

  return (
    <div>
      <h3 className="text-2xl font-semibold text-gray-900 mb-4">
        Upcoming Plans
      </h3>

      {/* Loading state */}
      {(authLoading || isLoading) && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-red"></div>
        </div>
      )}

      {/* Error state */}
      {!authLoading && !isLoading && isError && (
        <div className="text-center py-4">
          <p className="text-red-500 mb-2">
            {(error as Error)?.message || "Failed to load upcoming plans"}
          </p>
          <button
            onClick={() => refetch()}
            className="text-primary-red hover:underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Empty state */}
      {!authLoading && !isLoading && !isError && plans.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No upcoming plans</p>
          <p className="text-sm mt-1">
            Your future travel plans will appear here
          </p>
        </div>
      )}

      {/* Plans grid */}
      {!authLoading && !isLoading && !isError && plans.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handle_click(plan.id)}
            >
              <h3 className="font-semibold text-gray-900">{plan.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{plan.location}</p>
              <p className="text-sm text-gray-500 mt-2">
                {plan.start_date} - {plan.end_date}
              </p>
              {plan.approvedParticipants !== undefined && (
                <p className="text-xs text-gray-400 mt-2">
                  {plan.approvedParticipants}/{plan.max_slots} participants
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
