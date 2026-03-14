import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePublicPlans } from "../../features/travelPlans/queries";
import type { TravelPlan } from "../../types/travelPlan";
import { formatPlanDateRange } from "../../utils/date";
import { RoleBadge, SlotsPill } from "../ui/PlanCard";

const PLANS_PER_PAGE = 3;

export default function PublicPlans(): React.ReactElement {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);

  const { data: plans = [], isLoading, isError } = usePublicPlans();

  const handle_click = (plan: TravelPlan): void => {
    if (plan.isParticipant || plan.isOwner) {
      navigate(`/planner/view/${plan.id}`);
    } else {
      navigate(`/planner/join/${plan.id}`);
    }
  };

  // Calculate pagination
  const totalPages = Math.ceil(plans.length / PLANS_PER_PAGE);
  const startIndex = (currentPage - 1) * PLANS_PER_PAGE;
  const paginatedPlans = plans.slice(startIndex, startIndex + PLANS_PER_PAGE);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 rounded-xl border border-gray-100 animate-pulse">
            <div className="h-4 w-3/4 bg-gray-200 rounded mb-2" />
            <div className="h-3 w-1/2 bg-gray-200 rounded mb-3" />
            <div className="flex gap-2">
              <div className="h-5 w-20 bg-gray-200 rounded-full" />
              <div className="h-5 w-16 bg-gray-200 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="text-center py-6">
        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-gray-500 text-sm">Failed to load plans</p>
      </div>
    );
  }

  // Empty state
  if (plans.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <p className="text-gray-600 font-medium text-sm">No public plans available</p>
        <p className="text-xs text-gray-400 mt-1">Check back later for community plans</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {paginatedPlans.map((plan) => {
        const isJoined = plan.isParticipant || plan.isOwner;
        const slotsAvailable = plan.slots 
          ? plan.slots - (plan.approvedParticipants || 0)
          : null;
        
        return (
          <div
            key={plan.id}
            className={`group relative p-4 rounded-xl border cursor-pointer transition-colors duration-200 ${
              isJoined 
                ? "bg-green-50/50 border-green-200 hover:border-green-300" 
                : "bg-white border-gray-100 hover:border-primary-red/30 hover:shadow-sm"
            }`}
            onClick={() => handle_click(plan)}
          >
            {/* Participation badge */}
            {isJoined && (
              <div className="absolute -top-2 -right-2">
                <RoleBadge role={plan.participantRole} size="sm" />
              </div>
            )}

            {/* Plan info */}
            <h4 className={`font-semibold text-gray-900 line-clamp-1 mb-1 transition-colors ${
              !isJoined ? "group-hover:text-primary-red" : ""
            }`}>
              {plan.title}
            </h4>
            
            <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-2">
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              <span className="truncate">{plan.location}</span>
            </div>

            {/* Date and slots */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 text-gray-500">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {formatPlanDateRange(plan.start_date, plan.end_date)}
              </span>
              
              {plan.slots && (
                <SlotsPill 
                  current={plan.approvedParticipants || 0} 
                  max={plan.slots} 
                />
              )}
            </div>

            {/* Action hint */}
            <div className="mt-3 pt-2 border-t border-gray-100/80">
              {isJoined ? (
                <span className="inline-flex items-center gap-1.5 text-xs text-green-600 font-medium">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View your plan
                </span>
              ) : slotsAvailable !== null && slotsAvailable <= 0 ? (
                <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                  Plan is full
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs text-primary-red font-medium group-hover:gap-2 transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Request to join
                  <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              )}
            </div>
          </div>
        );
      })}
      
      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-6 h-6 rounded-md text-xs font-medium transition-colors ${
                  currentPage === page
                    ? "bg-primary-red text-white"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {page}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
      
      {/* Total count */}
      {plans.length > PLANS_PER_PAGE && (
        <p className="text-center text-xs text-gray-400">
          Showing {startIndex + 1}-{Math.min(startIndex + PLANS_PER_PAGE, plans.length)} of {plans.length} plans
        </p>
      )}
    </div>
  );
}
