import { useState, useEffect } from "react";
import { fetch_activities } from "../../utils/travel_plan/fetch_activities";
import Edit_Activity from "./Edit_Activity";
import { delete_activity } from "../../utils/travel_plan/delete_activity";
import type { Activity, TravelPlanDates } from "../../types/travelPlan";

interface ActivitiesProps {
  reference_id: string | number;
  load_state: boolean;
  day_selected: number;
  dates: TravelPlanDates;
  status?: string;
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
  onSendData,
}: ActivitiesProps): React.ReactElement {
  const [plans, setPlans] = useState<Activity[] | undefined>();
  const [clicked, setClicked] = useState<boolean>(false);
  const [data, setData] = useState<Activity | undefined>();
  const [refresh, setRefresh] = useState<boolean>(false);
  const [confirmDelete, setConfirmDelete] = useState<string>("");
  const [toDelete, setToDelete] = useState<number | string>("");

  useEffect(() => {
    const load_plans = async (): Promise<void> => {
      const activityData = await fetch_activities(reference_id);

      const starting_date = new Date(dates.start);
      let current_day: Date;

      if (day_selected === 1) {
        current_day = starting_date;
      } else {
        const selected_day_ms = 1000 * 60 * 60 * 24 * (day_selected - 1);
        current_day = new Date(starting_date.getTime() + selected_day_ms);
      }

      const filtered_data = activityData.filter((item) => {
        const activity_date = new Date(item.target_date);
        return activity_date.toDateString() === current_day.toDateString();
      });

      setPlans(filtered_data);
    };

    load_plans();
  }, [load_state, refresh, reference_id, dates.start, day_selected]);

  useEffect(() => {
    if (confirmDelete === "confirmed" && toDelete) {
      delete_activity(toDelete);
      setConfirmDelete("");
      setToDelete("");
      setRefresh((prev) => !prev);
    }
  }, [confirmDelete, toDelete]);

  const handle_click = (activityData: Activity): void => {
    setClicked(true);
    setData(activityData);
  };

  const handle_close = (): void => {
    setClicked(false);
    setRefresh((prev) => !prev);
  };

  const handle_delete = (plan: Activity): void => {
    setConfirmDelete("verify");
    setToDelete(plan.activity_id);
  };

  const click_plan = (plan: Activity): void => {
    if (status === "view" && plan.lat && plan.lng) {
      onSendData(plan.lat, plan.lng);
    }
  };

  return (
    <>
      <div className="mt-3">
        {!plans && <p>loading...</p>}

        {plans &&
          plans.map((plan) => (
            <div
              key={plan.activity_id}
              className="card cursor-pointer"
              onClick={() => click_plan(plan)}
            >
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
              {/* Priority indicator */}
              {plan.is_priority && (
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Priority</span>
              )}

              {status !== "join" && status !== "planner" && (
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
        <Edit_Activity on_close={handle_close} data={data} dates={dates} />
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

