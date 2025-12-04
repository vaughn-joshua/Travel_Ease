import { useState } from "react";
import { useForm } from "react-hook-form";
import { edit_plan } from "../../utils/travel_plan/edit_plan";
import type { TravelPlan, UpdatePlanPayload, PlanStatus } from "../../types/travelPlan";

interface EditPlanProps {
  data: TravelPlan[];
  travel_plan: string | number;
  on_close: () => void;
}

interface FormData {
  title: string;
  description: string;
  location: string;
  start_date: string;
  end_date: string;
  max_slots: string;
  visibility: boolean;
  status: PlanStatus;
}

// Format date for input (YYYY-MM-DD)
function formatDateForInput(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
}

// Status transition rules
const STATUS_TRANSITIONS: Record<PlanStatus, PlanStatus[]> = {
  Draft: ["Draft", "Active", "Cancelled"],
  Active: ["Active", "Completed", "Cancelled"],
  Completed: ["Completed"],
  Cancelled: ["Cancelled"],
};

export default function EditPlan({
  data,
  travel_plan,
  on_close,
}: EditPlanProps): React.ReactElement {
  const plan = data[0];
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      title: plan.title || plan.name || "",
      description: plan.description || "",
      location: plan.location || "",
      start_date: formatDateForInput(plan.start_date),
      end_date: formatDateForInput(plan.end_date),
      max_slots: plan.max_slots?.toString() || plan.slots?.toString() || "",
      visibility: plan.visibility ?? plan.is_public ?? false,
      status: plan.status || "Draft",
    },
  });

  const startDate = watch("start_date");
  const currentStatus = plan.status || "Draft";
  const allowedStatuses = STATUS_TRANSITIONS[currentStatus] || [currentStatus];

  const on_submit = async (formData: FormData): Promise<void> => {
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const payload: UpdatePlanPayload = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined,
        slots: formData.max_slots ? parseInt(formData.max_slots, 10) : undefined,
        is_public: formData.visibility,
        status: formData.status,
      };

      const result = await edit_plan(travel_plan, payload);
      
      if (result && typeof result === 'object' && 'error' in result) {
        setSubmitError((result as { error: string }).error);
        return;
      }

      on_close();
    } catch (e) {
      console.error("Error updating plan:", e);
      setSubmitError(e instanceof Error ? e.message : "Failed to update plan");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal">
      <div className="modal_body max-w-lg">
        <h1 className="text-xl font-semibold text-red-600 text-center mb-4">
          Edit Plan
        </h1>

        <form onSubmit={handleSubmit(on_submit)} className="space-y-4">
          <div>
            <label className="label">Title</label>
            <input
              {...register("title", { required: "Title is required" })}
              className="text_box"
            />
            {errors.title && (
              <p className="text-red-500 text-sm">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              {...register("description")}
              className="text_box resize-none"
              rows={3}
            />
            {errors.description && (
              <p className="text-red-500 text-sm">{errors.description.message}</p>
            )}
          </div>

          <div>
            <label className="label">Location</label>
            <input
              {...register("location")}
              className="text_box"
            />
            {errors.location && (
              <p className="text-red-500 text-sm">{errors.location.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Start Date</label>
              <input
                type="date"
                {...register("start_date")}
                className="text_box"
              />
            </div>
            <div>
              <label className="label">End Date</label>
              <input
                type="date"
                {...register("end_date", {
                  validate: (value) => {
                    if (startDate && value && value < startDate) {
                      return "End date must be after start date";
                    }
                    return true;
                  },
                })}
                min={startDate || undefined}
                className="text_box"
              />
              {errors.end_date && (
                <p className="text-red-500 text-sm">{errors.end_date.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Max Participants</label>
              <input
                type="number"
                min="1"
                {...register("max_slots", {
                  validate: (value) => {
                    if (value && parseInt(value, 10) < 1) {
                      return "Must be at least 1";
                    }
                    return true;
                  },
                })}
                className="text_box"
                placeholder="No limit"
              />
              {errors.max_slots && (
                <p className="text-red-500 text-sm">{errors.max_slots.message}</p>
              )}
            </div>
            <div>
              <label className="label">Status</label>
              <select
                {...register("status")}
                className="text_box"
              >
                {allowedStatuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="visibility"
              {...register("visibility")}
              className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
            />
            <label htmlFor="visibility" className="text-sm text-gray-700">
              Make plan public (visible in Quick Join search)
            </label>
          </div>

          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <p className="text-red-600 text-sm">{submitError}</p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={on_close}
              disabled={isSubmitting}
              className="soft_btn"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="hard_btn"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

