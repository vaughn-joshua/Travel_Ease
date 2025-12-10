import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useUpcomingPlans } from "../../features/travelPlans/queries";
import { formatPlanDateRange } from "../../utils/date";

export default function UpcomingPlans(): React.ReactElement {
  const navigate = useNavigate();
  const { loading: authLoading } = useAuth();

  // Check for token in localStorage to determine if user is authenticated
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // Use TanStack Query hook for fetching upcoming plans
  const {
    data,
    isError,
    error,
    refetch,
  } = useUpcomingPlans(!authLoading && Boolean(token));

  const plans = data?.plans ?? [];
  const dbUnavailable = data?.dbUnavailable ?? false;

  const handle_click = (id: number): void => {
    navigate(`/planner/start/${id}`);
  };

  return (
    <section>
      <h3 className="text-2xl font-semibold text-gray-900 mb-4">
        Upcoming Plans
      </h3>

      {/* Error state */}
      {isError && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 text-center">
          <p className="text-red-500 mb-2">
            {(error as Error)?.message || "Failed to load upcoming plans"}
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
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-gray-600 font-medium">
            {dbUnavailable ? "We couldn’t load your upcoming plans." : "No upcoming plans"}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {dbUnavailable ? "Please try again shortly." : "Your future travel plans will appear here"}
          </p>
          {dbUnavailable && (
            <button
              onClick={() => refetch()}
              className="mt-3 text-primary-red hover:underline text-sm font-medium"
            >
              Retry loading
            </button>
          )}
        </div>
      )}

      {/* Plans grid */}
      {!isError && plans.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 cursor-pointer hover:shadow-md hover:border-primary-red/20 transition-all"
              onClick={() => handle_click(plan.id)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-secondary-blue bg-secondary-blue/10 px-2.5 py-1 rounded-full">
                  Upcoming
                </span>
              </div>
              <h4 className="font-semibold text-gray-900 line-clamp-1">{plan.title}</h4>
              <p className="text-sm text-gray-500 mt-1 line-clamp-1">📍 {plan.location}</p>
              <p className="text-xs text-gray-400 mt-2">
                📅 {formatPlanDateRange(plan.start_date, plan.end_date)}
              </p>
              {plan.accommodation && (
                <p className="text-xs text-gray-600 mt-1.5 flex items-center gap-1 line-clamp-1">
                  <span>🛏️</span> {plan.accommodation.name}
                </p>
              )}
              {plan.approvedParticipants !== undefined && (
                <p className="text-xs text-gray-400 mt-1">
                  👥 {plan.approvedParticipants}/{plan.max_slots} participants
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
