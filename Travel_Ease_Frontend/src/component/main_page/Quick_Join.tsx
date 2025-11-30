import { useState } from "react";
import { useForm } from "react-hook-form";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/flatpickr.css";
import type { TravelPlan, QuickJoinPayload } from "../../types/travelPlan";
import { endpoints } from "../../config/api";

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
    formState: { errors },
  } = useForm<FormData>();

  const [dateRange, setDateRange] = useState<Date[]>([]);

  const handle_change = (
    selectedDates: Date[],
    _dateStr: string,
    instance: { setDate: (dates: Date[], triggerChange: boolean) => void }
  ): void => {
    if (selectedDates.length > 2) {
      alert("You can only select up to 2 dates (start and end).");
      const trimmed = selectedDates.slice(0, 2);
      instance.setDate(trimmed, true);
      setDateRange(trimmed);
      return;
    }
    setDateRange(selectedDates);

    if (selectedDates[0]) {
      setValue("start_date", selectedDates[0].toISOString());
    }
    if (selectedDates[1]) {
      setValue("end_date", selectedDates[1].toISOString());
    }
  };

  const on_submit = async (data: FormData): Promise<void> => {
    try {
      const payload: QuickJoinPayload = {
        location: data.location,
        start_date: data.start_date,
        end_date: data.end_date,
      };

      const response = await fetch(endpoints.travelPlan.quickJoin, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to find plans");
      }

      const results: TravelPlan[] = await response.json();
      on_close(results);
    } catch (e) {
      console.error("Quick join error:", e);
      on_close([]);
    }
  };

  return (
    <div className="modal">
      <div className="modal_body">
        <h1 className="text-xl font-semibold text-red-600 text-center mb-4">
          Quick Join
        </h1>

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
              }}
              value={dateRange}
              onChange={handle_change}
              className="text_box"
              placeholder="Select date range"
            />
            <input type="hidden" {...register("start_date", { required: true })} />
            <input type="hidden" {...register("end_date", { required: true })} />
            {(errors.start_date || errors.end_date) && (
              <p className="text-red-500 text-sm">Please select a date range</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={() => on_close([])} className="soft_btn">
              Cancel
            </button>
            <button type="submit" className="hard_btn">
              Find Plans
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

