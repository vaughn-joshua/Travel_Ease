import { useForm } from "react-hook-form";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/flatpickr.css";
import { useState } from "react";
import { edit_activity } from "../../utils/travel_plan/edit_activity";
import type { Activity, TravelPlanDates, BudgetRange, UpdateActivityPayload } from "../../types/travelPlan";
import { BUDGET_RANGES } from "../../types/travelPlan";

interface EditActivityProps {
  on_close: () => void;
  data: Activity;
  dates: TravelPlanDates;
}

interface FormData {
  target_date: string;
  budget_range: BudgetRange | "";
  notes: string;
}

export default function Edit_Activity({
  on_close,
  data,
  dates,
}: EditActivityProps): React.ReactElement {
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const [value, setValue] = useState<Date>(new Date(data.target_date || new Date()));

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      target_date: data.target_date ? formatDate(data.target_date) : "",
      budget_range: data.budget_range || "",
      notes: data.notes || "",
    },
  });

  const handle_change = (selectedDates: Date[]): void => {
    if (selectedDates[0]) {
      setValue(selectedDates[0]);
      reset((prev) => ({
        ...prev,
        target_date: formatDate(selectedDates[0].toISOString()),
      }));
    }
  };

  const on_submit = async (formData: FormData): Promise<void> => {
    try {
      const payload: UpdateActivityPayload = {
        target_date: value.toISOString(),
        budget_range: formData.budget_range || undefined,
        notes: formData.notes || undefined,
      };

      await edit_activity(data.activity_id, payload);
      on_close();
    } catch (e) {
      console.error("Error updating activity:", e);
    }
  };

  return (
    <div className="modal">
      <div className="modal_body">
        <h1 className="text-xl font-semibold text-red-600 mb-4">Edit Activity</h1>
        <p className="text-gray-600 mb-4">Location: {data.location}</p>

        <form onSubmit={handleSubmit(on_submit)} className="space-y-4">
          <div>
            <label className="label">Target Date:</label>
            <input
              {...register("target_date")}
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
              <p className="text-red-500 text-sm">{errors.budget_range.message}</p>
            )}
          </div>

          <div>
            <label className="label">Notes:</label>
            <textarea
              {...register("notes")}
              className="text_box resize-none"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={on_close} className="soft_btn">
              Cancel
            </button>
            <button type="submit" className="hard_btn">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

