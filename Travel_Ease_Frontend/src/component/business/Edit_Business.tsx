import { useForm } from "react-hook-form";
import { business_edit } from "../../utils/business/business_edit";
import type { Business, UpdateBusinessPayload } from "../../types/business";

interface EditBusinessProps {
  on_close: () => void;
  business: Business;
}

interface FormData {
  name: string;
  description: string;
}

export default function Edit_Business({
  on_close,
  business,
}: EditBusinessProps): React.ReactElement {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      name: business.name,
      description: business.description || "",
    },
  });

  const on_submit = async (data: FormData): Promise<void> => {
    try {
      const payload: UpdateBusinessPayload = {
        name: data.name,
        description: data.description,
      };

      await business_edit(business.id, payload);
      on_close();
    } catch (e) {
      console.error("Error updating business:", e);
    }
  };

  return (
    <div className="modal">
      <div className="modal_body">
        <h1 className="text-xl font-semibold text-red-600 text-center mb-4">
          Edit Business
        </h1>

        <form onSubmit={handleSubmit(on_submit)} className="space-y-4">
          <div>
            <label className="label">Business Name</label>
            <input
              {...register("name", { required: "Business name is required" })}
              className="text_box"
            />
            {errors.name && (
              <p className="text-red-500 text-sm">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              {...register("description")}
              className="text_box resize-none"
              rows={4}
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

