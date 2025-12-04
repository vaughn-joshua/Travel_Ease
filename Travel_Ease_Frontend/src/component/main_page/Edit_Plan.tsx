import { useState } from "react";
import { useForm } from "react-hook-form";
import { useUpdatePlan } from "../../features/travelPlans/mutations";
import type { TravelPlan, UpdatePlanPayload } from "../../types/travelPlan";

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
}

// Format date for input (YYYY-MM-DD)
function formatDateForInput(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
}

export default function Edit_Plan({
  data,
  travel_plan,
  on_close,
}: EditPlanProps): React.ReactElement {
  const plan = data[0];
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Use TanStack Query mutation for updating plans
  const updatePlanMutation = useUpdatePlan();

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
    },
  });

  const startDate = watch("start_date");

  const on_submit = async (formData: FormData): Promise<void> => {
    setSubmitError(null);

    const payload: UpdatePlanPayload = {
      title: formData.title,
      description: formData.description,
      location: formData.location,
      start_date: formData.start_date || undefined,
      end_date: formData.end_date || undefined,
      slots: formData.max_slots ? parseInt(formData.max_slots, 10) : undefined,
      is_public: formData.visibility,
    };

    updatePlanMutation.mutate(
      { id: travel_plan, data: payload },
      {
        onSuccess: () => {
          on_close();
        },
        onError: (error) => {
          console.error("Error updating plan:", error);
          setSubmitError(
            error instanceof Error ? error.message : "Failed to update plan"
          );
        },
      }
    );
  };

  return (
    <div className="modal">
      <div className="modal_body max-w-lg">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-red-600">Edit Plan</h1>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-sm text-gray-600">open to Public</span>
            <div className="relative">
              <input
                type="checkbox"
                id="visibility"
                {...register("visibility")}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
            </div>
          </label>
        </div>

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
              <p className="text-red-500 text-sm">
                {errors.description.message}
              </p>
            )}
          </div>

          <div>
            <label className="label">
              Location <span className="font-light">(fixed)</span>
            </label>
            <input
              {...register("location")}
              className="text_box"
              value="Tagaytay City"
              readOnly
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
                <p className="text-red-500 text-sm">
                  {errors.end_date.message}
                </p>
              )}
            </div>
          </div>

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

          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <p className="text-red-600 text-sm">{submitError}</p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={on_close}
              disabled={updatePlanMutation.isPending}
              className="soft_btn"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updatePlanMutation.isPending}
              className="hard_btn"
            >
              {updatePlanMutation.isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
