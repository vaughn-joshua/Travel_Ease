import { useNavigate } from "react-router-dom";
import { useUpcomingPlans } from "../../features/travelPlans/queries";
import { 
  StatusBadge, 
  DatePill, 
  SlotsPill, 
  MetaRow, 
  EmptyState, 
  ErrorState,
  DbUnavailableBanner,
  PlanCardSkeleton 
} from "../ui/PlanCard";

export default function UpcomingPlans(): React.ReactElement {
  const navigate = useNavigate();

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useUpcomingPlans();

  const plans = data?.plans ?? [];
  const dbUnavailable = data?.dbUnavailable ?? false;

  const handle_click = (id: number): void => {
    navigate(`/planner/start/${id}`);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <PlanCardSkeleton />
        <PlanCardSkeleton />
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <ErrorState
        message={(error as Error)?.message || "Failed to load upcoming plans"}
        onRetry={() => refetch()}
      />
    );
  }

  // Empty state
  if (plans.length === 0) {
    return (
      <EmptyState
        icon={
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        }
        title={dbUnavailable ? "Couldn't load upcoming plans" : "No upcoming plans"}
        description={dbUnavailable ? "Please try again in a moment" : "Your future adventures will appear here"}
        action={dbUnavailable ? { label: "Retry", onClick: () => refetch() } : undefined}
        variant={dbUnavailable ? "warning" : "default"}
      />
    );
  }

  return (
    <div className="space-y-4">
      {dbUnavailable && <DbUnavailableBanner onRetry={() => refetch()} compact />}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="group bg-white rounded-xl border border-gray-100 p-4 cursor-pointer hover:border-indigo-200 hover:shadow-md transition-all duration-200"
            onClick={() => handle_click(plan.id)}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <StatusBadge status="Draft" />
              <svg 
                className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>

            {/* Title & Location */}
            <h3 className="font-semibold text-gray-900 line-clamp-1 mb-1 group-hover:text-indigo-700 transition-colors">
              {plan.title}
            </h3>
            
            <MetaRow 
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
              className="mb-3"
            >
              {plan.location || "No location set"}
            </MetaRow>

            {/* Meta pills */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <DatePill startDate={plan.start_date} endDate={plan.end_date} />
              {plan.max_slots && (
                <SlotsPill current={plan.approvedParticipants || 0} max={plan.max_slots} />
              )}
            </div>

            {/* Accommodation */}
            {plan.accommodation && (
              <div className="pt-3 border-t border-gray-100">
                <MetaRow 
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  }
                  className="text-gray-600"
                >
                  {plan.accommodation.name}
                </MetaRow>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
