import React, { useState, useEffect, useMemo } from "react";
import EditActivity from "./EditActivity";
import TrafficSuggestion from "./TrafficSuggestion";
import AlternativeSuggestionsModal from "./AlternativeSuggestionsModal";
import { useDeleteActivity, useToggleActivityPriority, useCreateActivity } from "../../features/travelPlans/mutations";
import { useTravelPlanActivities } from "../../features/travelPlans/queries";
import type { Activity, TravelPlanDates } from "../../types/travelPlan";

interface ActivitiesProps {
  reference_id: string | number;
  load_state: boolean;
  day_selected: number;
  dates: TravelPlanDates;
  status?: string;
  canEdit?: boolean;
  onSendData: (lat: number, lng: number) => void;
}

const formatBudgetRange = (range: string | null): string => {
  if (!range) return "";
  if (range.includes("+")) return `₱${range}`;
  const [min, max] = range.split("-");
  return `₱${min} - ₱${max}`;
};

// Hardcoded default "User Location" to use as the origin for the first activity
const USER_ORIGIN_LAT = 14.1153;
const USER_ORIGIN_LNG = 120.9620;

export default function Activities({
  reference_id,
  load_state,
  day_selected,
  dates,
  status,
  canEdit = true,
  onSendData,
}: ActivitiesProps): React.ReactElement {
  const [clicked, setClicked] = useState<boolean>(false);
  const [data, setData] = useState<Activity | undefined>();
  const [confirmDelete, setConfirmDelete] = useState<string>("");
  const [toDelete, setToDelete] = useState<number | string>("");
  const [selectedAlternatives, setSelectedAlternatives] = useState<any[] | null>(null);
  const [triggeringActivityId, setTriggeringActivityId] = useState<number | null>(null);
  const [addingAlternativeId, setAddingAlternativeId] = useState<number | null>(null);

  const {
    data: allActivities = [],
    isLoading,
    refetch,
  } = useTravelPlanActivities(reference_id);

  const deleteActivityMutation = useDeleteActivity();
  const togglePriorityMutation = useToggleActivityPriority();
  const createActivityMutation = useCreateActivity();

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

    return filtered.sort((a, b) => {
      if (a.is_priority && !b.is_priority) return -1;
      if (!a.is_priority && b.is_priority) return 1;
      const orderDiff = (a.sort_order ?? 0) - (b.sort_order ?? 0);
      if (orderDiff !== 0) return orderDiff;
      return a.activity_id - b.activity_id;
    });
  }, [allActivities, dates.start, day_selected]);

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

  const handleAddAlternative = (business: any) => {
    if (!dates?.start || !business?.id) return;

    setAddingAlternativeId(business.id);

    const starting_date = new Date(dates.start);
    let current_day: Date;
    if (day_selected === 1) {
      current_day = starting_date;
    } else {
      const selected_day_ms = 1000 * 60 * 60 * 24 * (day_selected - 1);
      current_day = new Date(starting_date.getTime() + selected_day_ms);
    }

    createActivityMutation.mutate({
      travel_plan_id: Number(reference_id),
      business_id: business.id,
      insert_after_activity_id: triggeringActivityId || undefined,
      name: business.name,
      location: business.name,
      lat: business.location?.lat,
      lng: business.location?.lng,
      city: business.location?.city,
      target_date: current_day.toISOString().split("T")[0],
      budget_range: "400-700"
    }, {
      onSuccess: () => {
        setAddingAlternativeId(null);
        setSelectedAlternatives(null);
        setTriggeringActivityId(null);
        refetch();
      },
      onError: () => {
        setAddingAlternativeId(null);
      }
    });
  };

  const click_plan = (plan: Activity): void => {
    if (plan.lat && plan.lng) {
      onSendData(plan.lat, plan.lng);
    }
  };

  const showActions = canEdit && status !== "join" && status !== "planner";

  return (
    <>
      <div className="space-y-2">
        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-red mb-3"></div>
            <p className="text-sm text-gray-500">Loading activities...</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && plans.length === 0 && (
          <div className="text-center py-12">
            <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <p className="text-gray-600 font-medium">No activities for Day {day_selected}</p>
            <p className="text-sm text-gray-400 mt-1">
              {canEdit ? "Add your first activity to get started" : "No activities planned yet"}
            </p>
          </div>
        )}

        {/* Activities list */}
        {!isLoading && plans.length > 0 &&
          plans.map((plan, index) => {
            const isWeekend = plan.target_date && ["Saturday", "Sunday"].includes(
              new Date(plan.target_date).toLocaleDateString("en-US", { weekday: "long" })
            );

            return (
              <React.Fragment key={plan.activity_id}>
                <div
                  className={`group relative p-4 rounded-xl border cursor-pointer transition-all duration-200 ${plan.is_priority
                    ? "bg-amber-50/50 border-amber-200 hover:border-amber-300"
                    : "bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm"
                    }`}
                  onClick={() => click_plan(plan)}
                >
                  {/* Index number */}
                  <div className={`absolute -left-2 -top-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${plan.is_priority
                    ? "bg-amber-500 text-white"
                    : "bg-gray-200 text-gray-600"
                    }`}>
                    {index + 1}
                  </div>

                  {/* Priority Star Button */}
                  {canEdit && (
                    <button
                      onClick={(e) => handle_toggle_priority(e, plan)}
                      disabled={togglePriorityMutation.isPending}
                      className={`absolute top-3 right-3 p-1.5 rounded-lg transition-all ${plan.is_priority
                        ? "text-amber-500 bg-amber-100 hover:bg-amber-200"
                        : "text-gray-300 hover:text-amber-400 hover:bg-amber-50"
                        } ${togglePriorityMutation.isPending ? "opacity-50" : ""}`}
                      title={plan.is_priority ? "Remove priority" : "Mark as priority"}
                    >
                      {plan.is_priority ? (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      )}
                    </button>
                  )}

                  <div className="pr-10">
                    {/* Location name */}
                    {plan.location && (
                      <h4 className="font-semibold text-gray-900 line-clamp-1">{plan.location}</h4>
                    )}

                    {/* Address */}
                    {(plan.brgy || plan.city || plan.province) && (
                      <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">
                        {[plan.brgy, plan.city, plan.province].filter(Boolean).join(", ")}
                      </p>
                    )}

                    {/* Notes */}
                    {plan.notes && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">{plan.notes}</p>
                    )}

                    {/* Meta row */}
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      {index === 0 ? (
                        <TrafficSuggestion
                          originId={null}
                          originLat={USER_ORIGIN_LAT}
                          originLng={USER_ORIGIN_LNG}
                          destId={plan.activity_id}
                          dayGroup={isWeekend ? "weekend" : "weekday"}
                          onShowAlternatives={(alts, destId) => {
                            setSelectedAlternatives(alts);
                            setTriggeringActivityId(destId);
                          }}
                        />
                      ) : (
                        <TrafficSuggestion
                          originId={plans[index - 1].activity_id}
                          destId={plan.activity_id}
                          dayGroup={isWeekend ? "weekend" : "weekday"}
                          onShowAlternatives={(alts, destId) => {
                            setSelectedAlternatives(alts);
                            setTriggeringActivityId(destId);
                          }}
                        />
                      )}

                      {plan.budget_range && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-green-50 text-green-700 rounded-lg border border-green-200">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {formatBudgetRange(plan.budget_range)}
                        </span>
                      )}

                      {plan.lat && plan.lng && (
                        <span className="inline-flex items-center gap-1 text-xs text-primary-red font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                          </svg>
                          Show on map
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  {showActions && (
                    <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handle_click(plan);
                        }}
                        className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-1"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handle_delete(plan);
                        }}
                        className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-1"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </React.Fragment>
            )
          })}
      </div>

      {/* Edit Activity Modal */}
      {clicked && data && (
        <EditActivity on_close={handle_close} data={data} dates={dates} planId={reference_id} />
      )}

      <AlternativeSuggestionsModal
        isOpen={!!selectedAlternatives}
        onClose={() => {
          setSelectedAlternatives(null);
          setTriggeringActivityId(null);
        }}
        alternatives={selectedAlternatives || []}
        onAddAlternative={handleAddAlternative}
        addingBusinessId={addingAlternativeId}
      />

      {/* Delete Confirmation Modal */}
      {confirmDelete === "verify" && (
        <div className="fixed inset-0 z-[1500] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-fade-in">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Delete Activity?</h3>
            <p className="text-gray-500 text-center text-sm mb-6">
              This action cannot be undone. The activity will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                onClick={() => {
                  setConfirmDelete("");
                  setToDelete("");
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => setConfirmDelete("confirmed")}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
