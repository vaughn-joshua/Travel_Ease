import React from "react";
import { useNavigate } from "react-router-dom";
import { useOngoingPlans, useUpcomingPlans } from "../../features/travelPlans/queries";
import type { SearchResult } from "../../types/map";
import type { TravelPlan } from "../../types/travelPlan";
import { formatPlanDateRange } from "../../utils/date";
import { StatusBadge } from "../ui/PlanCard";

interface SelectPlanModalProps {
  searchResult: SearchResult;
  onClose: () => void;
}

export default function SelectPlanModal({
  searchResult,
  onClose,
}: SelectPlanModalProps): React.ReactElement {
  const navigate = useNavigate();
  
  const { data: ongoingData, isLoading: ongoingLoading } = useOngoingPlans();
  const { data: upcomingData, isLoading: upcomingLoading } = useUpcomingPlans();

  const ongoingPlans = ongoingData?.plans ?? [];
  const upcomingPlans = upcomingData?.plans ?? [];
  const dbUnavailable = Boolean(ongoingData?.dbUnavailable || upcomingData?.dbUnavailable);
  
  const isLoading = ongoingLoading || upcomingLoading;
  
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
    navigate(`/planner/view/${plan.travel_plan_id}`, {
      state: { prefillActivity: searchResult },
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Add to Plan</h2>
              <p className="text-sm text-gray-500 mt-0.5">Select a travel plan</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Location info */}
        <div className="mx-4 mt-4 p-4 bg-primary-red/5 rounded-xl border border-primary-red/20">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-primary-red/10 rounded-lg flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-primary-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Adding</p>
              <p className="font-semibold text-gray-900 mt-0.5 line-clamp-1">{searchResult.name}</p>
              {searchResult.label && searchResult.label !== searchResult.name && (
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{searchResult.label}</p>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 max-h-80 overflow-y-auto">
          {/* Loading state */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-red mb-3"></div>
              <p className="text-sm text-gray-500">Loading your plans...</p>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && allPlans.length === 0 && (
            <div className="text-center py-12">
              <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-gray-600 font-medium mb-1">
                {dbUnavailable ? "Couldn't load plans" : "No travel plans"}
              </p>
              <p className="text-sm text-gray-400 mb-4">
                {dbUnavailable ? "Please try again later" : "Create a plan first to add locations"}
              </p>
              <button
                onClick={() => {
                  navigate("/plans");
                  onClose();
                }}
                className="px-4 py-2 bg-primary-red text-white rounded-xl text-sm font-medium hover:bg-primary-red-dark transition-colors"
              >
                Create a Plan
              </button>
            </div>
          )}

          {/* Plans list */}
          {!isLoading && allPlans.length > 0 && (
            <div className="space-y-2">
              {allPlans.map((plan) => (
                <button
                  key={plan.travel_plan_id}
                  onClick={() => handlePlanSelect(plan)}
                  className="w-full text-left p-4 rounded-xl border border-gray-100 hover:border-primary-red/30 hover:bg-primary-red/5 transition-all group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 group-hover:text-primary-red transition-colors line-clamp-1">
                        {plan.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        <span className="truncate">{plan.location}</span>
                      </div>
                      {plan.start_date && plan.end_date && (
                        <p className="text-xs text-gray-400 mt-1.5">
                          {formatPlanDateRange(plan.start_date, plan.end_date)}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      <StatusBadge 
                        status={plan.status === "Active" ? "Active" : plan.status === "Draft" ? "Draft" : "Completed"} 
                        size="sm" 
                      />
                      <svg 
                        className="w-4 h-4 text-gray-300 group-hover:text-primary-red group-hover:translate-x-0.5 transition-all" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <button 
            onClick={onClose} 
            className="w-full py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-white transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
