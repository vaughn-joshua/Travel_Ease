import { useNavigate } from "react-router-dom";
import { usePreviousPlans } from "../../features/travelPlans/queries";
import { formatPlanDateRange } from "../../utils/date";

export default function PreviousPlans(): React.ReactElement {
  const navigate = useNavigate();

  const {
    data,
    isError,
    error,
    refetch,
  } = usePreviousPlans();

  const plans = data?.plans ?? [];
  const dbUnavailable = data?.dbUnavailable ?? false;

  // Error state
  if (isError) {
    return (
      <div className="text-center py-6">
        <p className="text-red-500 text-sm mb-2">
          {(error as Error)?.message || "Failed to load"}
        </p>
        <button
          onClick={() => refetch()}
          className="text-primary-red hover:underline text-sm font-medium"
        >
          Try again
        </button>
      </div>
    );
  }

  // Empty state
  if (plans.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-gray-600 font-medium text-sm">
          {dbUnavailable ? "Couldn't load history" : "No past adventures yet"}
        </p>
        {dbUnavailable && (
          <button
            onClick={() => refetch()}
            className="mt-2 text-sm text-primary-red hover:underline"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {plans.slice(0, 5).map((plan) => (
        <div
          key={plan.id}
          onClick={() => navigate(`/planner/view/${plan.id}`)}
          className="group flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
        >
          {/* Completion indicator */}
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 group-hover:bg-gray-200 transition-colors">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 text-sm line-clamp-1 group-hover:text-primary-red transition-colors">
              {plan.title}
            </h4>
            <p className="text-xs text-gray-400 line-clamp-1">
              {plan.location} • {formatPlanDateRange(plan.start_date, plan.end_date)}
            </p>
          </div>
          
          <svg 
            className="w-4 h-4 text-gray-300 group-hover:text-gray-400 shrink-0" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      ))}
      
      {plans.length > 5 && (
        <button
          onClick={() => navigate("/plans/history")}
          className="w-full py-2 text-sm text-gray-500 hover:text-primary-red transition-colors"
        >
          View all {plans.length} past plans →
        </button>
      )}
    </div>
  );
}
