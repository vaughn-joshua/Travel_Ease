import { useState } from "react";
import type { TravelPlan } from "../../types/travelPlan";
import { endpoints } from "../../config/api";

interface PlanModalProps {
  results: TravelPlan[];
  on_close: () => void;
}

// Format date for display
function formatDate(dateStr: string | null): string {
  if (!dateStr) return "TBD";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "TBD";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function Plan_Modal({ results, on_close }: PlanModalProps): React.ReactElement {
  const [joiningPlanId, setJoiningPlanId] = useState<number | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState<number | null>(null);

  const handle_join = async (planId: number): Promise<void> => {
    const token = localStorage.getItem("token");
    
    if (!token) {
      setJoinError("Please log in to join a plan");
      return;
    }

    setJoiningPlanId(planId);
    setJoinError(null);

    try {
      const response = await fetch(endpoints.travelPlan.requestJoin, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ travel_plan_id: planId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send join request");
      }

      setJoinSuccess(planId);
    } catch (e) {
      console.error("Join error:", e);
      setJoinError(e instanceof Error ? e.message : "Failed to send join request");
    } finally {
      setJoiningPlanId(null);
    }
  };

  const getSlotInfo = (plan: TravelPlan): { text: string; color: string } => {
    const maxSlots = plan.max_slots ?? plan.slots;
    const approved = plan.approvedParticipants || 0;
    
    if (!maxSlots) {
      return { text: `${approved} participants`, color: "text-gray-600" };
    }
    
    const available = maxSlots - approved;
    if (available <= 0 || plan.isFull) {
      return { text: "Full", color: "text-red-600" };
    }
    if (available <= 2) {
      return { text: `${available} spot${available === 1 ? "" : "s"} left!`, color: "text-orange-600" };
    }
    return { text: `${approved}/${maxSlots} participants`, color: "text-green-600" };
  };

  return (
    <div className="modal">
      <div className="modal_body max-w-lg">
        <h1 className="text-xl font-semibold text-red-600 text-center mb-4">
          Matching Plans
        </h1>

        {joinError && (
          <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
            <p className="text-red-600 text-sm">{joinError}</p>
          </div>
        )}

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {results.length === 0 ? (
            <p className="text-center text-gray-500">No matching plans found</p>
          ) : (
            results.map((plan) => {
              const planId = plan.id || plan.travel_plan_id;
              const slotInfo = getSlotInfo(plan);
              const isJoining = joiningPlanId === planId;
              const hasJoined = joinSuccess === planId;
              const isFull = plan.isFull || (plan.slotsAvailable !== null && plan.slotsAvailable <= 0);

              return (
                <div
                  key={planId}
                  className="card hover:shadow-lg transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {plan.title || plan.name}
                      </h3>
                      {plan.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {plan.description}
                        </p>
                      )}
                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <span>📍</span> {plan.location || "Location TBD"}
                        </p>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <span>📅</span> {formatDate(plan.start_date)} - {formatDate(plan.end_date)}
                        </p>
                        <p className={`text-sm font-medium ${slotInfo.color}`}>
                          {slotInfo.text}
                        </p>
                      </div>
                      {plan.user && (
                        <p className="text-xs text-gray-400 mt-2">
                          Organized by {plan.user.first_name} {plan.user.last_name}
                        </p>
                      )}
                    </div>
                    <div className="ml-4">
                      {hasJoined ? (
                        <span className="px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg">
                          Request Sent!
                        </span>
                      ) : (
                        <button
                          onClick={() => handle_join(planId)}
                          disabled={isJoining || isFull}
                          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                            isFull
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
                          }`}
                        >
                          {isJoining ? "Sending..." : isFull ? "Full" : "Request to Join"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="flex justify-end pt-4 border-t mt-4">
          <button onClick={on_close} className="soft_btn">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

