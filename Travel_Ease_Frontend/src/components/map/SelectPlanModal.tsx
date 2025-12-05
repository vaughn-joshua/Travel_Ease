import React from "react";
import { useNavigate } from "react-router-dom";
import { useOngoingPlans, useUpcomingPlans } from "../../features/travelPlans/queries";
import type { SearchResult } from "../../types/map";
import type { TravelPlan } from "../../types/travelPlan";

interface SelectPlanModalProps {
  searchResult: SearchResult;
  onClose: () => void;
}

export default function SelectPlanModal({
  searchResult,
  onClose,
}: SelectPlanModalProps): React.ReactElement {
  const navigate = useNavigate();
  
  // Fetch user's travel plans
  const { data: ongoingPlans = [], isLoading: ongoingLoading } = useOngoingPlans();
  const { data: upcomingPlans = [], isLoading: upcomingLoading } = useUpcomingPlans();
  
  const isLoading = ongoingLoading || upcomingLoading;
  
  // Combine and deduplicate plans
  const allPlans = React.useMemo(() => {
    const planMap = new Map<number, TravelPlan>();
    [...ongoingPlans, ...upcomingPlans].forEach((plan) => {
      if (plan.travel_plan_id) {
        planMap.set(plan.travel_plan_id, plan);
      }
    });
    return Array.from(planMap.values());
  }, [ongoingPlans, upcomingPlans]);

  const handlePlanSelect = (plan: TravelPlan): void => {
    // Navigate to planner with prefill data
    navigate(`/planner/view/${plan.travel_plan_id}`, {
      state: { prefillActivity: searchResult },
    });
    onClose();
  };

  const getStatusBadge = (status: string): React.ReactElement => {
    const statusStyles: Record<string, string> = {
      Active: "bg-green-100 text-green-700",
      Draft: "bg-yellow-100 text-yellow-700",
      Completed: "bg-gray-100 text-gray-700",
    };
    
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[status] || "bg-gray-100 text-gray-600"}`}>
        {status}
      </span>
    );
  };

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-[10000]">
      <div className="modal_body max-w-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Select Travel Plan</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-100">
          <p className="text-sm text-gray-600">Adding location:</p>
          <p className="font-medium text-gray-900">{searchResult.name}</p>
          {searchResult.label && searchResult.label !== searchResult.name && (
            <p className="text-xs text-gray-500 mt-0.5">{searchResult.label}</p>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          </div>
        ) : allPlans.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-gray-500 mb-4">No travel plans found</p>
            <button
              onClick={() => {
                navigate("/plans");
                onClose();
              }}
              className="hard_btn"
            >
              Create a Plan
            </button>
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {allPlans.map((plan) => (
              <button
                key={plan.travel_plan_id}
                onClick={() => handlePlanSelect(plan)}
                className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-red-300 hover:bg-red-50/50 transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 group-hover:text-red-600 transition-colors truncate">
                      {plan.title}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">{plan.location}</p>
                    {plan.start_date && plan.end_date && (
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDate(plan.start_date)} - {formatDate(plan.end_date)}
                      </p>
                    )}
                  </div>
                  <div className="ml-3 flex-shrink-0">
                    {getStatusBadge(plan.status)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="flex justify-end mt-4 pt-4 border-t">
          <button onClick={onClose} className="soft_btn">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}


