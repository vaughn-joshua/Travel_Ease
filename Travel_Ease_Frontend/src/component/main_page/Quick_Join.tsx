import { useState } from "react";
import { useForm } from "react-hook-form";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/flatpickr.css";
import { useQuickJoinSearch } from "../../features/travelPlans/mutations";
import type { TravelPlan, QuickJoinPayload } from "../../types/travelPlan";

interface QuickJoinProps {
  on_close: (results: TravelPlan[]) => void;
}

interface FormData {
  location: string;
  start_date: string;
  end_date: string;
}

export default function Quick_Join({ on_close }: QuickJoinProps): React.ReactElement {
  const {
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<FormData>();

  const [dateRange, setDateRange] = useState<Date[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  // Use TanStack Query mutation for quick join search
  const quickJoinMutation = useQuickJoinSearch();

  const handle_change = (
    selectedDates: Date[],
    _dateStr: string,
    instance: { setDate: (dates: Date[], triggerChange: boolean) => void }
  ): void => {
    if (selectedDates.length > 2) {
      const trimmed = selectedDates.slice(0, 2);
      instance.setDate(trimmed, true);
      setDateRange(trimmed);
      return;
    }
    setDateRange(selectedDates);
    clearErrors(["start_date", "end_date"]);

    if (selectedDates[0]) {
      setValue("start_date", selectedDates[0].toISOString().split("T")[0]);
    } else {
      setValue("start_date", "");
    }
    if (selectedDates[1]) {
      setValue("end_date", selectedDates[1].toISOString().split("T")[0]);
    } else if (selectedDates.length === 1) {
      // If only one date selected, use it as both start and end
      setValue("end_date", selectedDates[0].toISOString().split("T")[0]);
    } else {
      setValue("end_date", "");
    }
  };

  const on_submit = async (data: FormData): Promise<void> => {
    // Validate date range is complete
    if (!data.start_date || !data.end_date) {
      setError("start_date", { message: "Please select a complete date range" });
      return;
    }

    setSearchError(null);

    const payload: QuickJoinPayload = {
      location: data.location,
      start_date: data.start_date,
      end_date: data.end_date,
    };

    quickJoinMutation.mutate(payload, {
      onSuccess: (results) => {
        if (results.length === 0) {
          setSearchError("No matching plans found. Try different dates or location.");
          return;
        }
        on_close(results);
      },
      onError: (error) => {
        console.error("Quick join error:", error);
        setSearchError(error instanceof Error ? error.message : "Failed to search for plans");
      },
    });
  };

  return (
    <div className="modal">
      <div className="modal_body">
        <h1 className="text-xl font-semibold text-red-600 text-center mb-4">
          Quick Join
        </h1>
        <p className="text-gray-600 text-sm text-center mb-4">
          Find public travel plans that match your dates and destination
        </p>

        <form onSubmit={handleSubmit(on_submit)} className="space-y-4">
          <div>
            <label className="label">Location</label>
            <input
              {...register("location", { required: "Location is required" })}
              className="text_box"
              placeholder="Where do you want to go?"
            />
            {errors.location && (
              <p className="text-red-500 text-sm">{errors.location.message}</p>
            )}
          </div>

          <div>
            <label className="label">Date Range</label>
            <Flatpickr
              options={{
                dateFormat: "Y-m-d",
                mode: "range",
                minDate: "today",
              }}
              value={dateRange}
              onChange={handle_change}
              className="text_box"
              placeholder="Select start and end dates"
            />
            <input type="hidden" {...register("start_date", { required: true })} />
            <input type="hidden" {...register("end_date", { required: true })} />
            {(errors.start_date || errors.end_date) && (
              <p className="text-red-500 text-sm">
                {errors.start_date?.message || "Please select a date range"}
              </p>
            )}
          </div>

          {searchError && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <p className="text-yellow-700 text-sm">{searchError}</p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={() => on_close([])}
              disabled={quickJoinMutation.isPending}
              className="soft_btn"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={quickJoinMutation.isPending}
              className="hard_btn"
            >
              {quickJoinMutation.isPending ? "Searching..." : "Find Plans"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

