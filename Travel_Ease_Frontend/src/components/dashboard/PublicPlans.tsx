import { useNavigate } from "react-router-dom";
import { usePublicPlans } from "../../features/travelPlans/queries";
import type { TravelPlan } from "../../types/travelPlan";
import { formatPlanDateRange } from "../../utils/date";

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
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 text-center">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <p className="text-gray-600 font-medium">No public plans available</p>
        <p className="text-sm text-gray-400 mt-1">Check back later for community plans</p>
      </div>
    );
  }

  // Plans list
  return (
    <div className="space-y-3">
      {plans.map((plan) => (
        <div
          key={plan.id}
          className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 cursor-pointer hover:shadow-md hover:border-primary-red/20 transition-all relative ${
            plan.isParticipant ? "border-l-4 border-l-green-500" : ""
          }`}
          onClick={() => handle_click(plan)}
        >
          {/* Participation Badge */}
          {plan.isParticipant && (
            <div className="absolute top-3 right-3">
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

          <div className={plan.isParticipant ? "pr-24" : ""}>
            <h4 className="font-semibold text-gray-900 line-clamp-1">{plan.title}</h4>
            <p className="text-sm text-gray-500 mt-1 line-clamp-1">📍 {plan.location}</p>
            <p className="text-xs text-gray-400 mt-1">
              📅 {formatPlanDateRange(plan.start_date, plan.end_date)}
            </p>
            {plan.accommodation && (
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1 line-clamp-1">
                <span>🛏️</span> {plan.accommodation.name}
              </p>
            )}
            {plan.slots && (
              <p className="text-xs text-gray-400 mt-1">
                👥 {plan.approvedParticipants || 0}/{plan.slots} slots
              </p>
            )}
          </div>

          {/* Action hint */}
          <div className="mt-3 pt-2 border-t border-gray-100 text-xs text-gray-400">
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
              <span className="flex items-center gap-1 text-primary-red">
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
