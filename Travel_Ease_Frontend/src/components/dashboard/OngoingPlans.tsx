import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useOngoingPlans } from "../../features/travelPlans/queries";

export default function OngoingPlans(): React.ReactElement {
  const navigate = useNavigate();
  const { loading: authLoading } = useAuth();

  // Check for token in localStorage to determine if user is authenticated
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // Use TanStack Query hook for fetching ongoing plans
  const {
    data: plans = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useOngoingPlans(!authLoading && Boolean(token));

  const handle_click = (id: number): void => {
    navigate(`/planner/view/${id}`);
  };

  // Show loading while auth is resolving or plans are loading
  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-red"></div>
      </div>
    );
  }

  // Show error state with retry option
  if (isError) {
    return (
      <div className="text-center py-4">
        <p className="text-red-500 mb-2">
          {(error as Error)?.message || "Failed to load ongoing plans"}
        </p>
        <button
          onClick={() => refetch()}
          className="text-primary-red hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  // Show empty state
  if (plans.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No ongoing plans</p>
        <p className="text-sm mt-1">Create a new plan to get started!</p>
      </div>
    );
  }

  return (
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
  );
}
