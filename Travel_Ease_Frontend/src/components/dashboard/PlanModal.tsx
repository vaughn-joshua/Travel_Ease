import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRequestJoin } from "../../features/travelPlans/mutations";
import { useAuth } from "../../context/AuthContext";
import type { TravelPlan } from "../../types/travelPlan";
import { formatPlanDateRange } from "../../utils/date";
import { SlotsPill, RoleBadge } from "../ui/PlanCard";

interface PlanModalProps {
  results: TravelPlan[];
  on_close: () => void;
}

export default function PlanModal({ results, on_close }: PlanModalProps): React.ReactElement {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [joiningPlanId, setJoiningPlanId] = useState<number | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState<number | null>(null);
  
  const requestJoinMutation = useRequestJoin();
  
  const isUserOwnPlan = (plan: TravelPlan): boolean => {
    if (!user?.id) return false;
    return plan.user_id === user.id || (plan.user?.user_id === user.id);
  };

  const handleViewPlan = (planId: number): void => {
    on_close();
    navigate(`/planner/join/${planId}`);
  };

  const handle_join = async (planId: number): Promise<void> => {
    const token = localStorage.getItem("token");
    
    if (!token) {
      setJoinError("Please log in to join a plan");
      return;
    }

    setJoiningPlanId(planId);
    setJoinError(null);

    requestJoinMutation.mutate(
      { travel_plan_id: planId },
      {
        onSuccess: () => {
          setJoinSuccess(planId);
          setJoiningPlanId(null);
        },
        onError: (error) => {
          console.error("Join error:", error);
          setJoinError(error instanceof Error ? error.message : "Failed to send join request");
          setJoiningPlanId(null);
        },
      }
    );
  };

  const getSlotInfo = (plan: TravelPlan): { available: number | null; isFull: boolean; isLow: boolean } => {
    const maxSlots = plan.max_slots ?? plan.slots;
    const approved = plan.approvedParticipants || 0;
    
    if (!maxSlots) {
      return { available: null, isFull: false, isLow: false };
    }
    
    const available = maxSlots - approved;
    return { 
      available, 
      isFull: available <= 0 || plan.isFull || false, 
      isLow: available > 0 && available <= 2 
    };
  };

  return (
    <div className="fixed inset-0 z-[1500] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                {results.length} {results.length === 1 ? "Plan" : "Plans"} Found
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Plans matching your travel dates
              </p>
            </div>
            <button
              onClick={on_close}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Error banner */}
        {joinError && (
          <div className="mx-4 mt-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
            <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-red-700 text-sm">{joinError}</p>
            <button onClick={() => setJoinError(null)} className="ml-auto text-red-500 hover:text-red-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Results list */}
        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3">
          {results.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-gray-600 font-medium">No matching plans</p>
              <p className="text-sm text-gray-400 mt-1">Try different dates or create your own plan</p>
            </div>
          ) : (
            results.map((plan) => {
              const planId = plan.id || plan.travel_plan_id;
              const slotInfo = getSlotInfo(plan);
              const isJoining = joiningPlanId === planId;
              const hasJoined = joinSuccess === planId;
              const isOwnPlan = isUserOwnPlan(plan);

              return (
                <div
                  key={planId}
                  className={`group relative p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                    isOwnPlan 
                      ? "border-primary-red/30 bg-primary-red/5 hover:border-primary-red/50" 
                      : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-md"
                  }`}
                  onClick={() => handleViewPlan(planId)}
                >
                  {/* Own plan badge */}
                  {isOwnPlan && (
                    <div className="absolute -top-2 -right-2">
                      <span className="px-2 py-0.5 text-xs font-semibold bg-primary-red text-white rounded-full shadow-sm">
                        Your Plan
                      </span>
                    </div>
                  )}

                  <div className="flex gap-4">
                    {/* Plan info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 line-clamp-1 group-hover:text-primary-red transition-colors">
                        {plan.title || plan.name}
                      </h3>
                      
                      {plan.description && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {plan.description}
                        </p>
                      )}
                      
                      {/* Meta info */}
                      <div className="mt-3 space-y-1.5">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                          <span className="truncate">{plan.location || "Location TBD"}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{formatPlanDateRange(plan.start_date, plan.end_date)}</span>
                        </div>
                        
                        {plan.accommodation && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <span className="truncate">{plan.accommodation.name}</span>
                          </div>
                        )}
                      </div>

                      {/* Slots and organizer */}
                      <div className="mt-3 flex items-center gap-3">
                        {plan.max_slots && (
                          <SlotsPill current={plan.approvedParticipants || 0} max={plan.max_slots} />
                        )}
                        {slotInfo.isLow && !slotInfo.isFull && (
                          <span className="text-xs text-amber-600 font-medium">
                            Only {slotInfo.available} left!
                          </span>
                        )}
                      </div>
                      
                      {plan.user && (
                        <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Organized by {plan.user.first_name} {plan.user.last_name}
                        </p>
                      )}
                    </div>

                    {/* Action button */}
                    <div className="shrink-0 flex flex-col items-end justify-between" onClick={(e) => e.stopPropagation()}>
                      {hasJoined ? (
                        <div className="flex items-center gap-1.5 px-3 py-2 bg-green-100 text-green-700 rounded-lg">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-sm font-medium">Requested</span>
                        </div>
                      ) : slotInfo.isFull ? (
                        <span className="px-3 py-2 text-sm bg-gray-100 text-gray-400 rounded-lg">
                          Full
                        </span>
                      ) : (
                        <button
                          onClick={() => handle_join(planId)}
                          disabled={isJoining}
                          className="px-4 py-2 text-sm font-medium bg-primary-red text-white rounded-lg hover:bg-primary-red-dark transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                          {isJoining ? (
                            <>
                              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              Joining...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                              </svg>
                              Join
                            </>
                          )}
                        </button>
                      )}
                      
                      <span className="text-xs text-gray-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        Click to view →
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <button 
            onClick={on_close} 
            className="w-full py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-white transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
