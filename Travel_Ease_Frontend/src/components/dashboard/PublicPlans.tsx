import { useNavigate } from "react-router-dom";
import { usePublicPlans } from "../../features/travelPlans/queries";
import type { TravelPlan } from "../../types/travelPlan";

// Helper to get badge color based on role
const getRoleBadgeStyle = (role: string | null | undefined): string => {
  switch (role) {
    case "Owner":
      return "bg-purple-100 text-purple-700 border-purple-200";
    case "Admin":
      return "bg-red-100 text-red-700 border-red-200";
    case "Editor":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "Viewer":
      return "bg-gray-100 text-gray-700 border-gray-200";
    default:
      return "bg-green-100 text-green-700 border-green-200";
  }
};

export default function PublicPlans(): React.ReactElement {
  const navigate = useNavigate();

  // Use TanStack Query hook for fetching public plans
  const { data: plans = [], isError } = usePublicPlans();

  const handle_click = (plan: TravelPlan): void => {
    // Navigate to view if user is a participant, otherwise join
    if (plan.isParticipant || plan.isOwner) {
      navigate(`/planner/view/${plan.id}`);
    } else {
      navigate(`/planner/join/${plan.id}`);
    }
  };

  // Error state
  if (isError) {
    return (
      <div className="text-center py-4">
        <p className="text-red-500">Failed to load public plans</p>
      </div>
    );
  }

  // Empty state
  if (plans.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        <p>No public plans available</p>
      </div>
    );
  }

  // Plans list
  return (
    <div className="grid grid-cols-1 gap-4">
      {plans.map((plan) => (
        <div
          key={plan.id}
          className={`card cursor-pointer hover:shadow-lg transition-shadow relative ${
            plan.isParticipant ? "border-l-4 border-l-green-500" : ""
          }`}
          onClick={() => handle_click(plan)}
        >
          {/* Participation Badge */}
          {plan.isParticipant && (
            <div className="absolute top-2 right-2">
              <span
                className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${getRoleBadgeStyle(
                  plan.participantRole
                )}`}
              >
                <svg
                  className="w-3 h-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                {plan.participantRole || "Member"}
              </span>
            </div>
          )}

          <div className="pr-20">
            <h3 className="font-semibold">{plan.title}</h3>
            <p className="text-sm text-gray-600">{plan.location}</p>
            <p className="text-sm text-gray-500">
              {plan.start_date} - {plan.end_date}
            </p>
            {plan.accommodation && (
              <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                <span>🛏️</span> {plan.accommodation.name}
              </p>
            )}
            {plan.slots && (
              <p className="text-sm text-gray-500">
                {plan.approvedParticipants || 0}/{plan.slots} slots
              </p>
            )}
          </div>

          {/* Action hint */}
          <div className="mt-2 text-xs text-gray-400">
            {plan.isParticipant ? (
              <span className="flex items-center gap-1">
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                Click to view plan
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                  />
                </svg>
                Click to join
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
