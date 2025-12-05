import { useForm } from "react-hook-form";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/flatpickr.css";
import { useState } from "react";
import MapSearchBox from "../map/MapSearchBox";
import { useCreateActivity } from "../../features/travelPlans/mutations";
import type {
  TravelPlanDates,
  BudgetRange,
  CreateActivityPayload,
} from "../../types/travelPlan";
import { BUDGET_RANGES } from "../../types/travelPlan";
import type { SearchResult } from "../../types/map";

interface CreateActivityProps {
  on_close: () => void;
  dates: TravelPlanDates;
  id: string | number;
}

interface FormData {
  target_date: string;
  budget_range: BudgetRange | "";
  notes: string;
}

export default function Create_Activity({
  on_close,
  dates,
  id,
}: CreateActivityProps): React.ReactElement {
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const [value, setValue] = useState<Date | string>(dates.start);
  const [search_result, set_search_result] = useState<SearchResult | null>(
    null
  );

  // Use TanStack Query mutation for creating activities
  const createActivityMutation = useCreateActivity();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      target_date: `${formatDate(dates.start)} - ${formatDate(dates.end)}`,
    },
  });

  const handle_change = (selectedDates: Date[]): void => {
    if (selectedDates[0]) {
      setValue(selectedDates[0]);
      reset({ target_date: formatDate(selectedDates[0].toISOString()) });
    }
  };

  // Format date as YYYY-MM-DD in local timezone (avoids UTC conversion issues)
  const formatDateForBackend = (date: Date | string): string => {
    const d = typeof date === "string" ? new Date(date) : date;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const on_submit = async (data: FormData): Promise<void> => {
    if (!search_result) {
      alert("Please select a location");
      return;
    }

    const payload: CreateActivityPayload = {
      travel_plan_id: typeof id === "string" ? parseInt(id) : id,
      lat: search_result.lat,
      lng: search_result.lng,
      location: search_result.name,
      name: search_result.name,
      brgy: search_result.address?.barangay || "",
      province: search_result.address?.province || "",
      city: search_result.address?.city || "",
      target_date: formatDateForBackend(value),
      budget_range: data.budget_range || undefined,
      notes: data.notes || undefined,
    };

    createActivityMutation.mutate(payload, {
      onSuccess: () => {
        reset();
        on_close();
      },
      onError: (error) => {
        console.error("Error creating activity:", error);
      },
    });
  };

  const handleSearch = (result: SearchResult): void => {
    set_search_result(result);
  };

  return (
    <div className="modal">
      <div className="modal_body">
        <h1 className="text-xl font-semibold text-red-600 mb-4">
          Create Activity
        </h1>

        <form onSubmit={handleSubmit(on_submit)} className="space-y-4">
          <div>
            <label className="label">Location:</label>
            <MapSearchBox onSearch={handleSearch} />
            {search_result && (
              <p className="text-sm text-green-600 mt-1">
                Selected: {search_result.name}
              </p>
            )}
          </div>

          <div>
            <label className="label">Target Date:</label>
            <input
              {...register("target_date", {
                validate: (val) => {
                  const range = `${formatDate(dates.start)} - ${formatDate(
                    dates.end
                  )}`;
                  return (
                    val !== range || "Please choose a date within the range"
                  );
                },
              })}
              className="text_box"
              disabled
            />
          </div>

          <Flatpickr
            options={{
              dateFormat: "Y-m-d",
              enable: [
                {
                  from: new Date(dates.start).toLocaleDateString("en-CA"),
                  to: new Date(dates.end).toLocaleDateString("en-CA"),
                },
              ],
            }}
            value={value}
            onChange={handle_change}
            className="text_box"
          />
          {errors.target_date && (
            <p className="text-red-500 text-sm">{errors.target_date.message}</p>
          )}

          <div>
            <label className="label">Budget Range:</label>
            <select
              {...register("budget_range", {
                required: "Please select a budget range",
              })}
              className="text_box"
            >
              <option value="">--Select--</option>
              {BUDGET_RANGES.map((range) => (
                <option key={range} value={range}>
                  {range.includes("+")
                    ? `₱${range}`
                    : `₱${range.split("-")[0]} - ₱${range.split("-")[1]}`}
                </option>
              ))}
            </select>
            {errors.budget_range && (
              <p className="text-red-500 text-sm">
                {errors.budget_range.message}
              </p>
            )}
          </div>

          <div>
            <label className="label">Notes:</label>
            <input {...register("notes")} className="text_box" />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={on_close}
              disabled={createActivityMutation.isPending}
              className="soft_btn"
            >
              Exit
            </button>
            <button
              type="submit"
              disabled={createActivityMutation.isPending}
              className="hard_btn"
            >
              {createActivityMutation.isPending ? "Creating..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
