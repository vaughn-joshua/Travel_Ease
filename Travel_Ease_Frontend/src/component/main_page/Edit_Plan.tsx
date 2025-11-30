import { useForm } from "react-hook-form";
import { edit_plan } from "../../utils/travel_plan/edit_plan";
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
}

export default function Edit_Plan({
  data,
  travel_plan,
  on_close,
}: EditPlanProps): React.ReactElement {
  const plan = data[0];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      title: plan.title,
      description: plan.description,
      location: plan.location,
    },
  });

  const on_submit = async (formData: FormData): Promise<void> => {
    try {
      const payload: UpdatePlanPayload = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
      };

      await edit_plan(travel_plan, payload);
      on_close();
    } catch (e) {
      console.error("Error updating plan:", e);
    }
  };

  return (
    <div className="modal">
      <div className="modal_body">
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
              {...register("description", { required: "Description is required" })}
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
              {...register("location", { required: "Location is required" })}
              className="text_box"
            />
            {errors.location && (
              <p className="text-red-500 text-sm">{errors.location.message}</p>
            )}
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

