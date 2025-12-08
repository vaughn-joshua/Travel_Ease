import { useState, useEffect, useMemo } from "react";
import EditActivity from "./EditActivity";
import { useDeleteActivity, useToggleActivityPriority } from "../../features/travelPlans/mutations";
import { useTravelPlanActivities } from "../../features/travelPlans/queries";
import type { Activity, TravelPlanDates } from "../../types/travelPlan";

interface ActivitiesProps {
  reference_id: string | number;
  load_state: boolean;
  day_selected: number;
  dates: TravelPlanDates;
  status?: string;
  canEdit?: boolean; // New prop for role-based permissions
  onSendData: (lat: number, lng: number) => void;
}

// Helper to format budget range for display
const formatBudgetRange = (range: string | null): string => {
  if (!range) return "";
  if (range.includes("+")) return `₱${range}`;
  const [min, max] = range.split("-");
  return `₱${min} - ₱${max}`;
};

export default function Activities({
  reference_id,
  load_state,
  day_selected,
  dates,
  status,
  canEdit = true, // Default to true for backwards compatibility
  onSendData,
}: ActivitiesProps): React.ReactElement {
  const [clicked, setClicked] = useState<boolean>(false);
  const [data, setData] = useState<Activity | undefined>();
  const [confirmDelete, setConfirmDelete] = useState<string>("");
  const [toDelete, setToDelete] = useState<number | string>("");
  
  // Use TanStack Query for fetching activities
  const {
    data: allActivities = [],
    isLoading,
    refetch,
  } = useTravelPlanActivities(reference_id);

  // Use TanStack Query mutations
  const deleteActivityMutation = useDeleteActivity();
  const togglePriorityMutation = useToggleActivityPriority();

  // Filter activities by selected day and sort by priority (memoized for performance)
  const plans = useMemo(() => {
    if (!allActivities.length) return [];

    const starting_date = new Date(dates.start);
    let current_day: Date;

    if (day_selected === 1) {
      current_day = starting_date;
    } else {
      const selected_day_ms = 1000 * 60 * 60 * 24 * (day_selected - 1);
      current_day = new Date(starting_date.getTime() + selected_day_ms);
    }

    const filtered = allActivities.filter((item) => {
      if (!item.target_date) return false;
      const activity_date = new Date(item.target_date);
      return activity_date.toDateString() === current_day.toDateString();
    });

    // Sort: priority items first, then by activity_id
    return filtered.sort((a, b) => {
      // Priority items come first
      if (a.is_priority && !b.is_priority) return -1;
      if (!a.is_priority && b.is_priority) return 1;
      // Then sort by activity_id
      return a.activity_id - b.activity_id;
    });
  }, [allActivities, dates.start, day_selected]);

  // Refetch when load_state changes (parent triggers refresh)
  useEffect(() => {
    refetch();
  }, [load_state, refetch]);

  useEffect(() => {
    if (confirmDelete === "confirmed" && toDelete) {
      deleteActivityMutation.mutate(
        { activityId: toDelete, planId: reference_id },
        {
          onSuccess: () => {
            refetch();
          },
        }
      );
      setConfirmDelete("");
      setToDelete("");
    }
  }, [confirmDelete, toDelete, reference_id, deleteActivityMutation, refetch]);

  const handle_click = (activityData: Activity): void => {
    setClicked(true);
    setData(activityData);
  };

  const handle_close = (): void => {
    setClicked(false);
    refetch();
  };

  const handle_delete = (plan: Activity): void => {
    setConfirmDelete("verify");
    setToDelete(plan.activity_id);
  };

  const handle_toggle_priority = (e: React.MouseEvent, activity: Activity): void => {
    e.stopPropagation();
    togglePriorityMutation.mutate(
      { activityId: activity.activity_id, planId: reference_id },
      {
        onSuccess: () => {
          refetch();
        },
      }
    );
  };

  const click_plan = (plan: Activity): void => {
    // Allow clicking activities for view, start, and join statuses
    if (plan.lat && plan.lng) {
      onSendData(plan.lat, plan.lng);
    }
  };

  // Determine if edit/delete actions should show
  const showActions = canEdit && status !== "join" && status !== "planner";

  return (
    <>
      <div className="mt-3 space-y-3">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          </div>
        )}

        {!isLoading && plans.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No activities for this day</p>
          </div>
        )}

        {!isLoading && plans.length > 0 &&
          plans.map((plan) => (
            <div
              key={plan.activity_id}
              className={`card cursor-pointer relative ${plan.is_priority ? 'border-l-4 border-l-yellow-400' : ''}`}
              onClick={() => click_plan(plan)}
            >
              {/* Priority Star Button */}
              {canEdit && (
                <button
                  onClick={(e) => handle_toggle_priority(e, plan)}
                  disabled={togglePriorityMutation.isPending}
                  className={`absolute top-2 right-2 p-1 rounded-full transition-colors ${
                    plan.is_priority 
                      ? 'text-yellow-500 hover:text-yellow-600' 
                      : 'text-gray-300 hover:text-yellow-400'
                  } ${togglePriorityMutation.isPending ? 'opacity-50' : ''}`}
                  title={plan.is_priority ? "Remove priority" : "Mark as priority"}
                >
                  {plan.is_priority ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  )}
                </button>
              )}

              <div className="pr-8">
              {/* Display location name if available */}
              {plan.location && (
                <h1 className="font-semibold">{plan.location}</h1>
              )}
              {/* Display address components if available */}
              {(plan.brgy || plan.city || plan.province) && (
                <p className="text-sm text-gray-600">
                  {[plan.brgy, plan.city, plan.province].filter(Boolean).join(", ")}
                </p>
              )}
              {/* Notes */}
              {plan.notes && <p className="text-sm">{plan.notes}</p>}
              {/* Target date */}
              {plan.target_date && (
                <p className="text-sm text-gray-500">{plan.target_date}</p>
              )}
              {/* Budget range - formatted for display */}
              {plan.budget_range && (
                <p className="text-sm text-gray-500">{formatBudgetRange(plan.budget_range)}</p>
              )}
              </div>

              {showActions && (
                <div className="mt-2 space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handle_click(plan);
                    }}
                    className="soft_btn"
                  >
                    edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handle_delete(plan);
                    }}
                    className="soft_btn"
                  >
                    delete
                  </button>
                </div>
              )}
            </div>
          ))}
      </div>

      {clicked && data && (
        <EditActivity on_close={handle_close} data={data} dates={dates} planId={reference_id} />
      )}

      {confirmDelete === "verify" && (
        <div className="modal">
          <div className="modal_body">
            <h1 className="text-lg font-semibold mb-4">Are you sure?</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete("confirmed")}
                className="hard_btn"
              >
                Yes
              </button>
              <button
                className="soft_btn"
                onClick={() => {
                  setConfirmDelete("");
                  setToDelete("");
                }}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
